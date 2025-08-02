#!/bin/bash

# HTTPS Deployment Script for api.staging.rocketlabs.cloud
# This script helps deploy your application with SSL/HTTPS configuration

set -e

echo "🚀 Starting HTTPS deployment for api.staging.rocketlabs.cloud..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if domain resolves to this server
check_domain() {
    echo "🔍 Checking domain resolution..."
    
    # Get server's public IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "Unable to get IP")
    echo "Server IP: $SERVER_IP"
    
    # Check domain resolution
    DOMAIN_IP=$(dig +short api.staging.rocketlabs.cloud 2>/dev/null || echo "Unable to resolve")
    echo "Domain IP: $DOMAIN_IP"
    
    if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
        print_status "Domain correctly points to this server"
    else
        print_warning "Domain may not point to this server. Please verify DNS settings."
        echo "Expected: $SERVER_IP"
        echo "Found: $DOMAIN_IP"
    fi
}

# Check if ports are open
check_ports() {
    echo "🔍 Checking if required ports are accessible..."
    
    # Check port 80
    if netstat -tuln | grep -q ":80 "; then
        print_status "Port 80 is open"
    else
        print_warning "Port 80 might not be accessible"
    fi
    
    # Check port 443
    if netstat -tuln | grep -q ":443 "; then
        print_status "Port 443 is open"
    else
        print_warning "Port 443 might not be accessible"
    fi
}

# Create SSL directory
setup_ssl_directory() {
    echo "📁 Setting up SSL directory..."
    mkdir -p ssl
    print_status "SSL directory created"
}

# Option 1: Let's Encrypt setup
setup_letsencrypt() {
    echo "🔐 Setting up Let's Encrypt SSL certificates..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    # Stop nginx container
    echo "Stopping nginx container..."
    docker-compose stop nginx 2>/dev/null || true
    
    # Generate certificates
    echo "Generating SSL certificates..."
    read -p "Enter your email address for Let's Encrypt notifications: " email
    
    sudo certbot certonly --standalone \
        -d api.staging.rocketlabs.cloud \
        --email "$email" \
        --agree-tos \
        --non-interactive
    
    # Copy certificates
    echo "Copying certificates..."
    sudo cp /etc/letsencrypt/live/api.staging.rocketlabs.cloud/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/api.staging.rocketlabs.cloud/privkey.pem ssl/
    
    # Set permissions
    sudo chown $USER:$USER ssl/*.pem
    chmod 644 ssl/fullchain.pem
    chmod 600 ssl/privkey.pem
    
    print_status "Let's Encrypt certificates installed"
}

# Option 2: Self-signed certificates
setup_selfsigned() {
    echo "🔐 Setting up self-signed SSL certificates..."
    
    cd ssl
    
    # Generate private key
    openssl genrsa -out privkey.pem 2048
    
    # Generate certificate
    openssl req -new -x509 -key privkey.pem -out fullchain.pem -days 365 \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=api.staging.rocketlabs.cloud"
    
    cd ..
    
    print_status "Self-signed certificates generated"
    print_warning "Note: Self-signed certificates will show security warnings in browsers"
}

# Deploy application
deploy_application() {
    echo "🚀 Deploying application with HTTPS..."
    
    # Stop existing containers
    docker-compose down
    
    # Rebuild and start containers
    docker-compose up -d --build
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 10
    
    # Check container status
    docker-compose ps
    
    print_status "Application deployed with HTTPS configuration"
}

# Test HTTPS setup
test_https() {
    echo "🧪 Testing HTTPS setup..."
    
    # Wait a bit for nginx to fully start
    sleep 5
    
    # Test HTTP redirect
    echo "Testing HTTP to HTTPS redirect..."
    if curl -s -I http://api.staging.rocketlabs.cloud | grep -q "301\|302"; then
        print_status "HTTP to HTTPS redirect working"
    else
        print_warning "HTTP redirect may not be working"
    fi
    
    # Test HTTPS health check
    echo "Testing HTTPS health endpoint..."
    if curl -k -s https://api.staging.rocketlabs.cloud/health | grep -q "healthy\|ok\|success"; then
        print_status "HTTPS health check working"
    else
        print_warning "HTTPS health check may not be working"
    fi
    
    # Test API docs
    echo "Testing HTTPS API documentation..."
    if curl -k -s -I https://api.staging.rocketlabs.cloud/api-docs | grep -q "200"; then
        print_status "HTTPS API documentation accessible"
    else
        print_warning "HTTPS API documentation may not be accessible"
    fi
}

# Setup auto-renewal for Let's Encrypt
setup_autorenewal() {
    echo "🔄 Setting up SSL certificate auto-renewal..."
    
    # Add cron job for renewal
    CRON_JOB="0 3 * * * /usr/bin/certbot renew --quiet && cd $(pwd) && docker-compose restart nginx"
    
    # Add to crontab if not already present
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
    
    print_status "Auto-renewal configured (runs daily at 3 AM)"
}

# Main menu
main_menu() {
    echo ""
    echo "🔧 HTTPS Setup Options:"
    echo "1. Let's Encrypt (Recommended for production)"
    echo "2. Self-signed certificates (For development/testing)"
    echo "3. Skip SSL setup (use existing certificates)"
    echo "4. Test existing HTTPS setup"
    echo "5. Exit"
    echo ""
    
    read -p "Choose an option (1-5): " choice
    
    case $choice in
        1)
            setup_letsencrypt
            deploy_application
            test_https
            setup_autorenewal
            ;;
        2)
            setup_selfsigned
            deploy_application
            test_https
            ;;
        3)
            deploy_application
            test_https
            ;;
        4)
            test_https
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            main_menu
            ;;
    esac
}

# Main execution
echo "=================================================="
echo "🚀 HTTPS Deployment Script"
echo "Domain: api.staging.rocketlabs.cloud"
echo "=================================================="

check_domain
check_ports
setup_ssl_directory
main_menu

echo ""
print_status "HTTPS deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Verify your domain DNS points to this server"
echo "2. Ensure firewall allows ports 80 and 443"
echo "3. Test your API at: https://api.staging.rocketlabs.cloud"
echo "4. Access API docs at: https://api.staging.rocketlabs.cloud/api-docs"
echo ""
echo "📝 For troubleshooting, check:"
echo "- docker-compose logs nginx"
