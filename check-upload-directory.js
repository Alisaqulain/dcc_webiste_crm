// Quick script to check upload directory setup
// Run with: node check-upload-directory.js

const fs = require('fs');
const path = require('path');

console.log('=== Upload Directory Diagnostic ===\n');

const projectRoot = process.cwd();
const uploadsDir = path.join(projectRoot, 'public', 'uploads');

console.log('Project root:', projectRoot);
console.log('Uploads directory:', uploadsDir);
console.log('');

// Check if public directory exists
const publicDir = path.join(projectRoot, 'public');
if (!fs.existsSync(publicDir)) {
  console.log('❌ ERROR: public/ directory does not exist!');
  console.log('   Create it with: mkdir -p public/uploads');
} else {
  console.log('✅ public/ directory exists');
  
  // Check permissions
  try {
    const publicStats = fs.statSync(publicDir);
    console.log('   Permissions:', (publicStats.mode & parseInt('777', 8)).toString(8));
  } catch (e) {
    console.log('   ⚠️  Could not read permissions');
  }
}

console.log('');

// Check if uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.log('❌ ERROR: public/uploads/ directory does not exist!');
  console.log('   Create it with: mkdir -p public/uploads');
  console.log('   Set permissions: chmod 755 public/uploads');
} else {
  console.log('✅ public/uploads/ directory exists');
  
  // Check permissions
  try {
    const stats = fs.statSync(uploadsDir);
    console.log('   Permissions:', (stats.mode & parseInt('777', 8)).toString(8));
    
    // Check if writable
    try {
      const testFile = path.join(uploadsDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('   ✅ Directory is writable');
    } catch (e) {
      console.log('   ❌ Directory is NOT writable:', e.message);
      console.log('   Fix with: chmod 755 public/uploads');
    }
  } catch (e) {
    console.log('   ⚠️  Could not read directory info:', e.message);
  }
  
  // List files
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`   Files in directory: ${files.length}`);
    if (files.length > 0) {
      console.log('   Sample files:', files.slice(0, 5).join(', '));
    }
  } catch (e) {
    console.log('   ⚠️  Could not list files:', e.message);
  }
}

console.log('\n=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('VERCEL:', process.env.VERCEL || 'not set (should be unset on KVM)');
console.log('FORCE_DATA_URL:', process.env.FORCE_DATA_URL || 'not set');

console.log('\n=== Recommendations ===');
if (!fs.existsSync(uploadsDir)) {
  console.log('1. Create upload directory:');
  console.log('   mkdir -p public/uploads');
  console.log('   chmod 755 public/uploads');
  console.log('');
}
console.log('2. Check server logs for upload errors');
console.log('3. Verify Next.js is running from project root');
console.log('4. Check disk space: df -h');

