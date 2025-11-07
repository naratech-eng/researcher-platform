# 🔐 Environment Variables Setup Instructions

Complete guide for adding `.env` files to your Animal Genetics Research Platform.

---

## 📍 Quick Navigation

- **Local Development**: [Jump to Local Setup](#-local-development-quickstart)
- **Production (AWS)**: [Jump to Production Setup](#-production-aws-setup)
- **Troubleshooting**: [Jump to Troubleshooting](#-troubleshooting)

---

## ✅ What's Already Done

The following files have been **already created** for you:

| File | Location | Status |
|------|----------|--------|
| Backend .env | `/user-backend/.env` | ✅ Created (local dev config) |
| Backend .env.example | `/user-backend/.env.example` | ✅ Created |
| Frontend .env.local | `/frontend/.env.local` | ✅ Created (local dev config) |
| Setup Guide | `/ENVIRONMENT_SETUP.md` | ✅ Created (comprehensive) |
| Quick Reference | `/ENV_SETUP_QUICK_REFERENCE.md` | ✅ Created |
| Summary | `/IMPLEMENTATION_SUMMARY.md` | ✅ Created |

---

## 🚀 Local Development Quickstart

### Step 1: Install MongoDB

Choose your platform:

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 2: Verify Backend .env

File: `/user-backend/.env`

Current content (already configured for local dev):
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=local-development-jwt-secret-key-change-in-production
MONGODB_URI=mongodb://localhost:27017
DB_NAME=animal_genetics
DOCUMENTDB_TLS=false
AWS_REGION=us-east-1
```

**No changes needed for local development!** ✅

### Step 3: Verify Frontend .env.local

File: `/frontend/.env.local`

Current content (already configured):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**No changes needed for local development!** ✅

### Step 4: Start Applications

**Terminal 1 - Backend:**
```bash
cd user-backend
bun install
bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

### Step 5: Verify

**Backend health check:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Open frontend:**
```
http://localhost:3000
```

---

## 🏭 Production (AWS) Setup

### Step 1: Create DocumentDB Cluster

```bash
# 1. Create cluster
aws docdb create-db-cluster \
    --db-cluster-identifier animal-genetics-cluster \
    --engine docdb \
    --master-username admin \
    --master-user-password "YourSecurePassword123!" \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --db-subnet-group-name your-subnet-group

# 2. Create instance
aws docdb create-db-instance \
    --db-instance-identifier animal-genetics-instance \
    --db-instance-class db.t3.medium \
    --engine docdb \
    --db-cluster-identifier animal-genetics-cluster

# 3. Get connection endpoint
aws docdb describe-db-clusters \
    --db-cluster-identifier animal-genetics-cluster \
    --query 'DBClusters[0].Endpoint' \
    --output text
```

### Step 2: Download TLS Certificate

```bash
cd user-backend
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

### Step 3: Update Backend .env

Edit `/user-backend/.env`:

```bash
PORT=3001
NODE_ENV=production

# Generate secure secret:
JWT_SECRET=<run: openssl rand -base64 32>

# Use your DocumentDB cluster endpoint:
DOCUMENTDB_URI=mongodb://admin:YourPassword@animal-genetics-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
DB_NAME=animal_genetics
DOCUMENTDB_TLS=true
DOCUMENTDB_CA_FILE=./global-bundle.pem

AWS_REGION=us-east-1
```

### Step 4: Update Frontend .env.local

```bash
# Use your production backend URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Use your production frontend URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: AWS Cognito (if using)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AWS_COGNITO_DOMAIN=your-app.auth.us-east-1.amazoncognito.com
```

---

## 🔑 Environment Variable Reference

### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Server port | `3001` |
| `NODE_ENV` | Yes | Environment | `development` or `production` |
| `JWT_SECRET` | **CRITICAL** | JWT signing key (min 32 chars) | `openssl rand -base64 32` |
| `MONGODB_URI` | Yes* | Local MongoDB URI | `mongodb://localhost:27017` |
| `DOCUMENTDB_URI` | Yes* | DocumentDB connection string | See example above |
| `DB_NAME` | Yes | Database name | `animal_genetics` |
| `DOCUMENTDB_TLS` | Yes | Enable TLS | `true` or `false` |
| `DOCUMENTDB_CA_FILE` | No | TLS cert path | `./global-bundle.pem` |
| `AWS_REGION` | Yes | AWS region | `us-east-1` |

*Use either `MONGODB_URI` (local) OR `DOCUMENTDB_URI` (production)

### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_AWS_REGION` | No | AWS region for Cognito | `us-east-1` |
| `NEXT_PUBLIC_AWS_USER_POOL_ID` | No | Cognito User Pool ID | `us-east-1_xxxxxxxxx` |
| `NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID` | No | Cognito Client ID | `xxxxxxxxxx` |
| `NEXT_PUBLIC_AWS_IDENTITY_POOL_ID` | No | Cognito Identity Pool | `us-east-1:xxx...` |
| `NEXT_PUBLIC_AWS_COGNITO_DOMAIN` | No | Cognito domain | `app.auth.us-east-1...` |

---

## 🔒 Security Checklist

### Critical Security Steps

- [ ] **Change JWT_SECRET** - Never use default/example values
- [ ] **Use strong passwords** - DocumentDB master password (12+ chars)
- [ ] **Enable TLS** - Always use TLS in production
- [ ] **Secure VPC** - Never expose DocumentDB publicly
- [ ] **Rotate credentials** - Change passwords regularly
- [ ] **Use HTTPS** - Enable SSL/TLS for frontend and backend
- [ ] **Environment isolation** - Different secrets for dev/prod

### Generate Secure JWT Secret

```bash
# Generate 32-character secret
openssl rand -base64 32

# Example output:
# k8vXYz9mN2pQ4wR7tL1bH3gF6jK0sA5c
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error**: `Database not connected`
```bash
# Check if MongoDB is running
mongod --version
# or
docker ps | grep mongo

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Ubuntu
```

**Error**: `JWT_SECRET not set`
```bash
# Edit .env and add:
JWT_SECRET=your-secret-key-here
```

### Frontend can't connect to backend

**Error**: Network request failed
```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check NEXT_PUBLIC_API_URL in frontend/.env.local
cat frontend/.env.local | grep API_URL

# 3. Ensure backend port matches
cd user-backend
cat .env | grep PORT
```

### DocumentDB connection fails

**Error**: Connection timeout
- ✓ Check security group allows port 27017
- ✓ Verify VPC peering/VPN is configured
- ✓ Ensure TLS certificate is downloaded
- ✓ Check connection string format

**Error**: Authentication failed
- ✓ Verify username and password
- ✓ Check URL encoding of password
- ✓ Ensure master user has permissions

---

## 📋 Verification Commands

### Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "Farmer"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Check Environment Files

```bash
# Backend
cat user-backend/.env

# Frontend
cat frontend/.env.local

# Check for example files
ls -la user-backend/.env*
ls -la frontend/.env*
```

---

## 📚 Additional Documentation

For more detailed information:

1. **ENVIRONMENT_SETUP.md** - Complete setup guide (400+ lines)
2. **ENV_SETUP_QUICK_REFERENCE.md** - Quick reference commands
3. **IMPLEMENTATION_SUMMARY.md** - Project overview
4. **user-backend/README.md** - Backend API documentation
5. **frontend/README.md** - Frontend documentation

---

## 🎯 Summary

### For Local Development (Already Done! ✅)

✅ Backend `.env` is configured for local MongoDB  
✅ Frontend `.env.local` is configured  
✅ Just install MongoDB and run!

### For Production Deployment

1. Create DocumentDB cluster
2. Download TLS certificate
3. Update `.env` files with production values
4. Generate secure JWT secret
5. Deploy applications

---

## 🆘 Need Help?

1. Check troubleshooting section above
2. Review server logs:
   - Backend: Console output from `bun run dev`
   - Frontend: Browser console (F12)
3. Verify environment files are in correct locations
4. Ensure all required variables are set

---

**Last Updated**: 2024-11-07  
**System**: Bun.js + DocumentDB + Next.js
