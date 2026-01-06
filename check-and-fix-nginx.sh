#!/bin/bash

# Check and fix Nginx config for /uploads
NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"

echo "=========================================="
echo "Checking Nginx Configuration"
echo "=========================================="
echo ""

# Show current location blocks
echo "Current location blocks in config:"
sudo grep -n "location" "$NGINX_CONFIG"
echo ""

# Check if /uploads block exists
if sudo grep -q "location /uploads" "$NGINX_CONFIG"; then
    echo "✅ /uploads location block found"
    echo ""
    echo "Current /uploads block:"
    sudo sed -n '/location \/uploads {/,/^[[:space:]]*}/p' "$NGINX_CONFIG"
    echo ""
    
    # Check if it's before location /
    UPLOADS_LINE=$(sudo grep -n "location /uploads" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    SLASH_LINE=$(sudo grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    
    if [ -n "$UPLOADS_LINE" ] && [ -n "$SLASH_LINE" ]; then
        if [ "$UPLOADS_LINE" -lt "$SLASH_LINE" ]; then
            echo "✅ /uploads block is BEFORE location / (correct order)"
        else
            echo "❌ /uploads block is AFTER location / (wrong order!)"
            echo "   This is why it's not working - location / matches first"
        fi
    fi
else
    echo "❌ /uploads location block NOT found"
fi

echo ""
echo "=========================================="
echo "To fix manually:"
echo "=========================================="
echo ""
echo "1. Edit config:"
echo "   sudo nano $NGINX_CONFIG"
echo ""
echo "2. Make sure /uploads block comes BEFORE location /"
echo ""
echo "3. The block should look like:"
echo "   location /uploads {"
echo "       alias /root/dcc_webiste_crm/public/uploads;"
echo "       expires 30d;"
echo "       add_header Cache-Control \"public\";"
echo "       access_log off;"
echo "   }"
echo ""
echo "4. Test and reload:"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""














