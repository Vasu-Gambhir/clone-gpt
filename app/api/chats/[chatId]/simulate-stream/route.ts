import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';

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

    const { message, files } = await request.json();

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Add user message with clean content
    const userMessage = {
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
      files: files || undefined,
    };
    
    // Build AI context with file information (separate from displayed message)
    let aiContextMessage = message.trim();
    if (files && files.length > 0) {
      const fileDescriptions = files.map((file: any) => {
        // Only include text content for text files, not data URLs
        if (file.textContent && !file.textContent.startsWith('[')) {
          return `File: ${file.name}\nContent: ${file.textContent}`;
        }
        return `File: ${file.name} (${file.mimeType})`;
      }).join('\n\n');
      
      aiContextMessage = `${aiContextMessage}\n\n[User has attached the following files:\n${fileDescriptions}]`;
    }

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

          // Get response from Perplexity (non-streaming)
          console.log('🤖 Getting response from Perplexity AI...');
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
                  content: 'You are a helpful AI assistant. Be concise and accurate in your responses. If files are provided, analyze them and provide relevant insights.',
                },
                ...chat.messages.slice(0, -1).map((msg: any) => ({
                  role: msg.role,
                  content: msg.content,
                })),
                // Use the AI context message for the last user message
                {
                  role: 'user',
                  content: aiContextMessage,
                },
              ],
              max_tokens: 1000,
              temperature: 0.7,
              stream: false,
            }),
          });

          if (!perplexityResponse.ok) {
            const errorText = await perplexityResponse.text();
            console.error('❌ Perplexity API error:', errorText);
            throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
          }

          const aiResponse = await perplexityResponse.json();
          const fullResponse = aiResponse.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
          
          console.log('✅ Got full response, simulating streaming...');
          
          // Simulate streaming by sending words gradually
          const words = fullResponse.split(' ');
          let streamedContent = '';
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            streamedContent += (i === 0 ? '' : ' ') + word;
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'chunk', 
                content: word + (i < words.length - 1 ? ' ' : '')
              })}\n\n`)
            );
            
            // Add delay between words for streaming effect
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Save assistant message to database
          const assistantMessage = {
            role: 'assistant' as const,
            content: fullResponse,
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
          console.error('Simulated streaming error:', error);
          
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
    console.error('Error in simulated streaming endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}