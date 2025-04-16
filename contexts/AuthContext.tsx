'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from 'next-auth';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signIn: (provider?: string, options?: any) => Promise<any>;
  signOut: () => Promise<void>;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  isSubscriptionActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: 'loading',
  signIn,
  signOut: () => Promise.resolve(),
  isSubscribed: false,
  subscriptionPlan: null,
  isSubscriptionActive: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // Check subscription status
      const plan = session.user.subscriptionPlan;
      setSubscriptionPlan(plan);

      // Consider user subscribed if they have PRO or MAX plan
      setIsSubscribed(plan === 'PRO' || plan === 'MAX');

      // Check if subscription end date is in the future
      const subscriptionEnd = session.user.subscriptionEnd;
      const isActive = subscriptionEnd
        ? new Date(subscriptionEnd) > new Date()
        : false;

      // For FREE plan, always consider active. For paid plans, check the end date
      setIsSubscriptionActive(plan === 'FREE' || isActive);
    } else {
      setIsSubscribed(false);
      setSubscriptionPlan(null);
      setIsSubscriptionActive(false);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        signIn,
        signOut,
        isSubscribed,
        subscriptionPlan,
        isSubscriptionActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
