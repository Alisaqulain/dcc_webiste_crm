# Simple Nginx Fix for Image 404

## Step 1: Check Current Config

```bash
# Check if /uploads block exists in active config
sudo nginx -T | grep -A 10 "location /uploads"
```

**If this shows nothing**, the block isn't active. Continue to Step 2.

## Step 2: Edit Nginx Config

```bash
sudo nano /etc/nginx/sites-available/digitalcareercenter.com
```

## Step 3: Add /uploads Block

Find the `location / {` line and ADD this block **BEFORE** it:

```nginx
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        limit_except GET { deny all; }
    }
```

**Important:** The `/uploads` block MUST come BEFORE `location /`

Your config should look like this:

```nginx
server {
    listen 80;
    server_name digitalcareercenter.com www.digitalcareercenter.com;

    # ✅ THIS COMES FIRST
    location /uploads {
        alias /root/dcc_webiste_crm/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        limit_except GET { deny all; }
    }

    # ✅ THIS COMES AFTER
    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... rest of proxy settings
    }
}
```

## Step 4: Save and Test

1. Save: `Ctrl+X`, then `Y`, then `Enter`
2. Test config: `sudo nginx -t`
3. Reload: `sudo systemctl reload nginx`

## Step 5: Test Image Access

```bash
curl -I http://localhost/uploads/1767767631103-logo.jpg
```

Should return: `HTTP/1.1 200 OK` (not 404)

## If Still 404

Run this to see what's actually active:

```bash
sudo nginx -T | grep -A 10 "location /uploads"
```

If still nothing, check:
1. Is config enabled? `ls -la /etc/nginx/sites-enabled/ | grep digitalcareercenter`
2. If not enabled: `sudo ln -s /etc/nginx/sites-available/digitalcareercenter.com /etc/nginx/sites-enabled/`
3. Reload: `sudo systemctl reload nginx`

