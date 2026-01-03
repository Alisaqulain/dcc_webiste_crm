# Manual Nginx Fix for /uploads 404 Errors

## Current Problem
Even after adding the location block, you're still getting 404 with `x-powered-by: Next.js` headers, meaning requests are being proxied to Next.js.

## Step-by-Step Manual Fix

### Step 1: View Current Config

```bash
sudo cat /etc/nginx/sites-available/digitalcareercenter.com
```

Look for the `location /` block. Note its line number.

### Step 2: Edit Config

```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

### Step 3: Find and Fix the Location Blocks

Your config should look like this (order is critical):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # ✅ THIS BLOCK MUST COME FIRST (before location /)
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        limit_except GET {
            deny all;
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

### Step 4: Save and Test

1. Save the file (Ctrl+X, then Y, then Enter in nano)
2. Test config:
   ```bash
   sudo nginx -t
   ```
3. If test passes, reload:
   ```bash
   sudo systemctl reload nginx
   ```

### Step 5: Verify

```bash
curl -I https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg
```

**Success indicators:**
- HTTP 200 (not 404)
- No `x-powered-by: Next.js` header
- `server: nginx/1.24.0` header

## Alternative: Use the Fix Script

If manual editing doesn't work, use the script:

```bash
cd ~/dcc_webiste_crm
# The script will be uploaded to your server
chmod +x fix-nginx-config-direct.sh
sudo ./fix-nginx-config-direct.sh
```

## Common Issues

### Issue 1: Location block is after `location /`

**Symptom:** Still seeing `x-powered-by: Next.js` in headers

**Fix:** Move `/uploads` block BEFORE `location /`

### Issue 2: Wrong alias path

**Symptom:** 404 or 403 errors

**Fix:** Verify the path:
```bash
ls -la /root/dcc_webiste_crm/public/uploads/1766146116916-adas.jpeg
```

If file doesn't exist, check:
```bash
ls -la /root/dcc_webiste_crm/public/uploads/
```

### Issue 3: File permissions

**Symptom:** 403 Forbidden

**Fix:**
```bash
sudo chmod 755 /root/dcc_webiste_crm/public/uploads
sudo chmod 644 /root/dcc_webiste_crm/public/uploads/*
```

### Issue 4: SELinux blocking (if enabled)

**Symptom:** 403 even with correct permissions

**Fix:**
```bash
sudo setsebool -P httpd_read_user_content 1
sudo restorecon -R /root/dcc_webiste_crm/public/uploads
```

## Debugging Commands

```bash
# Check Nginx config syntax
sudo nginx -t

# View current location blocks
sudo grep -n "location" /etc/nginx/sites-available/digitalcareercenter.com

# Check if file exists
ls -lh /root/dcc_webiste_crm/public/uploads/1766146116916-adas.jpeg

# Test local access
curl -I http://localhost/uploads/1766146116916-adas.jpeg

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## Quick Verification Checklist

- [ ] `/uploads` location block exists
- [ ] `/uploads` block comes BEFORE `location /`
- [ ] Alias path is correct: `/root/dcc_webiste_crm/public/uploads`
- [ ] File exists: `ls -lh /root/dcc_webiste_crm/public/uploads/1766146116916-adas.jpeg`
- [ ] File permissions: 644
- [ ] Directory permissions: 755
- [ ] Nginx config test passes: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Test returns 200 (not 404)
- [ ] Response has no `x-powered-by: Next.js` header










