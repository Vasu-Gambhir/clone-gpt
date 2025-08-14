'use client';

import { useState, useRef } from 'react';
import { Mic, SendHorizontal, Plus, Loader2, FileText, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useChats } from '@/lib/hooks/useChat';

interface UploadedFile {
  uuid: string;
  name: string;
  size: number;
  mimeType: string;
  cdnUrl: string;
  originalUrl: string;
}

interface ChatInputProps {
  placeholder?: string;
  onSendMessage?: (message: string, files?: UploadedFile[]) => Promise<void>;
  currentChatId?: string | null;
  disabled?: boolean;
}

/**
 * ChatInput Component
 * Main chat input interface supporting text messages and file uploads
 * Handles message submission, file processing, and chat creation
 */
export default function ChatInput({
  placeholder = "Ask anything",
  onSendMessage,
  currentChatId,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { createChat } = useChats();

  /**
   * Handles sending messages with optional file attachments
   * Creates new chat if needed or sends to existing chat
   */
  const handleSend = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || sending) return;

    const messageText = message.trim();
    const filesToSend = [...uploadedFiles];
    setMessage('');
    setUploadedFiles([]);

    try {
      setSending(true);
      
      if (onSendMessage && currentChatId) {
        await onSendMessage(messageText || 'Uploaded files', filesToSend);
      } else {
        // Create new chat and redirect with message in URL state
        const chatTitle = messageText ? messageText.split(' ').slice(0, 6).join(' ') : 'File Upload Chat';
        const newChat = await createChat(chatTitle);
        
        // Store the initial message in sessionStorage to be picked up by the chat page
        const initialData = {
          message: messageText || 'Uploaded files',
          files: filesToSend,
          timestamp: Date.now()
        };
        sessionStorage.setItem(`initial-message-${newChat._id}`, JSON.stringify(initialData));
        
        router.push(`/chat/${newChat._id}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageText); // Restore message on error
      setUploadedFiles(filesToSend); // Restore files on error
    } finally {
      setSending(false);
    }
  };


  /**
   * Navigates to new chat page
   */
  const handleNewChat = () => {
    router.push('/chat');
  };

  /**
   * Handles plus button functionality
   * Opens file upload in existing chat or creates new chat
   */
  const handlePlusClick = () => {
    // If we're in an existing chat, trigger file upload
    // If we're on the home page, create a new chat
    if (currentChatId) {
      console.log('Opening file upload dialog');
      fileInputRef.current?.click();
    } else {
      console.log('Creating new chat');
      handleNewChat();
    }
  };

  /**
   * Processes selected files for upload
   * Converts files to data URLs and stores metadata
   * @param e - File input change event
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('Files selected:', files);
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    try {
      // Process files and create data URLs
      const uploadPromises = Array.from(files).map(async (file) => {
        return new Promise<UploadedFile>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            // Generate a simple UUID
            const uuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
            
            resolve({
              uuid: uuid,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
              cdnUrl: reader.result as string,
              originalUrl: reader.result as string,
            });
          };
          
          reader.onerror = () => reject(new Error('Failed to read file'));
          
          // Read file as data URL
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(uploadPromises);
      newUploadedFiles.push(...results);
      
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      console.log('Files uploaded:', newUploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process files. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Removes a file from the upload queue
   * @param uuid - Unique identifier of file to remove
   */
  const removeFile = (uuid: string) => {
    setUploadedFiles(prev => prev.filter(file => file.uuid !== uuid));
  };

  const canSend = (message.trim() || uploadedFiles.length > 0) && !sending && !disabled;

  return (
    <div className="w-full max-w-4xl px-3 sm:px-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        accept="*/*"
      />
      
      {/* Display uploaded files above input */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Files to upload:</span>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.uuid}
                className="flex items-center gap-2 p-2 bg-background rounded-lg text-sm"
              >
                {file.mimeType.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(file.size / 1024)} KB
                </span>
                <button
                  onClick={() => removeFile(file.uuid)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3 rounded-3xl bg-background border border-border/50 shadow-lg focus-within:border-primary/50 focus-within:shadow-primary/10 focus-within:shadow-xl transition-all duration-200 p-2 sm:p-3">
          <button
            onClick={handlePlusClick}
            className="flex-shrink-0 rounded-xl p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={currentChatId ? "Upload files" : "New chat"}
            disabled={sending || isUploading}
            title={currentChatId ? "Upload files" : "Start new chat"}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex-1 min-h-6 max-h-32">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={placeholder}
              className="w-full resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base leading-6 py-1"
              disabled={sending || disabled}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '24px',
                maxHeight: '128px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              className="rounded-xl p-1.5 sm:p-2 text-muted-foreground hover:bg-muted transition-colors opacity-40 cursor-not-allowed"
              aria-label="Voice input"
              disabled
              title="Voice input (coming soon)"
            >
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <button
              onClick={handleSend}
              className={`rounded-xl p-1.5 sm:p-2 transition-all duration-200 ${
                canSend 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 scale-100' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed scale-95'
              }`}
              aria-label="Send message"
              disabled={!canSend}
              title={canSend ? "Send message" : "Type a message to send"}
            >
              {sending || isUploading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        ChatGPT can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}