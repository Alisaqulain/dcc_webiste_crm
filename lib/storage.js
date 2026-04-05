// Universal storage service that works on both Vercel and KVM hosting

export class StorageService {
  constructor() {
    // On KVM, we're not on Vercel, so use filesystem
    // Only use data URLs if explicitly on Vercel
    this.isServerless = process.env.VERCEL === '1';
    this.forceDataUrl = process.env.FORCE_DATA_URL === '1';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Force filesystem mode on KVM hosting (not Vercel)
    // If VERCEL env var is not set, assume we're on KVM and use filesystem
    if (this.forceDataUrl) {
      console.log('Storage Service: FORCE_DATA_URL enabled → using data URL mode');
      this.isServerless = true;
    } else if (!this.isServerless) {
      // Always use filesystem on non-Vercel hosting
      this.isServerless = false;
      console.log('Storage Service: Using filesystem mode (KVM hosting)');
    } else {
      console.log('Storage Service: Using data URL mode (Vercel/serverless)');
    }
  }

  async uploadFile(file, folder = 'uploads') {
    try {
      console.log('Storage service - Starting file upload:', {
        filename: file.name,
        originalSize: file.size,
        originalSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        type: file.type,
        isServerless: this.isServerless,
        folder
      });

      const bytes = await file.arrayBuffer();
      console.log('Storage service - File converted to arrayBuffer');
      
      const buffer = Buffer.from(bytes);
      console.log('Storage service - Buffer created, size:', buffer.length);
      
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;

      // For videos, ALWAYS use filesystem (never data URLs) to avoid MongoDB 16MB limit
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo || !this.isServerless) {
        console.log('Storage service - Using file system method (KVM or video file)');
        // For KVM/traditional hosting or videos: Use file system
        return await this.uploadToFileSystem(buffer, filename, folder);
      } else {
        console.log('Storage service - Using data URL method (serverless, non-video)');
        // For Vercel/serverless with non-video files: Use data URLs
        return this.uploadToDataUrl(buffer, file.type, filename);
      }
    } catch (error) {
      console.error('Storage upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error('Failed to upload file: ' + error.message);
    }
  }

  async uploadToDataUrl(buffer, mimeType, filename) {
    console.log('Converting to base64 data URL:', {
      bufferSize: buffer.length,
      bufferSizeMB: (buffer.length / (1024 * 1024)).toFixed(2) + 'MB',
      mimeType: mimeType
    });
    
    // Convert to base64 data URL
    const base64Data = buffer.toString('base64');
    console.log('Base64 conversion completed, size:', base64Data.length);
    
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    console.log('Data URL created, total size:', dataUrl.length);
    
    const result = {
      success: true,
      url: dataUrl,
      filename: filename,
      isDataUrl: true,
      size: buffer.length
    };
    
    console.log('File uploaded as data URL:', filename, 'Final size:', dataUrl.length);
    
    return result;
  }

  async uploadToFileSystem(buffer, filename, folder) {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', folder);
      console.log('Storage Service: Upload directory:', uploadsDir);
      
      if (!existsSync(uploadsDir)) {
        console.log('Storage Service: Creating directory:', uploadsDir);
        await mkdir(uploadsDir, { recursive: true });
        console.log('Storage Service: Directory created successfully');
      }

      const filepath = join(uploadsDir, filename);
      console.log('Storage Service: Writing file to:', filepath);
      
      // Ensure directory exists and has write permissions
      try {
        await writeFile(filepath, buffer);
        console.log('Storage Service: File written successfully');
        
        // Verify file was written
        const { statSync } = await import('fs');
        const stats = statSync(filepath);
        console.log('Storage Service: File verified, size:', stats.size, 'bytes');
        
        if (stats.size !== buffer.length) {
          throw new Error(`File size mismatch: expected ${buffer.length} bytes, got ${stats.size} bytes`);
        }
      } catch (writeError) {
        console.error('Storage Service: File write error:', {
          message: writeError.message,
          code: writeError.code,
          path: filepath,
          directoryExists: existsSync(uploadsDir),
          directoryWritable: existsSync(uploadsDir) // Basic check
        });
        throw writeError;
      }

      const result = {
        success: true,
        url: `/${folder}/${filename}`,
        filename: filename,
        isDataUrl: false,
        size: buffer.length,
        filepath: filepath // Include filepath for verification
      };
      
      console.log('Storage Service: File uploaded to filesystem:', {
        filename,
        url: result.url,
        size: buffer.length,
        folder
      });
      
      return result;
    } catch (error) {
      console.error('Storage Service: File system upload error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // Don't fallback to data URL on KVM - this is an error that needs fixing
      throw new Error(`Failed to save file to filesystem: ${error.message}`);
    }
  }

  // For future cloud storage integration
  async uploadToCloudStorage(buffer, filename, folder) {
    // This can be implemented with AWS S3, Cloudinary, etc.
    // For now, fallback to data URL
    return this.uploadToDataUrl(buffer, 'application/octet-stream', filename);
  }

  // Get file info
  getFileInfo(url) {
    if (url.startsWith('data:')) {
      return {
        isDataUrl: true,
        type: url.split(';')[0].split(':')[1],
        size: this.getDataUrlSize(url)
      };
    } else {
      return {
        isDataUrl: false,
        type: this.getFileTypeFromUrl(url),
        size: null
      };
    }
  }

  getDataUrlSize(dataUrl) {
    // Approximate size calculation for base64 data
    const base64Data = dataUrl.split(',')[1];
    return Math.round((base64Data.length * 3) / 4);
  }

  /**
   * Delete a file under public/ given a URL path like /uploads/foo.jpg or /crm-files/users/id/file.xlsx
   */
  async deletePublicPath(publicUrl) {
    if (!publicUrl || typeof publicUrl !== 'string' || publicUrl.startsWith('data:')) {
      return { deleted: false, reason: 'skip-data-or-empty' };
    }
    let pathPart = publicUrl.split('?')[0];
    if (pathPart.startsWith('/')) pathPart = pathPart.slice(1);
    if (!pathPart || pathPart.includes('..')) {
      return { deleted: false, reason: 'invalid-path' };
    }
    const { join, normalize } = await import('path');
    const { unlink } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const publicRoot = join(process.cwd(), 'public');
    const filepath = normalize(join(publicRoot, pathPart));
    if (!filepath.startsWith(publicRoot)) {
      return { deleted: false, reason: 'path-escape' };
    }
    if (!existsSync(filepath)) {
      return { deleted: false, reason: 'not-found' };
    }
    await unlink(filepath);
    return { deleted: true };
  }

  getFileTypeFromUrl(url) {
    const extension = url.split('.').pop().split('?')[0];
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

// Export singleton instance
export const storageService = new StorageService();
