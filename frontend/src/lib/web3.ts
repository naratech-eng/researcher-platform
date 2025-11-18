declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MetaMaskError extends Error {
  code?: number;
}

export async function connectMetaMask(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    return accounts[0];
  } catch (error) {
    const metamaskError = error as MetaMaskError;
    
    if (metamaskError.code === 4001) {
      throw new Error("MetaMask connection request was rejected.");
    } else if (metamaskError.code === -32002) {
      throw new Error("MetaMask connection request is already pending. Please check MetaMask.");
    }
    
    throw new Error(metamaskError.message || "Failed to connect to MetaMask.");
  }
}

export async function signMessageWithMetaMask(
  address: string,
  message: string
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    return signature;
  } catch (error) {
    const metamaskError = error as MetaMaskError;
    
    if (metamaskError.code === 4001) {
      throw new Error("Signature request was rejected.");
    }
    
    throw new Error(metamaskError.message || "Failed to sign message.");
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window.ethereum !== "undefined";
}

export async function switchToNetwork(chainId: string): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error: any) {
    // Chain not added to MetaMask
    if (error.code === 4902) {
      throw new Error("Please add this network to MetaMask first.");
    }
    throw error;
  }
}
