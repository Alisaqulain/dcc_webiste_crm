# Immediate Fix Steps for Image 404 Error

## Your Current Situation
- ✅ Nginx config has `/uploads` location block
- ✅ Files exist in `public/uploads/` directory
- ❌ Images still return 404

## Quick Fix (Run These Commands on KVM Server)

### Step 1: Verify Nginx Config and Reload

```bash
# Test Nginx config
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### Step 2: Fix File Permissions

```bash
cd /root/dcc_webiste_crm

# Fix directory permissions
chmod 755 public/uploads
chmod 755 public

# Fix file permissions (all files in uploads)
chmod 644 public/uploads/*

# Verify specific file
ls -lh public/uploads/1767790451655-bl1.png
# Should show: -rw-r--r-- (644)
```

### Step 3: Ensure Nginx User Can Read Files

```bash
# Check Nginx user
ps aux | grep '[n]ginx: master' | awk '{print $1}'
# Usually: www-data or nginx

# Make sure Nginx can read the directory
chmod 755 /root
chmod 755 /root/dcc_webiste_crm
chmod 755 /root/dcc_webiste_crm/public
chmod 755 /root/dcc_webiste_crm/public/uploads
```

### Step 4: Verify Nginx Config Details

```bash
# Check if /uploads block exists and is correct
sudo grep -A 10 "location /uploads" /etc/nginx/sites-available/digitalcareercenter.com

# Check location block order (uploads should come before location /)
sudo grep -n "location" /etc/nginx/sites-available/digitalcareercenter.com
```

**Expected output:**
```
location /uploads should be at a lower line number than location /
```

### Step 5: Test File Access

```bash
# Test via localhost
curl -I http://localhost/uploads/1767790451655-bl1.png

# Should return:
# HTTP/1.1 200 OK
# Content-Type: image/png
# (NO x-powered-by: Next.js header)
```

### Step 6: Check Nginx Error Logs

```bash
# Watch error logs in real-time
sudo tail -f /var/log/nginx/error.log

# Then try accessing the image in browser
# Look for any permission errors
```

### Step 7: Verify Alias Path

```bash
# Check what alias path is configured
sudo grep -A 2 "location /uploads" /etc/nginx/sites-available/digitalcareercenter.com | grep alias

# Should show:
# alias /root/dcc_webiste_crm/public/uploads;

# Verify this path exists
ls -ld /root/dcc_webiste_crm/public/uploads
```

## Common Issues and Fixes

### Issue 1: Nginx Not Reloaded
**Symptom:** Config looks correct but still 404

**Fix:**
```bash
sudo systemctl reload nginx
# OR
sudo systemctl restart nginx
```

### Issue 2: File Permissions
**Symptom:** File exists but Nginx can't read it

**Fix:**
```bash
chmod 644 /root/dcc_webiste_crm/public/uploads/*
chmod 755 /root/dcc_webiste_crm/public/uploads
```

### Issue 3: Directory Permissions
**Symptom:** Nginx can't access parent directories

**Fix:**
```bash
chmod 755 /root
chmod 755 /root/dcc_webiste_crm
chmod 755 /root/dcc_webiste_crm/public
```

### Issue 4: Location Block Order
**Symptom:** `/uploads` block exists but still proxied to Next.js

**Fix:** Ensure `/uploads` comes BEFORE `location /` in config

### Issue 5: SELinux (if enabled)
**Symptom:** Permission denied errors in logs

**Fix:**
```bash
# Check if SELinux is enabled
getenforce

# If enabled, allow Nginx to read user content
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /root/dcc_webiste_crm/public/uploads
```

## Automated Troubleshooting

Run the diagnostic script:

```bash
cd /root/dcc_webiste_crm
chmod +x troubleshoot-nginx-uploads.sh
sudo ./troubleshoot-nginx-uploads.sh
```

## Manual Verification Checklist

- [ ] File exists: `ls -lh /root/dcc_webiste_crm/public/uploads/1767790451655-bl1.png`
- [ ] File permissions: `644` (readable by all)
- [ ] Directory permissions: `755` (readable/executable by all)
- [ ] Nginx config test passes: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] `/uploads` block exists in config
- [ ] `/uploads` block comes BEFORE `location /`
- [ ] Alias path is correct: `/root/dcc_webiste_crm/public/uploads`
- [ ] Test via localhost: `curl -I http://localhost/uploads/1767790451655-bl1.png` returns 200

## Still Not Working?

1. **Check Nginx error logs:**
   ```bash
   sudo tail -20 /var/log/nginx/error.log
   ```

2. **Test with a simple file:**
   ```bash
   # Create a test file
   echo "test" > /root/dcc_webiste_crm/public/uploads/test.txt
   chmod 644 /root/dcc_webiste_crm/public/uploads/test.txt
   
   # Test access
   curl http://localhost/uploads/test.txt
   # Should return: test
   ```

3. **Verify Nginx is actually using the config:**
   ```bash
   # Check which config file is active
   sudo nginx -T | grep -A 10 "location /uploads"
   ```

4. **Check if there are multiple server blocks:**
   ```bash
   sudo grep -n "server {" /etc/nginx/sites-available/digitalcareercenter.com
   ```

