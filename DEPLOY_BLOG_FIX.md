# Deploy Blog Image Fix to KVM Server

## Problem
Blog images show correctly on individual blog post pages (`/blog/bc`) but not on the blog listing page (`/blog`). The error shows Next.js is still trying to optimize images even though `unoptimized` prop was added.

## Solution
The code changes are correct, but the production server needs to be rebuilt with the latest code.

## Steps to Fix on KVM Server

### 1. SSH into your KVM server
```bash
ssh your-user@your-kvm-server
```

### 2. Navigate to the project directory
```bash
cd ~/dcc_webiste_crm
# or
cd /root/dcc_webiste_crm
```

### 3. Pull latest code (if using git) or ensure files are synced
```bash
# If using git:
git pull origin main

# Or manually upload/rsync the updated files:
# - app/blog/page.jsx
# - app/blog/[slug]/page.jsx
```

### 4. Clear Next.js cache and rebuild
```bash
# Remove old build
rm -rf .next

# Rebuild the application
npm run build
```

### 5. Restart the application

**If using PM2:**
```bash
pm2 restart all
# or
pm2 restart dcc-app
```

**If using systemd:**
```bash
sudo systemctl restart dcc-app
# or your service name
```

**If running directly:**
```bash
# Stop current process (Ctrl+C or kill process)
# Then start:
npm start
```

### 6. Verify the fix
1. Clear browser cache or use incognito mode
2. Visit: https://www.digitalcareercenter.com/blog
3. Check that blog images are now loading
4. Check browser console - should no longer see 400 errors for `_next/image`

## Verification Commands

Check if the build was successful:
```bash
# Check build output
ls -la .next/server/app/blog/

# Should see:
# - page.js
# - [slug]/
```

Check if application is running:
```bash
# If using PM2
pm2 status
pm2 logs dcc-app --lines 50

# If using systemd
sudo systemctl status dcc-app
```

## Troubleshooting

### If images still don't load after rebuild:

1. **Check file permissions:**
   ```bash
   ls -la app/blog/page.jsx
   # Should show the file exists
   ```

2. **Verify unoptimized prop is in the code:**
   ```bash
   grep -n "unoptimized" app/blog/page.jsx
   # Should show lines 138 and 233
   ```

3. **Clear browser cache completely:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or use incognito/private browsing

4. **Check Nginx configuration** (if images are served by Nginx):
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Check application logs for errors:**
   ```bash
   # PM2
   pm2 logs dcc-app --err --lines 100
   
   # systemd
   sudo journalctl -u dcc-app -n 100
   ```

## Expected Result

After deployment:
- ✅ Blog listing page (`/blog`) should show all images
- ✅ Individual blog post pages (`/blog/[slug]`) should continue to show images
- ✅ No 400 errors in browser console for `_next/image`
- ✅ Images should load directly from `/uploads/` without Next.js optimization




