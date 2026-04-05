#!/bin/bash

# Troubleshoot Nginx /uploads 404 issue
# Run this on your KVM server

set -e

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"
PROJECT_DIR="/root/dcc_webiste_crm"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
TEST_FILE="1767790451655-bl1.png"

echo "=========================================="
echo "Troubleshooting Nginx /uploads 404 Issue"
echo "=========================================="
echo ""

# 1. Check if file exists
echo "1. Checking if file exists..."
if [ -f "$UPLOADS_DIR/$TEST_FILE" ]; then
    echo "   ✅ File exists: $UPLOADS_DIR/$TEST_FILE"
    ls -lh "$UPLOADS_DIR/$TEST_FILE"
else
    echo "   ❌ File NOT found: $UPLOADS_DIR/$TEST_FILE"
    exit 1
fi
echo ""

# 2. Check file permissions
echo "2. Checking file permissions..."
FILE_PERMS=$(stat -c "%a" "$UPLOADS_DIR/$TEST_FILE")
DIR_PERMS=$(stat -c "%a" "$UPLOADS_DIR")

echo "   File permissions: $FILE_PERMS (should be 644)"
echo "   Directory permissions: $DIR_PERMS (should be 755)"

if [ "$FILE_PERMS" != "644" ]; then
    echo "   ⚠️  Fixing file permissions..."
    chmod 644 "$UPLOADS_DIR/$TEST_FILE"
fi

if [ "$DIR_PERMS" != "755" ]; then
    echo "   ⚠️  Fixing directory permissions..."
    chmod 755 "$UPLOADS_DIR"
fi
echo ""

# 3. Check Nginx config
echo "3. Checking Nginx configuration..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "   ❌ Config file not found: $NGINX_CONFIG"
    exit 1
fi

# Check if /uploads location block exists
if grep -q "location /uploads" "$NGINX_CONFIG"; then
    echo "   ✅ /uploads location block found"
    echo ""
    echo "   Current /uploads block:"
    sed -n '/location \/uploads {/,/^[[:space:]]*}/p' "$NGINX_CONFIG" | head -20
else
    echo "   ❌ /uploads location block NOT found!"
    echo "   Run: sudo ./fix-kvm-image-upload.sh"
    exit 1
fi
echo ""

# 4. Check location block order
echo "4. Checking location block order..."
LOCATION_UPLOADS_LINE=$(grep -n "location /uploads" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
LOCATION_SLASH_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)

if [ -n "$LOCATION_UPLOADS_LINE" ] && [ -n "$LOCATION_SLASH_LINE" ]; then
    if [ "$LOCATION_UPLOADS_LINE" -lt "$LOCATION_SLASH_LINE" ]; then
        echo "   ✅ /uploads comes BEFORE location / (correct order)"
        echo "      /uploads at line: $LOCATION_UPLOADS_LINE"
        echo "      location / at line: $LOCATION_SLASH_LINE"
    else
        echo "   ❌ /uploads comes AFTER location / (wrong order!)"
        echo "      /uploads at line: $LOCATION_UPLOADS_LINE"
        echo "      location / at line: $LOCATION_SLASH_LINE"
        echo "   Fix: Move /uploads block before location /"
    fi
else
    echo "   ⚠️  Could not determine location block order"
fi
echo ""

# 5. Check alias path
echo "5. Checking alias path..."
ALIAS_PATH=$(grep -A 1 "location /uploads" "$NGINX_CONFIG" | grep "alias" | awk '{print $2}' | tr -d ';')

if [ -n "$ALIAS_PATH" ]; then
    echo "   Alias path in config: $ALIAS_PATH"
    echo "   Expected path: $UPLOADS_DIR"
    
    if [ "$ALIAS_PATH" = "$UPLOADS_DIR" ]; then
        echo "   ✅ Alias path is correct"
    else
        echo "   ❌ Alias path mismatch!"
        echo "   Update config to use: $UPLOADS_DIR"
    fi
    
    # Check if alias path exists
    if [ -d "$ALIAS_PATH" ]; then
        echo "   ✅ Alias directory exists"
    else
        echo "   ❌ Alias directory does NOT exist: $ALIAS_PATH"
    fi
else
    echo "   ❌ Could not find alias directive"
fi
echo ""

# 6. Test Nginx config syntax
echo "6. Testing Nginx configuration syntax..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors!"
    sudo nginx -t
    exit 1
fi
echo ""

# 7. Check if Nginx is running
echo "7. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is NOT running"
    echo "   Start with: sudo systemctl start nginx"
    exit 1
fi
echo ""

# 8. Reload Nginx
echo "8. Reloading Nginx..."
if sudo systemctl reload nginx; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ❌ Failed to reload Nginx"
    exit 1
fi
echo ""

# 9. Test file access via Nginx
echo "9. Testing file access..."
sleep 2

# Test via localhost
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/uploads/$TEST_FILE" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ File accessible via localhost (HTTP 200)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ File returns 404 via localhost"
    echo "   Checking Nginx error logs..."
    sudo tail -5 /var/log/nginx/error.log
else
    echo "   ⚠️  Unexpected response: HTTP $HTTP_CODE"
fi
echo ""

# 10. Check Nginx error logs
echo "10. Recent Nginx error logs (last 5 lines):"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "   No errors found"
echo ""

# 11. Check if Nginx can read the file
echo "11. Testing if Nginx user can read the file..."
NGINX_USER=$(ps aux | grep '[n]ginx: master' | awk '{print $1}' | head -1)
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi

echo "   Nginx user: $NGINX_USER"

if sudo -u "$NGINX_USER" test -r "$UPLOADS_DIR/$TEST_FILE"; then
    echo "   ✅ Nginx user can read the file"
else
    echo "   ❌ Nginx user CANNOT read the file!"
    echo "   Fixing permissions..."
    chmod 644 "$UPLOADS_DIR/$TEST_FILE"
    chmod 755 "$UPLOADS_DIR"
    chmod 755 "$(dirname "$UPLOADS_DIR")"
fi
echo ""

# 12. Final test
echo "12. Final verification..."
echo "   Test URL: https://www.digitalcareercenter.com/uploads/$TEST_FILE"
echo ""
echo "   Run this command to test:"
echo "   curl -I https://www.digitalcareercenter.com/uploads/$TEST_FILE"
echo ""

echo "=========================================="
echo "Troubleshooting Complete"
echo "=========================================="
echo ""
echo "If still getting 404, check:"
echo "1. Nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "2. File permissions: ls -lh $UPLOADS_DIR/$TEST_FILE"
echo "3. Nginx config: sudo nginx -t"
echo "4. Test locally: curl -I http://localhost/uploads/$TEST_FILE"
echo ""

