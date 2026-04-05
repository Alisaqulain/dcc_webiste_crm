#!/bin/bash

# Fix 404 Error on KVM Server
# Run this script on your KVM server

set -e  # Exit on error

echo "========================================="
echo "Fixing 404 Error on KVM Server"
echo "========================================="
echo ""

# Navigate to project directory
if [ -d "/root/dcc_webiste_crm" ]; then
    cd /root/dcc_webiste_crm
elif [ -d "~/dcc_webiste_crm" ]; then
    cd ~/dcc_webiste_crm
else
    echo "Error: Project directory not found!"
    echo "Please navigate to your project directory first"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Step 0: Check versions
echo "Step 0: Checking required versions..."
echo ""

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "NOT INSTALLED")
echo "Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v(14|16|18) ]]; then
    echo "⚠️  WARNING: Node.js version should be v14.x, v16.x, or v18.x"
    echo "   Current version: $NODE_VERSION"
    echo "   Please install correct version before proceeding"
    echo ""
fi

# Check npm version
NPM_VERSION=$(npm --version 2>/dev/null || echo "NOT INSTALLED")
echo "npm version: $NPM_VERSION"
echo ""

# Check Nginx
NGINX_VERSION=$(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+' || echo "NOT INSTALLED")
echo "Nginx version: $NGINX_VERSION"
echo ""

# Step 1: Check Git status
echo "Step 1: Checking Git status..."
git status
echo ""

# Step 2: Pull latest code
echo "Step 2: Pulling latest code from GitHub..."
if ! git pull origin main; then
    echo "Git pull failed. Trying to reset to origin/main..."
    git fetch origin
    git reset --hard origin/main
fi
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing/updating dependencies..."
npm install
echo ""

# Step 4: Remove old build
echo "Step 4: Removing old build cache..."
rm -rf .next
rm -rf node_modules/.cache
echo ""

# Step 5: Build application
echo "Step 5: Building Next.js application..."
echo "This may take a few minutes..."
if npm run build; then
    echo "✓ Build successful!"
else
    echo "✗ Build failed! Check the errors above."
    exit 1
fi
echo ""

# Step 6: Restart application
echo "Step 6: Restarting application..."

# Check if PM2 is installed and running
if command -v pm2 &> /dev/null; then
    echo "Using PM2 to restart..."
    pm2 restart all 2>/dev/null || pm2 start npm --name "dcc-app" -- start
    pm2 save
    echo ""
    echo "PM2 Status:"
    pm2 status
elif systemctl list-unit-files | grep -q dcc-app; then
    echo "Using systemd to restart..."
    sudo systemctl restart dcc-app
    sudo systemctl status dcc-app --no-pager
else
    echo "Warning: Neither PM2 nor systemd service found."
    echo "Please start the application manually with: npm start"
fi
echo ""

# Step 7: Check if port 3000 is listening
echo "Step 7: Checking if application is listening on port 3000..."
if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✓ Application is running on port 3000"
else
    echo "✗ Application is NOT running on port 3000!"
    echo "Please check the logs: pm2 logs dcc-app"
fi
echo ""

# Step 8: Test Nginx
echo "Step 8: Checking Nginx..."
if sudo nginx -t 2>/dev/null; then
    echo "✓ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    echo "✗ Nginx configuration has errors!"
    echo "Check with: sudo nginx -t"
fi
echo ""

# Step 9: Test local application
echo "Step 9: Testing local application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
    echo "✓ Application is responding on localhost:3000"
else
    echo "✗ Application is not responding properly!"
fi
echo ""

echo "========================================="
echo "Fix Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test your website: https://www.digitalcareercenter.com"
echo "2. Check logs if still having issues: pm2 logs dcc-app"
echo "3. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""

