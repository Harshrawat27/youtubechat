import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      subscriptionPlan: string;
      subscriptionEnd: Date | null;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user type
   */
  interface User {
    id: string;
    subscriptionPlan?: string;
    subscriptionEnd?: Date | null;
    emailVerified?: Date | null;
    // Additional user fields can be added here
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT type
   */
  interface JWT {
    id: string;
    subscriptionPlan?: string;
    subscriptionEnd?: Date | null;
    // Additional JWT fields can be added here
  }
}
