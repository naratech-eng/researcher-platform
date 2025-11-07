export type UserRole = 'Farmer' | 'Researcher' | 'Student' | 'Admin';

export type AuthMethod = 'cognito' | 'metamask' | 'did' | 'social';

export interface User {
  id: string;
  cognitoUserId?: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  walletAddress?: string;
  didIdentifier?: string;
  authMethod: AuthMethod;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  [key: string]: Permission[];
}
