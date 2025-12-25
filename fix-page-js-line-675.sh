#!/bin/bash
# Fix app/page.js line 675 - Image component closing tag
# Run on KVM server: bash fix-page-js-line-675.sh

cd ~/dcc_webiste_crm || exit 1

echo "Fixing app/page.js line 675..."

# Backup
cp app/page.js app/page.js.backup.$(date +%Y%m%d_%H%M%S)

# Fix line 675 - ensure Image component is properly closed
# Replace standalone > with />
sed -i '675s/^[[:space:]]*>$/                    \/>/' app/page.js

# Also fix any other instances where Image might not be closed properly
sed -i 's/style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}\s*>\s*$/style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}\n                    \/>/' app/page.js

# Verify the fix
if grep -A1 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' app/page.js | grep -q '/>'; then
    echo "✓ Fixed app/page.js line 675"
else
    echo "⚠ Warning: Could not verify fix. Checking line 675:"
    sed -n '674,676p' app/page.js
fi

echo ""
echo "Now run: npm run build"







