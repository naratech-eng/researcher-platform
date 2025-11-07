import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth';
import type { User } from '../types/auth';

export const cognitoSignUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
) => {
  try {
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          given_name: firstName,
          family_name: lastName,
          'custom:role': role,
        },
      },
    });
    return { success: true, userId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const cognitoSignIn = async (email: string, password: string) => {
  try {
    const { isSignedIn } = await signIn({ username: email, password });
    if (isSignedIn) {
      const user = await getCognitoUser();
      return { success: true, user };
    }
    return { success: false, error: 'Sign in failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const socialSignIn = async (provider: 'Google' | 'Facebook' | 'Apple') => {
  try {
    await signInWithRedirect({ provider });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const cognitoSignOut = async () => {
  try {
    await signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCognitoUser = async (): Promise<User | null> => {
  try {
    const currentUser = await getCurrentUser();
    const session = await fetchAuthSession();

    const attributes = session?.tokens?.idToken?.payload;

    if (!attributes) return null;

    return {
      id: currentUser.userId,
      cognitoUserId: currentUser.userId,
      email: attributes.email as string,
      firstName: attributes.given_name as string || '',
      lastName: attributes.family_name as string || '',
      role: (attributes['custom:role'] as any) || 'Student',
      authMethod: 'cognito',
    };
  } catch (error) {
    return null;
  }
};

export const getUserGroups = async (): Promise<string[]> => {
  try {
    const session = await fetchAuthSession();
    const groups = session?.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
    return groups;
  } catch (error) {
    return [];
  }
};
