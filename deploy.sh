#!/bin/bash

# NetFlow WiFi Management System - Production Deployment Script
# This script automates the deployment of NetFlow to a production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="netflow"
APP_USER="netflow"
APP_DIR="/opt/netflow"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SYSTEMD_DIR="/etc/systemd/system"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update system
    apt update && apt upgrade -y
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Install Nginx
    apt install -y nginx
    
    # Install PM2 globally
    npm install -g pm2
    
    # Install other utilities
    apt install -y git curl wget unzip htop ufw fail2ban
    
    log_success "System dependencies installed"
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80
    ufw allow 443
    
    # Allow PostgreSQL (local only)
    ufw allow from 127.0.0.1 to any port 5432
    
    # Allow MikroTik API port (adjust as needed)
    ufw allow 8728
    
    log_success "Firewall configured"
}

create_user() {
    log_info "Creating application user..."
    
    # Create user if doesn't exist
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d $APP_DIR $APP_USER
        log_success "User $APP_USER created"
    else
        log_warning "User $APP_USER already exists"
    fi
}

setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE USER netflow_user WITH PASSWORD 'secure_password_change_this';
CREATE DATABASE netflow_db OWNER netflow_user;
GRANT ALL PRIVILEGES ON DATABASE netflow_db TO netflow_user;
\q
EOF
    
    log_success "Database setup completed"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Create application directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone repository (replace with your actual repository)
    if [ ! -d ".git" ]; then
        git clone https://github.com/your-username/netflow.git .
    else
        git pull origin main
    fi
    
    # Install backend dependencies
    cd backend
    npm ci --production
    
    # Generate Prisma client
    npx prisma generate
    
    # Run database migrations
    npx prisma db push
    
    # Seed database
    npx prisma db seed
    
    # Build application
    npm run build
    
    # Install frontend dependencies and build
    cd ../
    npm ci --production
    npm run build
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log_success "Application deployed"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Copy environment file
    if [ ! -f "$APP_DIR/backend/.env" ]; then
        cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
        log_warning "Please edit $APP_DIR/backend/.env with your configuration"
    fi
    
    # Set secure permissions
    chmod 600 $APP_DIR/backend/.env
    chown $APP_USER:$APP_USER $APP_DIR/backend/.env
    
    log_success "Environment configuration setup"
}

setup_pm2() {
    log_info "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'netflow-backend',
    script: './backend/dist/server.js',
    cwd: '/opt/netflow',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/netflow/error.log',
    out_file: '/var/log/netflow/out.log',
    log_file: '/var/log/netflow/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
    
    # Create log directory
    mkdir -p /var/log/netflow
    chown $APP_USER:$APP_USER /var/log/netflow
    
    # Start application with PM2
    sudo -u $APP_USER pm2 start $APP_DIR/ecosystem.config.js
    
    # Save PM2 configuration
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup script
    pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    log_success "PM2 setup completed"
}

setup_nginx() {
    log_info "Setting up Nginx reverse proxy..."
    
    # Create Nginx configuration
    cat > $NGINX_AVAILABLE/netflow << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration (update paths to your certificates)
    ssl_certificate /etc/ssl/certs/netflow.crt;
    ssl_certificate_key /etc/ssl/private/netflow.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend (React app)
    location / {
        root /opt/netflow/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Captive portal (special handling)
    location /portal {
        root /opt/netflow/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    # Enable site
    ln -sf $NGINX_AVAILABLE/netflow $NGINX_ENABLED/netflow
    
    # Remove default site
    rm -f $NGINX_ENABLED/default
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_success "Nginx setup completed"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    # Install Certbot
    apt install -y certbot python3-certbot-nginx
    
    log_warning "Please run the following command to obtain SSL certificate:"
    log_warning "certbot --nginx -d your-domain.com -d www.your-domain.com"
    log_warning "Then update the Nginx configuration with the correct certificate paths"
    
    # Setup auto-renewal
    crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
    
    log_success "SSL setup completed (manual certificate generation required)"
}

setup_monitoring() {
    log_info "Setting up monitoring and logging..."
    
    # Setup log rotation
    cat > /etc/logrotate.d/netflow << 'EOF'
/var/log/netflow/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 netflow netflow
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    # Setup system monitoring script
    cat > /usr/local/bin/netflow-monitor << 'EOF'
#!/bin/bash
# NetFlow system monitoring script

# Check if PM2 processes are running
if ! pm2 list | grep -q "netflow-backend"; then
    echo "$(date): NetFlow backend is not running, restarting..." >> /var/log/netflow/monitor.log
    pm2 restart netflow-backend
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%, cleaning up..." >> /var/log/netflow/monitor.log
    # Add cleanup commands here
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "$(date): Memory usage is ${MEMORY_USAGE}%, restarting services..." >> /var/log/netflow/monitor.log
    pm2 restart netflow-backend
fi
EOF
    
    chmod +x /usr/local/bin/netflow-monitor
    
    # Add to crontab
    crontab -l | { cat; echo "*/5 * * * * /usr/local/bin/netflow-monitor"; } | crontab -
    
    log_success "Monitoring setup completed"
}

setup_backup() {
    log_info "Setting up backup system..."
    
    # Create backup script
    cat > /usr/local/bin/netflow-backup << 'EOF'
#!/bin/bash
# NetFlow backup script

BACKUP_DIR="/opt/backups/netflow"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="netflow_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U netflow_user -h localhost netflow_db > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/$BACKUP_FILE -C /opt netflow --exclude=node_modules --exclude=.git

# Keep only last 7 backups
find $BACKUP_DIR -name "netflow_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "database_*.sql" -mtime +7 -delete

echo "$(date): Backup completed: $BACKUP_FILE" >> /var/log/netflow/backup.log
EOF
    
    chmod +x /usr/local/bin/netflow-backup
    
    # Add to crontab (daily backup at 2 AM)
    crontab -l | { cat; echo "0 2 * * * /usr/local/bin/netflow-backup"; } | crontab -
    
    log_success "Backup system setup completed"
}

main() {
    log_info "Starting NetFlow deployment..."
    
    check_root
    install_dependencies
    setup_firewall
    create_user
    setup_database
    deploy_application
    setup_environment
    setup_pm2
    setup_nginx
    setup_ssl
    setup_monitoring
    setup_backup
    
    log_success "NetFlow deployment completed!"
    log_info "Next steps:"
    log_info "1. Edit /opt/netflow/backend/.env with your configuration"
    log_info "2. Update Nginx configuration with your domain name"
    log_info "3. Obtain SSL certificate with: certbot --nginx -d your-domain.com"
    log_info "4. Configure MikroTik routers to point to your server"
    log_info "5. Test the system by connecting to a router's Wi-Fi"
    
    log_warning "Don't forget to:"
    log_warning "- Change default database password"
    log_warning "- Configure mobile money API credentials"
    log_warning "- Set up monitoring alerts"
    log_warning "- Test backup and restore procedures"
}

# Run main function
main "$@"