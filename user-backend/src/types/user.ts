export interface User {
  _id?: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Researcher' | 'Farmer' | 'Student';
  firstName: string;
  lastName: string;
  cognitoUserId?: string;
  walletAddress?: string;
  didIdentifier?: string;
  authMethod: 'cognito' | 'metamask' | 'did' | 'email';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Researcher' | 'Farmer' | 'Student';
}

export interface MetaMaskAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface DIDAuthRequest {
  didIdentifier: string;
  provider: string;
}
