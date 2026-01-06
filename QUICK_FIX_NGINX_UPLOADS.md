# Quick Fix: Nginx /uploads Location Block

## Problem
Even after adding the `/uploads` location block, images still return 404 and the response shows `x-powered-by: Next.js`, meaning requests are still being proxied to Next.js instead of served by Nginx.

## Root Cause
The `/uploads` location block must come **BEFORE** the general `location /` block in Nginx config. Nginx processes location blocks in order, and if `location /` comes first, it matches all requests and proxies them to Next.js.

## Quick Fix Script

Run this on your KVM server:

```bash
cd ~/dcc_webiste_crm
chmod +x fix-nginx-uploads-location.sh
sudo ./fix-nginx-uploads-location.sh
```

## Manual Fix

### Step 1: Edit Nginx Config

```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

### Step 2: Find the `location /` Block

Look for this section:
```nginx
location / {
    proxy_pass http://localhost:3000;
    # ... other proxy settings
}
```

### Step 3: Add `/uploads` Block BEFORE `location /`

The `/uploads` block **MUST** come before `location /`. Your config should look like this:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # ✅ THIS MUST COME FIRST (before location /)
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        limit_except GET {
            deny all;
        }
        
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
            image/svg+xml svg;
        }
    }

    # ✅ location / comes AFTER /uploads
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

### Step 4: Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Verify

```bash
# Test locally (should return 200, not 404)
curl -I http://localhost/uploads/1766146116916-adas.jpeg

# Check response headers - should NOT have x-powered-by: Next.js
curl -I https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg
```

If it's working, you should see:
- HTTP 200 (not 404)
- No `x-powered-by: Next.js` header
- `server: nginx/1.24.0` header

## One-Liner Fix (If location / exists)

```bash
# Remove any existing /uploads block
sudo sed -i '/location \/uploads {/,/^    }/d' /etc/nginx/sites-available/digitalcareercenter.com

# Add /uploads block before location /
sudo sed -i '/location \/ {/i\    location /uploads {\n        alias /root/dcc_webiste_crm/public/uploads;\n        expires 30d;\n        add_header Cache-Control "public";\n        access_log off;\n        limit_except GET { deny all; }\n    }\n' /etc/nginx/sites-available/digitalcareercenter.com

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Verify It's Working

After fixing, test:

```bash
# Should return 200 and show nginx server header (not Next.js)
curl -I https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg
```

Expected output:
```
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
content-type: image/jpeg
```

NOT:
```
HTTP/2 404
x-powered-by: Next.js  ← This means it's still proxying to Next.js
```

## Troubleshooting

### Still getting 404 with Next.js headers

1. **Check location block order:**
   ```bash
   sudo grep -n "location" /etc/nginx/sites-available/digitalcareercenter.com
   ```
   `/uploads` should come before `/`

2. **Check if alias path is correct:**
   ```bash
   ls -la /root/dcc_webiste_crm/public/uploads/1766146116916-adas.jpeg
   ```

3. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Test direct file access:**
   ```bash
   curl -I http://localhost/uploads/1766146116916-adas.jpeg
   ```

### File permissions issue

```bash
sudo chmod 755 /root/dcc_webiste_crm/public/uploads
sudo chmod 644 /root/dcc_webiste_crm/public/uploads/*
```

### SELinux blocking (if enabled)

```bash
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /root/dcc_webiste_crm/public/uploads
```

## Key Points

1. **Order matters**: `/uploads` location block MUST come before `location /`
2. **Alias path**: Must be absolute path to the uploads directory
3. **File permissions**: Directory 755, files 644
4. **Test locally first**: `curl -I http://localhost/uploads/filename.jpg`














