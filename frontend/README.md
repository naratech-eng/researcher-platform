# Animal Genetics Research Platform - Frontend

Modern authentication system with multiple login methods and role-based access control.

## Features

- **Multi-Method Authentication**:
  - Email/Password (with backend API)
  - MetaMask (Web3 wallet)
  - Decentralized Identity (DID)

- **Role-Based Access Control**:
  - Admin - Full platform access
  - Researcher - Research projects and data analysis
  - Farmer - Livestock management
  - Student - Learning resources

- **Modern UI**: Built with Next.js, React, TypeScript, and Tailwind CSS

## Environment Setup

### Step 1: Create `.env.local` file

The environment file is already created for you at `.env.local` with these variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**No changes needed for local development!**

### Step 2: Start the Backend

Make sure the user-backend is running on port 3001:

```bash
cd ../user-backend
bun install
bun run dev
```

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Pages

- `/` - Home (redirects to dashboard)
- `/login` - Multi-method authentication page
- `/register` - User registration
- `/dashboard` - Role-based dashboard (protected)

## Quick Test

### Register a New User

1. Go to http://localhost:3000/register
2. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
   - Role: Farmer
3. Click "Create Account"

### Login

1. Go to http://localhost:3000/login
2. Enter credentials:
   - Email: test@example.com
   - Password: password123
3. Click "Sign In"

You'll be redirected to the dashboard with role-specific content!

## Project Structure

```
app/
├── login/          # Login page (email, MetaMask, DID)
├── register/       # Registration page
├── dashboard/      # Protected dashboard
├── layout.tsx      # Root layout
└── page.tsx        # Home page (redirects)

components/
├── ProtectedRoute.tsx    # Route protection
└── PermissionGate.tsx    # Conditional rendering

services/
├── api.ts               # Backend API client
├── cognitoAuth.ts       # Cognito auth (optional)
├── metamaskAuth.ts      # MetaMask integration
└── didAuth.ts           # DID integration

store/
└── authStore.ts         # Zustand auth state

types/
└── auth.ts              # TypeScript interfaces

utils/
└── rbac.ts             # Role-based access control
```

## Authentication Flow

### Email/Password
1. User enters credentials
2. Frontend calls `/api/auth/login`
3. Backend validates & returns JWT token
4. Token stored in localStorage
5. User redirected to dashboard

### MetaMask
1. User clicks "Connect MetaMask"
2. MetaMask prompts for wallet connection
3. User signs authentication message
4. Frontend sends wallet address + signature to backend
5. Backend verifies signature & returns JWT
6. User logged in

## API Integration

The frontend connects to the backend API at `http://localhost:3001`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/metamask` | POST | MetaMask authentication |
| `/api/auth/did` | POST | DID authentication |
| `/api/auth/profile` | GET | Get user profile (requires JWT) |
| `/health` | GET | Health check |

## Troubleshooting

### "Cannot connect to backend"

1. Check backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`:
   ```bash
   cat .env.local
   ```

### "Login failed"

1. Check backend logs for errors
2. Verify MongoDB/DocumentDB is running
3. Try registering a new account first

### MetaMask not detected

1. Install MetaMask browser extension
2. Create/import a wallet
3. Refresh the page

## Build for Production

```bash
pnpm build
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Auth**: JWT tokens
- **Web3**: Ethers.js 6

## License

MIT
