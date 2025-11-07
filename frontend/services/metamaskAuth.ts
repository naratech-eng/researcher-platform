import { BrowserProvider } from 'ethers';
import type { User } from '../types/auth';
import axios from 'axios';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

export const connectMetaMask = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length === 0) {
      return { success: false, error: 'No accounts found' };
    }

    return { success: true, address: accounts[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signMessageWithMetaMask = async (message: string): Promise<{ success: boolean; signature?: string; error?: string }> => {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    return { success: true, signature };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const authenticateWithMetaMask = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  const connectionResult = await connectMetaMask();

  if (!connectionResult.success || !connectionResult.address) {
    return { success: false, error: connectionResult.error };
  }

  const message = `Sign this message to authenticate with Animal Genetics Research Platform.\n\nWallet: ${connectionResult.address}\nTimestamp: ${Date.now()}`;

  const signResult = await signMessageWithMetaMask(message);

  if (!signResult.success || !signResult.signature) {
    return { success: false, error: signResult.error };
  }

  try {
    const response = await axios.post('/api/auth/metamask', {
      walletAddress: connectionResult.address,
      signature: signResult.signature,
      message,
    });

    const userData = response.data;

    const user: User = {
      id: userData.id,
      email: userData.email || `${connectionResult.address}@metamask.local`,
      firstName: userData.firstName || 'MetaMask',
      lastName: userData.lastName || 'User',
      role: userData.role || 'Farmer',
      walletAddress: connectionResult.address,
      authMethod: 'metamask',
    };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const disconnectMetaMask = async (): Promise<void> => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      console.error('Error disconnecting MetaMask:', error);
    }
  }
};
