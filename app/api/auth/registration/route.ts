// app/api/auth/registration/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

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

      // Create verification token
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

      // Send verification email
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(
        email
      )}`;

      console.log('Attempting to send verification email...');
      try {
        // Configure email transporter
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
          secure: process.env.EMAIL_SERVER_PORT === '465',
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });

        // Send the email
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Verify your YouChat AI account',
          text: `Welcome to YouChat AI! Please verify your account by clicking this link: ${verificationUrl}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8975EA;">Welcome to YouChat AI!</h2>
              <p>Thank you for signing up. Please verify your email address to activate your account.</p>
              <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #8975EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Verify your email
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>This verification link will expire in 24 hours.</p>
              <p>If you didn't sign up for YouChat AI, you can safely ignore this email.</p>
            </div>
          `,
        });
        console.log('Verification email sent successfully');
      } catch (emailError: any) {
        console.error('Error sending verification email:', emailError);
        // Don't return an error response here, still consider the registration successful
        // We'll just log the error and continue
      }

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
