import type { User } from '../types/auth';
import axios from 'axios';

export interface DIDProvider {
  name: string;
  authenticate: () => Promise<{ success: boolean; identifier?: string; error?: string }>;
}

export const civicDIDAuth = async (): Promise<{ success: boolean; identifier?: string; error?: string }> => {
  try {
    return {
      success: false,
      error: 'Civic DID integration requires additional setup. Please configure Civic API credentials.',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const uPortDIDAuth = async (): Promise<{ success: boolean; identifier?: string; error?: string }> => {
  try {
    return {
      success: false,
      error: 'uPort DID integration requires additional setup. Please configure uPort credentials.',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const authenticateWithDID = async (
  provider: 'civic' | 'uport' = 'civic'
): Promise<{ success: boolean; user?: User; error?: string }> => {
  let authResult;

  switch (provider) {
    case 'civic':
      authResult = await civicDIDAuth();
      break;
    case 'uport':
      authResult = await uPortDIDAuth();
      break;
    default:
      return { success: false, error: 'Unknown DID provider' };
  }

  if (!authResult.success || !authResult.identifier) {
    return { success: false, error: authResult.error };
  }

  try {
    const response = await axios.post('/api/auth/did', {
      didIdentifier: authResult.identifier,
      provider,
    });

    const userData = response.data;

    const user: User = {
      id: userData.id,
      email: userData.email || `${authResult.identifier}@did.local`,
      firstName: userData.firstName || 'DID',
      lastName: userData.lastName || 'User',
      role: userData.role || 'Student',
      didIdentifier: authResult.identifier,
      authMethod: 'did',
    };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const didProviders: DIDProvider[] = [
  {
    name: 'Civic',
    authenticate: civicDIDAuth,
  },
  {
    name: 'uPort',
    authenticate: uPortDIDAuth,
  },
];
