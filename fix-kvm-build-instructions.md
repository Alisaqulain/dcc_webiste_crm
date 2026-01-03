# How to Fix Build Errors on KVM Server

## Quick Fix Script

I've created a script `fix-kvm-build.sh` that will automatically fix the build errors on your KVM server.

## Method 1: Using the Fix Script (Recommended)

### Step 1: Upload the script to your KVM server

```bash
# On your local machine, copy the script to server
scp fix-kvm-build.sh root@your-server-ip:~/dcc_webiste_crm/
```

### Step 2: Run the script on KVM server

```bash
# SSH into your KVM server
ssh root@your-server-ip

# Navigate to project directory
cd ~/dcc_webiste_crm

# Make script executable
chmod +x fix-kvm-build.sh

# Run the script
bash fix-kvm-build.sh
```

The script will:
1. Pull latest changes from GitHub (if available)
2. Fix corrupted lines in `app/admin/home/page.jsx`
3. Fix corrupted lines in `app/page.js`
4. Verify and fix `tailwind.config.mjs`
5. Install dependencies if needed
6. Build the project

## Method 2: Manual Fix (If script doesn't work)

### Fix 1: app/admin/home/page.jsx line 758

```bash
cd ~/dcc_webiste_crm
sed -i '758s/.*/                      <div className="h-32 flex items-center justify-center text-gray-400">No image<\/div>/' app/admin/home/page.jsx
```

### Fix 2: app/page.js (remove double << characters)

```bash
cd ~/dcc_webiste_crm
sed -i 's/<<h3/<h3/g' app/page.js
sed -i 's/<<div/<div/g' app/page.js
sed -i 's/<<\/div/<\/div/g' app/page.js
```

### Fix 3: tailwind.config.mjs

```bash
cd ~/dcc_webiste_crm
sed -i 's/module.exports =/export default/' tailwind.config.mjs
```

### Then rebuild:

```bash
npm run build
pm2 restart all  # or restart your app process
```

## Method 3: Pull from GitHub (Best if you've committed fixes)

```bash
# On KVM server
cd ~/dcc_webiste_crm
git pull origin main
npm install
npm run build
pm2 restart all
```

## Troubleshooting

If the build still fails:

1. Check the error message - it will tell you which file and line has the issue
2. View the problematic line: `sed -n 'LINE_NUMBERp' app/page.js`
3. Manually edit with nano: `nano app/page.js` (then go to line with Ctrl+_)
4. Check backups: The script creates `.backup` files you can restore from

## Need Help?

If you encounter issues:
1. Check server logs: `pm2 logs`
2. Check build output for specific error messages
3. Verify file permissions: `ls -la app/page.js`










