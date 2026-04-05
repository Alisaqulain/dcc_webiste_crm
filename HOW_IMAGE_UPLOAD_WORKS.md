# How Image Upload Works in This Application

## Overview
This application uses a **file-based storage system** that saves images directly to the server's filesystem. The upload process involves the frontend, API route, and storage service.

## Complete Upload Flow

### 1. Frontend (User Selects Image)

When a user selects an image file (e.g., in admin panel for courses, blogs, ID cards, etc.):

```javascript
// Example from app/admin/home/page.jsx
const uploadImage = async (file) => {
  const form = new FormData();
  form.append('file', file);
  
  const res = await fetch('/api/upload', { 
    method: 'POST', 
    body: form 
  });
  
  const data = await res.json();
  // Returns: { success: true, url: '/uploads/1234567890-filename.jpg', ... }
}
```

**What happens:**
- User selects an image file from their computer
- Frontend creates a `FormData` object
- File is appended to the form with key `'file'`
- POST request is sent to `/api/upload`

---

### 2. API Route (`app/api/upload/route.js`)

The API route receives the file and validates it:

```javascript
export async function POST(request) {
  // 1. Extract file from FormData
  const data = await request.formData();
  const file = data.get('file');
  
  // 2. Validate file type (only images allowed)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return error response;
  }
  
  // 3. Validate file size (default max 20MB)
  const maxMb = Number(process.env.UPLOAD_MAX_MB || 20);
  if (file.size > maxSize) {
    return error response;
  }
  
  // 4. Force filesystem mode (for KVM hosting)
  storageService.isServerless = false;
  
  // 5. Upload using storage service
  const result = await storageService.uploadFile(file, 'uploads');
  
  // 6. Verify file was saved
  if (!result.isDataUrl) {
    // Check if file exists on filesystem
    const filepath = join(process.cwd(), 'public', 'uploads', result.filename);
    if (!existsSync(filepath)) {
      throw error;
    }
  }
  
  // 7. Return success response
  return NextResponse.json({
    success: true,
    url: result.url,  // e.g., '/uploads/1761758075136-images.jpeg'
    filename: result.filename,
    size: result.size
  });
}
```

**Key validations:**
- ✅ File type must be an image (jpeg, jpg, png, gif, webp)
- ✅ File size must be ≤ 20MB (configurable via `UPLOAD_MAX_MB` env var)
- ✅ Forces filesystem mode (saves to disk, not data URLs)

---

### 3. Storage Service (`lib/storage.js`)

The storage service handles the actual file saving:

```javascript
async uploadFile(file, folder = 'uploads') {
  // 1. Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // 2. Generate unique filename with timestamp
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  // Example: '1761758075136-images.jpeg'
  
  // 3. Determine storage method
  // On KVM: Always use filesystem
  // On Vercel: Use data URLs (base64)
  
  if (!this.isServerless) {
    // KVM hosting: Save to filesystem
    return await this.uploadToFileSystem(buffer, filename, folder);
  } else {
    // Vercel/serverless: Convert to base64 data URL
    return this.uploadToDataUrl(buffer, file.type, filename);
  }
}
```

---

### 4. File System Upload (`uploadToFileSystem`)

For KVM hosting, files are saved to disk:

```javascript
async uploadToFileSystem(buffer, filename, folder) {
  // 1. Create directory path
  const uploadsDir = join(process.cwd(), 'public', folder);
  // Example: '/root/dcc_webiste_crm/public/uploads'
  
  // 2. Create directory if it doesn't exist
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
  
  // 3. Write file to disk
  const filepath = join(uploadsDir, filename);
  await writeFile(filepath, buffer);
  
  // 4. Verify file was written correctly
  const stats = statSync(filepath);
  if (stats.size !== buffer.length) {
    throw new Error('File size mismatch');
  }
  
  // 5. Return result with URL
  return {
    success: true,
    url: `/${folder}/${filename}`,  // '/uploads/1761758075136-images.jpeg'
    filename: filename,
    isDataUrl: false,
    size: buffer.length,
    filepath: filepath
  };
}
```

**File location:**
- **Path:** `public/uploads/`
- **Full path:** `/root/dcc_webiste_crm/public/uploads/`
- **URL:** `https://www.digitalcareercenter.com/uploads/filename.jpg`

---

### 5. Response to Frontend

The API returns:

```json
{
  "success": true,
  "url": "/uploads/1761758075136-images.jpeg",
  "filename": "1761758075136-images.jpeg",
  "isDataUrl": false,
  "size": 245678
}
```

**Frontend uses the URL:**
- Saves it to database (e.g., course image, blog featured image)
- Displays it in the UI: `<img src="/uploads/1761758075136-images.jpeg" />`

---

## Storage Modes

