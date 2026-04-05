#!/bin/bash

# Verify Nginx configuration for /uploads
# This will show the actual config being used

echo "=========================================="
echo "Verifying Nginx Configuration"
echo "=========================================="
echo ""

# 1. Check if /uploads location exists in active config
echo "1. Checking active Nginx configuration..."
echo "   Looking for /uploads location block:"
echo ""

if sudo nginx -T 2>/dev/null | grep -A 15 "location /uploads" | head -20; then
    echo ""
    echo "   ✅ /uploads location block found in active config"
else
    echo "   ❌ /uploads location block NOT found in active config!"
    echo ""
    echo "   Checking config file..."
    if grep -q "location /uploads" /etc/nginx/sites-available/digitalcareercenter.com; then
        echo "   ⚠️  Block exists in config file but not active!"
        echo "   The config might not be enabled."
        echo ""
        echo "   Check if config is symlinked:"
        ls -la /etc/nginx/sites-enabled/ | grep digitalcareercenter
    fi
fi
echo ""

# 2. Check location block order
echo "2. Checking location block order..."
echo "   All location blocks:"
sudo nginx -T 2>/dev/null | grep -n "location" | grep -E "(location /uploads|location / {)" | head -10
echo ""

# 3. Check alias path
echo "3. Checking alias path..."
ALIAS_PATH=$(sudo nginx -T 2>/dev/null | grep -A 2 "location /uploads" | grep "alias" | awk '{print $2}' | tr -d ';')
if [ -n "$ALIAS_PATH" ]; then
    echo "   Alias path: $ALIAS_PATH"
    if [ -d "$ALIAS_PATH" ]; then
        echo "   ✅ Directory exists"
        ls -ld "$ALIAS_PATH"
    else
        echo "   ❌ Directory does NOT exist!"
    fi
else
    echo "   ❌ Could not find alias path"
fi
echo ""

# 4. Check if config is enabled
echo "4. Checking if config is enabled..."
if [ -L "/etc/nginx/sites-enabled/digitalcareercenter.com" ]; then
    echo "   ✅ Config is enabled (symlinked)"
    ls -la /etc/nginx/sites-enabled/digitalcareercenter.com
else
    echo "   ❌ Config is NOT enabled!"
    echo "   Enable it with:"
    echo "   sudo ln -s /etc/nginx/sites-available/digitalcareercenter.com /etc/nginx/sites-enabled/"
fi
echo ""

# 5. Show full /uploads location block
echo "5. Full /uploads location block from active config:"
sudo nginx -T 2>/dev/null | sed -n '/location \/uploads {/,/^[[:space:]]*}/p' | head -20
echo ""

# 6. Test the exact path
echo "6. Testing file access with exact path..."
TEST_FILE="1767790451655-bl1.png"
if [ -f "/root/dcc_webiste_crm/public/uploads/$TEST_FILE" ]; then
    echo "   File exists: /root/dcc_webiste_crm/public/uploads/$TEST_FILE"
    
    # Try accessing via the alias path
    if [ -n "$ALIAS_PATH" ]; then
        RELATIVE_PATH="${TEST_FILE}"
        if [ -f "$ALIAS_PATH/$RELATIVE_PATH" ]; then
            echo "   ✅ File accessible via alias path"
        else
            echo "   ❌ File NOT accessible via alias path"
            echo "   Expected: $ALIAS_PATH/$RELATIVE_PATH"
        fi
    fi
else
    echo "   ❌ File does not exist"
fi
echo ""

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "If /uploads block is missing or wrong:"
echo "1. Edit config: sudo nano /etc/nginx/sites-available/digitalcareercenter.com"
echo "2. Ensure /uploads block comes BEFORE location /"
echo "3. Test: sudo nginx -t"
echo "4. Reload: sudo systemctl reload nginx"
echo ""

