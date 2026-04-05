#!/bin/bash

# Direct fix for Nginx /uploads location block
# This script will properly configure the location block

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"
UPLOADS_PATH="/root/dcc_webiste_crm/public/uploads"

echo "=========================================="
echo "Fixing Nginx Configuration for /uploads"
echo "=========================================="
echo ""

# Backup
echo "1. Creating backup..."
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"
echo ""

# Check current config
echo "2. Current configuration:"
echo "   Location blocks found:"
sudo grep -n "location" "$NGINX_CONFIG" | head -10
echo ""

# Remove any existing /uploads blocks
echo "3. Removing any existing /uploads blocks..."
sudo sed -i '/location \/uploads/,/^[[:space:]]*}/d' "$NGINX_CONFIG"
echo "   ✅ Cleaned up"
echo ""

# Find the line number of "location / {" 
LOCATION_SLASH_LINE=$(sudo grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)

if [ -z "$LOCATION_SLASH_LINE" ]; then
    echo "❌ Error: Could not find 'location / {' in config"
    echo "   Please check the config file manually"
    exit 1
fi

echo "4. Found 'location /' at line $LOCATION_SLASH_LINE"
echo "   Will insert /uploads block before it"
echo ""

# Create the location block content
LOCATION_BLOCK="    # Serve uploads directory directly - MUST come before location /
    location /uploads {
        alias $UPLOADS_PATH;
        expires 30d;
        add_header Cache-Control \"public\";
        access_log off;
        
        # Security: Only allow GET requests
        limit_except GET {
            deny all;
        }
    }"

# Insert before location /
echo "5. Inserting /uploads location block..."
sudo sed -i "${LOCATION_SLASH_LINE}i\\$LOCATION_BLOCK" "$NGINX_CONFIG"
echo "   ✅ Block inserted"
echo ""

# Verify
echo "6. Verifying configuration..."
echo "   Location blocks (should show /uploads before /):"
sudo grep -n "location" "$NGINX_CONFIG" | head -5
echo ""

# Show the /uploads block
echo "   /uploads block content:"
sudo sed -n '/location \/uploads {/,/^[[:space:]]*}/p' "$NGINX_CONFIG"
echo ""

# Test config
echo "7. Testing Nginx configuration..."
if sudo nginx -t 2>&1; then
    echo ""
    echo "   ✅ Configuration is valid"
    echo ""
    echo "8. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo ""
    echo "   ❌ Configuration test failed!"
    echo "   Restoring backup..."
    sudo cp "$NGINX_CONFIG.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi
echo ""

# Test
echo "9. Testing /uploads endpoint..."
sleep 2
TEST_URL="https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg"
echo "   Testing: $TEST_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")
HEADERS=$(curl -s -I "$TEST_URL" | head -5)

echo ""
echo "   HTTP Status: $HTTP_CODE"
echo "   Response headers:"
echo "$HEADERS" | head -5

if echo "$HEADERS" | grep -q "x-powered-by: Next.js"; then
    echo ""
    echo "   ⚠️  Still proxying to Next.js - location block may not be matching"
    echo "   Check Nginx error logs: sudo tail -f /var/log/nginx/error.log"
else
    echo ""
    echo "   ✅ Not proxying to Next.js - should be working!"
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "If still not working, check:"
echo "1. File exists: ls -lh $UPLOADS_PATH/1766146116916-adas.jpeg"
echo "2. File permissions: sudo chmod 644 $UPLOADS_PATH/*"
echo "3. Nginx error log: sudo tail -f /var/log/nginx/error.log"
echo "4. Test locally: curl -I http://localhost/uploads/1766146116916-adas.jpeg"
echo ""


















