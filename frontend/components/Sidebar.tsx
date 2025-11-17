'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles?: string[];
  subItems?: NavItem[];
}

const navigationItems: NavItem[] = [
  { id: 'home', label: 'Home / Dashboard', icon: '🏠', path: '/dashboard' },
  { id: 'emilia', label: 'Emilia AI', icon: '🤖', path: '/emilia-ai' },
  { id: 'breeding', label: 'Breeding Engine', icon: '🧬', path: '/breeding-engine' },
  { id: 'mating', label: 'Mating Strategy', icon: '💕', path: '/mating-strategy' },
  {
    id: 'research',
    label: 'Research Environment',
    icon: '🔬',
    path: '/research',
    subItems: [
      { id: 'rstudio', label: 'RStudio', icon: '📊', path: '/research/rstudio' },
      { id: 'jupyter', label: 'Jupyter Notebook', icon: '📓', path: '/research/jupyter' },
    ],
  },
  { id: 'data', label: 'Data Management', icon: '💾', path: '/data-management' },
  { id: 'analytics', label: 'Analytics & Reports', icon: '📈', path: '/analytics' },
  { id: 'collaboration', label: 'Collaboration Hub', icon: '👥', path: '/collaboration' },
  { id: 'education', label: 'Education / Tutorials', icon: '📚', path: '/education' },
  { id: 'admin', label: 'Admin Tools', icon: '⚙️', path: '/admin', roles: ['Admin'] },
];

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

export default function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredNav = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        {!collapsed && (
          <h2 className="text-lg font-bold text-gradient">
            AGRP
          </h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
          style={{ backgroundColor: 'var(--hover-bg)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--sidebar-text)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
        {filteredNav.map((item) => (
          <div key={item.id} className="mb-1">
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    collapsed ? 'justify-center' : ''
                  }`}
                  style={{
                    color: 'var(--sidebar-text)',
                    backgroundColor: expandedItems.includes(item.id)
                      ? 'var(--hover-bg)'
                      : 'transparent',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedItems.includes(item.id) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
                {!collapsed && expandedItems.includes(item.id) && item.subItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                          isActive(subItem.path)
                            ? 'font-medium'
                            : ''
                        }`}
                        style={{
                          color: isActive(subItem.path) ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                          backgroundColor: isActive(subItem.path) ? 'rgba(0, 185, 122, 0.1)' : 'transparent',
                          borderLeft: isActive(subItem.path) ? '3px solid var(--sidebar-active)' : 'none',
                        }}
                      >
                        <span className="text-base">{subItem.icon}</span>
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${isActive(item.path) ? 'font-medium' : ''}`}
                style={{
                  color: isActive(item.path) ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                  backgroundColor: isActive(item.path) ? 'rgba(0, 185, 122, 0.1)' : 'transparent',
                  borderLeft: isActive(item.path) ? '3px solid var(--sidebar-active)' : 'none',
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div
        className="border-t p-4"
        style={{ borderColor: 'var(--card-border)' }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {userName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>
                {userEmail}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        {!collapsed && (
          <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--sidebar-text)' }}>
            <span>v1.0.0</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Online</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
