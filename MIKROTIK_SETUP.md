# MikroTik Router Configuration for NetFlow

This guide provides step-by-step instructions for configuring MikroTik routers to work with the NetFlow WiFi Management System.

## Prerequisites

- MikroTik router with RouterOS 6.40 or later
- Administrative access to the router
- Basic understanding of MikroTik configuration

## 1. Initial Router Setup

### Connect to Router
```bash
# Via Winbox, WebFig, or SSH
ssh admin@192.168.88.1
```

### Set Router Identity
```bash
/system identity set name="NetFlow-Router-01"
```

### Configure Basic Network
```bash
# Set up WAN interface (adjust as needed)
/ip address add address=192.168.1.100/24 interface=ether1

# Set up LAN interface
/ip address add address=192.168.10.1/24 interface=ether2

# Configure default route
/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1
```

## 2. Enable API Access

### Enable API Service
```bash
# Enable API on default port 8728
/ip service enable api
/ip service set api port=8728

# For secure connection, enable API-SSL
/ip service enable api-ssl
/ip service set api-ssl port=8729
```

### Create API User
```bash
# Create dedicated user for NetFlow
/user add name=netflow-api password=secure-api-password group=full
```

### Configure API Access
```bash
# Allow API access from NetFlow server
/ip service set api address=192.168.1.50/32  # Replace with your server IP
```

## 3. Hotspot Configuration

### Create Hotspot Server Profile
```bash
/ip hotspot profile add name="netflow-profile" \
    hotspot-address=192.168.10.1 \
    dns-name="netflow.local" \
    html-directory=hotspot \
    http-proxy=0.0.0.0:0 \
    login-by=cookie,http-chap \
    split-user-domain=no \
    use-radius=no
```

### Create Hotspot User Profile
```bash
# Default profile for all users
/ip hotspot user profile add name="netflow-default" \
    idle-timeout=none \
    keepalive-timeout=2m \
    shared-users=1 \
    status-autorefresh=1m \
    transparent-proxy=no \
    rate-limit="10M/10M"

# Premium profile for higher-tier packages
/ip hotspot user profile add name="netflow-premium" \
    idle-timeout=none \
    keepalive-timeout=2m \
    shared-users=1 \
    status-autorefresh=1m \
    transparent-proxy=no \
    rate-limit="25M/25M"
```

### Setup Hotspot Server
```bash
# Create hotspot server
/ip hotspot add name="netflow-hotspot" \
    interface=ether2 \
    address-pool=hotspot-pool \
    profile=netflow-profile \
    idle-timeout=5m \
    keepalive-timeout=2m \
    addresses-per-mac=2
```

### Configure Address Pool
```bash
# Create IP pool for hotspot clients
/ip pool add name="hotspot-pool" ranges=192.168.10.100-192.168.10.200
```

### Configure DHCP Server
```bash
# Create DHCP server for hotspot
/ip dhcp-server add name="hotspot-dhcp" \
    interface=ether2 \
    address-pool=hotspot-pool \
    authoritative=after-2sec-delay \
    lease-time=1h

# Configure DHCP network
/ip dhcp-server network add address=192.168.10.0/24 \
    gateway=192.168.10.1 \
    dns-server=8.8.8.8,8.8.4.4 \
    domain=netflow.local
```

## 4. Firewall Configuration

### Basic Firewall Rules
```bash
# Allow established and related connections
/ip firewall filter add chain=forward action=accept \
    connection-state=established,related \
    comment="Allow established connections"

# Allow hotspot users to access internet
/ip firewall filter add chain=forward action=accept \
    src-address=192.168.10.0/24 \
    comment="Allow hotspot users"

# Allow access to NetFlow server
/ip firewall filter add chain=forward action=accept \
    dst-address=192.168.1.50 \
    comment="Allow access to NetFlow server"

# Block inter-client communication (optional)
/ip firewall filter add chain=forward action=drop \
    src-address=192.168.10.0/24 \
    dst-address=192.168.10.0/24 \
    comment="Block inter-client communication"

# Allow DNS
/ip firewall filter add chain=forward action=accept \
    protocol=udp dst-port=53 \
    comment="Allow DNS"

# Allow DHCP
/ip firewall filter add chain=input action=accept \
    protocol=udp dst-port=67 \
    comment="Allow DHCP"

# Allow hotspot HTTP
/ip firewall filter add chain=input action=accept \
    protocol=tcp dst-port=80 \
    comment="Allow hotspot HTTP"

# Allow API access from NetFlow server
/ip firewall filter add chain=input action=accept \
    src-address=192.168.1.50 \
    protocol=tcp dst-port=8728 \
    comment="Allow NetFlow API access"

# Drop everything else
/ip firewall filter add chain=forward action=drop \
    comment="Drop all other traffic"
```

### NAT Configuration
```bash
# Masquerade hotspot traffic
/ip firewall nat add chain=srcnat action=masquerade \
    src-address=192.168.10.0/24 \
    comment="Hotspot NAT"
```

## 5. Hotspot Customization

### Custom Login Page
```bash
# Upload custom hotspot files to /hotspot directory
# Files needed: login.html, status.html, logout.html, alogin.html

# Example login.html redirect to NetFlow portal
```

### Walled Garden (Allowed Sites)
```bash
# Allow access to NetFlow server without authentication
/ip hotspot walled-garden add dst-host=192.168.1.50 \
    comment="NetFlow server access"

# Allow access to payment APIs
/ip hotspot walled-garden add dst-host=api.vodacom.co.tz \
    comment="M-Pesa API"
/ip hotspot walled-garden add dst-host=api.tigo.co.tz \
    comment="Tigo Pesa API"
/ip hotspot walled-garden add dst-host=api.airtel.co.tz \
    comment="Airtel Money API"
```

