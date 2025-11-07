# Animal Genetics Research Platform - Frontend

Multi-method authentication system with role-based access control (RBAC) built with Next.js 16.0.1.

## Features

### Authentication Methods

1. **Email/Password with Amazon Cognito** - Traditional authentication with password management
2. **Social Login** - Google, Facebook, and Apple OAuth integration
3. **MetaMask (Web3)** - Ethereum wallet connection with message signing
4. **Decentralized Identity (DID)** - Support for Civic and uPort providers

### Role-Based Access Control

Four distinct user roles with hierarchical permissions:
- **Admin**: Full platform access, user management, system configuration
- **Researcher**: Research projects, data analysis, notebooks, publications
- **Farmer**: Livestock management, breeding insights, health records
- **Student**: Learning resources, research access, educational materials

### Dashboard Features

- Role-specific content and quick actions
- Permission-based UI rendering
- Activity tracking and notifications
- Responsive design for all devices
- MetaMask and DID connection indicators

## Tech Stack

- **Next.js 16.0.1** with App Router
- **React 19.2.0** with TypeScript
- **Tailwind CSS 4.1** for styling
- **AWS Amplify 6** for Cognito integration
- **Ethers.js 6** for Web3/MetaMask
- **Zustand 5** for state management
- **Supabase** for database
- **pnpm** for package management

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```
NEXT_PUBLIC_AWS_USER_POOL_ID=your_cognito_user_pool_id
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=your_cognito_client_id
NEXT_PUBLIC_AWS_COGNITO_DOMAIN=your_cognito_domain
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - automatically redirects to login or dashboard.

## Build

```bash
pnpm build
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Home (redirects to dashboard)
│   ├── login/              # Login page
│   └── dashboard/          # Protected dashboard
├── components/
│   ├── AuthProvider.tsx    # Auth initialization
│   ├── ProtectedRoute.tsx  # Route protection
│   └── PermissionGate.tsx  # Permission-based rendering
├── services/
│   ├── cognitoAuth.ts      # Cognito authentication
│   ├── metamaskAuth.ts     # MetaMask Web3 auth
│   └── didAuth.ts          # DID authentication
├── store/
│   └── authStore.ts        # Zustand auth state
├── types/
│   └── auth.ts             # TypeScript types
├── utils/
│   └── rbac.ts             # Permission utilities
└── lib/
    ├── amplify-config.ts   # AWS Amplify setup
    └── supabase.ts         # Supabase client
```

## AWS Cognito Setup (Required)

### 1. Create User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name animal-genetics-pool \
  --auto-verified-attributes email \
  --schema Name=custom:role,AttributeDataType=String,Mutable=true
```

### 2. Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name animal-genetics-client \
  --generate-secret false \
  --allowed-o-auth-flows code implicit \
  --allowed-o-auth-scopes openid email profile \
  --callback-urls http://localhost:3000 \
  --logout-urls http://localhost:3000
```

### 3. Create User Groups

```bash
for role in Admin Researcher Farmer Student; do
  aws cognito-idp create-group \
    --group-name $role \
    --user-pool-id YOUR_USER_POOL_ID
done
```

### 4. Configure Social Providers

In AWS Console:
1. Navigate to Cognito → User Pools → Your Pool
2. Go to "App integration" → "Federated identity providers"
3. Add Google, Facebook, Apple providers
4. Configure OAuth redirect URLs

## Authentication Flows

### Email/Password Login
User enters credentials → Cognito validates → JWT tokens returned → User redirected to dashboard

### Social Login
Click provider → Cognito hosted UI → Provider auth → Account linked → Tokens returned → Dashboard

### MetaMask Login
Connect wallet → Select account → Sign message → Signature verified → Session created → Dashboard

### DID Login
Select provider → DID authentication → Credentials verified → User profile created → Dashboard

## RBAC System

Permission matrix defined in `utils/rbac.ts`:

```typescript
const rolePermissions = {
  Admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    // ...
  ],
  // ...
}
```

Usage in components:

```tsx
<PermissionGate resource="data" action="create">
  <button>Add New Data</button>
</PermissionGate>
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `NEXT_PUBLIC_AWS_USER_POOL_ID` | Cognito User Pool ID | Yes |
| `NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID` | Cognito Client ID | Yes |
| `NEXT_PUBLIC_AWS_COGNITO_DOMAIN` | Cognito hosted UI domain | Yes |
| `NEXT_PUBLIC_AWS_IDENTITY_POOL_ID` | Cognito Identity Pool | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

## Security Best Practices

- Never commit `.env.local` to version control
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Rotate credentials regularly
- Validate JWT tokens server-side
- Enable MFA for admin accounts
- Audit user actions and access logs

## Troubleshooting

### MetaMask Not Detected
- Install MetaMask browser extension
- Refresh the page
- Check browser console for errors

### Cognito Authentication Fails
- Verify User Pool configuration
- Check OAuth redirect URLs
- Ensure user exists in correct group

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Check TypeScript errors: `pnpm run build`

## License

MIT
