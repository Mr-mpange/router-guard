# NetFlow WiFi Management System

🚀 **Production-Ready Wi-Fi Management Platform with Router-Enforced Access Control**

NetFlow is a comprehensive WiFi management system designed for ISPs, cafés, hotels, campuses, and venues. It provides **router-bound internet access control** where access is physically enforced at the router level, ensuring that internet access is only granted to devices actually connected to registered routers.

## 🎯 Core Features

### 🔒 **Router-Enforced Security**
- Internet access ONLY when device is connected to registered router
- MAC address and IP verification at router level
- Physical connection validation prevents remote access abuse
- Automatic session termination when device disconnects

### 💳 **Integrated Payment Processing**
- Mobile Money support (M-Pesa, Tigo Pesa, Airtel Money)
- Secure payment verification and callback handling
- Voucher code system for offline payments
- Automatic refund processing for failed sessions

### ⏱️ **Time-Based Access Control**
- Automatic session expiry enforcement
- Real-time session monitoring and statistics
- Bandwidth management and usage tracking
- Session extension and package upgrades

### 🖥️ **Comprehensive Management**
- Real-time admin dashboard with live updates
- Multi-router support and monitoring
- User session management and analytics
- Revenue tracking and reporting

### 🔧 **MikroTik Integration**
- Direct API control of MikroTik routers
- Hotspot user management
- Firewall rule automation
- Router health monitoring

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Captive       │    │   Backend API   │    │   MikroTik      │
│   Portal        │◄──►│   (Node.js +    │◄──►│   Routers       │
│   (React)       │    │    TypeScript)  │    │   (Hotspot)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin         │    │   PostgreSQL    │    │   Mobile Money  │
│   Dashboard     │    │   Database      │    │   APIs          │
│   (React)       │    │   + Prisma ORM  │    │   (Payment)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

**Get started in 5 minutes!** 👉 **[QUICK START GUIDE](../QUICK_START.md)**

### Automated Setup
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

### Manual Setup
```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Setup database
createdb netflow_db
cd backend
cp .env.example .env
npm run db:push
npx prisma db seed

# 3. Start servers
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2
```

### Access Points
- **Admin Dashboard**: http://localhost:5173/login (`admin@netflow.co.tz` / `admin123`)
- **Captive Portal**: http://localhost:5173/portal
- **API Health**: http://localhost:3001/health

## 📋 Environment Configuration

### Essential Settings
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/netflow"

# Security
JWT_SECRET="your-super-secret-jwt-key"

# MikroTik Router
MIKROTIK_USERNAME="admin"
MIKROTIK_PASSWORD="your-router-password"

# Mobile Money APIs
MPESA_API_KEY="your-mpesa-api-key"
TIGO_PESA_API_KEY="your-tigo-api-key"
AIRTEL_API_KEY="your-airtel-api-key"
```

See [.env.example](backend/.env.example) for complete configuration options.

## 🔐 Security Architecture

### Multi-Layer Security
1. **Physical Layer**: Device must be connected to router Wi-Fi
2. **Network Layer**: MAC/IP verification via router API
3. **Application Layer**: Session validation and payment verification
4. **Time Layer**: Automatic expiry and cleanup

### Anti-Abuse Features
- MAC address spoofing detection
- One device = one active session policy
- Payment fraud monitoring
- Router connectivity verification
- Suspicious activity alerts

## 📊 API Endpoints

### Captive Portal (Public)
```
GET  /api/portal/packages           # Available packages
GET  /api/portal/status/:mac        # Device session status
POST /api/portal/purchase           # Purchase package
POST /api/portal/extend/:sessionId  # Extend session
POST /api/portal/redeem-voucher     # Redeem voucher code
```

### Admin Dashboard (Protected)
```
GET  /api/dashboard/stats           # System statistics
GET  /api/routers                   # Router management
GET  /api/sessions                  # Session management
GET  /api/payments                  # Payment records
GET  /api/packages                  # Package management
```

### Authentication
```
POST /api/auth/login                # Admin login
GET  /api/auth/me                   # Current user info
```

## 🗄️ Database Schema

### Core Tables
- **routers**: MikroTik router configurations
- **packages**: Internet access packages
- **sessions**: User internet sessions
- **payments**: Payment transactions
- **users**: Admin/operator accounts

### Key Features
- Automatic session expiry tracking
- Payment status management
- Router health monitoring
- Usage statistics collection

## ⚙️ Background Jobs

Automated system maintenance:
- **Every minute**: Expire and cleanup sessions
- **Every 5 minutes**: Check router connectivity
- **Every 10 minutes**: Update usage statistics
- **Every 30 minutes**: Security monitoring
- **Daily**: Data cleanup and backups

## 🔄 Session Lifecycle

1. **Device Connection**: User connects to Wi-Fi → Captive portal redirect
2. **Package Selection**: User selects package → Payment processing
3. **Router Verification**: System verifies device connection to router
4. **Access Activation**: Router grants internet access with time limits
5. **Session Monitoring**: Real-time tracking and statistics
6. **Automatic Expiry**: Session terminates when time expires

## 📱 Mobile Money Integration

### Supported Providers
- **M-Pesa** (Vodacom Tanzania)
- **Tigo Pesa** (Tigo Tanzania)
- **Airtel Money** (Airtel Tanzania)

### Payment Flow
1. User selects package and enters phone number
2. System initiates payment request
3. User receives mobile money prompt
4. Payment confirmation triggers internet activation
5. Failed payments are automatically refunded

## 🖥️ Admin Dashboard Features

- **Real-time Monitoring**: Live session and router status
- **Revenue Analytics**: Payment tracking and reporting
- **User Management**: Session control and statistics
- **Router Management**: Health monitoring and configuration
- **Package Management**: Pricing and duration settings
- **System Settings**: Configuration and maintenance

## 🚀 Production Deployment

### Automated Deployment
```bash
# Run deployment script (Ubuntu/Debian)
sudo ./deploy.sh
```

The deployment script automatically:
- Installs system dependencies
- Configures PostgreSQL database
- Sets up Nginx reverse proxy
- Configures SSL certificates
- Sets up PM2 process management
- Configures monitoring and backups

### Manual Deployment
See [System Architecture Guide](SYSTEM_ARCHITECTURE.md) for detailed deployment instructions.

## 🔧 MikroTik Router Setup

### Quick Configuration
```bash
# Enable API
/ip service enable api

