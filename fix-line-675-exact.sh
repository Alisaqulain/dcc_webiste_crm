#!/bin/bash
# EXACT FIX for app/page.js line 675
# This will definitely fix the issue

cd ~/dcc_webiste_crm || exit 1

echo "Fixing app/page.js line 675..."
echo ""

# Backup
cp app/page.js app/page.js.backup

# Method 1: Direct replacement of line 675
# Replace whatever is on line 675 with the correct closing tag
sed -i '675c\                    />' app/page.js

# Method 2: If Method 1 doesn't work, use this pattern replacement
# This finds the style line and ensures the next line has />
perl -0777 -i -pe 's/(style=\{\{ filter: "drop-shadow\(0 8px 16px rgba\(0,0,0,0\.3\)\)" \}\})\s*\n\s*>/$1\n                    \/>/g' app/page.js

# Verify
echo "Checking lines 674-676:"
sed -n '674,676p' app/page.js
echo ""

# Check if fix worked
if grep -A1 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' app/page.js | grep -q '/>'; then
    echo "✓ SUCCESS! Line 675 is now fixed with />"
    echo ""
    echo "Now run: npm run build"
else
    echo "✗ Fix may not have worked. Showing lines 674-676:"
    sed -n '674,676p' app/page.js
    echo ""
    echo "Try manual fix with nano (see FIX_LINE_675.txt)"
fi







