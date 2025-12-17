# NetFlow WiFi Management System - Architecture & Deployment Guide

## 🎯 System Overview

NetFlow is a production-ready Wi-Fi management platform that provides **router-enforced internet access control** with online payment processing. The system ensures that internet access is physically limited to authorized devices connected to registered routers.

### Core Security Principle
**Internet access is ONLY granted when:**
1. Device is physically connected to a registered router's Wi-Fi
2. Router confirms the device's presence via MAC/IP verification  
3. Valid payment has been processed
4. Session has not expired

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Captive       │    │   Backend API   │    │   MikroTik      │
│   Portal        │◄──►│   (Laravel/     │◄──►│   Routers       │
│   (React)       │    │    Node.js)     │    │   (Hotspot)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin         │    │   Database      │    │   Mobile Money  │
│   Dashboard     │    │   (PostgreSQL)  │    │   APIs          │
│   (React)       │    │                 │    │   (M-Pesa, etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Details

#### 1. Frontend Applications
- **Captive Portal**: Public-facing portal for device authentication and package purchase
- **Admin Dashboard**: Secure management interface for operators
- **Technology**: React + TypeScript + Tailwind CSS + shadcn/ui

#### 2. Backend API
- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT-based with role-based access control
- **Background Jobs**: Node-cron for session management and cleanup

#### 3. Router Integration
- **Platform**: MikroTik RouterOS
- **Protocol**: MikroTik API (port 8728)
- **Features**: Hotspot management, firewall rules, user statistics
- **Security**: MAC address binding, IP verification

#### 4. Payment Processing
- **Providers**: M-Pesa, Tigo Pesa, Airtel Money
- **Security**: Transaction verification and callback handling
- **Fallback**: Voucher code system for offline payments

## 🔒 Security Architecture

### Router-Bound Access Control
```
Device Request → Router Verification → Payment Check → Access Grant
     ↓                    ↓                 ↓             ↓
MAC Address    →    ARP Table Check  →  DB Lookup  →  Hotspot User
IP Address     →    DHCP Lease       →  Session     →  Time Limit
Router ID      →    Physical Conn.   →  Payment     →  Bandwidth
```

### Security Layers
1. **Physical Layer**: Device must be connected to router's Wi-Fi
2. **Network Layer**: MAC address and IP verification
3. **Application Layer**: Session validation and payment verification
4. **Time Layer**: Automatic session expiry and cleanup

### Anti-Abuse Measures
- MAC address spoofing detection
- Multiple session prevention (one device = one session)
- Payment fraud monitoring
- Router connectivity verification
- Automatic session cleanup

## 📊 Database Schema

### Core Tables
```sql
-- Users (Admin/Operators)
users: id, email, password, name, role, created_at, updated_at

-- Routers (MikroTik devices)
routers: id, name, ip_address, mac_address, location, status, 
         last_seen, signal_strength, active_users, created_at, updated_at

-- Packages (Internet plans)
packages: id, name, duration, price, description, is_active, 
          created_at, updated_at

-- Sessions (User internet sessions)
sessions: id, user_id, device_mac, device_name, ip_address, 
          router_id, package_id, status, start_time, end_time, 
          expires_at, bytes_up, bytes_down, created_at, updated_at

-- Payments (Transaction records)
payments: id, session_id, package_id, amount, currency, 
          payment_method, payment_reference, phone_number, 
          status, paid_at, created_at, updated_at

-- System Settings (Configuration)
system_settings: id, key, value, type
```

### Key Relationships
- Router → Sessions (1:many)
- Package → Sessions (1:many)  
- Session → Payment (1:1)
- User → Sessions (1:many, optional)

## 🔄 Session Lifecycle

### 1. Device Connection
```
Device connects to Wi-Fi → Router assigns IP → Captive portal redirect
```

### 2. Portal Access
```
Portal loads → Check device status → Show packages or active session
```

### 3. Package Purchase
```
Select package → Enter phone → Payment processing → Router verification → Session creation
```

### 4. Access Activation
```
Payment success → Add user to MikroTik → Set time limits → Grant internet access
```

### 5. Session Management
```
Background jobs → Monitor expiry → Update statistics → Cleanup expired sessions
```

### 6. Session Termination
```
Time expires OR Manual termination → Remove from router → Update database → Disconnect user
```

## 🚀 Deployment Architecture

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Database      │
│   (Nginx/HAProxy│◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   SSL/TLS)      │    │   (PM2/Docker)  │    │   (Replication) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis Cache   │    │   Monitoring    │
│   (Static       │    │   (Sessions/    │    │   (Logs/        │
│    Assets)      │    │    Cache)       │    │    Metrics)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Network Topology
```
Internet ◄──► ISP Router ◄──► Core Switch ◄──► MikroTik Routers
                                    │
                                    ▼
                              Backend Server
                              (NetFlow API)
```

## 📋 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- MikroTik RouterOS 6.40+
- SSL Certificate (for production)

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd netflow-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:generate
npm run db:push
npx prisma db seed

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### MikroTik Router Configuration
```bash
# Enable API
/ip service enable api
/ip service set api port=8728

# Create hotspot
/ip hotspot setup

# Configure user profiles
/ip hotspot user profile add name="netflow-default" rate-limit="10M/10M"

# Setup firewall rules (optional)
/ip firewall filter add chain=forward action=accept src-address=192.168.1.0/24
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/netflow"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# MikroTik
MIKROTIK_USERNAME="admin"
MIKROTIK_PASSWORD="your-password"
MIKROTIK_PORT=8728

# Mobile Money APIs
MPESA_API_KEY="your-api-key"
TIGO_PESA_API_KEY="your-api-key"
AIRTEL_API_KEY="your-api-key"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### Package Configuration
```javascript
// Example packages
const packages = [
  { name: "1 Hour", duration: 60, price: 50000 }, // 500 TZS
  { name: "Daily", duration: 1440, price: 100000 }, // 1000 TZS  
  { name: "Weekly", duration: 10080, price: 500000 }, // 5000 TZS
  { name: "Monthly", duration: 43200, price: 2000000 } // 20000 TZS
];
```

## 📊 Monitoring & Analytics

### Key Metrics
- Active sessions count
- Revenue per day/week/month
- Router uptime and performance
- Payment success rates
- User acquisition and retention

### Logging
- Session creation/termination
- Payment transactions
- Router connectivity
- Security events
- System errors

### Alerts
- Router offline notifications
- Payment failures
- High error rates
- Security breaches
- System resource usage

## 🔄 Background Jobs

### Scheduled Tasks
- **Every minute**: Check expired sessions
- **Every 5 minutes**: Update router status
- **Every 10 minutes**: Update session statistics
- **Every 30 minutes**: Security monitoring
- **Every hour**: Sync router users
- **Daily at 2 AM**: Cleanup old data

## 🛡️ Security Best Practices

### Network Security
- Use VPN for router management
- Implement firewall rules
- Regular security updates
- Monitor network traffic

### Application Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting

### Data Security
- Encrypt sensitive data
- Secure payment processing
- Regular backups
- Access logging

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer for multiple backend instances
- Database read replicas
- Redis for session storage
- CDN for static assets

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

### High Availability
- Multiple backend servers
- Database clustering
- Router redundancy
- Automated failover

## 🎯 Use Cases

### Suitable For
- Cafés and restaurants
- Hotels and hostels
- University campuses
- Community Wi-Fi
- Small ISPs
- Co-working spaces
- Public venues

### Not Suitable For
- Global VPN services
- Enterprise networks
- High-security environments
- Large-scale ISP operations

## 📞 Support & Maintenance

### Regular Maintenance
- Database cleanup
- Log rotation
- Security updates
- Performance monitoring
- Backup verification

### Troubleshooting
- Check router connectivity
- Verify payment API status
- Monitor database performance
- Review application logs
- Test session creation flow

---

This system provides a robust, secure, and scalable solution for Wi-Fi management with router-enforced access control. The architecture ensures that internet access is truly limited to authorized devices connected to registered routers, preventing abuse and ensuring fair usage.