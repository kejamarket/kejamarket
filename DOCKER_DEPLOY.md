# Docker Deployment Guide (Alternative to Render)

Since Render auto-deploy is not working, you can deploy using Docker instead.

## Prerequisites
- Docker and Docker Compose installed
- VPS/Server with public IP (DigitalOcean, AWS, Azure, etc.)

## Quick Deploy

### 1. Update docker-compose.yml with Supabase

Replace the postgres service with Supabase connection:

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: kejamarket-app
    restart: always
    ports:
      - "80:3001"
      - "443:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres
      - JWT_SECRET=${JWT_SECRET}
      - MPESA_CONSUMER_KEY=${MPESA_CONSUMER_KEY}
      - MPESA_CONSUMER_SECRET=${MPESA_CONSUMER_SECRET}
      - MPESA_PASSKEY=${MPESA_PASSKEY}
      - MPESA_PAYBILL=303030
      - MPESA_ACCOUNT=2057103992
      - MPESA_CALLBACK_URL=https://kejamarket.co.ke/api/mpesa/callback
      - MPESA_ENV=sandbox
      - AT_USERNAME=kejamarket
      - AT_API_KEY=${AT_API_KEY}
    volumes:
      - ./.env:/app/.env
```

### 2. Create Dockerfile (if not exists)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "start.js"]
```

### 3. Deploy

```bash
# Build and start
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### 4. Access
Your app will be running at:
- http://YOUR_SERVER_IP:80
- https://YOUR_SERVER_IP:443

## OR: Just Fix Render Manually

**Since Docker requires a VPS, the EASIEST solution is still:**

### Go to Render Dashboard RIGHT NOW:
1. https://dashboard.render.com
2. Click your `kejamarket-prod` service
3. Click "Manual Deploy" button
4. Select "Deploy latest commit"
5. Wait 2-3 minutes

**That's it! This will work immediately!**

## Why Render Isn't Auto-Deploying

Possible reasons:
1. Auto-deploy is turned OFF in settings
2. GitHub webhook is disconnected
3. Render deployment is stuck/failed
4. Free tier limitations

## Current Status

✅ Database: Fully populated (21 properties, 10 services, 20 marketplace items)
✅ Code: Latest commit f6a0d39 pushed to GitHub
✅ Hardcoded DATABASE_URL in multiple places
❌ Render: Not picking up new commits (auto-deploy broken)

## Test After Deploy

```bash
curl https://kejamarket.co.ke/api/health
```

Should show:
- database: "postgresql"
- version: "2.0.0-with-real-data"
- commit: "f6a0d39"
- dataCounts: {properties: 21, services: 10, marketplace: 20}
