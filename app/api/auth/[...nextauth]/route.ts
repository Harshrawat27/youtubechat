import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      //   // Optional: Customize email template
      //   sendVerificationRequest: async ({
      //     identifier: email,
      //     url,
      //     provider: { server, from },
      //   }) => {
      //     // Custom email sending logic using nodemailer
      //     const { createTransport } = await import("nodemailer");
      //     const transport = createTransport(server);
      //     const result = await transport.sendMail({
      //       to: email,
      //       from,
      //       subject: "Sign in to your account",
      //       text: `Please click this link to sign in: ${url}`,
      //       html: `<p>Please click this link to sign in:</p><p><a href="${url}">Sign in</a></p>`,
      //     });
      //     const failed = result.rejected.concat(result.pending).filter(Boolean);
      //     if (failed.length) {
      //       throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
      //     }
      //   },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('User not found');
        }

        if (!user.emailVerified) {
          throw new Error('Email not verified');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionPlan = user.subscriptionPlan;
        token.subscriptionEnd = user.subscriptionEnd;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        session.user.subscriptionEnd = token.subscriptionEnd as Date | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // If the user signs in with Google, we need to check if they have verified their email
      if (account?.provider === 'google' && user.email) {
        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
          where: {
            email: user.email,
          },
        });

        // If they don't exist, set emailVerified to the current date because Google accounts are already verified
        if (!existingUser) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
              subscriptionPlan: 'FREE',
            },
          });
        }
        return true;
      }

      // For email/password login, we need to check if the email is verified
      if (account?.provider === 'credentials') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });

        return !!dbUser?.emailVerified;
      }

      return true;
    },
  },
  events: {
    // When a user signs up via email, we start with a "FREE" plan
    createUser: async ({ user }) => {
      // Only set a subscription plan if the user doesn't already have one
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionPlan: 'FREE' },
      });
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
