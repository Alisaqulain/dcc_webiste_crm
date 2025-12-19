#!/bin/bash
# Quick script to check KVM server resources
# Usage: bash check-kvm-resources.sh

echo "=========================================="
echo "KVM Server Resource Check"
echo "=========================================="
echo ""

echo "=== DISK USAGE ==="
df -h | grep -E '^/dev/|Filesystem'
echo ""

echo "=== INODE USAGE ==="
df -i | grep -E '^/dev/|Filesystem'
echo ""

echo "=== MEMORY USAGE ==="
free -h
echo ""

echo "=== CPU LOAD ==="
uptime
echo ""

echo "=== TOP 10 LARGEST DIRECTORIES IN /var/www ==="
if [ -d "/var/www" ]; then
    du -h /var/www 2>/dev/null | sort -rh | head -10
else
    echo "Directory /var/www not found"
fi
echo ""

echo "=== TOP 10 LARGEST DIRECTORIES IN HOME ==="
du -h ~ 2>/dev/null | sort -rh | head -10
echo ""

echo "=== PROJECT DIRECTORY CHECK ==="
# Try to find Next.js project
PROJECT_DIRS=(
    "/var/www"
    "$HOME"
    "$HOME/projects"
    "/opt"
)

for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Checking $dir for Next.js projects..."
        find "$dir" -maxdepth 2 -name "package.json" -type f 2>/dev/null | while read pkg; do
            proj_dir=$(dirname "$pkg")
            echo "  Found: $proj_dir"
            if [ -d "$proj_dir/public" ]; then
                echo "    Upload directories:"
                du -sh "$proj_dir/public/uploads" 2>/dev/null || echo "      uploads: not found"
                du -sh "$proj_dir/public/videos" 2>/dev/null || echo "      videos: not found"
                du -sh "$proj_dir/public/thumbnails" 2>/dev/null || echo "      thumbnails: not found"
            fi
        done
    fi
done
echo ""

echo "=== LARGE FILES (>100MB) ==="
find /var/www /home /opt -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -10
echo ""

echo "=== SYSTEM INFO ==="
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo ""

echo "=========================================="
echo "Check complete!"
echo "=========================================="
echo ""
echo "If disk usage is above 80%, consider:"
echo "1. Increasing disk size (see KVM_STORAGE_INCREASE_GUIDE.md)"
echo "2. Cleaning old files"
echo "3. Archiving old uploads"
echo "4. Removing unused packages: sudo apt-get clean && sudo apt-get autoremove"

