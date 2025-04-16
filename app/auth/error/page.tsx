'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Get error message based on error code
  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'You do not have access to this resource.';
      case 'Verification':
        return 'The verification link may have expired or already been used. Please request a new verification email.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was a problem with your authentication provider. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailSignin':
        return 'The email could not be sent. Please try again later.';
      case 'CredentialsSignin':
        return 'The email or password you entered is incorrect.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unknown error occurred during authentication.';
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-4 bg-dark-500'>
      <div className='w-full max-w-md p-6 bg-dark-300 rounded-lg shadow-md border border-primary-500/20 text-center'>
        <div className='mb-6 p-3 bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto'>
          <AlertTriangle size={32} className='text-red-400' />
        </div>

        <h1 className='text-2xl font-bold mb-4 text-white'>
          Authentication Error
        </h1>

        <div className='p-4 bg-dark-400 rounded-lg mb-6'>
          <p className='text-gray-300'>{getErrorMessage()}</p>
        </div>

        <div className='flex flex-col gap-3'>
          <Link
            href='/auth/signin'
            className='btn-secondary flex items-center justify-center gap-2'
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>

          <Link href='/' className='text-primary-300 hover:underline text-sm'>
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
