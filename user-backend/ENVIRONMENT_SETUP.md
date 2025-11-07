# Environment Configuration Guide

Complete guide for setting up environment variables for the Animal Genetics Research Platform.

## Table of Contents

1. [User Backend (Bun.js + DocumentDB)](#user-backend)
2. [Frontend (Next.js)](#frontend)
3. [Amazon DocumentDB Setup](#amazon-documentdb-setup)
4. [AWS Cognito Setup](#aws-cognito-setup)
5. [Local Development](#local-development)

---

## User Backend

### Location
`/user-backend/.env`

### Required Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret - CRITICAL: Change this in production!
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Amazon DocumentDB Configuration
DOCUMENTDB_URI=mongodb://username:password@your-docdb-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
DB_NAME=animal_genetics

# DocumentDB TLS Configuration
DOCUMENTDB_TLS=true
DOCUMENTDB_CA_FILE=./global-bundle.pem

# AWS Region
AWS_REGION=us-east-1
```

### Local Development (MongoDB instead of DocumentDB)

```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=local-development-secret-key-change-in-prod
MONGODB_URI=mongodb://localhost:27017
DB_NAME=animal_genetics
DOCUMENTDB_TLS=false
AWS_REGION=us-east-1
```

---

## Frontend

### Location
`/frontend/.env.local`

### Required Environment Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# AWS Cognito Configuration (Optional - for Cognito auth)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AWS_COGNITO_DOMAIN=your-app-domain.auth.us-east-1.amazoncognito.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Amazon DocumentDB Setup

### Step 1: Create DocumentDB Cluster

```bash
# Via AWS CLI
aws docdb create-db-cluster \
    --db-cluster-identifier animal-genetics-cluster \
    --engine docdb \
    --master-username admin \
    --master-user-password YourSecurePassword123! \
    --vpc-security-group-ids sg-xxxxxxxx \
    --db-subnet-group-name your-subnet-group
```

### Step 2: Create DB Instance

```bash
aws docdb create-db-instance \
    --db-instance-identifier animal-genetics-instance \
    --db-instance-class db.t3.medium \
    --engine docdb \
    --db-cluster-identifier animal-genetics-cluster
```

### Step 3: Download TLS Certificate

```bash
cd user-backend
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

### Step 4: Get Connection String

```bash
# Get your cluster endpoint
aws docdb describe-db-clusters \
    --db-cluster-identifier animal-genetics-cluster \
    --query 'DBClusters[0].Endpoint' \
    --output text
```

### Step 5: Configure Connection String

Format:
```
mongodb://USERNAME:PASSWORD@ENDPOINT:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

Example:
```
mongodb://admin:YourPassword@animal-genetics-cluster.cluster-c1abc2defg3h.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
```

### Step 6: Security Group Configuration

Ensure your DocumentDB security group allows inbound traffic:
- **Port**: 27017
- **Source**: Your application's security group or IP range

---

## AWS Cognito Setup

### Step 1: Create User Pool

```bash
aws cognito-idp create-user-pool \
    --pool-name animal-genetics-users \
    --auto-verified-attributes email \
    --schema Name=email,Required=true \
             Name=given_name,Required=true \
             Name=family_name,Required=true \
             Name=custom:role,AttributeDataType=String,Mutable=true
```

### Step 2: Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id us-east-1_xxxxxxxxx \
    --client-name animal-genetics-client \
    --generate-secret false \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --allowed-o-auth-flows code implicit \
    --allowed-o-auth-scopes openid email profile \
    --callback-urls http://localhost:3000 \
    --logout-urls http://localhost:3000
```

### Step 3: Create User Groups

```bash
# Admin Group
aws cognito-idp create-group \
    --group-name Admin \
    --user-pool-id us-east-1_xxxxxxxxx \
    --description "Administrator users"

# Researcher Group
aws cognito-idp create-group \
    --group-name Researcher \
    --user-pool-id us-east-1_xxxxxxxxx \
    --description "Research scientists"

# Farmer Group
aws cognito-idp create-group \
    --group-name Farmer \
    --user-pool-id us-east-1_xxxxxxxxx \
    --description "Livestock farmers"

# Student Group
aws cognito-idp create-group \
    --group-name Student \
    --user-pool-id us-east-1_xxxxxxxxx \
    --description "Students and learners"
```

### Step 4: Create Identity Pool

```bash
aws cognito-identity create-identity-pool \
    --identity-pool-name animal-genetics-identity \
    --allow-unauthenticated-identities false \
    --cognito-identity-providers \
      ProviderName=cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx,ClientId=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Local Development

### Using Local MongoDB

1. **Install MongoDB**:
```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod
```

2. **Backend .env**:
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=local-dev-secret
MONGODB_URI=mongodb://localhost:27017
DB_NAME=animal_genetics
DOCUMENTDB_TLS=false
```

3. **Frontend .env.local**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Starting the Application

1. **Start Backend**:
```bash
cd user-backend
bun install
bun run dev
```

2. **Start Frontend**:
```bash
cd frontend
pnpm install
pnpm dev
```

---

## Security Best Practices

### JWT Secret
- **Minimum 32 characters**
- Use cryptographically secure random string
- Generate with: `openssl rand -base64 32`

### DocumentDB
- **Use VPC**: Never expose DocumentDB publicly
- **Enable TLS**: Always use TLS in production
- **Strong passwords**: Minimum 12 characters with special chars
- **Rotate credentials**: Change passwords regularly

### Cognito
- **MFA**: Enable multi-factor authentication
- **Password policy**: Enforce strong passwords
- **OAuth scopes**: Limit to necessary scopes only

---

## Production Deployment

### Environment Variables Checklist

#### Backend
- [ ] Change `JWT_SECRET` to secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Use DocumentDB production cluster
- [ ] Enable TLS (`DOCUMENTDB_TLS=true`)
- [ ] Configure proper VPC and security groups

#### Frontend
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Configure production Cognito User Pool
- [ ] Update callback URLs for production domain
- [ ] Enable HTTPS

### AWS Resources to Create

1. **DocumentDB Cluster** (or MongoDB Atlas)
2. **Cognito User Pool**
3. **Cognito Identity Pool**
4. **VPC** with proper security groups
5. **EC2 or ECS** for backend hosting
6. **S3 + CloudFront** for frontend hosting

---

## Troubleshooting

### DocumentDB Connection Issues

**Problem**: Cannot connect to DocumentDB
**Solutions**:
- Check security group allows port 27017
- Verify TLS certificate path
- Ensure VPC peering/VPN is configured
- Check connection string format

### Cognito Authentication Fails

**Problem**: Users cannot sign in
**Solutions**:
- Verify callback URLs match exactly
- Check User Pool Client configuration
- Ensure custom attributes are configured
- Verify OAuth flow settings

### CORS Errors

**Problem**: Frontend cannot reach backend
**Solutions**:
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration
- Ensure proper headers are set

---

## Quick Start Commands

### Backend Setup
```bash
cd user-backend
cp .env.example .env
# Edit .env with your values
bun install
bun run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your values
pnpm install
pnpm dev
```

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Check application console logs
4. Verify all environment variables are set correctly
