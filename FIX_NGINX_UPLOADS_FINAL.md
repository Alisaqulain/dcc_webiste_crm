# Final Fix: Nginx /uploads Configuration

## The Problem
New images upload successfully but return 404 errors when trying to load. The error shows:
- `Package image failed to load: /uploads/1766147524863-adas.jpeg`
- Response headers show `x-powered-by: Next.js` (meaning requests are proxied to Next.js instead of served by Nginx)

## Root Cause
Nginx is not configured to serve files from `/uploads`. All requests are being proxied to Next.js, which doesn't serve static files from the `public` folder in production when using a reverse proxy.

## The Fix

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

### Step 2: Add /uploads Location Block

Find your `server` block and add this location block **BEFORE** the `location /` block:

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

**IMPORTANT:** The `/uploads` block MUST come before `location /`. Nginx processes location blocks in order, and if `location /` comes first, it matches all requests.

### Step 3: Test and Reload

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Step 4: Verify It's Working

```bash
# Test a specific image
curl -I https://digitalcareercenter.com/uploads/1766147524863-adas.jpeg
```

**Success indicators:**
- ✅ HTTP 200 (not 404)
- ✅ No `x-powered-by: Next.js` header
- ✅ `server: nginx/1.24.0` header
- ✅ `content-type: image/jpeg` header

**Failure indicators:**
- ❌ HTTP 404
- ❌ `x-powered-by: Next.js` header (still proxying to Next.js)
- ❌ `content-type: text/html` (error page)

### Step 5: Fix File Permissions (if needed)

```bash
# Ensure directory is readable
sudo chmod 755 /root/dcc_webiste_crm/public/uploads

# Ensure files are readable
sudo chmod 644 /root/dcc_webiste_crm/public/uploads/*

# Verify a specific file
ls -lh /root/dcc_webiste_crm/public/uploads/1766147524863-adas.jpeg
```

## Quick One-Liner Fix

If you want to add the block automatically:

```bash
# Backup config
sudo cp /etc/nginx/sites-available/digitalcareercenter.com /etc/nginx/sites-available/digitalcareercenter.com.backup

# Remove any existing /uploads block
sudo sed -i '/location \/uploads {/,/^[[:space:]]*}/d' /etc/nginx/sites-available/digitalcareercenter.com

# Add /uploads block before location /
sudo sed -i '/^[[:space:]]*location \/ {/i\    location /uploads {\n        alias /root/dcc_webiste_crm/public/uploads;\n        expires 30d;\n        add_header Cache-Control "public";\n        access_log off;\n        limit_except GET { deny all; }\n    }\n' /etc/nginx/sites-available/digitalcareercenter.com

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting

### Still getting 404 with Next.js headers

1. **Check location block order:**
   ```bash
   sudo grep -n "location" /etc/nginx/sites-available/digitalcareercenter.com
   ```
   `/uploads` should have a lower line number than `/`

2. **Check if the block was added correctly:**
   ```bash
   sudo sed -n '/location \/uploads {/,/^[[:space:]]*}/p' /etc/nginx/sites-available/digitalcareercenter.com
   ```

3. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### File exists but still 404

1. **Check file permissions:**
   ```bash
   ls -lh /root/dcc_webiste_crm/public/uploads/1766147524863-adas.jpeg
   sudo chmod 644 /root/dcc_webiste_crm/public/uploads/1766147524863-adas.jpeg
   ```

2. **Check directory permissions:**
   ```bash
   ls -ld /root/dcc_webiste_crm/public/uploads
   sudo chmod 755 /root/dcc_webiste_crm/public/uploads
   ```

3. **Test direct file access:**
   ```bash
   curl -I http://localhost/uploads/1766147524863-adas.jpeg
   ```

### SELinux blocking (if enabled)

```bash
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /root/dcc_webiste_crm/public/uploads
```

## Why This Happens

1. **Image uploads successfully** → File is written to `public/uploads/`
2. **URL is saved to database** → `/uploads/filename.jpeg`
3. **Frontend tries to load image** → Requests `https://digitalcareercenter.com/uploads/filename.jpeg`
4. **Nginx receives request** → No `/uploads` location block, so it matches `location /`
5. **Request is proxied to Next.js** → Next.js doesn't serve static files in production with reverse proxy
6. **Next.js returns 404** → Image not found

**The fix:** Configure Nginx to serve `/uploads` directly, bypassing Next.js.

## After Fixing

Once Nginx is configured correctly:
- ✅ New images will load immediately after upload
- ✅ Existing images will work
- ✅ No more 404 errors
- ✅ Faster image loading (served directly by Nginx)

## Verification Checklist

- [ ] `/uploads` location block exists in Nginx config
- [ ] `/uploads` block comes BEFORE `location /`
- [ ] Alias path is correct: `/root/dcc_webiste_crm/public/uploads`
- [ ] Nginx config test passes: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Test image returns 200: `curl -I https://digitalcareercenter.com/uploads/1766147524863-adas.jpeg`
- [ ] Response has no `x-powered-by: Next.js` header
- [ ] File permissions are correct (755 for directory, 644 for files)




