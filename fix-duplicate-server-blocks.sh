#!/bin/bash

# Fix duplicate server blocks causing /uploads to not work
# The issue: Multiple server blocks with same server_name

set -e

NGINX_CONFIG="/etc/nginx/sites-available/digitalcareercenter.com"

echo "=========================================="
echo "Fixing Duplicate Server Blocks"
echo "=========================================="
echo ""

# 1. Backup
echo "1. Creating backup..."
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"
echo ""

# 2. Show all server blocks
echo "2. Finding all server blocks..."
echo ""
echo "   Server blocks in config:"
grep -n "server {" "$NGINX_CONFIG" | head -10
echo ""

# 3. Check which server block has /uploads
echo "3. Checking which server block has /uploads location..."
echo ""

# Count server blocks
SERVER_COUNT=$(grep -c "^server {" "$NGINX_CONFIG" || echo "0")
echo "   Found $SERVER_COUNT server block(s)"
echo ""

# Find which server block contains /uploads
if grep -q "location /uploads" "$NGINX_CONFIG"; then
    echo "   ✅ /uploads block found in config"
    
    # Find line numbers
    SERVER_LINES=$(grep -n "^server {" "$NGINX_CONFIG" | cut -d: -f1)
    UPLOADS_LINE=$(grep -n "location /uploads" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    
    echo "   /uploads block at line: $UPLOADS_LINE"
    echo "   Server blocks at lines: $SERVER_LINES"
    
    # Determine which server block contains /uploads
    UPLOADS_SERVER=0
    for server_line in $SERVER_LINES; do
        if [ "$UPLOADS_LINE" -gt "$server_line" ]; then
            UPLOADS_SERVER=$server_line
        fi
    done
    
    if [ "$UPLOADS_SERVER" -gt 0 ]; then
        echo "   /uploads is in server block starting at line: $UPLOADS_SERVER"
    fi
else
    echo "   ❌ /uploads block NOT found!"
fi
echo ""

# 4. Show the actual server blocks
echo "4. Showing server blocks from config..."
echo ""
echo "   First server block:"
sed -n '/^server {/,/^}/p' "$NGINX_CONFIG" | head -30
echo ""

if [ "$SERVER_COUNT" -gt 1 ]; then
    echo "   ⚠️  Multiple server blocks detected!"
    echo "   This is causing the conflict."
    echo ""
    echo "   Second server block:"
    # Get second server block
    awk '/^server {/{count++; if(count==2) flag=1} flag; /^}/{if(flag && count==2) exit}' "$NGINX_CONFIG" | head -30
    echo ""
fi
echo ""

# 5. Solution
echo "=========================================="
echo "SOLUTION"
echo "=========================================="
echo ""
echo "You have multiple server blocks. Nginx uses the FIRST one."
echo ""
echo "Options:"
echo ""
echo "Option 1: Remove duplicate server block (Recommended)"
echo "  1. Edit config: sudo nano $NGINX_CONFIG"
echo "  2. Remove the duplicate server block"
echo "  3. Keep only ONE server block with /uploads location"
echo ""
echo "Option 2: Merge server blocks"
echo "  Combine both server blocks into one"
echo ""
echo "To see all server blocks:"
echo "  grep -n 'server {' $NGINX_CONFIG"
echo ""
echo "To see which one has /uploads:"
echo "  grep -B 20 'location /uploads' $NGINX_CONFIG | grep 'server {' | tail -1"
echo ""

