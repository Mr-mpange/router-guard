# NetFlow WiFi Management System - Troubleshooting Guide

## Common Issues and Solutions

### 1. "Unexpected token '<', "<!doctype "... is not valid JSON"

**Problem**: Frontend is receiving HTML instead of JSON from the API.

**Causes & Solutions**:

#### A. Backend Server Not Running
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running, start it:
cd backend
npm run dev
```

#### B. Wrong API URL
- Check `.env` file in project root:
```env
VITE_API_URL=http://localhost:3001
```

#### C. CORS Issues
- Ensure backend CORS is configured for frontend URL
- Check `backend/src/server.ts` CORS settings

#### D. Database Connection Issues
```bash
# Test database connection
cd backend
npm run db:studio

# If fails, check DATABASE_URL in backend/.env
```

### 2. "Failed to load packages" Error

**Problem**: Cannot fetch packages from API.

**Solutions**:

#### A. Check Backend Status
```bash
# Test API directly
curl http://localhost:3001/api/test
curl http://localhost:3001/api/portal/packages
```

#### B. Database Not Seeded
```bash
cd backend
npm run db:push
npx prisma db seed
```

#### C. Missing Environment Variables
Check `backend/.env` file exists and has:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/netflow"
JWT_SECRET="your-secret-key"
```

### 3. Database Connection Errors

**Problem**: Cannot connect to PostgreSQL database.

**Solutions**:

#### A. PostgreSQL Not Running
```bash
# Windows
net start postgresql-x64-13

# Linux/Mac
sudo systemctl start postgresql
# or
brew services start postgresql
```

#### B. Database Doesn't Exist
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE netflow_db;
CREATE USER netflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE netflow_db TO netflow_user;
```

#### C. Wrong Connection String
Update `backend/.env`:
```env
DATABASE_URL="postgresql://netflow_user:your_password@localhost:5432/netflow_db"
```

### 4. "Router not found" or Router Connection Issues

**Problem**: Cannot connect to MikroTik router or router not found.

**Solutions**:

#### A. Add Test Router
```bash
cd backend
npx prisma studio
# Add a router manually in the database
```

#### B. Router API Configuration
- Enable API on MikroTik: `/ip service enable api`
- Check firewall allows API access
- Verify credentials in `backend/.env`

#### C. Mock Router for Testing
The system includes mock routers for development. Check database seed data.

### 5. Payment Processing Errors

**Problem**: Payment fails or doesn't process.

**Solutions**:

#### A. Mock Payments (Development)
The system uses mock payment processing by default. Real payments require:
- Valid API credentials in `backend/.env`
- Proper mobile money provider setup

#### B. Check Payment Service
```bash
# Test payment service
curl -X POST http://localhost:3001/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "phone": "+255712345678"}'
```

### 6. Session Management Issues

**Problem**: Sessions not expiring or not being created.

**Solutions**:

#### A. Background Jobs Not Running
Check if background jobs are running:
```bash
# Check server logs
tail -f backend/logs/combined.log
```

#### B. Session Cleanup
```bash
# Manually clean expired sessions
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.session.updateMany({
  where: { expiresAt: { lt: new Date() } },
  data: { status: 'EXPIRED' }
}).then(() => console.log('Sessions cleaned'));
"
```

### 7. Frontend Build/Development Issues

**Problem**: Frontend won't start or build.

**Solutions**:

#### A. Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### B. Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

#### C. TypeScript Errors
```bash
# Check TypeScript
npx tsc --noEmit
```

### 8. API Connection Test

**Problem**: Need to verify API connectivity.

**Test Script**:
```javascript
// Save as test-api.js and run with: node test-api.js
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const health = await fetch('http://localhost:3001/health');
    console.log('Health:', await health.json());
    
    // Test API endpoint
    const test = await fetch('http://localhost:3001/api/test');
    console.log('API Test:', await test.json());
    
    // Test packages
    const packages = await fetch('http://localhost:3001/api/portal/packages');
    console.log('Packages:', await packages.json());
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
```

### 9. Development Environment Setup

**Complete Setup Checklist**:

1. **Install Prerequisites**:
   - Node.js 18+
   - PostgreSQL 13+
   - Git

2. **Clone and Setup**:
   ```bash
   git clone <repository>
   cd netflow-wifi-system
   
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   ```

3. **Database Setup**:
   ```bash
   # Create database
   createdb netflow_db
   
   # Setup environment
   cp .env.example .env
   # Edit .env with your database URL
   
   # Generate Prisma client and push schema
   npm run db:generate
   npm run db:push
   
   # Seed with test data
   npx prisma db seed
   ```

4. **Start Development Servers**:
   ```bash
   # Option 1: Use startup script
   ./start-dev.sh  # Linux/Mac
   start-dev.bat   # Windows
   
   # Option 2: Manual start
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

### 10. Production Deployment Issues

**Problem**: Issues when deploying to production.

**Solutions**:

#### A. Environment Variables
Ensure all production environment variables are set:
```bash
# Check required variables
echo $DATABASE_URL
echo $JWT_SECRET
echo $NODE_ENV
```

#### B. Database Migrations
```bash
cd backend
npm run db:push
npx prisma db seed
```

#### C. Build Issues
```bash
# Backend build
cd backend
npm run build

# Frontend build
npm run build
```

### 11. Logging and Debugging

**Enable Debug Logging**:

#### Backend Logs
```bash
# View logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Enable debug logging
export LOG_LEVEL=debug
```

#### Frontend Debug
```javascript
// Add to browser console
localStorage.setItem('debug', 'netflow:*');
```

### 12. Quick Fixes

#### Reset Everything
```bash
# Stop all processes
pkill -f "node.*netflow"

# Reset database
cd backend
npx prisma migrate reset --force
npx prisma db seed

# Clear caches
rm -rf node_modules/.cache
rm -rf backend/node_modules/.cache

# Restart
npm run dev
```

#### Test with cURL
```bash
# Test all endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/test
curl http://localhost:3001/api/portal/packages
curl http://localhost:3001/api/portal/router/default
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs** in `backend/logs/`
2. **Verify all environment variables** are set correctly
3. **Test API endpoints** directly with cURL
4. **Check database connectivity** with Prisma Studio
5. **Ensure all services are running** (PostgreSQL, Node.js servers)

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `ECONNREFUSED` | Backend not running | Start backend server |
| `Invalid JSON` | HTML response instead of JSON | Check API endpoint exists |
| `Database connection failed` | PostgreSQL not running | Start PostgreSQL service |
| `JWT malformed` | Invalid token | Clear browser storage |
| `CORS error` | Cross-origin request blocked | Check CORS configuration |
| `Port already in use` | Port conflict | Kill process or use different port |

---

This troubleshooting guide covers the most common issues. For additional help, check the system logs and verify your environment configuration.