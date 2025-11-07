'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cognitoSignOut } from '@/services/cognitoAuth';
import { disconnectMetaMask } from '@/services/metamaskAuth';
import PermissionGate from '@/components/PermissionGate';
import { getRoleColor } from '@/utils/rbac';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    if (user?.authMethod === 'cognito' || user?.authMethod === 'social') {
      await cognitoSignOut();
    } else if (user?.authMethod === 'metamask') {
      await disconnectMetaMask();
    }
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const dashboardSections = {
    Admin: [
      { title: 'User Management', icon: '👥', description: 'Manage platform users and roles', color: 'bg-blue-500' },
      { title: 'System Settings', icon: '⚙️', description: 'Configure platform settings', color: 'bg-gray-500' },
      { title: 'Analytics', icon: '📊', description: 'View platform analytics', color: 'bg-green-500' },
      { title: 'Data Management', icon: '💾', description: 'Manage all platform data', color: 'bg-violet-500' },
    ],
    Researcher: [
      { title: 'Research Projects', icon: '🔬', description: 'Manage your research projects', color: 'bg-blue-500' },
      { title: 'Data Analysis', icon: '📊', description: 'Analyze genetic data', color: 'bg-green-500' },
      { title: 'Notebooks', icon: '📓', description: 'Jupyter & RStudio access', color: 'bg-orange-500' },
      { title: 'Publications', icon: '📄', description: 'Research publications', color: 'bg-teal-500' },
    ],
    Farmer: [
      { title: 'My Livestock', icon: '🐑', description: 'Manage your animals', color: 'bg-green-500' },
      { title: 'Breeding Program', icon: '🧬', description: 'View breeding recommendations', color: 'bg-blue-500' },
      { title: 'Health Records', icon: '🏥', description: 'Track animal health', color: 'bg-red-500' },
      { title: 'Insights', icon: '💡', description: 'AI-powered insights', color: 'bg-yellow-500' },
    ],
    Student: [
      { title: 'Learning Resources', icon: '📚', description: 'Educational materials', color: 'bg-blue-500' },
      { title: 'Research Access', icon: '🔍', description: 'View research data', color: 'bg-green-500' },
      { title: 'Practice Notebooks', icon: '📓', description: 'Learning environment', color: 'bg-orange-500' },
      { title: 'Tutorials', icon: '🎓', description: 'Interactive tutorials', color: 'bg-teal-500' },
    ],
  };

  const sections = dashboardSections[user.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Animal Genetics Research Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            {user.role === 'Admin' && 'Manage the platform and oversee all operations.'}
            {user.role === 'Researcher' && 'Continue your research and analyze genetic data.'}
            {user.role === 'Farmer' && 'Manage your livestock and view breeding insights.'}
            {user.role === 'Student' && 'Access learning resources and explore research data.'}
          </p>
        </div>

        {user.authMethod === 'metamask' && user.walletAddress && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-900">Connected with MetaMask</p>
                <p className="text-xs text-orange-700 font-mono">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {user.authMethod === 'did' && user.didIdentifier && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-teal-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-teal-900">Authenticated with DID</p>
                <p className="text-xs text-teal-700 font-mono">
                  {user.didIdentifier.slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
            >
              <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl">{section.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Successfully logged in</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <PermissionGate resource="data" action="read">
                <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Access granted to data resources</p>
                    <p className="text-xs text-gray-500">Based on your role permissions</p>
                  </div>
                </div>
              </PermissionGate>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <PermissionGate resource="data" action="create">
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium text-blue-700">
                  + Add New Data
                </button>
              </PermissionGate>
              <PermissionGate resource="research" action="create">
                <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition text-sm font-medium text-green-700">
                  + New Research Project
                </button>
              </PermissionGate>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700">
                📖 View Documentation
              </button>
            </div>
          </div>
        </div>

        <PermissionGate resource="settings" action="read">
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Admin Privileges</p>
                <p className="text-xs text-blue-700 mt-1">
                  You have administrator access to platform settings and user management.
                </p>
              </div>
            </div>
          </div>
        </PermissionGate>
      </main>
    </div>
  );
}
