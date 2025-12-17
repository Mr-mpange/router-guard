# NetFlow WiFi Management System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites
Make sure you have:
- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **PostgreSQL** running ([Download here](https://www.postgresql.org/download/))

### Step 2: Quick Setup

#### Option A: Automated Setup (Recommended)
```bash
# Windows
start-dev.bat

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

#### Option B: Manual Setup
```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Setup database
createdb netflow_db
cd backend
cp .env.example .env
# Edit .env with your database URL
npm run db:push
npx prisma db seed
cd ..

# 3. Start servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Step 3: Access the System

1. **Admin Dashboard**: http://localhost:5173/login
   - Email: `admin@netflow.co.tz`
   - Password: `admin123`

2. **Captive Portal**: http://localhost:5173/portal
   - This is what users see when connecting to WiFi

3. **API Health Check**: http://localhost:3001/health

### Step 4: Test the System

1. **Login to Admin Dashboard**
   - Go to http://localhost:5173/login
   - Use the default credentials above
   - You should see the dashboard with sample data

2. **Check Routers**
   - Navigate to "Routers" in the sidebar
   - You should see 2-3 sample routers
   - Try testing a router connection

3. **View Packages**
   - Navigate to "Packages"
   - You should see sample internet packages (1hr, 24hr, 7d, 30d)

4. **Test Captive Portal**
   - Open http://localhost:5173/portal in a new tab
   - You should see the WiFi portal interface
   - Try selecting a package (payment will be simulated)

## 🔧 Common Issues & Solutions

### "Failed to load packages" Error
**Problem**: Frontend can't connect to backend
**Solution**:
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running:
cd backend && npm run dev
```

### Database Connection Error
**Problem**: Can't connect to PostgreSQL
**Solution**:
```bash
# Start PostgreSQL service
# Windows: net start postgresql-x64-13
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql

# Create database
createdb netflow_db
```

### "Authentication required" Error
**Problem**: Not logged in to admin dashboard
**Solution**:
1. Go to http://localhost:5173/login
2. Login with: `admin@netflow.co.tz` / `admin123`

### Port Already in Use
**Problem**: Port 3001 or 5173 is busy
**Solution**:
```bash
# Kill processes on ports
npx kill-port 3001
npx kill-port 5173

# Or use different ports
npm run dev -- --port 3000
```

## 📱 What You Can Do

### Admin Dashboard Features
- ✅ **Router Management**: Add, configure, and monitor MikroTik routers
- ✅ **Session Monitoring**: View active user sessions in real-time
- ✅ **Package Management**: Create and manage internet packages
- ✅ **Payment Tracking**: Monitor revenue and payment history
- ✅ **User Analytics**: Track usage statistics and trends

### Captive Portal Features
- ✅ **Package Selection**: Users can choose from available packages
- ✅ **Mobile Money Payment**: Integrated M-Pesa, Tigo Pesa, Airtel Money
- ✅ **Voucher System**: Offline payment option with voucher codes
- ✅ **Session Management**: Real-time session status and time remaining
- ✅ **Router Verification**: Ensures users are connected to correct router

## 🔒 Security Features

- **Router-Bound Access**: Internet only works when connected to registered router
- **MAC Address Verification**: Prevents unauthorized access
- **Payment Verification**: No internet without valid payment
- **Automatic Expiry**: Sessions end automatically when time expires
- **Admin Authentication**: Secure login for dashboard access

## 📊 Sample Data Included

The system comes with sample data for testing:
- **3 Routers**: Main Lobby, Cafe, Conference Room
- **4 Packages**: 1hr (100 TZS), 24hr (500 TZS), 7d (1000 TZS), 30d (5000 TZS)
- **2 Active Sessions**: Demo user sessions with payment history
- **Admin User**: Default login credentials

## 🌐 Next Steps

1. **Configure Real Routers**: Add your actual MikroTik routers
2. **Setup Payment APIs**: Configure real mobile money credentials
3. **Customize Packages**: Adjust pricing and duration for your needs
4. **Deploy to Production**: Use the deployment guide for live setup

## 🆘 Need Help?

- **Detailed Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **System Architecture**: See [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **MikroTik Setup**: See [MIKROTIK_SETUP.md](MIKROTIK_SETUP.md)
- **API Documentation**: Check the backend README

## 🎉 Success!

If you can:
1. ✅ Login to the admin dashboard
2. ✅ See routers and packages
3. ✅ Access the captive portal
4. ✅ Test package selection

**Congratulations!** Your NetFlow WiFi Management System is working perfectly!

---

**Ready for Production?** Check out the [deployment guide](SYSTEM_ARCHITECTURE.md#-deployment-architecture) to deploy to a live server.