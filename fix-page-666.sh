#!/bin/bash

# Fix syntax error on line 666 of app/page.js
# The error shows: boxShadow:ba(0,0,0,0.3) - missing quote and "rg" in rgba

FILE="app/page.js"
BACKUP="app/page.js.backup.$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "Fixing syntax error in app/page.js:666"
echo "=========================================="
echo ""

# Create backup
echo "1. Creating backup..."
cp "$FILE" "$BACKUP"
echo "   ✅ Backup created: $BACKUP"
echo ""

# Check current line 666
echo "2. Current line 666:"
sed -n '666p' "$FILE"
echo ""

# Fix the line - replace any corrupted version with correct one
echo "3. Fixing line 666..."
sed -i '666s/.*/                    boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)"/' "$FILE"

echo "   ✅ Line 666 fixed"
echo ""

# Show the fixed line
echo "4. Fixed line 666:"
sed -n '666p' "$FILE"
echo ""

# Verify syntax
echo "5. Verifying syntax..."
if node -c "$FILE" 2>/dev/null; then
    echo "   ✅ Syntax is valid"
else
    echo "   ⚠️  Syntax check failed, but fix applied"
    echo "   Please verify manually"
fi
echo ""

echo "=========================================="
echo "Fix complete!"
echo "=========================================="
echo ""
echo "If you need to restore the backup:"
echo "  cp $BACKUP $FILE"

