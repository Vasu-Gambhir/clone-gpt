'use client';

import { useState, useEffect } from 'react';
import { ChatData, ChatMessage, ChatSummary } from '@/lib/types/chat';

/**
 * useChats Hook
 * Manages multiple chat conversations list
 * Handles fetching, creating, and deleting chats
 */
export function useChats() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all chats for the current user
   */
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats');
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data = await response.json();
      setChats(data.chats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new chat conversation
   * @param title - Initial title for the chat
   */
  const createChat = async (title: string = 'New Chat') => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create chat');
      const data = await response.json();
      setChats(prev => [data.chat, ...prev]);
      return data.chat;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
      throw err;
    }
  };

  /**
   * Deletes a chat conversation
   * @param chatId - ID of chat to delete
   */
  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete chat (${response.status})`);
      }
      
      setChats(prev => prev.filter(chat => chat._id !== chatId));
    } catch (err) {
      console.error('Delete chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
      throw err;
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Listen for chat title updates
    const handleTitleUpdate = (event: CustomEvent) => {
      const { chatId, newTitle } = event.detail;
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, title: newTitle } : chat
      ));
    };
    
    window.addEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
    };
  }, []);

  return {
    chats,
    loading,
    error,
    fetchChats,
    createChat,
    deleteChat,
  };
}

/**
 * useChat Hook
 * Manages a single chat conversation
 * Handles message sending, editing, and streaming responses
 */
export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  /**
   * Fetches chat data including message history
   * @param id - Chat ID to fetch
   */
  const fetchChat = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chats/${id}`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      const data = await response.json();
      setChat(data.chat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sends a message and handles streaming response
   * @param message - Message content to send
   * @param files - Optional file attachments
   * @param isRegenerate - Whether this is a response regeneration
   */
  const sendMessage = async (message: string, files?: unknown[], isRegenerate: boolean = false) => {
    if (!chatId || !message.trim()) return;

    try {
      setSending(true);
      setError(null);

      // If regenerating, remove the last assistant message
      if (isRegenerate) {
        setChat(prev => prev ? {
          ...prev,
          messages: prev.messages.slice(0, -1),
        } : null);
      } else {
        // Optimistically add user message for new messages
        const tempUserMessage: ChatMessage = {
          role: 'user',
          content: message.trim(),
          timestamp: new Date(),
        };

        setChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, tempUserMessage],
        } : null);
      }

      // Process files if provided
      let processedFiles = null;
      if (files && files.length > 0) {
        const fileResponse = await fetch('/api/files/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files }),
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          processedFiles = fileData.processedFiles;
        }
      }

      // Use simulated streaming API
      const response = await fetch(`/api/chats/${chatId}/simulate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message.trim(),
          files: processedFiles 
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'userMessage':
                  if (!isRegenerate) {
                    // Replace temp message with real user message
                    setChat(prev => prev ? {
                      ...prev,
                      messages: [
                        ...prev.messages.slice(0, -1),
                        data.message,
                      ],
                    } : null);
                  }
                  break;

                case 'chunk':
                  assistantContent += data.content;
                  // Update streaming assistant message
                  setChat(prev => {
                    if (!prev) return null;
                    
                    const messages = [...prev.messages];
                    const lastMessage = messages[messages.length - 1];
                    
                    if (lastMessage?.role === 'assistant') {
                      // Update existing assistant message
                      messages[messages.length - 1] = {
                        ...lastMessage,
                        content: assistantContent,
                      };
                    } else {
                      // Add new assistant message
                      messages.push({
                        role: 'assistant',
                        content: assistantContent,
                        timestamp: new Date(),
                      });
                    }
                    
                    return {
                      ...prev,
                      messages,
                    };
                  });
                  break;

                case 'complete':
                  // Final update with complete message
                  setChat(prev => {
                    if (!prev) return null;
                    const updatedChat = {
                      ...prev,
                      title: data.chatTitle || prev.title,
                      messages: [
                        ...prev.messages.slice(0, -1),
                        data.assistantMessage,
                      ],
                    };
                    
                    // If title changed, emit event for sidebar to update
                    if (data.chatTitle && data.chatTitle !== prev.title) {
                      window.dispatchEvent(new CustomEvent('chatTitleUpdated', {
                        detail: { chatId: chatId, newTitle: data.chatTitle }
                      }));
                    }
                    
                    return updatedChat;
                  });
                  break;

                case 'error':
                  setChat(prev => prev ? {
                    ...prev,
                    messages: [
                      ...prev.messages.slice(0, -1),
                      data.message,
                    ],
                  } : null);
                  setError(data.error);
                  break;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return { success: true };
    } catch (err) {
      // Remove optimistic user message on error
      if (!isRegenerate) {
        setChat(prev => prev ? {
          ...prev,
          messages: prev.messages.slice(0, -1),
        } : null);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  };

  /**
   * Edits a message and regenerates subsequent responses
   * @param messageIndex - Index of message to edit
   * @param newContent - New message content
   */
  const editMessage = async (messageIndex: number, newContent: string) => {
    if (!chatId || !chat) return;

    try {
      setSending(true);
      setError(null);

      // Update the specific message
      const updatedMessages = [...chat.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
      };

      // Remove any assistant messages after this user message
      const editedMessageIndex = messageIndex;
      const messagesUpToEdit = updatedMessages.slice(0, editedMessageIndex + 1);
      
      setChat(prev => prev ? {
        ...prev,
        messages: messagesUpToEdit,
      } : null);

      // Regenerate response from the edited message
      await sendMessage(newContent, undefined, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      throw err;
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
    } else {
      setChat(null);
    }
  }, [chatId]);

  return {
    chat,
    loading,
    error,
    sending,
    sendMessage,
    editMessage,
    refetch: chatId ? () => fetchChat(chatId) : undefined,
  };
}