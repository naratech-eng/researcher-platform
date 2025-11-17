'use client';

import { useAuthStore } from '@/store/authStore';
import PermissionGate from '@/components/PermissionGate';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const metricsData = {
    Admin: [
      { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
      { label: 'Active Studies', value: '45', change: '+5%', trend: 'up' },
      { label: 'System Health', value: '98%', change: '+2%', trend: 'up' },
      { label: 'Storage Used', value: '2.4 TB', change: '+8%', trend: 'up' },
    ],
    Researcher: [
      { label: 'Active Projects', value: '8', change: '+2', trend: 'up' },
      { label: 'Animals Studied', value: '1,456', change: '+156', trend: 'up' },
      { label: 'Publications', value: '12', change: '+3', trend: 'up' },
      { label: 'Collaborators', value: '24', change: '+6', trend: 'up' },
    ],
    Farmer: [
      { label: 'Total Animals', value: '342', change: '+18', trend: 'up' },
      { label: 'Breeding Program', value: '5', change: '0', trend: 'stable' },
      { label: 'Health Score', value: '94%', change: '+3%', trend: 'up' },
      { label: 'AI Insights', value: '23', change: '+7', trend: 'up' },
    ],
    Student: [
      { label: 'Courses Enrolled', value: '6', change: '+2', trend: 'up' },
      { label: 'Lessons Completed', value: '34', change: '+8', trend: 'up' },
      { label: 'Practice Hours', value: '42h', change: '+12h', trend: 'up' },
      { label: 'Certificates', value: '3', change: '+1', trend: 'up' },
    ],
  };

  const metrics = metricsData[user.role] || metricsData.Student;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Welcome back, {user.firstName}!
        </h1>
        <p style={{ color: 'var(--sidebar-text)' }}>
          {user.role === 'Admin' && 'Manage the platform and oversee all operations.'}
          {user.role === 'Researcher' && 'Continue your research and analyze genetic data.'}
          {user.role === 'Farmer' && 'Manage your livestock and view breeding insights.'}
          {user.role === 'Student' && 'Access learning resources and explore research data.'}
        </p>
      </div>

      {user.authMethod === 'metamask' && user.walletAddress && (
        <div className="mb-6 p-4 rounded-lg border theme-transition" style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)', borderColor: '#fb923c' }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Connected with MetaMask</p>
              <p className="text-xs text-orange-700 dark:text-orange-400 font-mono">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="rounded-xl p-6 border card-hover theme-transition"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium" style={{ color: 'var(--sidebar-text)' }}>
                {metric.label}
              </p>
              {metric.trend === 'up' && (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
              {metric.value}
            </p>
            <p className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
              {metric.change} from last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="lg:col-span-2 rounded-xl p-6 border theme-transition"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b theme-transition" style={{ borderColor: 'var(--card-border)' }}>
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Successfully logged in
                </p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                  Just now
                </p>
              </div>
            </div>
            <PermissionGate resource="data" action="read">
              <div className="flex items-start gap-3 pb-4 border-b theme-transition" style={{ borderColor: 'var(--card-border)' }}>
                <div className="w-2 h-2 mt-2 rounded-full gradient-primary"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Access granted to data resources
                  </p>
                  <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                    Based on your role permissions
                  </p>
                </div>
              </div>
            </PermissionGate>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  System updated to v1.0.0
                </p>
                <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                  2 hours ago
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 border theme-transition"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <PermissionGate resource="data" action="create">
              <button
                className="w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(0, 185, 122, 0.1)',
                  color: 'var(--sidebar-active)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 185, 122, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 185, 122, 0.1)';
                }}
              >
                + Add New Data
              </button>
            </PermissionGate>
            <PermissionGate resource="research" action="create">
              <button
                className="w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(0, 185, 122, 0.1)',
                  color: 'var(--sidebar-active)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 185, 122, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 185, 122, 0.1)';
                }}
              >
                + New Research Project
              </button>
            </PermissionGate>
            <button
              className="w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium theme-transition"
              style={{
                backgroundColor: 'var(--hover-bg)',
                color: 'var(--foreground)',
              }}
            >
              📖 View Documentation
            </button>
          </div>
        </div>
      </div>

      <PermissionGate resource="settings" action="read">
        <div className="p-4 rounded-lg border theme-transition" style={{ backgroundColor: 'rgba(0, 185, 122, 0.1)', borderColor: 'var(--sidebar-active)' }}>
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 mt-0.5"
              style={{ color: 'var(--sidebar-active)' }}
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
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Admin Privileges
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--sidebar-text)' }}>
                You have administrator access to platform settings and user management.
              </p>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
