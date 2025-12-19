#!/bin/bash
# Quick fix for app/page.js line 675 - Image component closing
# Run on KVM: bash fix-page-675-quick.sh

cd ~/dcc_webiste_crm

echo "Fixing app/page.js line 675..."

# Backup
cp app/page.js app/page.js.backup

# Fix: Replace standalone > on line 675 with />
# Method 1: Direct line replacement
sed -i '675s/^[[:space:]]*>$/                    \/>/' app/page.js

# Method 2: If that doesn't work, fix the pattern around the Image component
# Find the style line and ensure the next line has />
perl -i -pe 'if (/style=\{\{ filter: "drop-shadow\(0 8px 16px rgba\(0,0,0,0\.3\)\)" \}\}/) { 
    $_ .= ""; 
    $next = <>; 
    if ($next =~ /^\s*>$/) { 
        $next = "                    \/>\n"; 
    } 
    print $_ . $next; 
} else { 
    print; 
}' app/page.js

# Verify
echo "Checking line 675:"
sed -n '674,676p' app/page.js

echo ""
echo "If line 675 shows '/>', the fix worked!"
echo "Now run: npm run build"


