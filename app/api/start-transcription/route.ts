import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getTranscript,
  isTranscriptCached,
  isTranscriptionInProgress,
} from '@/lib/transcription';
import prisma from '@/lib/prisma';

// Define usage limits for different plans
const USAGE_LIMITS = {
  FREE: 5, // 5 videos per month
  PRO: 50, // 50 videos per month
  MAX: Infinity, // Unlimited
};

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // If no session, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract info from the request
    const { videoId } = await request.json();
    const userId = session.user.id;
    const subscriptionPlan = session.user.subscriptionPlan || 'FREE';

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if user has reached their usage limit (only for FREE and PRO plans)
    if (subscriptionPlan !== 'MAX') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      // Count the number of chats created this month
      const monthlyUsage = await prisma.chat.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Get the limit for the user's plan
      const userLimit =
        USAGE_LIMITS[subscriptionPlan as keyof typeof USAGE_LIMITS] ||
        USAGE_LIMITS.FREE;

      // Check if the user has reached their limit
      if (monthlyUsage >= userLimit) {
        return NextResponse.json(
          {
            error: 'Usage limit reached',
            status: 'limit_reached',
            limit: userLimit,
            usage: monthlyUsage,
          },
          { status: 403 }
        );
      }
    }

    // Check if transcript already exists or is being processed
    if (isTranscriptCached(videoId)) {
      // If using a cached transcript, still record the usage
      await recordUsage(userId, videoId);
      return NextResponse.json({ status: 'completed', videoId });
    }

    if (isTranscriptionInProgress(videoId)) {
      return NextResponse.json({ status: 'in_progress', videoId });
    }

    // Record this video as a new usage
    await recordUsage(userId, videoId);

    // Start transcription process in the background
    getTranscript(videoId).catch((error) => {
      console.error(`Error transcribing video ${videoId}:`, error);
    });

    return NextResponse.json({ status: 'started', videoId });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    );
  }
}

// Helper function to record usage
async function recordUsage(userId: string, videoId: string) {
  try {
    // Create a new chat entry to track usage
    await prisma.chat.create({
      data: {
        videoId,
        title: `Chat about video ${videoId}`,
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
  } catch (error) {
    console.error('Error recording usage:', error);
  }
}
