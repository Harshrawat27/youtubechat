// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test the database connection
    await prisma.$connect();

    // Get the count of users as a simple test query
    const userCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
    });
  } catch (error: any) {
    console.error('Database connection error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
