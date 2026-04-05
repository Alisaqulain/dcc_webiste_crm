#!/bin/bash

# Check and fix Nginx /uploads configuration
# This will show exactly what's in the active config and fix it

set -e

echo "=========================================="
echo "Checking Active Nginx Configuration"
echo "=========================================="
echo ""

# 1. Check if /uploads block exists in ACTIVE config
echo "1. Checking active Nginx config for /uploads block..."
echo ""

ACTIVE_CONFIG=$(sudo nginx -T 2>/dev/null)

if echo "$ACTIVE_CONFIG" | grep -q "location /uploads"; then
    echo "   ✅ /uploads block found in active config"
    echo ""
    echo "   Active /uploads block:"
    echo "$ACTIVE_CONFIG" | sed -n '/location \/uploads {/,/^[[:space:]]*}/p' | head -20
else
    echo "   ❌ /uploads block NOT found in active config!"
    echo ""
    echo "   This is the problem - the block exists in the file but isn't active."
    echo ""
fi
echo ""

# 2. Check location blocks order
echo "2. Checking location block order in active config..."
echo ""
echo "   Location blocks (should show /uploads before /):"
echo "$ACTIVE_CONFIG" | grep -n "location" | grep -E "(location /uploads|location / {)" | head -5
echo ""

# 3. Check which server blocks are active
echo "3. Active server blocks:"
echo "$ACTIVE_CONFIG" | grep -A 2 "server_name.*digitalcareercenter" | head -10
echo ""

# 4. Check config file
echo "4. Checking config file: /etc/nginx/sites-available/digitalcareercenter.com"
if grep -q "location /uploads" /etc/nginx/sites-available/digitalcareercenter.com; then
    echo "   ✅ /uploads block exists in config file"
    echo ""
    echo "   Block in file:"
    grep -A 10 "location /uploads" /etc/nginx/sites-available/digitalcareercenter.com | head -12
else
    echo "   ❌ /uploads block NOT in config file!"
fi
echo ""

# 5. Check if config is enabled
echo "5. Checking if config is enabled..."
if [ -L "/etc/nginx/sites-enabled/digitalcareercenter.com" ] || [ -f "/etc/nginx/sites-enabled/digitalcareercenter.com" ]; then
    echo "   ✅ Config is enabled"
    ls -la /etc/nginx/sites-enabled/digitalcareercenter.com
else
    echo "   ❌ Config is NOT enabled!"
    echo "   Enabling it now..."
    sudo ln -s /etc/nginx/sites-available/digitalcareercenter.com /etc/nginx/sites-enabled/
    echo "   ✅ Config enabled"
fi
echo ""

# 6. Show the fix
echo "=========================================="
echo "FIX NEEDED"
echo "=========================================="
echo ""
echo "If /uploads block is missing from active config, run:"
echo ""
echo "sudo nano /etc/nginx/sites-available/digitalcareercenter.com"
echo ""
echo "Add this block BEFORE 'location /':"
echo ""
echo "    location /uploads {"
echo "        alias /root/dcc_webiste_crm/public/uploads;"
echo "        expires 30d;"
echo "        add_header Cache-Control \"public\";"
echo "        access_log off;"
echo "        limit_except GET { deny all; }"
echo "    }"
echo ""
echo "Then:"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""

