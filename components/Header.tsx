'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  LogOut,
  Menu,
  X,
  Home,
  Video,
  MessageSquare,
} from 'lucide-react';

export default function Header() {
  const { session, status, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className='bg-dark-400 border-b border-dark-300'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo and main nav */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center gap-2'>
              <span className='font-bold text-xl text-primary-300'>
                YouChat AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden md:ml-6 md:flex md:items-center md:space-x-4'>
              <Link
                href='/'
                className='text-gray-300 hover:text-primary-300 px-3 py-2 rounded-md'
              >
                <span className='flex items-center gap-1'>
                  <Home size={16} />
                  <span>Home</span>
                </span>
              </Link>
              <Link
                href='/chat'
                className='text-gray-300 hover:text-primary-300 px-3 py-2 rounded-md'
              >
                <span className='flex items-center gap-1'>
                  <MessageSquare size={16} />
                  <span>AI Chat</span>
                </span>
              </Link>
              <Link
                href='/videos'
                className='text-gray-300 hover:text-primary-300 px-3 py-2 rounded-md'
              >
                <span className='flex items-center gap-1'>
                  <Video size={16} />
                  <span>My Videos</span>
                </span>
              </Link>
            </nav>
          </div>

          {/* User profile & mobile menu button */}
          <div className='flex items-center'>
            {status === 'authenticated' && session?.user ? (
              <div className='flex items-center gap-3'>
                <div className='hidden md:flex items-center'>
                  <span className='text-sm text-gray-300 mr-2'>
                    {session.user.name || session.user.email}
                  </span>
                  <span className='px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30'>
                    {session.user.subscriptionPlan || 'FREE'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className='text-gray-300 hover:text-primary-300 p-2'
                  aria-label='Sign out'
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className='hidden md:flex items-center gap-2'>
                <Link
                  href='/auth/signin'
                  className='text-gray-300 hover:text-primary-300 px-3 py-2 rounded-md'
                >
                  Sign In
                </Link>
                <Link
                  href='/auth/signup'
                  className='bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-md transition-colors'
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className='md:hidden ml-4'>
              <button
                onClick={toggleMobileMenu}
                className='text-gray-300 hover:text-primary-300 p-2'
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='md:hidden bg-dark-300 border-t border-dark-200'>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            <Link
              href='/'
              className='text-gray-300 hover:text-primary-300 block px-3 py-2 rounded-md'
              onClick={toggleMobileMenu}
            >
              <span className='flex items-center gap-2'>
                <Home size={16} />
                <span>Home</span>
              </span>
            </Link>
            <Link
              href='/chat'
              className='text-gray-300 hover:text-primary-300 block px-3 py-2 rounded-md'
              onClick={toggleMobileMenu}
            >
              <span className='flex items-center gap-2'>
                <MessageSquare size={16} />
                <span>AI Chat</span>
              </span>
            </Link>
            <Link
              href='/videos'
              className='text-gray-300 hover:text-primary-300 block px-3 py-2 rounded-md'
              onClick={toggleMobileMenu}
            >
              <span className='flex items-center gap-2'>
                <Video size={16} />
                <span>My Videos</span>
              </span>
            </Link>

            {status === 'authenticated' && session?.user ? (
              <div className='pt-2 border-t border-dark-200'>
                <div className='px-3 py-2 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <User size={16} className='text-gray-300' />
                    <span className='text-sm text-gray-300'>
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <span className='px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30'>
                    {session.user.subscriptionPlan || 'FREE'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className='flex items-center gap-2 w-full text-left text-gray-300 hover:text-primary-300 px-3 py-2 rounded-md'
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className='pt-2 border-t border-dark-200 flex flex-col gap-2'>
                <Link
                  href='/auth/signin'
                  className='text-gray-300 hover:text-primary-300 block px-3 py-2 rounded-md'
                  onClick={toggleMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  href='/auth/signup'
                  className='bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-md transition-colors text-center'
                  onClick={toggleMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
