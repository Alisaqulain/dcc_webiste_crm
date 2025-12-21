#!/bin/bash

# Fix Nginx /uploads location block - Ensure it's properly configured
# This script will check and fix the Nginx configuration

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"
PROJECT_DIR="/root/dcc_webiste_crm"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"

echo "=========================================="
echo "Fixing Nginx /uploads Location Block"
echo "=========================================="
echo ""

# Backup config
echo "1. Backing up current config..."
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"
echo ""

# Check if file exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Error: Config file not found: $NGINX_CONFIG"
    exit 1
fi

# Check current config
echo "2. Checking current configuration..."
if grep -q "location /uploads" "$NGINX_CONFIG"; then
    echo "   ⚠️  /uploads location block already exists"
    echo "   Current block:"
    grep -A 5 "location /uploads" "$NGINX_CONFIG" | head -6
    echo ""
    echo "   Removing old block..."
    # Remove existing /uploads block
    sudo sed -i '/location \/uploads {/,/^    }/d' "$NGINX_CONFIG"
    echo "   ✅ Old block removed"
else
    echo "   ℹ️  No /uploads location block found"
fi
echo ""

# Find where to insert the block (before location /)
echo "3. Finding insertion point..."
if grep -q "location / {" "$NGINX_CONFIG"; then
    INSERT_LINE=$(grep -n "location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    echo "   Found 'location /' at line $INSERT_LINE"
    echo "   Will insert /uploads block before it"
else
    echo "   ⚠️  No 'location /' block found, will append to server block"
    INSERT_LINE=""
fi
echo ""

# Create the location block
echo "4. Adding /uploads location block..."
LOCATION_BLOCK="    # Serve uploads directory directly (MUST come before location /)
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

if [ -n "$INSERT_LINE" ]; then
    # Insert before location /
    sudo sed -i "${INSERT_LINE}i\\$LOCATION_BLOCK" "$NGINX_CONFIG"
else
    # Append to server block (before closing brace)
    sudo sed -i '/^}$/i\\'"$LOCATION_BLOCK" "$NGINX_CONFIG"
fi
echo "   ✅ Location block added"
echo ""

# Verify the block was added correctly
echo "5. Verifying configuration..."
echo "   Location block:"
grep -A 15 "location /uploads" "$NGINX_CONFIG" | head -16
echo ""

# Check file permissions
echo "6. Checking file permissions..."
if [ -d "$UPLOADS_DIR" ]; then
    sudo chmod 755 "$UPLOADS_DIR"
    sudo chmod 644 "$UPLOADS_DIR"/* 2>/dev/null || true
    echo "   ✅ Permissions set: 755 for directory, 644 for files"
else
    echo "   ⚠️  Uploads directory not found: $UPLOADS_DIR"
    echo "   Creating directory..."
    sudo mkdir -p "$UPLOADS_DIR"
    sudo chmod 755 "$UPLOADS_DIR"
    echo "   ✅ Directory created"
fi
echo ""

# Test Nginx config
echo "7. Testing Nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Configuration is valid"
    echo ""
    echo "8. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Configuration test failed!"
    echo "   Restoring backup..."
    sudo cp "$NGINX_CONFIG.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi
echo ""

# Test the endpoint
echo "9. Testing /uploads endpoint..."
sleep 1
TEST_FILE=$(ls "$UPLOADS_DIR" | head -1)
if [ -n "$TEST_FILE" ]; then
    echo "   Testing with file: $TEST_FILE"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/uploads/$TEST_FILE")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ File is accessible! (HTTP $HTTP_CODE)"
    else
        echo "   ⚠️  File returned HTTP $HTTP_CODE"
        echo "   This might be normal if testing via localhost"
    fi
else
    echo "   ⚠️  No files found in uploads directory to test"
fi
echo ""

echo "=========================================="
echo "Configuration Updated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test from browser: https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg"
echo "2. Check Nginx error logs if still not working:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo "3. Verify file exists:"
echo "   ls -lh $UPLOADS_DIR/1766146116916-adas.jpeg"
echo ""






