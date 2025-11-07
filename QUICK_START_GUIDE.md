# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## ✅ Prerequisites

- **Bun.js** installed (for backend)
- **pnpm** installed (for frontend)
- **MongoDB** running locally (or use Docker)

## 📦 Installation Steps

### 1. Start MongoDB

Choose one option:

```bash
# Option A: If you have MongoDB installed
mongod

# Option B: Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Start Backend

```bash
cd user-backend

# Install dependencies
bun install

# Start server (port 3001)
bun run dev
```

You should see:
```
✅ Connected to DocumentDB: animal_genetics
✅ Database indexes created
✅ User backend running on http://localhost:3001
```

### 3. Start Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server (port 3000)
pnpm dev
```

Frontend will start at `http://localhost:3000`

## 🎯 Test the Application

### 1. Open Browser

Navigate to: **http://localhost:3000**

You'll be redirected to the dashboard, then to login (not authenticated yet).

### 2. Register a New Account

1. Click "Sign up" or go to http://localhost:3000/register
2. Fill in the form:
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: john@example.com
   - **Password**: password123
   - **Role**: Farmer
3. Click "Create Account"

You'll be automatically logged in and see the dashboard!

### 3. View the Dashboard

You should see:
- Welcome message with your name
- Role badge (Farmer)
- 4 dashboard sections specific to your role:
  - My Livestock
  - Breeding Program
  - Health Records
  - Insights

### 4. Test Logout & Login

1. Click "Logout" button (top right)
2. You'll be redirected to `/login`
3. Enter your credentials:
   - Email: john@example.com
   - Password: password123
4. Click "Sign In"

Back to the dashboard!

## 🔍 Verify Everything Works

### Check Backend Health

```bash
curl http://localhost:3001/health
```

Response:
```json
{"status":"ok","timestamp":"2024-11-07T..."}
```

### Check MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to database
use animal_genetics

# View users
db.users.find().pretty()
```

You should see your registered user!

## 🎨 Test Different Roles

Create users with different roles to see role-specific dashboards:

### Admin Dashboard
- User Management
- System Settings
- Analytics
- Data Management

### Researcher Dashboard
- Research Projects
- Data Analysis
- Notebooks
- Publications

### Farmer Dashboard (you just saw this!)
- My Livestock
- Breeding Program
- Health Records
- Insights

### Student Dashboard
- Learning Resources
- Research Access
- Practice Notebooks
- Tutorials

## 🔐 Environment Variables

### Backend (already configured)
File: `/user-backend/.env`
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=local-development-jwt-secret-key-change-in-production
MONGODB_URI=mongodb://localhost:27017
DB_NAME=animal_genetics
DOCUMENTDB_TLS=false
AWS_REGION=us-east-1
```

### Frontend (already configured)
File: `/frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**No changes needed for local development!**

## 🐛 Troubleshooting

### Backend won't start

**Problem**: `Database not connected`

**Solution**:
```bash
# Check if MongoDB is running
docker ps | grep mongo
# or
mongosh
```

If not running, start it:
```bash
docker start mongodb
# or
mongod
```

---

**Problem**: Port 3001 already in use

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Frontend won't start

**Problem**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Can't login

**Problem**: "Login failed" or "Network error"

**Solutions**:
1. Check backend is running: `curl http://localhost:3001/health`
2. Check MongoDB is running: `mongosh`
3. Register a new account first
4. Check browser console for errors (F12)

### MetaMask not working

**Problem**: "Please install MetaMask"

**Solution**:
1. Install MetaMask browser extension
2. Create or import a wallet
3. Refresh the page
4. Click "Connect MetaMask"

## 📋 API Endpoints

Test the API directly:

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "Farmer"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Next Steps

1. **Explore the Dashboard** - Try different roles
2. **Test MetaMask** - If you have the extension
3. **Read Documentation**:
   - `ENVIRONMENT_VARIABLES_INSTRUCTIONS.md` - Complete setup guide
   - `ENVIRONMENT_SETUP.md` - AWS DocumentDB setup
   - `user-backend/README.md` - Backend API docs
   - `frontend/README.md` - Frontend docs

## 🎉 You're All Set!

The application is running and you can now:
- ✅ Register new users
- ✅ Login with email/password
- ✅ See role-based dashboards
- ✅ Logout and login again
- ✅ Test different user roles

For production deployment with AWS DocumentDB, see `ENVIRONMENT_VARIABLES_INSTRUCTIONS.md`.
