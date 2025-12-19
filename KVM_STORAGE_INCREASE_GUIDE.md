# How to Increase KVM Storage Size and Check Resources

## Step 1: Check Current Disk Usage

SSH into your KVM server and check disk space:

```bash
# Check disk usage
df -h

# Check specific directory sizes
du -sh /var/www/*  # If your project is in /var/www
du -sh ~/*         # If your project is in home directory

# Check your project directory
cd /path/to/your/project
du -sh public/uploads
du -sh public/videos
```

## Step 2: Check CPU Usage

```bash
# Check CPU usage
top
# or
htop  # if installed

# Check system load
uptime

# Check memory usage
free -h
```

## Step 3: Increase KVM Disk Size

### Option A: If you have access to KVM host (Proxmox, Virtualizor, etc.)

#### For Proxmox:
1. **Shutdown the VM** (or use online resize if supported)
2. Go to Proxmox web interface
3. Select your VM → Hardware → Hard Disk
4. Click "Resize disk"
5. Enter new size (e.g., increase from 20GB to 50GB)
6. Start the VM

#### For Virtualizor:
1. **Shutdown the VM**
2. Go to Virtualizor panel
3. Select VM → Storage → Resize
4. Enter new size
5. Start the VM

#### For other KVM managers:
- Check your hosting panel for "Resize Disk" or "Expand Storage" option
- If using command line: `qemu-img resize /path/to/disk.img +30G`

### Option B: If you're using a VPS provider (DigitalOcean, Linode, Vultr, etc.)

1. **Take a snapshot** (backup first!)
2. Go to your provider's dashboard
3. Find "Resize" or "Upgrade" option
4. Select larger disk size
5. Confirm and wait for resize to complete

## Step 4: Expand Filesystem After Disk Resize

After increasing disk size, you need to expand the filesystem:

### For ext4 filesystem (most common):

```bash
# 1. Check current partition
lsblk
# or
fdisk -l

# 2. Resize partition (if using LVM)
# Check if using LVM:
pvdisplay
vgdisplay
lvdisplay

# If using LVM:
pvresize /dev/sda2  # Adjust device name
lvextend -l +100%FREE /dev/your-vg/your-lv
resize2fs /dev/your-vg/your-lv

# If NOT using LVM (direct partition):
# Resize partition using growpart:
growpart /dev/sda 1  # Adjust device and partition number
resize2fs /dev/sda1  # Adjust partition

# 3. Verify new size
df -h
```

### For XFS filesystem:

```bash
# Check filesystem type
df -T

# If XFS:
xfs_growfs /
```

### Automated script (safer):

```bash
# Install cloud-utils if not installed
sudo apt-get update
sudo apt-get install -y cloud-utils

# Auto-resize (works for most setups)
sudo growpart /dev/sda 1  # Adjust device/partition
sudo resize2fs /dev/sda1  # Adjust partition
```

## Step 5: Verify and Clean Up

```bash
# Check new disk size
df -h

# Check if there are large files taking space
du -h / | sort -rh | head -20

# Clean up old logs (if needed)
sudo journalctl --vacuum-time=7d  # Keep only 7 days of logs

# Clean package cache (if needed)
sudo apt-get clean
sudo apt-get autoremove
```

## Step 6: Check Your Application Directories

```bash
# Navigate to your project
cd /path/to/dcc_webiste_crm

# Check upload directories
du -sh public/uploads
du -sh public/videos
du -sh public/thumbnails

# If directories are large, consider:
# - Moving old files to archive
# - Setting up automatic cleanup
# - Using external storage (S3, etc.)
```

## Step 7: Monitor Resources

Set up monitoring to prevent future issues:

```bash
# Create a simple monitoring script
cat > ~/check_resources.sh << 'EOF'
#!/bin/bash
echo "=== Disk Usage ==="
df -h | grep -E '^/dev/'
echo ""
echo "=== Top 10 Largest Directories ==="
du -h /var/www 2>/dev/null | sort -rh | head -10
echo ""
echo "=== CPU Load ==="
uptime
echo ""
echo "=== Memory Usage ==="
free -h
EOF

chmod +x ~/check_resources.sh

# Run it
./check_resources.sh
```

## Common Issues and Solutions

### Issue: "No space left on device" but df shows space available
**Solution:** Check inodes:
```bash
df -i
# If inodes are full, delete small files or increase inode count
```

### Issue: Can't resize partition
**Solution:** 
- Make sure VM is shut down (or use online resize)
- Check if partition is at end of disk
- Use `parted` for GPT partitions: `parted /dev/sda resizepart 1 100%`

### Issue: Filesystem resize fails
**Solution:**
- Boot from rescue mode if needed
- Use `e2fsck -f /dev/sda1` to check filesystem first
- Then resize: `resize2fs /dev/sda1`

## Prevention Tips

1. **Set up disk usage alerts:**
```bash
# Add to crontab (crontab -e):
0 * * * * df -h | awk '$5 > 80 {print "WARNING: Disk usage above 80%"}'
```

2. **Regular cleanup:**
   - Remove old log files
   - Archive old uploads
   - Clean package cache

3. **Monitor upload directories:**
   - Set size limits per user
   - Implement automatic cleanup of old files
   - Consider external storage for large files

## Quick Commands Reference

```bash
# Check everything at once
df -h && echo "---" && free -h && echo "---" && uptime

# Find large files
find /var/www -type f -size +100M -exec ls -lh {} \;

# Check specific project
du -sh /path/to/project/* | sort -rh | head -10
```

## Important Notes

⚠️ **Always backup before resizing!**
⚠️ **Shutdown VM if possible (safer)**
⚠️ **Test in staging environment first if possible**
⚠️ **Monitor during and after resize**

## If You Don't Have Root Access

If you're on shared hosting or don't have root access:
1. Contact your hosting provider
2. Request disk space increase
3. They will handle the resize
4. You may need to upgrade your plan

