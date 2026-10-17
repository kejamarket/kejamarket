#!/bin/bash
# Production Deployment Script for KejaMarket
# Run this on your TrueHost server via SSH

echo "🚀 Starting deployment..."

# Navigate to application directory
cd ~/public_html/kejamarket || cd ~/kejamarket || cd ~/htdocs/kejamarket || exit 1

echo "📂 Current directory: $(pwd)"

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Restart application with PM2
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.js || pm2 restart all
    pm2 save
else
    echo "⚠️  PM2 not found. Attempting to restart with Node.js..."
    pkill -f "node server.js"
    nohup node server.js > output.log 2>&1 &
fi

echo "✅ Deployment complete!"
echo "🌐 Visit https://kejamarket.co.ke to verify"

# Show recent commits
echo ""
echo "📋 Recent commits deployed:"
git log --oneline -3
