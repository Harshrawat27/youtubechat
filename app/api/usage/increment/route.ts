import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // If no session, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get request body
    const body = await request.json();
    const { videoId, title } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Create a new chat entry to track usage
    const chat = await prisma.chat.create({
      data: {
        videoId,
        title: title || `Chat about video ${videoId}`,
        userId,
      },
    });

    // Update the user's usage credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageCredits: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
