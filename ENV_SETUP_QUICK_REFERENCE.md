# Environment Setup - Quick Reference

## 📍 File Locations

### Backend
- **Config File**: `/user-backend/.env`
- **Example**: `/user-backend/.env.example`

### Frontend  
- **Config File**: `/frontend/.env.local`
- **Example**: `/frontend/.env.example` (if exists)

---

## 🔧 Backend Environment Variables

### File: `/user-backend/.env`

```bash
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-minimum-32-chars

# Database - Choose ONE option:

# Option 1: Local MongoDB (Development)
MONGODB_URI=mongodb://localhost:27017
DB_NAME=animal_genetics
DOCUMENTDB_TLS=false

# Option 2: Amazon DocumentDB (Production)
DOCUMENTDB_URI=mongodb://username:password@cluster.region.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
DB_NAME=animal_genetics
DOCUMENTDB_TLS=true
DOCUMENTDB_CA_FILE=./global-bundle.pem

# AWS
AWS_REGION=us-east-1
```

---

## 🎨 Frontend Environment Variables

### File: `/frontend/.env.local`

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS Cognito (Optional - only if using Cognito auth)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AWS_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
```

---

## 🚀 Quick Start Commands

### 1. Setup Backend

```bash
cd user-backend

# Copy example
cp .env.example .env

# Edit .env file with your values
nano .env  # or vim, code, etc.

# Install dependencies
bun install

# Start server
bun run dev
```

### 2. Setup Frontend

```bash
cd frontend

# Create .env.local
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVEOF

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

---

## 🔑 Critical Values to Change

### Backend
1. **JWT_SECRET** - MUST be unique and secure
   ```bash
   # Generate with:
   openssl rand -base64 32
   ```

2. **Database URI** - Update with your credentials
   - Development: Use local MongoDB
   - Production: Use DocumentDB cluster URL

### Frontend
1. **NEXT_PUBLIC_API_URL** - Backend API endpoint
   - Development: `http://localhost:3001`
   - Production: Your backend domain

---

## 📊 Database Options

### Development: Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or
sudo apt-get install mongodb    # Ubuntu

# Start MongoDB
mongod

# Backend .env
MONGODB_URI=mongodb://localhost:27017
DOCUMENTDB_TLS=false
```

### Production: Amazon DocumentDB

```bash
# Create cluster (AWS CLI)
aws docdb create-db-cluster \
    --db-cluster-identifier animal-genetics \
    --engine docdb \
    --master-username admin \
    --master-user-password YourSecurePassword

# Get endpoint
aws docdb describe-db-clusters \
    --db-cluster-identifier animal-genetics \
    --query 'DBClusters[0].Endpoint'

# Download TLS cert
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Backend .env
DOCUMENTDB_URI=mongodb://admin:password@your-cluster.docdb.amazonaws.com:27017/...
DOCUMENTDB_TLS=true
DOCUMENTDB_CA_FILE=./global-bundle.pem
```

---

## ✅ Verification

### Test Backend
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend
```bash
# Open browser to:
http://localhost:3000
```

---

## 🐛 Common Issues

### Backend won't start
- ✓ Check MongoDB/DocumentDB is running
- ✓ Verify JWT_SECRET is set
- ✓ Check port 3001 is available

### Frontend can't reach backend
- ✓ Verify NEXT_PUBLIC_API_URL is correct
- ✓ Check backend is running on port 3001
- ✓ Ensure CORS is enabled

### Database connection fails
- ✓ Check connection string format
- ✓ Verify credentials
- ✓ Check security group rules (DocumentDB)
- ✓ Ensure TLS cert path is correct

---

## 📚 Full Documentation

For complete setup instructions, see:
- **ENVIRONMENT_SETUP.md** - Comprehensive guide
- **user-backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend documentation
