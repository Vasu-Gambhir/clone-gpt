import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Perplexity streaming...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: 'Say hello world',
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
        stream: true,
      }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Check if it's a streaming response
    const contentType = response.headers.get('content-type');
    console.log('📡 Content-Type:', contentType);

    if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
      console.log('🎯 Detected streaming response!');
      
      const reader = response.body?.getReader();
      if (reader) {
        let chunks = [];
        let fullText = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          chunks.push(chunk);
          fullText += chunk;
          
          console.log('📦 Chunk:', chunk);
        }
        
        return NextResponse.json({
          streaming: true,
          contentType,
          chunks: chunks.length,
          fullResponse: fullText,
        });
      }
    } else {
      console.log('📄 Non-streaming response detected');
      const jsonResponse = await response.json();
      return NextResponse.json({
        streaming: false,
        contentType,
        response: jsonResponse,
      });
    }

  } catch (error) {
    console.error('🔥 Test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}