### Filesystem Mode (KVM - Current Setup)
- **Location:** `public/uploads/` directory on server
- **URL Format:** `/uploads/filename.jpg`
- **Pros:** 
  - Fast access
  - No database storage needed
  - Works well with traditional hosting
- **Cons:**
  - Requires Nginx configuration to serve files
  - Files are stored on server disk

### Data URL Mode (Vercel/Serverless)
- **Location:** Base64 encoded in database
- **URL Format:** `data:image/jpeg;base64,/9j/4AAQSkZJRg...`
- **Pros:**
  - Works on serverless platforms
  - No file system needed
- **Cons:**
  - Increases database size
  - Not suitable for large files (MongoDB 16MB limit)

**Current Setup:** Always uses filesystem mode on KVM (forced in upload route)

---

## File Naming Convention

Files are renamed with a timestamp prefix to avoid conflicts:

```
Original: "my-image.jpg"
Saved as: "1761758075136-my-image.jpg"
         └─┬─┘ └─────┬─────┘
      timestamp   original name
```

**Why?**
- Prevents filename collisions
- Ensures unique filenames
- Timestamp helps with sorting/identification

---

## Complete Example Flow

### Step-by-Step:

1. **User selects image:** `images.jpeg` (2.5 MB)

2. **Frontend sends to API:**
   ```
   POST /api/upload
   Content-Type: multipart/form-data
   Body: FormData with file
   ```

3. **API validates:**
   - ✅ File type: `image/jpeg` (allowed)
   - ✅ File size: 2.5 MB (≤ 20 MB limit)

4. **Storage service processes:**
   - Converts to buffer
   - Generates filename: `1761758075136-images.jpeg`
   - Saves to: `public/uploads/1761758075136-images.jpeg`

5. **API verifies:**
   - Checks file exists on disk
   - Confirms file size matches

6. **Response sent:**
   ```json
   {
     "success": true,
     "url": "/uploads/1761758075136-images.jpeg"
   }
   ```

7. **Frontend receives:**
   - Saves URL to database
   - Displays image: `<img src="/uploads/1761758075136-images.jpeg" />`

8. **Browser requests image:**
   ```
   GET https://www.digitalcareercenter.com/uploads/1761758075136-images.jpeg
   ```
   - Nginx serves file directly (if configured correctly)
   - Image displays in browser ✅

---

## Configuration

### Environment Variables

```bash
# Maximum upload size (default: 20MB)
UPLOAD_MAX_MB=20

# Force data URL mode (for Vercel)
FORCE_DATA_URL=1

# Vercel detection (auto-detected)
VERCEL=1
```

### File Permissions

On KVM server, ensure proper permissions:

```bash
# Directory permissions
chmod 755 public/uploads

# File permissions
chmod 644 public/uploads/*
```

---

## Troubleshooting

### Images Upload But Return 404

**Problem:** File is saved but browser can't access it.

**Solution:** Configure Nginx to serve `/uploads` directly:
```nginx
location /uploads {
    alias /root/dcc_webiste_crm/public/uploads;
    expires 30d;
    add_header Cache-Control "public";
}
```

See `KVM_IMAGE_UPLOAD_FIX.md` for detailed fix.

### Upload Fails with Permission Error

**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Fix directory permissions
chmod 755 public/uploads
chown -R $USER:$USER public/uploads
```

### File Too Large Error

**Problem:** `File size too large. Maximum size is 20MB.`

**Solution:** Increase limit in `.env`:
```bash
UPLOAD_MAX_MB=50
```

---

## Where Uploads Are Used

Image uploads are used in multiple admin pages:

1. **Courses** (`app/admin/courses/page.jsx`)
   - Course thumbnail images
   - Package images

2. **Blogs** (`app/admin/blogs/page.jsx`)
   - Featured images
   - Author avatars

3. **ID Cards** (`app/admin/idcards/page.jsx`)
   - Student photos

4. **Certificates** (`app/admin/certificates/page.jsx`)
   - Certificate templates

5. **Homepage** (`app/admin/home/page.jsx`)
   - Banner images
   - Section images

All use the same `/api/upload` endpoint!

---

## Summary

```
User selects image
    ↓
Frontend creates FormData
    ↓
POST /api/upload
    ↓
API validates (type, size)
    ↓
Storage Service processes
    ↓
File saved to public/uploads/
    ↓
API returns URL: /uploads/filename.jpg
    ↓
Frontend saves URL to database
    ↓
Image displayed via URL
    ↓
Nginx serves file (if configured)
```

**Key Points:**
- ✅ Files saved to `public/uploads/` directory
- ✅ Filenames prefixed with timestamp
- ✅ Always uses filesystem mode on KVM
- ✅ Requires Nginx config to serve files
- ✅ Max size: 20MB (configurable)
- ✅ Only image types allowed

