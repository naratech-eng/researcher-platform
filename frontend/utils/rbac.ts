import type { UserRole, RolePermissions } from '../types/auth';

export const rolePermissions: RolePermissions = {
  Admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'data', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'research', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  Researcher: [
    { resource: 'data', actions: ['create', 'read', 'update'] },
    { resource: 'research', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'notebooks', actions: ['create', 'read', 'update', 'delete'] },
  ],
  Farmer: [
    { resource: 'data', actions: ['create', 'read', 'update'] },
    { resource: 'livestock', actions: ['create', 'read', 'update'] },
    { resource: 'breeding', actions: ['read'] },
    { resource: 'insights', actions: ['read'] },
  ],
  Student: [
    { resource: 'data', actions: ['read'] },
    { resource: 'research', actions: ['read'] },
    { resource: 'learning', actions: ['read'] },
    { resource: 'notebooks', actions: ['create', 'read', 'update'] },
  ],
};

export const hasPermission = (
  role: UserRole,
  resource: string,
  action: string
): boolean => {
  const permissions = rolePermissions[role] || [];
  const resourcePermission = permissions.find((p) => p.resource === resource);
  return resourcePermission?.actions.includes(action) || false;
};

export const canAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    Admin: 4,
    Researcher: 3,
    Farmer: 2,
    Student: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const getRoleDisplayName = (role: UserRole): string => {
  return role;
};

export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    Admin: 'text-red-600 bg-red-100',
    Researcher: 'text-blue-600 bg-blue-100',
    Farmer: 'text-green-600 bg-green-100',
    Student: 'text-yellow-600 bg-yellow-100',
  };
  return colors[role] || 'text-gray-600 bg-gray-100';
};
