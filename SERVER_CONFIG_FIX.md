# Fix MIME Type Errors for Static Files

## The Problem

You're seeing errors like:
- `Refused to apply style from '...css' because its MIME type ('text/html') is not a supported stylesheet MIME type`
- `Failed to load resource: the server responded with a status of 400 (Bad Request)`
- `ChunkLoadError: Loading chunk failed`

This happens when your web server (Nginx/Apache) is returning HTML error pages instead of serving the actual static files from `_next/static`.

## Root Cause

When using Next.js with `output: 'standalone'`, the web server needs to:
1. **Serve static files directly** from `_next/static` folder (not through Next.js)
2. **Proxy dynamic routes** to the Next.js server
3. **Set correct MIME types** for CSS, JS, and other static assets

## Solution: Update Web Server Configuration

### For Nginx

Edit your Nginx configuration file (usually `/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.digitalcareercenter.com digitalcareercenter.com;

    # Root directory where your Next.js app is built
    root /path/to/your/project/.next;
    
    # Serve static files directly with correct MIME types
    location /_next/static {
        alias /path/to/your/project/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        
        # Ensure correct MIME types
        types {
            text/css css;
            application/javascript js;
            application/json json;
            image/png png;
            image/jpeg jpg jpeg;
            image/svg+xml svg;
            font/woff woff;
            font/woff2 woff2;
        }
    }
    
    # Serve public folder files
    location /public {
        alias /path/to/your/project/public;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Proxy all other requests to Next.js server
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Important:** Replace `/path/to/your/project` with your actual project path.

### For Apache

Edit your Apache configuration (usually `/etc/apache2/sites-available/your-site.conf`):

```apache
<VirtualHost *:80>
    ServerName www.digitalcareercenter.com
    ServerAlias digitalcareercenter.com
    
    DocumentRoot /path/to/your/project
    
    # Serve static files directly
    Alias /_next/static /path/to/your/project/.next/static
    <Directory "/path/to/your/project/.next/static">
        Options -Indexes
        AllowOverride None
        Require all granted
        
        # Set correct MIME types
        <FilesMatch "\.css$">
            ForceType text/css
        </FilesMatch>
        <FilesMatch "\.js$">
            ForceType application/javascript
        </FilesMatch>
        <FilesMatch "\.json$">
            ForceType application/json
        </FilesMatch>
    </Directory>
    
    # Serve public folder
    Alias /public /path/to/your/project/public
    <Directory "/path/to/your/project/public">
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>
    
    # Proxy to Next.js server
    ProxyPreserveHost On
    ProxyPass /_next/static !
    ProxyPass /public !
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Headers
    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>
```

### Alternative: Let Next.js Serve Everything

If you can't modify web server config, you can let Next.js serve static files:

1. **Remove `output: 'standalone'`** from `next.config.mjs` (or set it to default)
2. **Rebuild the application:**
   ```bash
   npm run build
   ```
3. **Start Next.js:**
   ```bash
   npm start
   ```
4. **Update web server** to proxy ALL requests to Next.js (including static files):
   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       # ... rest of proxy config
   }
   ```

## Steps to Fix

1. **Identify your web server:**
   ```bash
   # Check if Nginx is running
   systemctl status nginx
   
   # Check if Apache is running
   systemctl status apache2
   ```

2. **Find your configuration file:**
   ```bash
   # For Nginx
   ls -la /etc/nginx/sites-available/
   
   # For Apache
   ls -la /etc/apache2/sites-available/
   ```

3. **Update the configuration** using one of the examples above

4. **Test the configuration:**
   ```bash
   # For Nginx
   sudo nginx -t
   
   # For Apache
   sudo apache2ctl configtest
   ```

5. **Reload the web server:**
   ```bash
   # For Nginx
   sudo systemctl reload nginx
   
   # For Apache
   sudo systemctl reload apache2
   ```

6. **Clear browser cache** and test again

## Verify It's Fixed

1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Check that CSS and JS files load with status 200
5. Check Response Headers - should see `Content-Type: text/css` for CSS files

## Quick Test

Test if static files are accessible directly:

```bash
# Test CSS file
curl -I https://www.digitalcareercenter.com/_next/static/css/1897a25f852f6088.css

# Should return:
# HTTP/1.1 200 OK
# Content-Type: text/css
```

If you get `404` or `400` with `Content-Type: text/html`, the configuration needs to be fixed.

## If Still Not Working

1. **Check file permissions:**
   ```bash
   ls -la /path/to/your/project/.next/static
   # Should be readable by web server user
   ```

2. **Check if files exist:**
   ```bash
   ls -la /path/to/your/project/.next/static/css/
   ls -la /path/to/your/project/.next/static/chunks/
   ```

3. **Check Next.js server logs** for errors

4. **Rebuild the application:**
   ```bash
   cd /path/to/your/project
   rm -rf .next
   npm run build
   ```

## Summary

The issue is that your web server is not configured to serve Next.js static files correctly. Update your Nginx/Apache configuration to serve `_next/static` files directly with correct MIME types, or let Next.js handle everything by proxying all requests to it.

