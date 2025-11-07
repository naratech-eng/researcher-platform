'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { isMetaMaskInstalled } from '@/services/metamaskAuth';

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

    const result = await api.login(email, password);

    if (result.success && result.user && result.token) {
      login(result.user, result.token);
      router.push('/dashboard');
    } else {
      setErrorMessage(result.error || 'Login failed');
    }

    setIsProcessing(false);
  };

  const handleMetaMaskLogin = async () => {
    if (!isMetaMaskInstalled()) {
      setErrorMessage('Please install MetaMask to continue');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];

      const message = `Sign this message to authenticate with Animal Genetics Research Platform.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const result = await api.metamaskAuth(walletAddress, signature, message);

      if (result.success && result.user && result.token) {
        login(result.user, result.token);
        router.push('/dashboard');
      } else {
        setErrorMessage(result.error || 'MetaMask authentication failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'MetaMask authentication failed');
    }

    setIsProcessing(false);
  };

  const handleDIDLogin = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setErrorMessage('DID authentication requires provider setup. Please use email/password or MetaMask.');
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
              Don't have an account?{' '}
              <button 
                onClick={() => router.push('/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
