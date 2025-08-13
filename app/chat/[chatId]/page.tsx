"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";
import ChatInput from "@/components/chat/ChatInput";
import MessageList from "@/components/chat/MessageList";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/hooks/useChat";
import { Sparkles, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebar } from "@/lib/contexts/SidebarContext";

/**
 * ChatPage Component
 * Individual chat conversation page with message history and interaction
 * Handles message sending, editing, and real-time updates
 */
export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { chat, loading, error, sending, sendMessage, editMessage } =
    useChat(chatId);
  const { isOpen, toggle } = useSidebar();

  useEffect(() => {
    // Check for initial message in sessionStorage
    if (chatId && chat && chat.messages.length === 0) {
      const storageKey = `initial-message-${chatId}`;
      const initialDataStr = sessionStorage.getItem(storageKey);
      
      if (initialDataStr) {
        try {
          const initialData = JSON.parse(initialDataStr);
          // Send the initial message
          if (initialData.message || initialData.files) {
            sendMessage(initialData.message || "Uploaded files", initialData.files);
          }
          // Clean up
          sessionStorage.removeItem(storageKey);
        } catch (error) {
          console.error('Error parsing initial message data:', error);
          sessionStorage.removeItem(storageKey);
        }
      }
    }

    // Keep the old event listener for backwards compatibility
    const handleSendInitialMessage = (event: CustomEvent) => {
      const data = event.detail;
      if (data && chatId) {
        if (typeof data === "string") {
          sendMessage(data);
        } else if (data.message || data.files) {
          sendMessage(data.message || "Uploaded files", data.files);
        }
      }
    };

    window.addEventListener(
      "sendInitialMessage",
      handleSendInitialMessage as EventListener
    );
    return () => {
      window.removeEventListener(
        "sendInitialMessage",
        handleSendInitialMessage as EventListener
      );
    };
  }, [chatId, sendMessage, chat]);

  if (loading) {
    return (
      <div className="h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar currentChatId={chatId} />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chat...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar currentChatId={chatId} />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-destructive">Error loading chat</div>
              <div className="text-sm text-muted-foreground">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
      <div className="h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar currentChatId={chatId} />
        <main className="flex-1 flex flex-col relative">
          
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between w-full">
              <Button
                onClick={toggle}
                variant="ghost"
                size="icon"
                className="rounded-lg hover:bg-accent transition-colors md:hidden"
                title="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 mr-4 md:ml-auto">
                <ThemeToggle />
                <Button
                  variant="outline"
                  className="rounded-full px-3 sm:px-4 py-2 text-xs border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all hidden sm:flex"
                >
                  <Sparkles className="mr-2 h-3 w-3" />
                  Upgrade to Plus
                </Button>
              </div>
            </div>
          </header>

          {/* Messages */}
          <MessageList
            messages={chat?.messages || []}
            loading={sending}
            onEditMessage={editMessage}
            onRegenerateResponse={() => {
              if (chat?.messages.length > 0) {
                const lastUserMessage = [...chat.messages]
                  .reverse()
                  .find((m) => m.role === "user");
                if (lastUserMessage) {
                  sendMessage(lastUserMessage.content, true);
                }
              }
            }}
            canEdit={!sending}
          />

          {/* Chat Input */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex justify-center">
              <ChatInput
                onSendMessage={sendMessage}
                currentChatId={chatId}
                disabled={sending}
              />
            </div>
          </div>
        </main>
      </div>
  );
}
