#!/bin/bash
# KejaMarket Production Deployment Script
# Run this on your production server

echo "🚀 Starting KejaMarket Deployment..."

# Navigate to project directory
cd /var/www/kejamarket || cd ~/kejamarket || cd /home/ubuntu/kejamarket || exit 1

echo "📁 Current directory: $(pwd)"

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies (if package.json changed)
echo "📦 Checking dependencies..."
npm install --production

# Restart the application
echo "🔄 Restarting application..."

# Try PM2 first
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart kejamarket || pm2 restart all
    pm2 save
    echo "✅ PM2 restart complete"
elif command -v systemctl &> /dev/null; then
    echo "Using systemctl..."
    sudo systemctl restart kejamarket
    echo "✅ Systemctl restart complete"
elif [ -f docker-compose.yml ]; then
    echo "Using Docker Compose..."
    docker-compose restart
    echo "✅ Docker restart complete"
else
    echo "⚠️ No process manager found. Please restart manually."
fi

# Check status
echo ""
echo "📊 Application Status:"
if command -v pm2 &> /dev/null; then
    pm2 status
elif command -v systemctl &> /dev/null; then
    sudo systemctl status kejamarket --no-pager
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check your site: https://kejamarket.co.ke"
echo ""
echo "Recent commits:"
git log --oneline -5
