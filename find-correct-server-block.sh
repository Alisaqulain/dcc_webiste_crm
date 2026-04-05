#!/bin/bash

# Find which server block has /uploads and show the solution

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"

echo "=========================================="
echo "Finding Correct Server Block"
echo "=========================================="
echo ""

# Find all server blocks
echo "1. All server blocks in config:"
grep -n "^server {" "$NGINX_CONFIG"
echo ""

# Find which server block contains /uploads
echo "2. Server block that contains /uploads:"
grep -B 30 "location /uploads" "$NGINX_CONFIG" | grep "^server {" | tail -1
echo ""

# Show the server block with /uploads
echo "3. Full server block with /uploads:"
# Find line number of server block containing /uploads
UPLOADS_LINE=$(grep -n "location /uploads" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
SERVER_LINES=$(grep -n "^server {" "$NGINX_CONFIG" | cut -d: -f1)

# Find which server block this belongs to
PREV_SERVER=0
for line in $SERVER_LINES; do
    if [ "$line" -lt "$UPLOADS_LINE" ]; then
        PREV_SERVER=$line
    fi
done

if [ "$PREV_SERVER" -gt 0 ]; then
    echo "   Server block starts at line: $PREV_SERVER"
    echo ""
    # Show from server block start to next server block or end
    NEXT_SERVER=$(echo "$SERVER_LINES" | awk -v prev="$PREV_SERVER" '$1 > prev {print $1; exit}')
    if [ -n "$NEXT_SERVER" ]; then
        sed -n "${PREV_SERVER},$((NEXT_SERVER-1))p" "$NGINX_CONFIG" | head -50
    else
        sed -n "${PREV_SERVER},\$p" "$NGINX_CONFIG" | head -50
    fi
fi
echo ""

echo "=========================================="
echo "FIX: Remove Duplicate Server Block"
echo "=========================================="
echo ""
echo "1. Edit config:"
echo "   sudo nano $NGINX_CONFIG"
echo ""
echo "2. Find and REMOVE the server block that does NOT have /uploads"
echo ""
echo "3. Keep ONLY the server block that has:"
echo "   - location /uploads { ... }"
echo "   - location / { proxy_pass ... }"
echo ""
echo "4. Test and reload:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""

