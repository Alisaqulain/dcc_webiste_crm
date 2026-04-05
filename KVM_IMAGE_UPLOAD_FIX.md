# Fix Image Upload 404 Error on KVM Server

## Problem
- ✅ Images upload successfully to `public/uploads/` directory
- ❌ Images return 404 when accessed via URL: `https://www.digitalcareercenter.com/uploads/filename.png`
- ✅ Works in local environment
- ❌ Doesn't work in KVM production

## Root Cause
Nginx is proxying ALL requests (including `/uploads`) to Next.js. Next.js doesn't serve static files from the `public` folder when behind a reverse proxy in production. We need to configure Nginx to serve `/uploads` directly.

## Solution: Configure Nginx to Serve /uploads Directly

### Step 1: SSH into Your KVM Server
```bash
ssh root@your-kvm-server-ip
```

### Step 2: Navigate to Project Directory
```bash
cd /root/dcc_webiste_crm
```

### Step 3: Ensure Uploads Directory Exists
```bash
# Create directory if it doesn't exist
mkdir -p public/uploads

# Set proper permissions
chmod 755 public/uploads
chmod 644 public/uploads/* 2>/dev/null || true
```

### Step 4: Edit Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

### Step 5: Add /uploads Location Block

**IMPORTANT:** The `/uploads` block MUST come BEFORE the `location /` block!

Find your `server` block and add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # ✅ CRITICAL: This MUST come BEFORE location /
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        # Security: Only allow GET requests
        limit_except GET {
            deny all;
        }
        
        # Ensure correct MIME types
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
            image/svg+xml svg;
        }
    }

    # ✅ This comes AFTER /uploads
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: Test Nginx Configuration
```bash
sudo nginx -t
```

If you see "syntax is ok" and "test is successful", proceed to Step 7.

### Step 7: Reload Nginx
```bash
sudo systemctl reload nginx
```

### Step 8: Verify File Permissions
```bash
# Check if uploads directory exists and has correct permissions
ls -ld /root/dcc_webiste_crm/public/uploads

# Should show: drwxr-xr-x (755 permissions)

# Check file permissions
ls -lh /root/dcc_webiste_crm/public/uploads/ | head -5

# Files should have: -rw-r--r-- (644 permissions)
```

### Step 9: Test the Fix

1. **Upload a new image** through your application
2. **Check if file exists on server:**
   ```bash
   ls -lh /root/dcc_webiste_crm/public/uploads/
   ```
3. **Test via curl:**
   ```bash
   curl -I https://www.digitalcareercenter.com/uploads/YOUR_FILENAME.png
   ```
   
   **Success indicators:**
   - ✅ HTTP 200 (not 404)
   - ✅ No `x-powered-by: Next.js` header
   - ✅ `server: nginx` header
   - ✅ `content-type: image/png` (or appropriate image type)

   **Failure indicators:**
   - ❌ HTTP 404
   - ❌ `x-powered-by: Next.js` header (still proxying to Next.js)
   - ❌ `content-type: text/html` (error page)

## Quick Automated Fix (Alternative)

If you prefer to use the automated script:

```bash
cd /root/dcc_webiste_crm
chmod +x fix-nginx-uploads-location.sh
sudo ./fix-nginx-uploads-location.sh
```

## Troubleshooting

### Still Getting 404 with Next.js Headers

1. **Check location block order:**
   ```bash
   sudo grep -n "location" /etc/nginx/sites-available/digitalcareercenter.com
   ```
   `/uploads` should have a **lower line number** than `/`

2. **Check if the block was added correctly:**
   ```bash
   sudo sed -n '/location \/uploads {/,/^[[:space:]]*}/p' /etc/nginx/sites-available/digitalcareercenter.com
   ```

3. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### File Exists But Still 404

1. **Check file permissions:**
   ```bash
   ls -lh /root/dcc_webiste_crm/public/uploads/YOUR_FILENAME.png
   sudo chmod 644 /root/dcc_webiste_crm/public/uploads/YOUR_FILENAME.png
   ```

2. **Check directory permissions:**
   ```bash
   ls -ld /root/dcc_webiste_crm/public/uploads
   sudo chmod 755 /root/dcc_webiste_crm/public/uploads
   ```

3. **Verify Nginx can read the directory:**
   ```bash
   sudo -u www-data ls /root/dcc_webiste_crm/public/uploads/
   ```
   If this fails, you may need to adjust permissions or SELinux settings.

### SELinux Blocking (if enabled)

```bash
# Check if SELinux is enabled
getenforce

# If enabled, allow Nginx to read user content
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /root/dcc_webiste_crm/public/uploads
```

## Why This Happens

1. **Image uploads successfully** → File is written to `public/uploads/` ✅
2. **URL is saved to database** → `/uploads/filename.png` ✅
3. **Frontend tries to load image** → Requests `https://digitalcareercenter.com/uploads/filename.png` ✅
4. **Nginx receives request** → No `/uploads` location block, so it matches `location /` ❌
5. **Request is proxied to Next.js** → Next.js doesn't serve static files in production with reverse proxy ❌
6. **Next.js returns 404** → Image not found ❌

**The fix:** Configure Nginx to serve `/uploads` directly, bypassing Next.js.

## Verification Checklist

- [ ] `/uploads` location block exists in Nginx config
- [ ] `/uploads` block comes **BEFORE** `location /`
- [ ] Alias path is correct: `/root/dcc_webiste_crm/public/uploads`
- [ ] Nginx config test passes: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Test image returns 200: `curl -I https://digitalcareercenter.com/uploads/filename.png`
- [ ] Response has no `x-powered-by: Next.js` header
- [ ] File permissions are correct (755 for directory, 644 for files)

## After Fixing

Once Nginx is configured correctly:
- ✅ New images will load immediately after upload
- ✅ Existing images will work
- ✅ No more 404 errors
- ✅ Faster image loading (served directly by Nginx)

## Need Help?

If you're still having issues:

1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Next.js logs: `pm2 logs` or check your application logs
3. Verify the file actually exists: `ls -lh /root/dcc_webiste_crm/public/uploads/`
4. Test with a simple curl command to see the response headers