# Create hotspot
/ip hotspot setup

# Configure user profiles
/ip hotspot user profile add name="netflow-default" rate-limit="10M/10M"
```

See [MikroTik Setup Guide](MIKROTIK_SETUP.md) for complete configuration.

## 📊 Monitoring & Analytics

### System Metrics
- Active sessions and users
- Router connectivity status
- Payment success rates
- Revenue tracking
- Bandwidth usage statistics

### Real-time Updates
- WebSocket-based live dashboard
- Session status changes
- Payment notifications
- Router status alerts

## 🛡️ Security Best Practices

### Network Security
- Router API access restricted to server IP
- Firewall rules for hotspot traffic
- VPN access for router management

### Application Security
- JWT authentication with role-based access
- Input validation and sanitization
- Rate limiting and DDoS protection
- Secure payment processing

### Data Security
- Encrypted database connections
- Secure password hashing
- PCI DSS compliance for payments
- Regular security audits

## 🎯 Use Cases

### Perfect For
- **Cafés & Restaurants**: Customer Wi-Fi with payment
- **Hotels & Hostels**: Guest internet access
- **Campuses**: Student/visitor internet
- **Co-working Spaces**: Flexible internet plans
- **Community Wi-Fi**: Neighborhood internet sharing
- **Small ISPs**: Hotspot management

### Not Suitable For
- Global VPN services
- Enterprise corporate networks
- High-security government networks
- Large-scale ISP operations (>1000 routers)

## 🔧 Development

### Database Operations
```bash
npm run db:studio      # Open Prisma Studio
npm run db:migrate     # Create migration
npm run db:push        # Push schema changes
```

### Testing
```bash
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Building
```bash
npm run build          # Build for production
npm run start          # Start production server
```

## 📚 Documentation

- [System Architecture](SYSTEM_ARCHITECTURE.md) - Complete system design
- [MikroTik Setup](MIKROTIK_SETUP.md) - Router configuration guide
- [API Documentation](API.md) - Complete API reference
- [Deployment Guide](DEPLOYMENT.md) - Production deployment

## 🆘 Support & Troubleshooting

### Quick Start Issues

#### "Unexpected token '<', "<!doctype "... is not valid JSON"
This error means the frontend is receiving HTML instead of JSON. **Solution**:
1. Ensure backend is running: `cd backend && npm run dev`
2. Check API URL in `.env`: `VITE_API_URL=http://localhost:3001`
3. Test API: `curl http://localhost:3001/api/test`

#### "Failed to load packages"
**Solution**:
1. Start backend server: `cd backend && npm run dev`
2. Seed database: `cd backend && npx prisma db seed`
3. Check database connection: `npm run db:studio`

#### Database Connection Failed
**Solution**:
1. Start PostgreSQL service
2. Create database: `createdb netflow_db`
3. Update `backend/.env` with correct DATABASE_URL

### Easy Development Setup
```bash
# Quick start (Windows)
start-dev.bat

# Quick start (Linux/Mac)
./start-dev.sh

# Manual start
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
npm run dev
```

### Common Issues
- **Router Connection Failed**: Check API credentials and firewall
- **Payment Not Processing**: Verify mobile money API configuration
- **Sessions Not Expiring**: Check background job status
- **Captive Portal Not Loading**: Verify router hotspot configuration

### Getting Help
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions
- Review system logs in `backend/logs/`
- Test API endpoints: `curl http://localhost:3001/api/test`
- Check database: `npm run db:studio`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🙏 Acknowledgments

- MikroTik for RouterOS API
- Mobile money providers for payment integration
- Open source community for tools and libraries

---

**NetFlow WiFi Management System** - Secure, scalable, and router-enforced internet access control.