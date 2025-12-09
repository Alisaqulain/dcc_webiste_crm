#!/bin/bash

# Next.js 15 to 12 Downgrade Script
# Run this script to downgrade your project

echo "🚀 Starting Next.js 15 to 12 downgrade..."

# Step 1: Clean old dependencies
echo "📦 Step 1: Cleaning old dependencies..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
rm -f yarn.lock

# Step 2: Install Next.js 12
echo "📦 Step 2: Installing Next.js 12 and dependencies..."
npm install

# Step 3: Verify installation
echo "✅ Step 3: Verifying installation..."
npm list next

echo ""
echo "✅ Downgrade complete!"
echo ""
echo "⚠️  IMPORTANT WARNINGS:"
echo "1. This project uses App Router (app/ directory) which is NOT supported in Next.js 12"
echo "2. Next.js 12 only supports Pages Router (pages/ directory)"
echo "3. You will need to migrate from App Router to Pages Router for this to work"
echo ""
echo "📝 Next steps:"
echo "1. Test the build: npm run build"
echo "2. If build fails, you'll need to migrate to Pages Router"
echo "3. Check for any other Next.js 15-specific features in your code"
echo ""
echo "🔧 To test locally:"
echo "   npm run dev"

