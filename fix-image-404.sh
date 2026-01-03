#!/bin/bash

# Fix Image 404 Errors - Diagnostic and Fix Script
# This script checks if images exist and provides fixes for web server configuration

echo "=========================================="
echo "Image 404 Error Diagnostic & Fix Script"
echo "=========================================="
echo ""

# Get project directory
PROJECT_DIR=$(pwd)
echo "Project directory: $PROJECT_DIR"
echo ""

# Check if uploads directory exists
UPLOADS_DIR="$PROJECT_DIR/public/uploads"
echo "Checking uploads directory..."
if [ -d "$UPLOADS_DIR" ]; then
    echo "✅ Uploads directory exists: $UPLOADS_DIR"
    FILE_COUNT=$(ls -1 "$UPLOADS_DIR" 2>/dev/null | wc -l)
    echo "   Files found: $FILE_COUNT"
    
    # List first 5 files
    echo "   Sample files:"
    ls -lh "$UPLOADS_DIR" | head -6 | tail -5 | awk '{print "   - " $9 " (" $5 ")"}'
else
    echo "❌ Uploads directory NOT found: $UPLOADS_DIR"
    echo "   Creating directory..."
    mkdir -p "$UPLOADS_DIR"
    chmod 755 "$UPLOADS_DIR"
    echo "   ✅ Directory created"
fi
echo ""

# Check specific file mentioned in error
ERROR_FILE="1766146116916-adas.jpeg"
if [ -f "$UPLOADS_DIR/$ERROR_FILE" ]; then
    echo "✅ Error file exists: $ERROR_FILE"
    ls -lh "$UPLOADS_DIR/$ERROR_FILE"
else
    echo "❌ Error file NOT found: $ERROR_FILE"
    echo "   This file may have been deleted or never uploaded successfully"
fi
echo ""

# Check Next.js config
echo "Checking Next.js configuration..."
if [ -f "$PROJECT_DIR/next.config.mjs" ]; then
    if grep -q "output.*standalone" "$PROJECT_DIR/next.config.mjs"; then
        echo "⚠️  Next.js is using 'standalone' output mode"
        echo "   This means your web server (Nginx/Apache) must serve static files"
    else
        echo "✅ Next.js will serve static files directly"
    fi
else
    echo "⚠️  next.config.mjs not found"
fi
echo ""

# Check web server
echo "Checking web server..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx is installed"
    NGINX_CONF="/etc/nginx/sites-available/digitalcareercenter.com"
    if [ -f "$NGINX_CONF" ]; then
        echo "   Found config: $NGINX_CONF"
        if grep -q "location /uploads" "$NGINX_CONF"; then
            echo "   ✅ /uploads location block found"
        else
            echo "   ❌ /uploads location block NOT found - THIS IS THE PROBLEM!"
        fi
    else
        echo "   ⚠️  Nginx config not found at $NGINX_CONF"
        echo "   Checking default location..."
        NGINX_DEFAULT="/etc/nginx/sites-available/default"
        if [ -f "$NGINX_DEFAULT" ]; then
            echo "   Found: $NGINX_DEFAULT"
        fi
    fi
elif command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo "✅ Apache is installed"
else
    echo "⚠️  No web server detected (Nginx/Apache)"
    echo "   Next.js is serving directly on port 3000"
fi
echo ""

# Check if Next.js is running
echo "Checking Next.js process..."
if pgrep -f "next" > /dev/null; then
    echo "✅ Next.js process is running"
    ps aux | grep -E "next|node" | grep -v grep | head -3
else
    echo "⚠️  Next.js process not found"
fi
echo ""

# Check file permissions
echo "Checking file permissions..."
if [ -d "$UPLOADS_DIR" ]; then
    PERMS=$(stat -c "%a" "$UPLOADS_DIR" 2>/dev/null || stat -f "%OLp" "$UPLOADS_DIR" 2>/dev/null)
    echo "   Uploads directory permissions: $PERMS"
    if [ "$PERMS" != "755" ] && [ "$PERMS" != "775" ]; then
        echo "   ⚠️  Permissions should be 755 or 775"
    fi
fi
echo ""

echo "=========================================="
echo "RECOMMENDED FIXES"
echo "=========================================="
echo ""
echo "Option 1: Configure Nginx to serve /uploads (RECOMMENDED)"
echo "--------------------------------------------------------"
echo "Add this to your Nginx config file:"
echo ""
echo "  location /uploads {"
echo "      alias $PROJECT_DIR/public/uploads;"
echo "      expires 30d;"
echo "      add_header Cache-Control \"public\";"
echo "      access_log off;"
echo "  }"
echo ""
echo "Then reload Nginx:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""

echo "Option 2: Let Next.js serve all static files"
echo "--------------------------------------------------------"
echo "If you can't modify Nginx, ensure Next.js serves static files:"
echo "  1. Make sure 'output: standalone' is NOT in next.config.mjs"
echo "  2. Rebuild: npm run build"
echo "  3. Restart: pm2 restart all (or your process manager)"
echo ""

echo "Option 3: Quick test - Check if file is accessible"
echo "--------------------------------------------------------"
echo "Test if the file exists and is readable:"
echo "  ls -lh $UPLOADS_DIR/1766146116916-adas.jpeg"
echo "  curl -I http://localhost:3000/uploads/1766146116916-adas.jpeg"
echo ""

echo "=========================================="
echo "Script completed!"
echo "=========================================="








