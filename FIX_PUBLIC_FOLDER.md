# Fix Public Folder on KVM Server

## The Problem
The `public/` folder doesn't exist, so photo uploads are failing.

## Quick Fix

### Step 1: Navigate to Your Project Directory
```bash
# Find your Next.js project (usually in /var/www or ~/project-name)
cd /var/www/your-project-name
# OR
cd ~/dcc_webiste_crm
# OR wherever you deployed your project

# Check if you're in the right place
ls -la
# Should see: package.json, next.config.mjs, app/, etc.
```

### Step 2: Create Public Folders
```bash
# Create public directory and subdirectories
mkdir -p public/uploads
mkdir -p public/videos
mkdir -p public/thumbnails

# Set proper permissions (755 = owner can read/write/execute, others can read/execute)
chmod 755 public
chmod 755 public/uploads
chmod 755 public/videos
chmod 755 public/thumbnails

# If using specific user (not root), set ownership
# Replace 'your-username' with your actual user
chown -R your-username:your-username public
```

### Step 3: Verify
```bash
ls -la public/
# Should see:
# drwxr-xr-x uploads
# drwxr-xr-x videos
# drwxr-xr-x thumbnails
```

### Step 4: Restart Your Application
```bash
# If using PM2:
pm2 restart all

# If using systemd:
sudo systemctl restart your-app-name

# Or manually restart Node.js
```

## Alternative: Check Project Location

If you're not sure where your project is:

```bash
# Find where Node.js is running
ps aux | grep node

# Or find where PM2 apps are running
pm2 list
pm2 info your-app-name

# Check the 'cwd' (current working directory) in the output
```

## Permissions Explained

- `755` = Owner: read/write/execute, Group: read/execute, Others: read/execute
- `-R` = Recursive (applies to all subdirectories)

If uploads still fail after creating folders, you might need:

```bash
# More permissive (if 755 doesn't work)
chmod 777 public
chmod -R 777 public/uploads
chmod -R 777 public/videos
chmod -R 777 public/thumbnails
```

**Note:** 777 gives everyone full access (not ideal for security, but works for troubleshooting)

