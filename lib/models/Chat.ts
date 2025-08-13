import mongoose, { Document, Schema } from 'mongoose';

/**
 * Message interface for chat messages
 * Represents individual messages in a chat conversation
 */
export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Chat interface extending Mongoose Document
 * Represents a complete chat conversation with all messages
 */
export interface IChat extends Document {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for chat messages
 * Defines structure and validation for message documents
 */
const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Mongoose schema for chat conversations
 * Defines structure, validation, and indexes for chat documents
 */
const ChatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save middleware
 * Automatically updates the updatedAt timestamp before saving
 */
ChatSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Compound index for efficient user chat queries
 * Optimizes queries that filter by userId and sort by updatedAt
 */
ChatSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);