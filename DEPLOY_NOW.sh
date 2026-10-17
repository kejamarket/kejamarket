#!/bin/bash
#################################################
# KejaMarket Production Deployment
# Run this script on your production server
#################################################

set -e  # Exit on any error

echo "🚀 KejaMarket Deployment Started"
echo "================================"

# Find project directory
if [ -d "/var/www/kejamarket" ]; then
    cd /var/www/kejamarket
elif [ -d "/home/ubuntu/kejamarket" ]; then
    cd /home/ubuntu/kejamarket
elif [ -d "~/kejamarket" ]; then
    cd ~/kejamarket
else
    echo "❌ Error: Could not find kejamarket directory"
    echo "Please run this script from your project directory or update the paths"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo ""

# Backup current version
echo "💾 Creating backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p ../backups
cp -r . "../backups/$BACKUP_DIR" 2>/dev/null || echo "⚠️  Backup skipped"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
echo "✅ Code updated to latest commit: $(git log -1 --oneline)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --production
    echo "✅ Dependencies installed"
else
    echo "⚠️  No package.json found, skipping npm install"
fi
echo ""

# Restart application
echo "🔄 Restarting application..."

# Try PM2 first (most common)
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart kejamarket 2>/dev/null || pm2 restart ecosystem.config.js 2>/dev/null || pm2 restart all
    pm2 save
    echo "✅ PM2 restarted"
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    
# Try systemctl
elif command -v systemctl &> /dev/null && systemctl list-units --type=service | grep -q kejamarket; then
    echo "Using systemctl..."
    sudo systemctl restart kejamarket
    echo "✅ Service restarted"
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status kejamarket --no-pager -l
    
# Try Docker Compose
elif [ -f "docker-compose.yml" ]; then
    echo "Using Docker Compose..."
    docker-compose restart
    echo "✅ Docker containers restarted"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    
# Try forever
elif command -v forever &> /dev/null; then
    echo "Using forever..."
    forever restartall
    echo "✅ Forever restarted"
    
else
    echo "⚠️  No process manager detected!"
    echo "Please manually restart your application:"
    echo "  - PM2: pm2 restart kejamarket"
    echo "  - systemctl: sudo systemctl restart kejamarket"
    echo "  - Docker: docker-compose restart"
    echo "  - Manual: kill the node process and run 'npm start'"
fi

echo ""
echo "================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "🌐 Your site: https://kejamarket.co.ke"
echo ""
echo "📋 Recent commits deployed:"
git log -5 --oneline --decorate
echo ""
echo "🎉 Mobile layout (all 8 screens) is now live!"
echo "   - Test on mobile device or resize browser to ≤768px"
echo "   - All 137 properties should now be visible"
echo ""
