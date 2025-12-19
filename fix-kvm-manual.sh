#!/bin/bash
# Manual Fix Script for KVM Server - NO GIT PULL
# Run this script on your KVM server: bash fix-kvm-manual.sh

set -e  # Exit on error

echo "========================================="
echo "KVM Manual Build Fix Script"
echo "Fixing files directly on server (NO GIT PULL)"
echo "========================================="

# Get the project directory
PROJECT_DIR="${1:-~/dcc_webiste_crm}"
cd "$PROJECT_DIR" || { echo "Error: Cannot access $PROJECT_DIR"; exit 1; }

echo "Current directory: $(pwd)"
echo ""

# Fix 1: Fix line 758 in app/admin/home/page.jsx
echo "Fix 1: Fixing app/admin/home/page.jsx line 758..."
if [ -f "app/admin/home/page.jsx" ]; then
    # Backup the file
    cp app/admin/home/page.jsx app/admin/home/page.jsx.backup.$(date +%Y%m%d_%H%M%S)
    
    # Fix the corrupted className (classNamflex -> className="h-32 flex...")
    sed -i '758s/.*/                      <div className="h-32 flex items-center justify-center text-gray-400">No image<\/div>/' app/admin/home/page.jsx
    
    # Verify the fix
    if grep -q 'className="h-32 flex items-center justify-center text-gray-400"' app/admin/home/page.jsx; then
        echo "✓ Fixed app/admin/home/page.jsx line 758"
    else
        echo "⚠ Warning: Could not verify fix for app/admin/home/page.jsx"
    fi
else
    echo "✗ Error: app/admin/home/page.jsx not found"
    exit 1
fi
echo ""

# Fix 2: Fix app/page.js - multiple fixes
echo "Fix 2: Fixing app/page.js..."
if [ -f "app/page.js" ]; then
    # Backup the file
    cp app/page.js app/page.js.backup.$(date +%Y%m%d_%H%M%S)
    
    # Fix 2a: Remove double << characters
    sed -i 's/<<h3/<h3/g' app/page.js
    sed -i 's/<<div/<div/g' app/page.js
    sed -i 's/<<\/div/<\/div/g' app/page.js
    sed -i 's/<<Image/<Image/g' app/page.js
    sed -i 's/<<\/Image/<\/Image/g' app/page.js
    
    # Fix 2b: Fix line 675 - ensure Image component is properly closed with />
    # If line 675 is just ">" after the style prop, replace with "/>"
    sed -i '675s/^[[:space:]]*>$/                    \/>/' app/page.js
    
    # Fix 2c: Fix Image closing tag pattern - ensure /> is on same or next line after style
    # This handles cases where > is on a separate line
    perl -i -pe 's/(style=\{\{ filter: "drop-shadow\(0 8px 16px rgba\(0,0,0,0\.3\)\)" \}\})\s*\n\s*>/$1\n                    \/>/g' app/page.js
    
    # Check if there are still any << characters
    if grep -q '<<' app/page.js; then
        echo "⚠ Warning: Still found << characters in app/page.js at lines:"
        grep -n '<<' app/page.js | head -5
    else
        echo "✓ Fixed app/page.js (removed all << characters)"
    fi
    
    # Verify Image closing tag
    if grep -A2 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' app/page.js | grep -q '/>'; then
        echo "✓ Fixed Image component closing tag"
    else
        echo "⚠ Warning: Could not verify Image closing tag fix"
    fi
else
    echo "✗ Error: app/page.js not found"
    exit 1
fi
echo ""

# Fix 3: Fix tailwind.config.mjs - convert to ES modules
echo "Fix 3: Fixing tailwind.config.mjs..."
if [ -f "tailwind.config.mjs" ]; then
    # Backup the file
    cp tailwind.config.mjs tailwind.config.mjs.backup.$(date +%Y%m%d_%H%M%S)
    
    # Convert module.exports to export default
    if grep -q "module.exports" tailwind.config.mjs && ! grep -q "export default" tailwind.config.mjs; then
        sed -i 's/module.exports =/export default/' tailwind.config.mjs
        echo "✓ Fixed tailwind.config.mjs (converted to ES modules)"
    else
        echo "✓ tailwind.config.mjs is already correct"
    fi
else
    echo "⚠ Warning: tailwind.config.mjs not found"
fi
echo ""

# Fix 4: Verify next.config.mjs structure
echo "Fix 4: Verifying next.config.mjs..."
if [ -f "next.config.mjs" ]; then
    if grep -q "domains:" next.config.mjs && ! grep -q "remotePatterns:" next.config.mjs; then
        echo "⚠ Warning: next.config.mjs still uses deprecated 'domains'"
        echo "  This is just a warning and won't break the build"
    else
        echo "✓ next.config.mjs looks good"
    fi
else
    echo "⚠ Warning: next.config.mjs not found"
fi
echo ""

# Step 5: Install dependencies (if needed)
echo "Step 5: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 6: Build the project
echo "Step 6: Building the project..."
echo "This may take a few minutes..."
echo ""

if npm run build 2>&1 | tee build.log; then
    echo ""
    echo "========================================="
    echo "✓ BUILD SUCCESSFUL!"
    echo "========================================="
    echo ""
    echo "Backup files created:"
    ls -lh *.backup.* 2>/dev/null || echo "  (backups in file directories)"
    echo ""
    echo "Next steps:"
    echo "1. Restart your application:"
    echo "   pm2 restart all"
    echo "   OR"
    echo "   systemctl restart your-app-service"
    echo ""
    echo "2. Check the website to verify everything works"
    echo ""
    rm -f build.log
    exit 0
else
    BUILD_ERROR=$?
    echo ""
    echo "========================================="
    echo "✗ BUILD FAILED!"
    echo "========================================="
    echo ""
    echo "Check build.log for details:"
    echo "  tail -50 build.log"
    echo ""
    echo "Backup files were created. To restore:"
    echo "  cp app/admin/home/page.jsx.backup.* app/admin/home/page.jsx"
    echo "  cp app/page.js.backup.* app/page.js"
    echo ""
    exit $BUILD_ERROR
fi

