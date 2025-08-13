/**
 * ProcessedFile interface
 * Represents a file attachment that has been processed and uploaded
 */
export interface ProcessedFile {
  uuid: string;
  name: string;
  size: number;
  mimeType: string;
  cdnUrl: string;
  originalUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  textContent?: string;
  error?: string;
}

/**
 * ChatMessage interface
 * Represents a single message in a chat conversation
 * Can include file attachments
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: ProcessedFile[];
}

/**
 * ChatData interface
 * Complete chat conversation data including all messages
 * Used for full chat display and interaction
 */
export interface ChatData {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChatSummary interface
 * Lightweight chat representation for lists and navigation
 * Contains only essential metadata without messages
 */
export interface ChatSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}