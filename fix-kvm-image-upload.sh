#!/bin/bash

# Quick Fix for Image Upload 404 Error on KVM
# This script configures Nginx to serve /uploads directly

set -e

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"
PROJECT_DIR="/root/dcc_webiste_crm"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"

echo "=========================================="
echo "Fixing Image Upload 404 Error on KVM"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo $0"
    exit 1
fi

# Backup config
echo "1. Backing up Nginx config..."
BACKUP_FILE="$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "   ✅ Backup created: $BACKUP_FILE"
echo ""

# Ensure uploads directory exists
echo "2. Ensuring uploads directory exists..."
mkdir -p "$UPLOADS_DIR"
chmod 755 "$UPLOADS_DIR"
chmod 644 "$UPLOADS_DIR"/* 2>/dev/null || true
echo "   ✅ Directory ready: $UPLOADS_DIR"
echo ""

# Remove existing /uploads block if present
echo "3. Removing any existing /uploads block..."
sed -i '/location \/uploads {/,/^[[:space:]]*}/d' "$NGINX_CONFIG" 2>/dev/null || true
echo "   ✅ Cleaned up old blocks"
echo ""

# Find location / block
LOCATION_SLASH_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)

if [ -z "$LOCATION_SLASH_LINE" ]; then
    echo "❌ Error: Could not find 'location / {' in config"
    echo "   Please check the config file manually: $NGINX_CONFIG"
    exit 1
fi

echo "4. Found 'location /' at line $LOCATION_SLASH_LINE"
echo "   Will insert /uploads block before it"
echo ""

# Create the location block
LOCATION_BLOCK="    # Serve uploads directory directly - MUST come before location /
    location /uploads {
        alias $UPLOADS_DIR;
        expires 30d;
        add_header Cache-Control \"public\";
        access_log off;
        
        # Security: Only allow GET requests
        limit_except GET {
            deny all;
        }
        
        # Ensure correct MIME types
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
            image/svg+xml svg;
        }
    }"

# Insert before location /
echo "5. Adding /uploads location block..."
sed -i "${LOCATION_SLASH_LINE}i\\$LOCATION_BLOCK" "$NGINX_CONFIG"
echo "   ✅ Block inserted"
echo ""

# Verify configuration
echo "6. Verifying configuration..."
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "   ✅ Nginx configuration is valid"
    echo ""
    
    echo "7. Reloading Nginx..."
    systemctl reload nginx
    echo "   ✅ Nginx reloaded successfully"
    echo ""
    
    echo "=========================================="
    echo "✅ Fix Applied Successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Upload a new image through your application"
    echo "2. Test the image URL in your browser"
    echo "3. Check if it loads without 404 error"
    echo ""
    echo "To verify, test with:"
    echo "  curl -I https://www.digitalcareercenter.com/uploads/YOUR_FILENAME.png"
    echo ""
    echo "You should see:"
    echo "  ✅ HTTP 200 (not 404)"
    echo "  ✅ No 'x-powered-by: Next.js' header"
    echo "  ✅ 'server: nginx' header"
    echo ""
else
    echo "   ❌ Nginx configuration test failed!"
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "   Backup restored. Please check the config manually."
    exit 1
fi

