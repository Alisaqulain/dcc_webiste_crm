#!/bin/bash

# Production Deployment Script for Digital Career Center
# This script helps set up environment variables for production deployment

echo "=========================================="
echo "  Digital Career Center - Production Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to backup and create a new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup created"
    fi
fi

# Get production domain
echo ""
read -p "Enter your production domain (e.g., www.yourdomain.com): " DOMAIN

# Generate a secret if needed
if [ -z "$NEXTAUTH_SECRET" ]; then
    SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
else
    SECRET="$NEXTAUTH_SECRET"
fi

# Ask for MongoDB URI
echo ""
read -p "Enter MongoDB connection URI [default: mongodb://localhost:27017/dcc]: " MONGO_URI
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/dcc"}

# Ask for other optional configs
echo ""
read -p "Enter Razorpay Key ID (leave empty to skip): " RAZORPAY_KEY
read -p "Enter Razorpay Key Secret (leave empty to skip): " RAZORPAY_SECRET
read -p "Enter Google OAuth Client ID (leave empty to skip): " GOOGLE_CLIENT_ID
read -p "Enter Google OAuth Client Secret (leave empty to skip): " GOOGLE_CLIENT_SECRET

# Determine URL (https by default)
URL="https://${DOMAIN}"

# Create .env file
cat > .env << EOF
# Database Configuration
MONGODB_URI=${MONGO_URI}

# NextAuth Configuration - PRODUCTION
NEXTAUTH_URL=${URL}
NEXTAUTH_SECRET=${SECRET}

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=Dcchelp1@gmail.com
EMAIL_PASS=your-app-password-here

EOF

# Add optional configurations
if [ -n "$RAZORPAY_KEY" ]; then
    echo "" >> .env
    echo "# Razorpay Configuration" >> .env
    echo "RAZORPAY_KEY_ID=${RAZORPAY_KEY}" >> .env
    echo "RAZORPAY_KEY_SECRET=${RAZORPAY_SECRET}" >> .env
fi

if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo "" >> .env
    echo "# Google OAuth Configuration" >> .env
    echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" >> .env
    echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" >> .env
fi

echo "" >> .env
echo "# Environment" >> .env
echo "NODE_ENV=production" >> .env

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "IMPORTANT: Please review and update the following:"
echo "  1. EMAIL_PASS - Add your email app password"
echo "  2. Make sure your domain has HTTPS enabled"
echo "  3. Update Google OAuth credentials in Google Cloud Console:"
echo "     - Authorized JavaScript origins: ${URL}"
echo "     - Authorized redirect URIs: ${URL}/api/auth/callback/google"
echo ""
echo "Next steps:"
echo "  1. Review .env file: cat .env"
echo "  2. Install dependencies: npm install"
echo "  3. Build application: npm run build"
echo "  4. Start application: npm start"
echo ""
echo "Or with PM2:"
echo "  1. pm2 start npm --name 'dcc-app' -- start"
echo "  2. pm2 save"
echo ""

