#!/usr/bin/env bash
# Render Build Script - Runs BEFORE server starts
# This fixes DATABASE_URL at build time, not runtime

echo "=========================================="
echo "RENDER BUILD - Fixing DATABASE_URL"
echo "=========================================="

# Install dependencies
npm install

# Create .env file with correct DATABASE_URL
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres
NODE_ENV=production
EOF

echo "✅ .env file created with correct DATABASE_URL"
echo "=========================================="
