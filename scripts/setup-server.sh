#!/bin/bash

# Server setup script for Ubuntu 22.04

# Stop the script immediately if any command fails
set -e

echo "🚀 Setting up production server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "⚙️ Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create application directory (if not exists)
echo "📁 Ensuring application directory exists..."
if [ ! -d "/opt/rocket-cloud-portal" ]; then
    sudo mkdir -p /opt/rocket-cloud-portal
    sudo chown -R $USER:$USER /opt/rocket-cloud-portal
    echo "  ✅ Created /opt/rocket-cloud-portal"
else
    echo "  ✅ /opt/rocket-cloud-portal already exists"
    # Ensure correct ownership anyway
    sudo chown -R $USER:$USER /opt/rocket-cloud-portal
fi

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 5
    weekly
    compress
    missingok
    notifempty
    create 644 root root
    postrotate
        /bin/kill -USR1 \$(cat /var/run/docker.pid) 2>/dev/null || true
    endscript
}
EOF

# Create swap file (2GB)
echo "💾 Creating swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Setup monitoring (basic)
echo "📊 Setting up basic monitoring..."
sudo tee /etc/cron.d/system-monitoring << EOF
# System monitoring cron jobs
*/5 * * * * root df -h > /tmp/disk_usage.log 2>&1
*/5 * * * * root free -m > /tmp/memory_usage.log 2>&1
*/5 * * * * root docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" > /tmp/docker_stats.log 2>&1
EOF

# Install Node.js (for local debugging)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Setup Docker daemon configuration
echo "⚙️ Configuring Docker daemon..."
sudo tee /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true
}
EOF

# Restart Docker
sudo systemctl restart docker
sudo systemctl enable docker

# Create deployment user
echo "👤 Creating deployment user..."
sudo useradd -m -s /bin/bash deploy || true
sudo usermod -aG docker deploy || true
sudo mkdir -p /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

echo "✅ Server setup completed!"
echo "🔄 Please log out and log back in for Docker group changes to take effect"
echo "📝 Next steps:"
echo "  1. Copy your SSH key to /home/deploy/.ssh/authorized_keys"
echo "  2. Configure your domain DNS to point to this server"
echo "  3. Run the deployment script"
