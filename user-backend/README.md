# User Backend API

Authentication and user management service for the Animal Genetics Research Platform.

Built with **Bun.js** and **Amazon DocumentDB** (MongoDB-compatible).

## Features

- ✅ Email/Password authentication with bcrypt
- ✅ MetaMask Web3 wallet authentication
- ✅ Decentralized Identity (DID) authentication
- ✅ JWT token-based sessions
- ✅ Role-based user management (Admin, Researcher, Farmer, Student)
- ✅ Amazon DocumentDB integration
- ✅ CORS enabled for frontend integration

## Tech Stack

- **Runtime**: Bun.js
- **Database**: Amazon DocumentDB (MongoDB-compatible)
- **Authentication**: JWT, bcrypt
- **Web3**: Ethers.js

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- MongoDB or Amazon DocumentDB instance
- Node.js (for type checking)

### Installation

```bash
# Install dependencies
bun install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration (see ENVIRONMENT_SETUP.md in project root)

### Development

```bash
# Start development server with auto-reload
bun run dev
```

The API will be available at `http://localhost:3001`

### Production

```bash
# Start production server
bun run start
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user with email/password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Farmer"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Farmer",
    "authMethod": "email"
  }
}
```

#### POST `/api/auth/login`
Login with email/password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### POST `/api/auth/metamask`
Authenticate with MetaMask wallet.

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign this message to authenticate..."
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "walletAddress": "0x742d35...",
    "authMethod": "metamask",
    ...
  }
}
```

#### POST `/api/auth/did`
Authenticate with Decentralized Identity.

**Request Body**:
```json
{
  "didIdentifier": "did:example:123456",
  "provider": "civic"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "didIdentifier": "did:example:123456",
    "authMethod": "did",
    ...
  }
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Farmer",
  "authMethod": "email"
}
```

### Health Check

#### GET `/health`
Check API health status.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,
  password?: string (hashed),
  role: "Admin" | "Researcher" | "Farmer" | "Student",
  firstName: string,
  lastName: string,
  cognitoUserId?: string,
  walletAddress?: string,
  didIdentifier?: string,
  authMethod: "cognito" | "metamask" | "did" | "email",
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `email` (unique)
- `cognitoUserId` (sparse)
- `walletAddress` (sparse)
- `didIdentifier` (sparse)

## Environment Variables

See `ENVIRONMENT_SETUP.md` in the project root for complete configuration guide.

### Required Variables

```bash
PORT=3001
JWT_SECRET=your-secret-key
DOCUMENTDB_URI=mongodb://...
DB_NAME=animal_genetics
```

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: 7-day expiration
- **CORS**: Configurable origin validation
- **TLS**: DocumentDB connections encrypted
- **Signature Verification**: MetaMask signatures verified with ethers.js

## Development

### Type Checking

```bash
bun run typecheck
```

### Project Structure

```
src/
├── db.ts              # DocumentDB connection
├── server.ts          # Main server and routing
├── routes/
│   └── auth.ts        # Authentication endpoints
└── types/
    └── user.ts        # TypeScript interfaces
```

## Deployment

### Docker

```bash
# Build image
docker build -t user-backend .

# Run container
docker run -p 3001:3001 --env-file .env user-backend
```

### AWS Deployment

1. Set up DocumentDB cluster
2. Configure VPC and security groups
3. Deploy to EC2 or ECS
4. Set environment variables
5. Enable TLS for DocumentDB connection

## Troubleshooting

### Cannot connect to DocumentDB

- Verify security group allows port 27017
- Check TLS certificate path
- Ensure VPC configuration is correct

### JWT errors

- Verify `JWT_SECRET` is set
- Check token expiration
- Ensure consistent secret across restarts

## License

MIT
