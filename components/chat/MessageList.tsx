'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/lib/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/nextjs';
import { Bot, Edit2, Check, X, RotateCcw, FileText, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
  onRegenerateResponse?: () => void;
  canEdit?: boolean;
}

/**
 * MessageList Component
 * Renders chat messages with markdown support, file attachments, and editing capabilities
 * Includes empty state UI and loading indicators
 */
export default function MessageList({ 
  messages, 
  loading, 
  onEditMessage,
  onRegenerateResponse,
  canEdit = false 
}: MessageListProps) {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  /**
   * Scrolls to the bottom of the message list
   * Used to keep latest messages in view
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Generates user initials for avatar display
   * Falls back to email or default if name not available
   */
  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const email = user.primaryEmailAddress?.emailAddress || "";

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    } else if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  /**
   * Initiates message editing mode
   * @param index - Message index to edit
   * @param content - Current message content
   */
  const startEditing = (index: number, content: string) => {
    setEditingIndex(index);
    setEditContent(content);
  };

  /**
   * Saves edited message and exits edit mode
   */
  const saveEdit = () => {
    if (editingIndex !== null && onEditMessage) {
      onEditMessage(editingIndex, editContent);
      setEditingIndex(null);
      setEditContent('');
    }
  };

  /**
   * Cancels message editing without saving
   */
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditContent('');
  };

  /**
   * Returns appropriate icon based on file mime type
   * @param mimeType - File MIME type
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  /**
   * Formats file size in human-readable format
   * @param bytes - File size in bytes
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Renders file attachment UI with previews and download options
   * @param files - Array of file attachments
   */
  const renderFileAttachments = (files?: { uuid?: string; name: string; mimeType: string; size: number; cloudinaryUrl?: string; cdnUrl: string }[]) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs text-muted-foreground font-medium">Attachments:</div>
        <div className="space-y-2">
          {/* Show image previews first */}
          {files.filter(f => f.mimeType.startsWith('image/')).map((file, index) => (
            <div key={file.uuid || `img-${index}`} className="rounded-lg overflow-hidden border border-border/50">
              <Image 
                src={file.cloudinaryUrl || file.cdnUrl} 
                alt={file.name}
                width={500}
                height={256}
                className="max-w-full max-h-64 object-contain bg-muted/20"
                unoptimized
              />
              <div className="p-2 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = file.cloudinaryUrl || file.cdnUrl;
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  title="Download image"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Show other files in a compact list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.filter(f => !f.mimeType.startsWith('image/')).map((file, index) => (
              <div
                key={file.uuid || `file-${index}`}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.mimeType}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Only show view button for non-data URLs */}
                  {!file.cdnUrl.startsWith('data:') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-primary/10"
                      onClick={() => window.open(file.cloudinaryUrl || file.cdnUrl, '_blank')}
                      title="View file"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.cloudinaryUrl || file.cdnUrl;
                      link.download = file.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-6 max-w-2xl w-full">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
              How can I help you today?
            </h1>
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
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-messages scrollbar-hide">
      <div className="w-full">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message-container py-6 px-3 sm:px-4 md:px-6 border-b border-border/5 ${
              message.role === 'assistant' ? 'bg-muted/20' : 'bg-background'
            } hover:bg-muted/10 transition-colors duration-200`}
          >
            <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  {message.role === 'user' ? (
                    <>
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold text-foreground/90">
                    {message.role === 'user' ? (
                      user?.fullName || user?.primaryEmailAddress?.emailAddress || 'You'
                    ) : (
                      'ChatGPT'
                    )}
                  </div>
                  {canEdit && (
                    <div className="message-hover-actions flex items-center gap-1 ml-2 sm:ml-4">
                      {message.role === 'user' && (
                        <>
                          {editingIndex === index ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEdit}
                                className="h-7 w-7 p-0 hover:bg-primary/10 text-primary"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                className="h-7 w-7 p-0 hover:bg-destructive/10 text-muted-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(index, message.content)}
                              className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Edit message"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {message.role === 'assistant' && index === messages.length - 1 && onRegenerateResponse && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onRegenerateResponse}
                          className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Regenerate response"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className={`leading-7 ${message.role === 'assistant' ? 'typing-animation' : ''}`}>
                  {editingIndex === index ? (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit();
                          } else if (e.key === 'Escape') {
                            cancelEdit();
                          }
                        }}
                        className="bg-background border-border/50 focus:border-primary"
                        autoFocus
                        placeholder="Edit your message..."
                      />
                    </div>
                  ) : message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-7 prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border/50 prose-code:bg-muted/60 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-headings:font-semibold">
                      <ReactMarkdown
                        components={{
                          pre: ({ children }) => (
                            <pre className="bg-muted/80 border border-border/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                              {children}
                            </pre>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-muted/60 px-2 py-1 rounded text-sm font-mono">
                                {children}
                              </code>
                            ) : (
                              <code className={`${className} font-mono`}>{children}</code>
                            );
                          },
                          p: ({ children }) => (
                            <p className="mb-3 last:mb-0 leading-7">{children}</p>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="leading-7 text-foreground">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}
                  {renderFileAttachments(message.files)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message-container py-6 px-3 sm:px-4 md:px-6 border-b border-border/5 bg-muted/20 hover:bg-muted/10 transition-colors duration-200">
            <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">ChatGPT</div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}