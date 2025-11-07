'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cognitoSignIn, socialSignIn } from '@/services/cognitoAuth';
import { authenticateWithMetaMask, isMetaMaskInstalled } from '@/services/metamaskAuth';
import { authenticateWithDID } from '@/services/didAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'metamask' | 'did'>('email');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    const result = await cognitoSignIn(email, password);

    if (result.success && result.user) {
      login(result.user);
      router.push('/dashboard');
    } else {
      setErrorMessage(result.error || 'Login failed');
    }

    setIsProcessing(false);
  };

  const handleSocialLogin = async (provider: 'Google' | 'Facebook' | 'Apple') => {
    setIsProcessing(true);
    setErrorMessage('');

    await socialSignIn(provider);
    setIsProcessing(false);
  };

  const handleMetaMaskLogin = async () => {
    if (!isMetaMaskInstalled()) {
      setErrorMessage('Please install MetaMask to continue');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const result = await authenticateWithMetaMask();

    if (result.success && result.user) {
      login(result.user);
      router.push('/dashboard');
    } else {
      setErrorMessage(result.error || 'MetaMask authentication failed');
    }

    setIsProcessing(false);
  };

  const handleDIDLogin = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    const result = await authenticateWithDID('civic');

    if (result.success && result.user) {
      login(result.user);
      router.push('/dashboard');
    } else {
      setErrorMessage(result.error || 'DID authentication failed');
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Animal Genetics Research Platform
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'email'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setAuthMethod('metamask')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'metamask'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                MetaMask
              </button>
              <button
                onClick={() => setAuthMethod('did')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'did'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DID
              </button>
            </div>
          </div>

          {authMethod === 'email' && (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isProcessing ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSocialLogin('Google')}
                    disabled={isProcessing}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleSocialLogin('Facebook')}
                    disabled={isProcessing}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleSocialLogin('Apple')}
                    disabled={isProcessing}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {authMethod === 'metamask' && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect with MetaMask</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use your Ethereum wallet to securely sign in
                </p>
                <button
                  onClick={handleMetaMaskLogin}
                  disabled={isProcessing || !isMetaMaskInstalled()}
                  className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isProcessing ? 'Connecting...' : 'Connect MetaMask'}
                </button>
                {!isMetaMaskInstalled() && (
                  <p className="mt-3 text-xs text-orange-700">
                    MetaMask not detected.{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Install MetaMask
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {authMethod === 'did' && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-teal-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Decentralized Identity</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your decentralized digital identity
                </p>
                <button
                  onClick={handleDIDLogin}
                  disabled={isProcessing}
                  className="w-full bg-teal-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isProcessing ? 'Authenticating...' : 'Connect with DID'}
                </button>
                <p className="mt-3 text-xs text-teal-700">
                  Requires DID provider setup
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
