#!/bin/bash
# Script to fix build errors on KVM server
# Run this script on your KVM server: bash fix-kvm-build.sh

set -e  # Exit on error

echo "========================================="
echo "KVM Build Fix Script"
echo "========================================="

# Get the project directory (adjust if needed)
PROJECT_DIR="${1:-~/dcc_webiste_crm}"
cd "$PROJECT_DIR" || { echo "Error: Cannot access $PROJECT_DIR"; exit 1; }

echo "Current directory: $(pwd)"
echo ""

# Manual fixes for known issues (NO GIT PULL)
echo "Step 1: Applying manual fixes..."

# Fix 1: Fix line 758 in app/admin/home/page.jsx
echo "Fixing app/admin/home/page.jsx line 758..."
if [ -f "app/admin/home/page.jsx" ]; then
    # Backup the file
    cp app/admin/home/page.jsx app/admin/home/page.jsx.backup
    
    # Fix the corrupted className
    sed -i '758s/.*/                      <div className="h-32 flex items-center justify-center text-gray-400">No image<\/div>/' app/admin/home/page.jsx
    
    # Verify the fix
    if grep -q 'className="h-32 flex items-center justify-center text-gray-400"' app/admin/home/page.jsx; then
        echo "✓ Fixed app/admin/home/page.jsx line 758"
    else
        echo "⚠ Warning: Could not verify fix for app/admin/home/page.jsx"
    fi
else
    echo "⚠ Warning: app/admin/home/page.jsx not found"
fi
echo ""

# Fix 2: Fix app/page.js line 677 (if corrupted)
echo "Fixing app/page.js line 677..."
if [ -f "app/page.js" ]; then
    # Backup the file
    cp app/page.js app/page.js.backup
    
    # Fix any double << characters
    sed -i 's/<<h3/<h3/g' app/page.js
    sed -i 's/<<div/<div/g' app/page.js
    sed -i 's/<<\/div/<\/div/g' app/page.js
    
    # Ensure proper structure around line 677
    if grep -q '<<' app/page.js; then
        echo "⚠ Warning: Still found << characters in app/page.js"
    else
        echo "✓ Fixed app/page.js"
    fi
else
    echo "⚠ Warning: app/page.js not found"
fi
echo ""

# Fix 3: Verify tailwind.config.mjs uses ES modules
echo "Verifying tailwind.config.mjs..."
if [ -f "tailwind.config.mjs" ]; then
    if grep -q "module.exports" tailwind.config.mjs && ! grep -q "export default" tailwind.config.mjs; then
        echo "Fixing tailwind.config.mjs to use ES modules..."
        sed -i 's/module.exports =/export default/' tailwind.config.mjs
        echo "✓ Fixed tailwind.config.mjs"
    else
        echo "✓ tailwind.config.mjs is already correct"
    fi
else
    echo "⚠ Warning: tailwind.config.mjs not found"
fi
echo ""

# Fix 4: Verify next.config.mjs uses remotePatterns
echo "Verifying next.config.mjs..."
if [ -f "next.config.mjs" ]; then
    if grep -q "domains:" next.config.mjs && ! grep -q "remotePatterns:" next.config.mjs; then
        echo "⚠ Warning: next.config.mjs still uses deprecated 'domains'. Please update manually."
    else
        echo "✓ next.config.mjs looks good"
    fi
else
    echo "⚠ Warning: next.config.mjs not found"
fi
echo ""

# Step 3: Install dependencies (if needed)
echo "Step 3: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 4: Build the project
echo "Step 4: Building the project..."
echo "This may take a few minutes..."
if npm run build; then
    echo ""
    echo "========================================="
    echo "✓ Build successful!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Restart your application (if using PM2: pm2 restart all)"
    echo "2. Check the website to verify everything works"
    echo ""
else
    echo ""
    echo "========================================="
    echo "✗ Build failed!"
    echo "========================================="
    echo ""
    echo "Please check the error messages above."
    echo "Backup files were created:"
    echo "  - app/admin/home/page.jsx.backup"
    echo "  - app/page.js.backup"
    echo ""
    exit 1
fi

