const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  user?: any;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : ((options.headers as Record<string, string> | undefined) ?? {})),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
      ...data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

export const api = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    return fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string) => {
    return fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  metamaskAuth: async (walletAddress: string, signature: string, message: string) => {
    return fetchApi('/api/auth/metamask', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  },

  didAuth: async (didIdentifier: string, provider: string) => {
    return fetchApi('/api/auth/did', {
      method: 'POST',
      body: JSON.stringify({ didIdentifier, provider }),
    });
  },

  getProfile: async () => {
    return fetchApi('/api/auth/profile', {
      method: 'GET',
    });
  },

  healthCheck: async () => {
    return fetchApi('/health', {
      method: 'GET',
    });
  },
};
