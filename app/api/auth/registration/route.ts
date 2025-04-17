// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { createHash, randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    console.log('Registration API called');
    const body = await request.json();
    console.log('Request body received:', {
      name: body.name,
      email: body.email,
      hasPassword: !!body.password,
    });
    const { name, email, password } = body;

    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      console.log('Validation failed: Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    console.log('Checking if email exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Email already exists');
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    console.log('Attempting to create user in database...');
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          subscriptionPlan: 'FREE',
        },
      });
      console.log('User created successfully with ID:', user.id);

      // Create verification token (this would normally trigger an email)
      const token = randomBytes(32).toString('hex');
      const identifier = email;
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store the verification token
      await prisma.verificationToken.create({
        data: {
          identifier,
          token,
          expires,
        },
      });

      console.log('Created verification token for user');

      // Create a copy without the hashed password
      const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return NextResponse.json(
        {
          success: true,
          user: userWithoutPassword,
          message: 'Registration successful, please verify your email',
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          details: dbError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
