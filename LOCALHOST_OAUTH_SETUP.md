# Setting Up Google OAuth for Localhost Testing

## The Problem
Google OAuth is redirecting to production domain (`https://www.digitalcareercenter.com`) instead of localhost (`http://localhost:3000`).

## Solution Steps

### 1. Update Your .env File
Make sure your `.env` file has:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Add Localhost to Google Cloud Console ⚠️ CRITICAL

**You MUST add localhost URLs to your Google OAuth settings:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:3000
   ```
5. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Click **Save**

### 3. Restart Your Development Server
After updating:
```bash
# Stop your server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Test the Flow
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. The callback should return to: `http://localhost:3000/api/auth/callback/google`

## Important Notes

- **You can have BOTH production and localhost** in your Google OAuth settings
- Production domains should remain: `https://www.digitalcareercenter.com`
- Add localhost alongside production for testing
- Make sure to use `http://` (not `https://`) for localhost

## If Still Not Working

1. **Clear browser cache** - OAuth tokens might be cached
2. **Use incognito/private window** for testing
3. **Check console logs** - Look for any OAuth errors
4. **Verify .env is loaded** - Check if `process.env.NEXTAUTH_URL` is correct

## Example Google OAuth Console Settings

**Authorized JavaScript origins:**
```
http://localhost:3000
https://www.digitalcareercenter.com
https://digitalcareercenter.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://www.digitalcareercenter.com/api/auth/callback/google
https://digitalcareercenter.com/api/auth/callback/google
```
