# Information Needed for Deployment

To help you deploy to production, please provide:

## 1. Hosting Provider
Which service hosts kejamarket.co.ke?
- [ ] DigitalOcean
- [ ] AWS (EC2, Elastic Beanstalk, Lightsail)
- [ ] Heroku
- [ ] Vercel
- [ ] Railway
- [ ] Google Cloud
- [ ] Azure
- [ ] Shared hosting (cPanel/Plesk)
- [ ] VPS (Linode, Vultr, etc.)
- [ ] Other: _____________

## 2. Deployment Method
How do you usually deploy?
- [ ] SSH into server and git pull
- [ ] Hosting panel (cPanel, Plesk, etc.)
- [ ] CI/CD (GitHub Actions, GitLab CI)
- [ ] Platform dashboard (Heroku, Vercel, etc.)
- [ ] FTP upload
- [ ] Docker
- [ ] Not sure

## 3. Process Manager
What runs your Node.js app?
- [ ] PM2
- [ ] systemctl (systemd service)
- [ ] Docker / Docker Compose
- [ ] Forever
- [ ] Heroku (built-in)
- [ ] Manual (node server.js)
- [ ] Not sure

## 4. Access Details
Do you have:
- [ ] SSH access to the server
- [ ] Root/sudo access
- [ ] Hosting panel login
- [ ] GitHub connected to auto-deploy
- [ ] Someone else manages deployments

## 5. Current Setup
What's your production server path?
- [ ] /var/www/kejamarket
- [ ] /home/ubuntu/kejamarket
- [ ] /opt/kejamarket
- [ ] ~/kejamarket
- [ ] Other: _____________

---

## Quick Deployment Options

### If you have SSH access:
```bash
# Open terminal/PowerShell
ssh your-username@kejamarket.co.ke

# Then run:
cd /var/www/kejamarket  # (or your path)
git pull origin main
pm2 restart kejamarket  # (or your restart command)
```

### If you use Heroku:
```bash
# In your local project folder:
git push heroku main
```

### If you use Vercel/Netlify:
```bash
# In your local project folder:
vercel --prod
# OR
netlify deploy --prod
```

---

**Please tell me your hosting setup and I'll provide exact commands!**
