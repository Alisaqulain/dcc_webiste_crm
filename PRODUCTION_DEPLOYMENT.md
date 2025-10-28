e# Production Deployment Guide

## Issue: OAuth Callbacks Using Localhost URLs

If you're seeing URLs like `http://localhost:3000/login?callbackUrl=...` on your production site, it means your environment variables are not properly configured for production.

## Solution

### 1. Create a `.env` or `.env.production` file in your KVM server

Navigate to your project directory on the KVM server and create/update your environment variables:

```bash
# Database Configuration (use your production MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dcc

# NextAuth Configuration - CRITICAL FOR PRODUCTION
# Replace with your actual domain (e.g., https://www.digitalcareercenter.com)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-random-secret-key-here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Google OAuth Configuration (for sign-in with Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Environment
NODE_ENV=production
```

### 2. Key Steps for Production

#### Step 1: Update NEXTAUTH_URL
The most important change is to update `NEXTAUTH_URL` to your production domain:
```bash
NEXTAUTH_URL=https://www.yourdomain.com
```
⚠️ **Do NOT include trailing slashes** in NEXTAUTH_URL

#### Step 2: Generate a Strong Secret
Generate a secure secret key for NEXTAUTH_SECRET:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use an online generator
# https://generate-secret.vercel.app/32
```

#### Step 3: Update Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client
5. Add your production domain to "Authorized JavaScript origins":
   - `https://www.yourdomain.com`
6. Add callback URL to "Authorized redirect URIs":
   - `https://www.yourdomain.com/api/auth/callback/google`

#### Step 4: Restart Your Application
After updating environment variables:
```bash
# If using PM2
pm2 restart your-app-name

# If using systemd
sudo systemctl restart your-app

# Or if running directly
# Stop the current process and restart
```

### 3. Verify Environment Variables

Create a simple verification endpoint or check:
```bash
# SSH into your KVM server
cd /path/to/your/project

# Check if environment variables are loaded
npm run build  # This will show if there are any issues
```

### 4. Production Deployment on KVM

#### Option A: Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start your application
pm2 start npm --name "dcc-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

#### Option B: Using systemd
Create a service file at `/etc/systemd/system/dcc-app.service`:
```ini
[Unit]
Description=Digital Career Center App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable dcc-app
sudo systemctl start dcc-app
```

### 5. Build and Deploy

```bash
# Build the application
npm run build

# Start the production server
npm start

# Or with PM2
pm2 start npm --name "dcc-app" -- start
```

### 6. Checklist

- [ ] Updated `NEXTAUTH_URL` to production domain (https://yourdomain.com)
- [ ] Generated and set `NEXTAUTH_SECRET`
- [ ] Updated MongoDB URI to production database
- [ ] Updated Google OAuth credentials with production domains
- [ ] Updated Razorpay keys for production
- [ ] All environment variables are set in production
- [ ] Application has been rebuilt (`npm run build`)
- [ ] Application has been restarted
- [ ] SSL certificate is properly configured (for HTTPS)

### 7. Testing After Deployment

1. Visit your production site: `https://yourdomain.com`
2. Try logging in with Google
3. Check that URLs in browser don't contain `localhost`
4. Verify OAuth callback works properly

### Common Issues

#### Issue: Still seeing localhost URLs
**Cause**: Environment variables not properly loaded or application not restarted
**Solution**: 
- Double-check your `.env` file exists in the project directory
- Restart your application
- Check if your deployment process loads environment variables correctly

#### Issue: OAuth callback errors
**Cause**: Google OAuth credentials not updated with production domain
**Solution**: Update your Google Cloud Console OAuth credentials with production domains

#### Issue: Environment variables not loading
**Cause**: Wrong file location or incorrect syntax
**Solution**: 
- Ensure `.env` file is in the project root directory
- No spaces around `=` sign in `.env` file
- Restart the application after changes

## Quick Fix Script

If you need to quickly update NEXTAUTH_URL on your server:

```bash
# SSH into your KVM server
ssh your-username@your-server-ip

# Navigate to project directory
cd /path/to/your/project

# Edit environment variables (nano or vi)
nano .env

# Update NEXTAUTH_URL to your domain
# Save and exit

# Restart application
pm2 restart your-app-name  # If using PM2
# OR
sudo systemctl restart your-app  # If using systemd
```

## Need Help?

If you continue to see issues:
1. Check application logs: `pm2 logs` or `sudo journalctl -u your-app`
2. Verify environment variables are loaded: Check the `/api/check-config` endpoint
3. Ensure your domain has SSL enabled (HTTPS)
4. Verify Google OAuth credentials are updated with production domains

