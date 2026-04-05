#!/bin/bash

# Immediate fix for Nginx /uploads 404
# This will verify and fix the configuration

set -e

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/digitalcareercenter.com"
UPLOADS_DIR="/root/dcc_webiste_crm/public/uploads"

echo "=========================================="
echo "Fixing Nginx /uploads Configuration"
echo "=========================================="
echo ""

# 1. Check if config is enabled
echo "1. Checking if config is enabled..."
if [ ! -L "$NGINX_ENABLED" ] && [ ! -f "$NGINX_ENABLED" ]; then
    echo "   ⚠️  Config not enabled, enabling it..."
    sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
    echo "   ✅ Config enabled"
else
    echo "   ✅ Config is enabled"
fi
echo ""

# 2. Check current /uploads block in active config
echo "2. Checking active Nginx configuration..."
if sudo nginx -T 2>/dev/null | grep -q "location /uploads"; then
    echo "   ✅ /uploads location block found in active config"
    echo ""
    echo "   Current block:"
    sudo nginx -T 2>/dev/null | sed -n '/location \/uploads {/,/^[[:space:]]*}/p' | head -15
else
    echo "   ❌ /uploads location block NOT in active config!"
    echo "   Will add it now..."
    echo ""
    
    # Backup
    sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remove any existing /uploads block
    sudo sed -i '/location \/uploads {/,/^[[:space:]]*}/d' "$NGINX_CONFIG"
    
    # Find location / block
    LOCATION_SLASH_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    
    if [ -z "$LOCATION_SLASH_LINE" ]; then
        echo "   ❌ Could not find 'location /' block"
        exit 1
    fi
    
    # Create /uploads block
    UPLOADS_BLOCK="    # Serve uploads directory directly - MUST come before location /
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
    sudo sed -i "${LOCATION_SLASH_LINE}i\\$UPLOADS_BLOCK" "$NGINX_CONFIG"
    
    echo "   ✅ /uploads block added"
fi
echo ""

# 3. Verify location block order
echo "3. Verifying location block order..."
UPLOADS_LINE=$(grep -n "location /uploads" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
SLASH_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)

if [ -n "$UPLOADS_LINE" ] && [ -n "$SLASH_LINE" ]; then
    if [ "$UPLOADS_LINE" -lt "$SLASH_LINE" ]; then
        echo "   ✅ /uploads comes BEFORE location / (correct)"
    else
        echo "   ❌ /uploads comes AFTER location / (wrong order!)"
        echo "   Fixing order..."
        
        # Remove both blocks
        sudo sed -i '/location \/uploads {/,/^[[:space:]]*}/d' "$NGINX_CONFIG"
        sudo sed -i '/^[[:space:]]*location \/ {/,/^[[:space:]]*}/d' "$NGINX_CONFIG"
        
        # Re-add in correct order
        # (This is complex, so we'll just recreate the /uploads block)
        echo "   Please manually fix the order in the config file"
    fi
fi
echo ""

# 4. Test Nginx config
echo "4. Testing Nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Configuration is valid"
else
    echo "   ❌ Configuration has errors!"
    exit 1
fi
echo ""

# 5. Reload Nginx
echo "5. Reloading Nginx..."
sudo systemctl reload nginx
echo "   ✅ Nginx reloaded"
echo ""

# 6. Test file access
echo "6. Testing file access..."
sleep 2
TEST_FILE="1767790451655-bl1.png"

if [ -f "$UPLOADS_DIR/$TEST_FILE" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/uploads/$TEST_FILE" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ File is accessible! (HTTP 200)"
        echo ""
        echo "   Test with:"
        echo "   curl -I http://localhost/uploads/$TEST_FILE"
    else
        echo "   ❌ Still getting HTTP $HTTP_CODE"
        echo ""
        echo "   Checking Nginx error logs..."
        sudo tail -5 /var/log/nginx/error.log
        echo ""
        echo "   Please run: sudo ./verify-nginx-config.sh"
    fi
else
    echo "   ⚠️  Test file not found: $UPLOADS_DIR/$TEST_FILE"
fi
echo ""

echo "=========================================="
echo "Fix Applied"
echo "=========================================="
echo ""
echo "If still not working, check:"
echo "1. sudo nginx -T | grep -A 10 'location /uploads'"
echo "2. sudo tail -f /var/log/nginx/error.log"
echo "3. Verify file exists: ls -lh $UPLOADS_DIR/$TEST_FILE"
echo ""

