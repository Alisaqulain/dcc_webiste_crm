# 🔴 URGENT: Fix Localhost URLs in Production

## The Problem

Your production site is generating OAuth callback URLs with `http://localhost:3000` instead of your actual domain. This happens because the `NEXTAUTH_URL` environment variable is not set correctly on your KVM server.

## ✅ IMMEDIATE FIX (Do This NOW!)

### Step 1: SSH into Your KVM Server
```bash
ssh your-username@your-server-ip
cd /path/to/your/project
```

### Step 2: Check Current Environment Variables
```bash
cat .env
```

### Step 3: Update NEXTAUTH_URL

**If you have a .env file:**
```bash
nano .env
```

**If you DON'T have a .env file, create one:**
```bash
cp env.example .env
nano .env
```

### Step 4: Set These CRITICAL Variables

Add or update these lines in your `.env` file:

```env
# ⚠️ CRITICAL: Change this to your ACTUAL domain
NEXTAUTH_URL=https://your-actual-domain.com

# Generate a secret key (run this command):
# openssl rand -base64 32
NEXTAUTH_SECRET=paste-your-generated-secret-here

# Your production MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dcc

# Google OAuth (important!)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Environment
NODE_ENV=production
```

### Step 5: Save and Exit
Press `Ctrl + X`, then `Y`, then `Enter`

### Step 6: Restart Your Application
```bash
# If using PM2:
pm2 restart all

# If using systemd:
sudo systemctl restart your-app-name

# Or just restart the Node process
```

### Step 7: Rebuild the Application
```bash
npm run build
npm start
```

## 🔍 Verify Your Domain

After updating, verify your environment variables are loaded:

```bash
# Check if NEXTAUTH_URL is correct
cat .env | grep NEXTAUTH_URL

# Or check the config endpoint
curl https://yourdomain.com/api/check-config
```

## ⚙️ Update Google OAuth Settings

**THIS IS ALSO CRITICAL!**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client
3. Under "Authorized JavaScript origins", add:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
4. Under "Authorized redirect URIs", add:
   ```
   https://yourdomain.com/api/auth/callback/google
   https://www.yourdomain.com/api/auth/callback/google
   ```
5. Click **Save**

## 🧪 Test It

1. Visit your site: `https://yourdomain.com/login`
2. Click "Sign in with Google"
3. **Check the browser address bar** - it should say `https://yourdomain.com/api/auth/callback/google` NOT `http://localhost:3000`
4. Complete the OAuth flow

## ❌ Still Not Working?

### Check 1: Environment Variables Loading
```bash
# Restart and check logs
pm2 logs | grep NEXTAUTH_URL

# Or check if file exists
ls -la .env
```

### Check 2: Clear Cache and Rebuild
```bash
rm -rf .next
npm run build
pm2 restart all
```

### Check 3: Verify HTTPS
Make sure your domain has SSL enabled. NextAuth requires HTTPS in production.

### Check 4: Check Application Logs
```bash
pm2 logs
# Look for any errors related to NEXTAUTH_URL or OAuth
```

## 🎯 Common Mistakes to Avoid

1. ❌ **Don't include trailing slash**: Use `https://yourdomain.com` NOT `https://yourdomain.com/`
2. ❌ **Don't use http**: Use `https://` for production
3. ❌ **Don't forget to restart**: After changing .env, ALWAYS restart your app
4. ❌ **Don't set to localhost**: NEVER use `http://localhost:3000` in production .env

## 📝 Example .env File

Here's what your production `.env` should look like:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dcc

# Auth - THIS IS THE CRITICAL ONE
NEXTAUTH_URL=https://www.digitalcareercenter.com
NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=Dcchelp1@gmail.com
EMAIL_PASS=your-app-password

# Payment
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Environment
NODE_ENV=production
```

## 🚀 Final Checklist

- [ ] Created/updated `.env` file on production server
- [ ] Set `NEXTAUTH_URL=https://your-actual-domain.com`
- [ ] Generated and set strong `NEXTAUTH_SECRET`
- [ ] Updated Google OAuth credentials in Google Cloud Console
- [ ] Restarted application (pm2 restart / systemctl restart)
- [ ] Rebuilt the app (`npm run build`)
- [ ] Tested OAuth login on production
- [ ] Verified URLs don't contain localhost

## 📞 Need More Help?

If it's still not working after following these steps exactly:

1. Share your `.env` file (without secrets) - replace sensitive data with `***`
2. Share application logs: `pm2 logs`
3. Share the exact error message you see

---

**Remember**: The fix I applied to your code adds `trustHost: true` to NextAuth configuration, which tells NextAuth to trust the proxy and detect the correct host. But you MUST still set `NEXTAUTH_URL` in your `.env` file!

