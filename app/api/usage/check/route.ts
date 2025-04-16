import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Define usage limits for different plans
const USAGE_LIMITS = {
  FREE: 5, // 5 videos per month
  PRO: 50, // 50 videos per month
  MAX: Infinity, // Unlimited
};

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // If no session, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const subscriptionPlan = session.user.subscriptionPlan || 'FREE';

    // Get the current month's beginning and end
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
    const hasReachedLimit = monthlyUsage >= userLimit;

    // Get remaining usage
    const remainingUsage = Math.max(0, userLimit - monthlyUsage);

    return NextResponse.json({
      hasReachedLimit,
      usage: {
        current: monthlyUsage,
        limit: userLimit,
        remaining: remainingUsage,
      },
      plan: subscriptionPlan,
    });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Failed to check usage limit' },
      { status: 500 }
    );
  }
}
