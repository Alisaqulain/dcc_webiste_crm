// Universal storage service that works on both Vercel and KVM hosting

export class StorageService {
  constructor() {
    this.isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async uploadFile(file, folder = 'uploads') {
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;

      console.log('Uploading file:', filename, 'Size:', file.size, 'Type:', file.type);

      if (this.isServerless) {
        // For Vercel/serverless: Use data URLs or cloud storage
        return this.uploadToDataUrl(buffer, file.type, filename);
      } else {
        // For KVM/traditional hosting: Use file system
        return this.uploadToFileSystem(buffer, filename, folder);
      }
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadToDataUrl(buffer, mimeType, filename) {
    // Convert to base64 data URL
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    const result = {
      success: true,
      url: dataUrl,
      filename: filename,
      isDataUrl: true,
      size: buffer.length
    };
    
    console.log('File uploaded as data URL:', filename);
    
    return result;
  }

  async uploadToFileSystem(buffer, filename, folder) {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', folder);
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const filepath = join(uploadsDir, filename);
      await writeFile(filepath, buffer);

      const result = {
        success: true,
        url: `/${folder}/${filename}`,
        filename: filename,
        isDataUrl: false,
        size: buffer.length
      };
      
      console.log('File uploaded to file system:', filename);
      
      return result;
    } catch (error) {
      console.error('File system upload error, falling back to data URL:', error);
      // Fallback to data URL if file system fails
      return this.uploadToDataUrl(buffer, 'application/octet-stream', filename);
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
