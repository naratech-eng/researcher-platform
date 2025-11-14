import { Amplify } from 'aws-amplify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function configureAmplify(): void {
  Amplify.configure({
    API: {
      REST: {
        userApi: {
          endpoint: API_URL,
        },
      },
    },
  });
}
