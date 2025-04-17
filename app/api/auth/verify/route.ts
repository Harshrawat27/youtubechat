// app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the token and email from the URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      // Redirect to error page if token or email is missing
      return NextResponse.redirect(
        new URL('/auth/error?error=InvalidVerification', request.url)
      );
    }

    console.log('Verifying email with token:', {
      email,
      tokenLength: token.length,
    });

    // Find the verification token in the database
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: email,
        expires: {
          gt: new Date(), // Check that the token hasn't expired
        },
      },
    });

    if (!verificationToken) {
      console.log('Invalid or expired verification token');
      return NextResponse.redirect(
        new URL('/auth/error?error=ExpiredToken', request.url)
      );
    }

    // Find the user with this email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.redirect(
        new URL('/auth/error?error=UserNotFound', request.url)
      );
    }

    // Update the user's emailVerified field
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    console.log('Email verified successfully for user:', user.id);

    // Redirect to successful verification page (or sign-in page)
    return NextResponse.redirect(
      new URL('/auth/signin?verified=true', request.url)
    );
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=VerificationError', request.url)
    );
  }
}
