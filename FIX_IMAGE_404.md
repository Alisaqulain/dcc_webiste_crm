# Fix Image 404 Errors

## Problem
Images are returning 404 errors even though they exist in `public/uploads/`. The URL `https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg` returns 404.

## Root Cause
In Next.js, files in the `public` folder should be accessible at the root URL. However, when using a reverse proxy (Nginx/Apache), the web server needs to be configured to serve these files directly, OR Next.js must serve them.

## Quick Diagnostic

Run the diagnostic script on your KVM server:

```bash
cd ~/dcc_webiste_crm
chmod +x fix-image-404.sh
./fix-image-404.sh
```

## Solution 1: Configure Nginx to Serve /uploads (RECOMMENDED)

This is the best solution for production. It offloads static file serving from Next.js to Nginx.

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

Or if using default config:
```bash
sudo nano /etc/nginx/sites-available/default
```

### Step 2: Add /uploads Location Block

Find your server block and add this **BEFORE** the main `location /` block:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # Serve uploads directory directly (BEFORE the main location block)
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        # Allow all image types
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
            image/svg+xml svg;
        }
        
        # Security: Only allow GET requests
        limit_except GET {
            deny all;
        }
    }
    
    # Serve other public files
    location ~ ^/(favicon.ico|robots.txt|sitemap.xml)$ {
        alias /root/dcc_webiste_crm/public$request_uri;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Proxy all other requests to Next.js
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

**Important:** Replace `/root/dcc_webiste_crm` with your actual project path.

### Step 3: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Step 4: Verify

```bash
# Check if file exists
ls -lh ~/dcc_webiste_crm/public/uploads/1766146116916-adas.jpeg

# Test direct access (should return 200)
curl -I http://localhost/uploads/1766146116916-adas.jpeg

# Test from external URL
curl -I https://digitalcareercenter.com/uploads/1766146116916-adas.jpeg
```

## Solution 2: Let Next.js Serve Static Files

If you can't modify Nginx configuration, ensure Next.js serves static files:

### Step 1: Check next.config.mjs

Make sure `output: 'standalone'` is **NOT** present:

```bash
cd ~/dcc_webiste_crm
grep -i "standalone" next.config.mjs
```

If it exists, remove it or comment it out.

### Step 2: Rebuild

```bash
cd ~/dcc_webiste_crm
npm run build
```

### Step 3: Restart Next.js

```bash
# If using PM2
pm2 restart all

# Or if using systemd
sudo systemctl restart nextjs

# Or manually
pkill -f "next"
npm start
```

### Step 4: Update Nginx to Proxy Everything

If using this approach, your Nginx should proxy ALL requests (including static files) to Next.js:

```nginx
location / {
    proxy_pass http://localhost:3000;
    # ... rest of proxy config
}
```

## Solution 3: Verify Files Exist

Sometimes files are uploaded but not saved correctly:

```bash
cd ~/dcc_webiste_crm

# Check if uploads directory exists
ls -la public/uploads/

# Check specific file
ls -lh public/uploads/1766146116916-adas.jpeg

# Check file permissions
chmod 755 public/uploads
chmod 644 public/uploads/*

# Verify Next.js can read files
node -e "const fs = require('fs'); console.log(fs.existsSync('public/uploads/1766146116916-adas.jpeg'))"
```

## Solution 4: Quick Fix Script

Run this one-liner to add the Nginx location block:

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/digitalcareercenter.com /etc/nginx/sites-available/digitalcareercenter.com.backup

# Add location block (replace /root/dcc_webiste_crm with your actual path)
sudo sed -i '/location \/ {/i\    location /uploads {\n        alias /root/dcc_webiste_crm/public/uploads;\n        expires 30d;\n        add_header Cache-Control "public";\n        access_log off;\n    }\n' /etc/nginx/sites-available/digitalcareercenter.com

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting

### File exists but still 404

1. **Check file permissions:**
   ```bash
   chmod 644 public/uploads/*
   chmod 755 public/uploads
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check if Next.js is serving the file:**
   ```bash
   curl -I http://localhost:3000/uploads/1766146116916-adas.jpeg
   ```

4. **Check SELinux (if enabled):**
   ```bash
   sudo setsebool -P httpd_read_user_content 1
   ```

### Files not persisting after upload

This could be a storage issue. Check:
- Disk space: `df -h`
- Write permissions: `ls -ld public/uploads`
- Storage service logs in Next.js console

### Images work locally but not in production

1. Ensure files are uploaded to the production server (not just local)
2. Check that the production server has the same file structure
3. Verify Nginx configuration matches production setup

## Prevention

To prevent this issue in the future:

1. **Always configure Nginx to serve `/uploads` directly** (Solution 1)
2. **Set up proper file permissions** during deployment
3. **Monitor upload directory** for disk space
4. **Test image URLs** after deployment

## Summary

The most likely cause is that Nginx is not configured to serve files from `/uploads`. Add the location block in Solution 1, and images should load immediately.








