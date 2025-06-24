import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { theme, playerLevel } = await request.json();

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      );
    }

    const world = await aiService.generateProceduralWorld(
      theme,
      playerLevel || 1
    );

    return NextResponse.json(world);
  } catch (error) {
    console.error('World Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate world' },
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