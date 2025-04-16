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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get request body
    const body = await request.json();
    const { plan, billingInterval } = body;

    if (!plan || !['PRO', 'MAX'].includes(plan)) {
      return NextResponse.json(
        { error: 'Valid plan is required' },
        { status: 400 }
      );
    }

    if (!billingInterval || !['monthly', 'yearly'].includes(billingInterval)) {
      return NextResponse.json(
        { error: 'Valid billing interval is required' },
        { status: 400 }
      );
    }

    // In a real application, you would integrate with a payment processor here
    // such as Stripe, PayPal, etc.

    // For this demo, we'll simulate a successful subscription
    const subscriptionEnd = new Date();
    if (billingInterval === 'monthly') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionEnd: subscriptionEnd,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan,
        billingInterval,
        subscriptionEnd,
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const userId = session.user.id;

    // Get the user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription is active
    const isActive = user.subscriptionEnd
      ? new Date(user.subscriptionEnd) > new Date()
      : false;

    return NextResponse.json({
      subscription: {
        plan: user.subscriptionPlan,
        subscriptionEnd: user.subscriptionEnd,
        isActive: user.subscriptionPlan === 'FREE' || isActive,
      },
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
