'use client';

import Sidebar from "@/components/chat/Sidebar";
import ChatInput from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
/**
 * Dashboard Component
 * Main chat interface home page with empty state and prompt suggestions
 * Displays when no specific chat is selected
 */
export default function Dashboard() {
  
  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="w-full flex items-center justify-between p-3 sm:p-4">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              className="rounded-full px-3 sm:px-4 py-1 text-xs hidden sm:flex"
            >
              Get Plus
            </Button>
          </div>
        </header>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6">
            {/* Empty state */}
            <div className="mt-6 sm:mt-10 md:mt-16 text-center space-y-6 max-w-2xl w-full">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                What can I help with?
              </h1>
              
              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8">
                <div className="p-3 sm:p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="text-sm font-medium mb-2">💡 Get advice</div>
                  <div className="text-xs text-muted-foreground">Help me pick a programming language to learn</div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="text-sm font-medium mb-2">✍️ Help me write</div>
                  <div className="text-xs text-muted-foreground">Write a professional email</div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="text-sm font-medium mb-2">🧠 Brainstorm</div>
                  <div className="text-xs text-muted-foreground">Ideas for a team building activity</div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="text-sm font-medium mb-2">📊 Analyze</div>
                  <div className="text-xs text-muted-foreground">Compare pros and cons of different options</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pinned Chat Input */}
          <div className="bg-background px-3 sm:px-4 py-3 sm:py-4">
            <div className="max-w-4xl mx-auto w-full flex justify-center">
              <ChatInput />
            </div>
          </div>
        </main>
    </div>
  );
}
