// app/api/test-user-creation/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    // Generate a random email to avoid unique constraint errors
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;

    console.log('Testing user creation with email:', randomEmail);

    // Hash a simple password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Try to create a test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: randomEmail,
        hashedPassword,
        subscriptionPlan: 'FREE',
      },
    });

    console.log('Test user created successfully with ID:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      userId: user.id,
      email: randomEmail,
    });
  } catch (error: any) {
    console.error('Error creating test user:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create test user',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