## 6. Monitoring and Logging

### Enable Logging
```bash
# Enable system logging
/system logging add topics=hotspot,info action=memory
/system logging add topics=hotspot,warning action=memory
/system logging add topics=hotspot,error action=memory

# Log to remote server (optional)
/system logging action add name="netflow-log" \
    target=remote remote=192.168.1.50:514

/system logging add topics=hotspot action=netflow-log
```

### SNMP Configuration (Optional)
```bash
# Enable SNMP for monitoring
/snmp set enabled=yes contact="admin@netflow.com" \
    location="Main Location"

/snmp community add name=netflow-monitor \
    addresses=192.168.1.50/32 \
    security=none
```

## 7. Backup and Security

### Create Backup
```bash
# Export configuration
/export file=netflow-router-config

# Create system backup
/system backup save name=netflow-router-backup
```

### Security Hardening
```bash
# Disable unnecessary services
/ip service disable telnet
/ip service disable ftp
/ip service disable www-ssl

# Change default passwords
/user set admin password=new-secure-password

# Disable MAC server
/tool mac-server set allowed-interface-list=none
/tool mac-server mac-winbox set allowed-interface-list=none

# Disable neighbor discovery
/ip neighbor discovery-settings set discover-interface-list=none
```

## 8. Integration with NetFlow

### Router Registration
1. Add router in NetFlow admin dashboard
2. Use router's IP address: `192.168.10.1`
3. Set API credentials: `netflow-api` / `secure-api-password`
4. Test connection from NetFlow dashboard

### Captive Portal Redirect
```bash
# Configure hotspot to redirect to NetFlow portal
/ip hotspot profile set netflow-profile \
    html-directory=hotspot \
    login-by=http-chap \
    http-proxy=192.168.1.50:3001
```

## 9. Testing Configuration

### Test Hotspot
1. Connect device to WiFi network
2. Open browser - should redirect to captive portal
3. Verify NetFlow portal loads correctly
4. Test package purchase flow

### Test API Connection
```bash
# From NetFlow server, test API connection
curl -X POST http://192.168.10.1:8728/rest/login \
    -d '{"name":"netflow-api","password":"secure-api-password"}'
```

### Monitor Active Users
```bash
# Check active hotspot users
/ip hotspot active print

# Check user statistics
/ip hotspot user print stats
```

## 10. Troubleshooting

### Common Issues

#### Captive Portal Not Showing
```bash
# Check hotspot configuration
/ip hotspot print detail

# Verify walled garden settings
/ip hotspot walled-garden print

# Check firewall rules
/ip firewall filter print
```

#### API Connection Failed
```bash
# Verify API service is running
/ip service print

# Check API user permissions
/user print detail

# Test API locally
/system script run {/log info "API test"}
```

#### Users Can't Access Internet
```bash
# Check NAT rules
/ip firewall nat print

# Verify routing
/ip route print

# Check user profiles
/ip hotspot user profile print
```

### Log Analysis
```bash
# View hotspot logs
/log print where topics~"hotspot"

# Check system resources
/system resource print

# Monitor interface traffic
/interface monitor-traffic ether2
```

## 11. Advanced Configuration

### Load Balancing (Multiple WAN)
```bash
# Configure multiple WAN connections
/ip address add address=192.168.2.100/24 interface=ether3

# Create routing rules
/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1 \
    routing-mark=wan1 check-gateway=ping

/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 \
    routing-mark=wan2 check-gateway=ping

# Configure mangle rules for load balancing
/ip firewall mangle add chain=prerouting \
    src-address=192.168.10.0/24 \
    action=mark-connection new-connection-mark=wan1 \
    per-connection-classifier=both-addresses:2/0

/ip firewall mangle add chain=prerouting \
    src-address=192.168.10.0/24 \
    action=mark-connection new-connection-mark=wan2 \
    per-connection-classifier=both-addresses:2/1
```

### Bandwidth Management
```bash
# Create queue tree for bandwidth control
/queue tree add name="hotspot-download" parent=ether2 \
    max-limit=100M

/queue tree add name="hotspot-upload" parent=ether2 \
    max-limit=50M

# Apply to user profiles
/ip hotspot user profile set netflow-default \
    rate-limit="10M/10M" \
    parent-queue=hotspot-download/hotspot-upload
```

### RADIUS Integration (Optional)
```bash
# Configure RADIUS for centralized authentication
/radius add service=hotspot address=192.168.1.60 \
    secret=radius-secret timeout=3s

/ip hotspot profile set netflow-profile use-radius=yes
```

## 12. Maintenance

### Regular Tasks
- Monitor system resources
- Check log files for errors
- Update RouterOS firmware
- Backup configuration regularly
- Monitor user statistics

### Performance Optimization
```bash
# Optimize TCP settings
/ip settings set tcp-syncookies=yes

# Configure connection tracking
/ip firewall connection tracking set enabled=yes \
    tcp-established-timeout=1d \
    tcp-close-timeout=10s

# Optimize interface settings
/interface ethernet set ether2 auto-negotiation=yes \
    full-duplex=yes speed=1Gbps
```

This configuration provides a solid foundation for integrating MikroTik routers with the NetFlow WiFi Management System. Adjust IP addresses, passwords, and other settings according to your specific network requirements.