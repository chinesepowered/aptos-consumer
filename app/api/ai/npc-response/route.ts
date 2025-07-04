import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { character, playerMessage, playerLevel, gameContext } = await request.json();

    if (!character || !playerMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if API keys are available
    const aiProvider = process.env.AI_PROVIDER;
    const togetherKey = process.env.TOGETHER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    console.log('API Provider:', aiProvider);
    console.log('Together Key exists:', !!togetherKey);
    console.log('Groq Key exists:', !!groqKey);

    if (!togetherKey && !groqKey) {
      return NextResponse.json(
        { error: 'No AI API keys configured' },
        { status: 500 }
      );
    }

    const response = await aiService.generateNPCResponse(
      character,
      playerMessage,
      playerLevel || 1,
      gameContext || {}
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: `Failed to generate NPC response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}