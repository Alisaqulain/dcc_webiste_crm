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

# Fix 5: Verify certificate download routes exist (for 404 fixes)
echo "Verifying certificate download routes..."
CERT_CATCH_ALL="app/certificate/download/[...params]/page.jsx"
CERT_SINGLE="app/certificate/download/[rollNumber]/page.jsx"
CERT_TYPE_ID="app/certificate/download/[type]/[id]/page.jsx"
CERT_API="app/api/certificate/[rollNumber]/route.js"

# Check for conflicting routes
CONFLICTING_ROUTES=0
if [ -f "$CERT_SINGLE" ]; then
    echo "⚠ Warning: Conflicting route found: $CERT_SINGLE"
    echo "  This conflicts with catch-all route. Should be removed."
    CONFLICTING_ROUTES=1
fi

if [ -f "$CERT_TYPE_ID" ]; then
    echo "⚠ Warning: Conflicting route found: $CERT_TYPE_ID"
    echo "  This conflicts with catch-all route. Should be removed."
    CONFLICTING_ROUTES=1
fi

if [ -f "$CERT_CATCH_ALL" ]; then
    echo "✓ Certificate catch-all route exists (handles /certificate/download/Dt/1 and /certificate/download/123)"
else
    echo "⚠ Warning: Certificate catch-all route missing: $CERT_CATCH_ALL"
    echo "  This may cause 404 errors for multi-segment roll numbers"
fi

if [ -f "$CERT_API" ]; then
    # Check if API route handles URL decoding
    if grep -q "decodeURIComponent" "$CERT_API"; then
        echo "✓ Certificate API route handles URL decoding"
    else
        echo "⚠ Warning: Certificate API route may not handle URL-encoded roll numbers"
    fi
else
    echo "⚠ Warning: Certificate API route missing: $CERT_API"
fi

if [ $CONFLICTING_ROUTES -eq 1 ]; then
    echo ""
    echo "⚠ CRITICAL: Conflicting routes detected!"
    echo "  Next.js cannot have different slug names at the same path level."
    echo "  Please remove conflicting routes and keep only the catch-all route."
    echo ""
    # Clear Next.js cache to remove conflicting route definitions
    if [ -d ".next" ]; then
        echo "Clearing Next.js cache to remove conflicting route definitions..."
        rm -rf .next
        echo "✓ Cleared .next cache"
        echo ""
    fi
fi
echo ""

# Fix 6: Check for common routing issues
echo "Checking for common routing issues..."
if [ -d ".next" ]; then
    echo "✓ Build directory exists"
    if [ -d ".next/server/app" ]; then
        echo "✓ App router build output exists"
    else
        echo "⚠ Warning: App router build output not found - routes may not be built correctly"
    fi
else
    echo "⚠ Warning: .next directory not found - project needs to be built"
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
    
    # Verify routes were built
    echo "Verifying built routes..."
    if [ -d ".next/server/app/certificate/download" ]; then
        echo "✓ Certificate download routes built successfully"
    else
        echo "⚠ Warning: Certificate download routes not found in build output"
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Restart your application (if using PM2: pm2 restart all)"
    echo "2. Check the website to verify everything works"
    echo "3. Test certificate download: https://www.digitalcareercenter.com/certificate/download/Dt/1"
    echo ""
    echo "========================================="
    echo "404 Error Troubleshooting"
    echo "========================================="
    echo ""
    echo "If you still see 404 errors after build:"
    echo ""
    echo "1. Server Configuration (nginx/apache):"
    echo "   - Ensure all routes are proxied to Next.js (port 3000 or your app port)"
    echo "   - Check that try_files directive includes index.html fallback"
    echo "   - Verify rewrite rules for Next.js App Router"
    echo ""
    echo "2. Next.js Configuration:"
    echo "   - Verify output: 'standalone' is NOT set in next.config.mjs (for production)"
    echo "   - Check that all route files exist in app/ directory"
    echo "   - Ensure API routes are in app/api/ directory"
    echo ""
    echo "3. Common 404 Causes:"
    echo "   - Missing catch-all routes for multi-segment URLs"
    echo "   - Incorrect route file naming (must be page.jsx or page.js)"
    echo "   - Server not restarting after build"
    echo "   - Cached routes in browser/server"
    echo ""
    echo "4. Quick Fixes:"
    echo "   - Clear browser cache"
    echo "   - Restart Next.js server: pm2 restart all"
    echo "   - Check .next/server/app for built routes"
    echo "   - Verify certificate route: ls -la .next/server/app/certificate/download/"
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

