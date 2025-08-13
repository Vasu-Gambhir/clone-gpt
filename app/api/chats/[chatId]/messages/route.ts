import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';

/**
 * POST /api/chats/[chatId]/messages
 * Adds a new message to chat and generates AI response
 * Integrates with Perplexity AI for assistant responses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chatId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
    };

    chat.messages.push(userMessage);

    try {
      // Call Perplexity AI
      console.log('🤖 Sending request to Perplexity AI...');
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Be concise and accurate in your responses.',
            },
            ...chat.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      console.log('📡 Perplexity API response status:', perplexityResponse.status);

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        console.error('❌ Perplexity API error:', errorText);
        throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
      }

      const aiResponse = await perplexityResponse.json();
      console.log('✅ Received AI response');
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      chat.messages.push(assistantMessage);

      // Update chat title if it's the first message
      if (chat.messages.length === 2) {
        const firstWords = message.trim().split(' ').slice(0, 6).join(' ');
        chat.title = firstWords.length > 50 ? firstWords.substring(0, 47) + '...' : firstWords;
      }

      await chat.save();

      return NextResponse.json({
        userMessage,
        assistantMessage,
        chatTitle: chat.title,
      });

    } catch (aiError) {
      console.error('AI API error:', aiError);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };

      chat.messages.push(errorMessage);
      await chat.save();

      return NextResponse.json({
        userMessage,
        assistantMessage: errorMessage,
        error: 'AI service temporarily unavailable',
      });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}