'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden theme-transition">
      <Sidebar
        userRole={user.role}
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
      />

      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <header
          className="h-16 border-b flex items-center justify-between px-6 sticky top-0 z-30 theme-transition"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              Animal Genetics Research Platform
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="p-2.5 rounded-lg transition-all hover:scale-105 theme-transition relative"
              style={{
                backgroundColor: 'var(--hover-bg)',
                color: 'var(--foreground)',
              }}
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <ThemeToggle />

            <div className="relative group">
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg transition-all hover:scale-105 theme-transition"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                }}
              >
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
              </button>

              <div
                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 theme-transition"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--sidebar-text)' }}>
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-2 px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: 'rgba(0, 185, 122, 0.1)',
                      color: 'var(--sidebar-active)',
                    }}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="p-2">
                  <button
                    className="w-full text-left px-3 py-2 rounded-md transition-colors text-sm"
                    style={{
                      color: 'var(--foreground)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    My Account
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 rounded-md transition-colors text-sm"
                    style={{
                      color: 'var(--foreground)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Settings
                  </button>
                  <div className="my-1 border-t" style={{ borderColor: 'var(--card-border)' }}></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md transition-colors text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 theme-transition" style={{ backgroundColor: 'var(--background)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
