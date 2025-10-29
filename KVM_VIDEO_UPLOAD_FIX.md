# Fix Video Upload 413 Error on KVM Hosting

## The Problem

You're getting **413 Request Entity Too Large** errors even though chunks are only 1MB. This is because your **Nginx** (or web server) has a body size limit that's too small.

## Solution: Increase Nginx Body Size Limit

### Step 1: Find Your Nginx Configuration

SSH into your KVM server and locate the Nginx config:

```bash
# Common locations:
/etc/nginx/nginx.conf
/etc/nginx/sites-available/default
/etc/nginx/sites-available/your-site-name
```

### Step 2: Update Nginx Configuration

Edit your Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/your-site-name
# OR
sudo nano /etc/nginx/nginx.conf
```

### Step 3: Add/Update `client_max_body_size`

Find the `server` block for your domain and add/update:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.digitalcareercenter.com digitalcareercenter.com;

    # ⚠️ CRITICAL: Increase body size limit for video uploads
    client_max_body_size 50M;  # Allow up to 50MB requests
    
    # Also add these for better handling
    client_body_buffer_size 10M;
    client_body_timeout 120s;
    
    # Your existing location blocks...
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

### Step 4: Also Update Main Nginx Config (if needed)

If using multiple sites, you might need to update the main config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add in the `http` block:

```nginx
http {
    # ... existing config ...
    
    # Increase body size globally
    client_max_body_size 50M;
    client_body_buffer_size 10M;
    
    # ... rest of config ...
}
```

### Step 5: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
# OR
sudo service nginx reload
```

### Step 6: Restart Your Next.js Application

```bash
# If using PM2:
pm2 restart all

# If using systemd:
sudo systemctl restart your-app-name

# Or manually:
cd /path/to/your/project
npm run build
npm start
```

## Verify It Works

1. Try uploading a video again
2. Check browser console - should not see 413 errors
3. Check server logs for successful uploads

## Video Storage Location

**✅ Videos are already stored in filesystem, NOT in database!**

- Videos are saved to: `public/videos/` folder
- Only metadata (filename, URL, size) is stored in MongoDB
- Check your project folder: `public/videos/` to see uploaded videos

## If Still Not Working

### Check Current Limit

```bash
# Check current Nginx settings
sudo nginx -T | grep client_max_body_size
```

### Increase Limit Further

If 50MB isn't enough, increase to 100MB or more:

```nginx
client_max_body_size 100M;
```

### Check Other Web Servers

If you're using **Apache** instead of Nginx:

```bash
# Edit Apache config
sudo nano /etc/apache2/apache2.conf
# OR
sudo nano /etc/httpd/conf/httpd.conf

# Add:
LimitRequestBody 52428800  # 50MB in bytes
```

Then restart:
```bash
sudo systemctl reload apache2
# OR
sudo service apache2 reload
```

### Check Firewall/Cloudflare

If using Cloudflare or other CDN:
- Check Cloudflare settings
- Increase size limits in Cloudflare dashboard
- May need to adjust caching rules

## Alternative: Reduce Chunk Size

If you can't change server configs, we can reduce chunk size. But the best fix is increasing server limits.

## Summary

The issue is **NOT in your code** - it's a server configuration problem. Your code correctly:
- ✅ Stores videos in `public/videos/` folder (filesystem)
- ✅ Only stores metadata in database
- ✅ Uses chunked uploads for large files

You just need to allow larger request bodies in your web server configuration.

