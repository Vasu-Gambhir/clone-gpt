import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';

/**
 * POST /api/chats/[chatId]/stream
 * Handles streaming chat responses with real-time updates
 * Uses Server-Sent Events for progressive response delivery
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chatId } = await params;
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { message } = await request.json();

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
    };

    chat.messages.push(userMessage);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send user message first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'userMessage', 
              message: userMessage 
            })}\n\n`)
          );

          // Call Perplexity AI with streaming
          console.log('🤖 Sending streaming request to Perplexity AI...');
          console.log('🔑 API Key present:', !!process.env.PERPLEXITY_API_KEY);
          console.log('🔑 API Key format:', process.env.PERPLEXITY_API_KEY?.substring(0, 10) + '...');
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
                ...chat.messages.map((msg: { role: string; content: string }) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              ],
              max_tokens: 1000,
              temperature: 0.7,
              stream: true, // Enable streaming for real-time effect
            }),
          });

          console.log('📡 Perplexity API streaming response status:', perplexityResponse.status);

          if (!perplexityResponse.ok) {
            const errorText = await perplexityResponse.text();
            console.error('❌ Perplexity API error response:', errorText);
            throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
          }

          // Handle streaming response
          const reader = perplexityResponse.body?.getReader();
          if (!reader) {
            throw new Error('Failed to get reader from response');
          }

          let fullResponse = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                if (!data) continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    // Send each chunk as it comes
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ 
                        type: 'chunk', 
                        content: content 
                      })}\n\n`)
                    );
                    
                    // Add a small delay to make streaming more visible
                    await new Promise(resolve => setTimeout(resolve, 20));
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // If no streaming content was received, try fallback
          if (!fullResponse) {
            fullResponse = 'I received your message but there was an issue with the streaming response. Please try again.';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'chunk', 
                content: fullResponse 
              })}\n\n`)
            );
          }

          // Save assistant message to database
          const assistantMessage = {
            role: 'assistant' as const,
            content: fullResponse || 'Sorry, I could not generate a response.',
            timestamp: new Date(),
          };

          chat.messages.push(assistantMessage);

          // Update chat title if it's the first message
          if (chat.messages.length === 2) {
            const firstWords = message.trim().split(' ').slice(0, 6).join(' ');
            chat.title = firstWords.length > 50 ? firstWords.substring(0, 47) + '...' : firstWords;
          }

          await chat.save();

          // Send completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete',
              assistantMessage,
              chatTitle: chat.title
            })}\n\n`)
          );

        } catch (error) {
          console.error('Streaming error:', error);
          
          // Add error message
          const errorMessage = {
            role: 'assistant' as const,
            content: 'Sorry, I encountered an error while processing your message. Please try again.',
            timestamp: new Date(),
          };

          chat.messages.push(errorMessage);
          await chat.save();

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              message: errorMessage,
              error: 'AI service temporarily unavailable'
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in streaming endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}