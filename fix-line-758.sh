#!/bin/bash
# Script to fix line 758 in app/admin/home/page.jsx on the server

FILE="app/admin/home/page.jsx"
LINE_NUM=758

# Backup the file first
cp "$FILE" "${FILE}.backup"

# Use sed to fix the corrupted line
# Replace any variation of classNamflex with the correct className="h-32 flex items-center justify-center text-gray-400"
sed -i "${LINE_NUM}s/.*/                      <div className=\"h-32 flex items-center justify-center text-gray-400\">No image<\/div>/" "$FILE"

echo "Fixed line 758 in $FILE"
echo "Backup saved to ${FILE}.backup"
echo "Please verify the fix and rebuild"








