'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/rbac';

interface PermissionGateProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasAccess = hasPermission(user.role, resource, action);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
