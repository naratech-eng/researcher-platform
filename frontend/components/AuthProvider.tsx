'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCognitoUser } from '@/services/cognitoAuth';
import { configureAmplify } from '@/lib/amplify-config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    configureAmplify();

    const checkAuth = async () => {
      setLoading(true);
      const user = await getCognitoUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
