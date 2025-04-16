import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube Chat App',
  description: 'Chat with YouTube videos using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='dark'>
      <body
        className={`${inter.className} bg-dark-500 text-white min-h-screen`}
      >
        <SessionProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
