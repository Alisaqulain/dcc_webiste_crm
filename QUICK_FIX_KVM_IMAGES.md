# Quick Fix: Image Upload 404 on KVM

## The Problem
Images upload successfully but return 404 when accessed. Works locally but not on KVM server.

## The Solution (3 Steps)

### Option 1: Automated Script (Recommended)

```bash
# On your KVM server, run:
cd /root/dcc_webiste_crm
chmod +x fix-kvm-image-upload.sh
sudo ./fix-kvm-image-upload.sh
```

### Option 2: Manual Fix

1. **Edit Nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/digitalcareercenter.com
   ```

2. **Add this block BEFORE `location /`:**
   ```nginx
   location /uploads {
       alias /root/dcc_webiste_crm/public/uploads;
       expires 30d;
       add_header Cache-Control "public";
       access_log off;
       limit_except GET { deny all; }
   }
   ```

3. **Test and reload:**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

## Why This Happens

- Images upload to `public/uploads/` ✅
- Nginx proxies ALL requests to Next.js ❌
- Next.js doesn't serve static files in production ❌
- Result: 404 error ❌

**Fix:** Configure Nginx to serve `/uploads` directly (bypass Next.js)

## Verify It Works

```bash
# Test an uploaded image
curl -I https://www.digitalcareercenter.com/uploads/YOUR_FILENAME.png
```

**Success:** HTTP 200, no `x-powered-by: Next.js` header  
**Failure:** HTTP 404, has `x-powered-by: Next.js` header

## Full Documentation

See `KVM_IMAGE_UPLOAD_FIX.md` for detailed troubleshooting.


