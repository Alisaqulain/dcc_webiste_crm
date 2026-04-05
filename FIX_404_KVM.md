# Fix 404 Error on KVM Server - Complete Guide

## Required Software Versions

**IMPORTANT: Verify these versions are installed on your KVM server before proceeding:**

### Required Versions:

| Software | Required Version | Check Command |
|----------|-----------------|---------------|
| **Node.js** | **v14.x or v16.x or v18.x** (Recommended: v16.20.0 or v18.17.0) | `node --version` |
| **npm** | **v6.x or v7.x or v8.x or v9.x** (Comes with Node.js) | `npm --version` |
| **Next.js** | **12.3.4** (Fixed version in package.json) | Check `package.json` |
| **React** | **^18** (React 18.x) | Check `package.json` |
| **Nginx** | **1.18.x or later** | `nginx -v` |
| **PM2** (optional) | **Latest** (for process management) | `pm2 --version` |

### Check Your Current Versions:
```bash
# Check Node.js version
node --version
# Should show: v16.x.x or v18.x.x or v14.x.x

# Check npm version
npm --version
# Should show: 6.x.x or 7.x.x or 8.x.x or 9.x.x

# Check Nginx version
nginx -v
# Should show: nginx version: nginx/1.18.x or later

# Check PM2 version (if installed)
pm2 --version
```

### Install/Update Required Software:

**If Node.js is not installed or wrong version:**
```bash
# Option 1: Install Node.js 18.x (Recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Install Node.js 16.x
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 3: Using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

**If npm version is outdated:**
```bash
# Update npm to latest version
npm install -g npm@latest

# Verify
npm --version
```

**If Nginx is not installed:**
```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
nginx -v
```

**If PM2 is not installed (Recommended for production):**
```bash
# Install PM2 globally
npm install -g pm2

# Verify
pm2 --version

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it prints
```

## Problem
Website showing 404 errors on KVM server. This usually happens when:
- Code is not synced with server
- Next.js build is outdated
- Application is not running
- Nginx configuration issues
- Wrong Node.js version installed

## Complete Fix - Run These Commands on KVM Server

### Step 1: SSH into KVM Server
```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### Step 2: Navigate to Project Directory
```bash
cd ~/dcc_webiste_crm
# or if in root
cd /root/dcc_webiste_crm
```

### Step 3: Check Current Status and Versions
```bash
# Check if git is configured
git status

# Check Node.js version (MUST be v14.x, v16.x, or v18.x)
node --version
# Expected: v14.x.x OR v16.x.x OR v18.x.x
# If wrong version, install correct one (see version requirements above)

# Check npm version
npm --version
# Expected: 6.x.x or higher

# Check Next.js version in package.json
cat package.json | grep '"next"'
# Expected: "next": "12.3.4"

# Check if application is running
pm2 status
# OR if using systemd
systemctl status dcc-app

# Check Nginx version
nginx -v
```

### Step 4: Pull Latest Code from GitHub
```bash
# First, stash any local changes (if any)
git stash

# Pull the latest code
git pull origin main

# If there are conflicts, you may need to:
git fetch origin
git reset --hard origin/main
```

### Step 5: Install Dependencies (if needed)
```bash
# Install/update dependencies
npm install
```

### Step 6: Remove Old Build and Rebuild
```bash
# Remove old build cache
rm -rf .next

# Remove node_modules/.cache if exists
rm -rf node_modules/.cache

# Build the application
npm run build
```

### Step 7: Restart the Application

**If using PM2:**
```bash
# Stop the app
pm2 stop all

# Start the app
pm2 start npm --name "dcc-app" -- start

# Or restart
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs dcc-app --lines 50
```

**If using systemd:**
```bash
# Restart the service
sudo systemctl restart dcc-app

# Check status
sudo systemctl status dcc-app

# View logs
sudo journalctl -u dcc-app -n 100 -f
```

**If running directly:**
```bash
# Kill existing process (find the process ID first)
ps aux | grep node
kill -9 <process-id>

# Start the application
npm start
```

### Step 8: Check Nginx Configuration
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# If there are errors, edit the config
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
# OR
sudo nano /etc/nginx/sites-available/default

# Reload Nginx after changes
sudo systemctl reload nginx
```

### Step 9: Verify Nginx is Proxying to Next.js

Make sure your Nginx config has this (example):
```nginx
server {
    listen 80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # Serve uploads directory directly
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Proxy all other requests to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 10: Check Application Port
```bash
# Check if port 3000 is listening
netstat -tlnp | grep 3000
# OR
ss -tlnp | grep 3000

# If not listening, check if app started correctly
pm2 logs dcc-app
```

### Step 11: Check Firewall (if applicable)
```bash
# Check if firewall is blocking port 80/443
sudo ufw status

# Allow ports if needed
sudo ufw allow 80
sudo ufw allow 443
```

## Quick Fix Script - Copy and Run All at Once

```bash
#!/bin/bash
cd ~/dcc_webiste_crm || cd /root/dcc_webiste_crm

echo "Step 1: Pulling latest code..."
git pull origin main

echo "Step 2: Installing dependencies..."
npm install

echo "Step 3: Removing old build..."
rm -rf .next

echo "Step 4: Building application..."
npm run build

echo "Step 5: Restarting application..."
# If using PM2
pm2 restart all || pm2 start npm --name "dcc-app" -- start

# If using systemd
# sudo systemctl restart dcc-app

echo "Step 6: Checking status..."
pm2 status || sudo systemctl status dcc-app

echo "Done! Check your website now."
```

## Troubleshooting Common Issues

### Issue 0: Wrong Node.js Version (MOST COMMON)

If you see errors like "Cannot find module" or build failures, check Node.js version:

```bash
# Check current Node.js version
node --version

# If it shows v10.x, v11.x, v12.x, v13.x, v15.x, or v17.x, you need to upgrade
# Next.js 12.3.4 requires Node.js 14.x, 16.x, or 18.x

# Install correct version using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version  # Should show v18.x.x

# Rebuild after version change
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Issue 1: Git pull fails with conflicts
```bash
git fetch origin
git reset --hard origin/main
```

### Issue 2: Build fails
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### Issue 3: Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000
# OR
netstat -tlnp | grep 3000

# Kill the process
kill -9 <PID>
```

### Issue 4: PM2 not found
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start npm --name "dcc-app" -- start
pm2 save
pm2 startup
```

### Issue 5: Application crashes immediately
```bash
# Check logs
pm2 logs dcc-app --lines 100

# Check environment variables
cat .env.local

# Verify Node.js version (should be compatible)
node --version
```

### Issue 6: Nginx returns 502 Bad Gateway
```bash
# Check if Next.js app is running
curl http://localhost:3000

# If not running, start it
pm2 restart all

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Verify Everything is Working

```bash
# 1. Check if Next.js is running
curl http://localhost:3000

# 2. Check if Nginx is running
sudo systemctl status nginx

# 3. Check if PM2 processes are running
pm2 status

# 4. Test your website
curl -I https://www.digitalcareercenter.com
```

## After Fixing - Test These URLs

1. Homepage: `https://www.digitalcareercenter.com`
2. Blog listing: `https://www.digitalcareercenter.com/blog`
3. Courses: `https://www.digitalcareercenter.com/courses`
4. API test: `https://www.digitalcareercenter.com/api/courses`

If all return 200 OK, the fix is successful!

