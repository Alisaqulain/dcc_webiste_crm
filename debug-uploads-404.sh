#!/bin/bash

# Debug why /uploads is still returning 404
# Config looks correct, so let's check file access

set -e

UPLOADS_DIR="/root/dcc_webiste_crm/public/uploads"
TEST_FILE="1767767631103-logo.jpg"
ALIAS_PATH="/root/dcc_webiste_crm/public/uploads"

echo "=========================================="
echo "Debugging /uploads 404 Issue"
echo "=========================================="
echo ""

# 1. Check if file exists
echo "1. Checking if file exists..."
if [ -f "$UPLOADS_DIR/$TEST_FILE" ]; then
    echo "   ✅ File exists: $UPLOADS_DIR/$TEST_FILE"
    ls -lh "$UPLOADS_DIR/$TEST_FILE"
else
    echo "   ❌ File NOT found: $UPLOADS_DIR/$TEST_FILE"
    echo "   Available files:"
    ls -lh "$UPLOADS_DIR" | head -5
    exit 1
fi
echo ""

# 2. Check file permissions
echo "2. Checking file permissions..."
FILE_PERMS=$(stat -c "%a" "$UPLOADS_DIR/$TEST_FILE")
FILE_OWNER=$(stat -c "%U:%G" "$UPLOADS_DIR/$TEST_FILE")

echo "   Permissions: $FILE_PERMS (should be 644)"
echo "   Owner: $FILE_OWNER"

if [ "$FILE_PERMS" != "644" ]; then
    echo "   ⚠️  Fixing permissions..."
    chmod 644 "$UPLOADS_DIR/$TEST_FILE"
    echo "   ✅ Fixed"
fi
echo ""

# 3. Check directory permissions
echo "3. Checking directory permissions..."
for dir in "/root" "/root/dcc_webiste_crm" "/root/dcc_webiste_crm/public" "/root/dcc_webiste_crm/public/uploads"; do
    if [ -d "$dir" ]; then
        DIR_PERMS=$(stat -c "%a" "$dir")
        echo "   $dir: $DIR_PERMS (should be 755)"
        if [ "$DIR_PERMS" != "755" ]; then
            echo "   ⚠️  Fixing..."
            chmod 755 "$dir"
        fi
    else
        echo "   ❌ Directory not found: $dir"
    fi
done
echo ""

# 4. Check if Nginx user can read the file
echo "4. Testing if Nginx can access the file..."
NGINX_USER=$(ps aux | grep '[n]ginx: worker' | awk '{print $1}' | head -1)
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi

echo "   Nginx user: $NGINX_USER"

# Test read access
if sudo -u "$NGINX_USER" test -r "$UPLOADS_DIR/$TEST_FILE" 2>/dev/null; then
    echo "   ✅ Nginx user can read the file"
else
    echo "   ❌ Nginx user CANNOT read the file!"
    echo "   Fixing permissions..."
    chmod 644 "$UPLOADS_DIR/$TEST_FILE"
    chmod 755 "$UPLOADS_DIR"
    chmod 755 "$(dirname "$UPLOADS_DIR")"
    chmod 755 "$(dirname "$(dirname "$UPLOADS_DIR")")"
    chmod 755 "/root"
    echo "   ✅ Permissions fixed"
fi
echo ""

# 5. Check alias path vs actual path
echo "5. Verifying alias path..."
echo "   Alias in config: $ALIAS_PATH"
echo "   Actual file path: $UPLOADS_DIR/$TEST_FILE"

if [ "$ALIAS_PATH" = "$UPLOADS_DIR" ]; then
    echo "   ✅ Paths match"
else
    echo "   ⚠️  Path mismatch!"
    echo "   Update alias in Nginx config to: $UPLOADS_DIR"
fi
echo ""

# 6. Test direct file access
echo "6. Testing direct file access..."
if [ -r "$UPLOADS_DIR/$TEST_FILE" ]; then
    echo "   ✅ File is readable"
    FILE_SIZE=$(stat -c "%s" "$UPLOADS_DIR/$TEST_FILE")
    echo "   File size: $FILE_SIZE bytes"
else
    echo "   ❌ File is NOT readable"
fi
echo ""

# 7. Check Nginx error logs
echo "7. Recent Nginx error logs (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null | grep -i "uploads\|$TEST_FILE" || echo "   No relevant errors found"
echo ""

# 8. Test with curl and show full response
echo "8. Testing with curl (showing full response)..."
echo ""
curl -v http://localhost/uploads/$TEST_FILE 2>&1 | head -30
echo ""

# 9. Check if there are multiple server blocks
echo "9. Checking for multiple server blocks..."
SERVER_COUNT=$(sudo nginx -T 2>/dev/null | grep -c "server_name.*digitalcareercenter" || echo "0")
echo "   Found $SERVER_COUNT server block(s) with digitalcareercenter"
if [ "$SERVER_COUNT" -gt 1 ]; then
    echo "   ⚠️  Multiple server blocks found - this might cause conflicts"
    echo "   Server blocks:"
    sudo nginx -T 2>/dev/null | grep -B 2 "server_name.*digitalcareercenter" | head -20
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If file exists and permissions are correct, the issue might be:"
echo "1. Multiple server blocks causing conflicts"
echo "2. Nginx not reloaded properly"
echo "3. Browser cache (try hard refresh: Ctrl+Shift+R)"
echo ""
echo "Try:"
echo "  sudo systemctl restart nginx"
echo "  curl -I http://localhost/uploads/$TEST_FILE"
echo ""

