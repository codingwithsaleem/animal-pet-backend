#!/bin/bash

# Quick fix for SSL setup - single domain only
echo "🔧 Setting up SSL for api.staging.rocketlabs.cloud only..."

# Stop nginx container
echo "Stopping nginx container..."
docker-compose stop nginx

# Generate certificate for single domain
echo "Generating SSL certificate for api.staging.rocketlabs.cloud..."
sudo certbot certonly --standalone \
    -d api.staging.rocketlabs.cloud \
    --email sherohero33@gmail.com \
    --agree-tos \
    --non-interactive \
    --force-renewal

if [ $? -eq 0 ]; then
    echo "✅ Certificate generated successfully!"
    
    # Copy certificates
    echo "Copying certificates..."
    mkdir -p ssl
    sudo cp /etc/letsencrypt/live/api.staging.rocketlabs.cloud/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/api.staging.rocketlabs.cloud/privkey.pem ssl/
    
    # Set permissions
    sudo chown $USER:$USER ssl/*.pem
    chmod 644 ssl/fullchain.pem
    chmod 600 ssl/privkey.pem
    
    echo "✅ Certificates copied and permissions set!"
    
    # Start containers
    echo "Starting containers with HTTPS..."
    docker-compose up -d
    
    # Wait and test
    echo "Waiting for containers to start..."
    sleep 10
    
    echo "🧪 Testing HTTPS setup..."
    curl -I https://api.staging.rocketlabs.cloud/health
    
    echo "✅ SSL setup completed!"
    echo "Your API is now available at: https://api.staging.rocketlabs.cloud"
    echo "API Documentation: https://api.staging.rocketlabs.cloud/api-docs"
    
else
    echo "❌ Certificate generation failed. Let's try alternative approach..."
    echo "The domain might not be pointing to this server correctly."
    echo "Server IP: $(curl -s ifconfig.me)"
    echo "Domain resolves to: $(dig +short api.staging.rocketlabs.cloud)"
fi

