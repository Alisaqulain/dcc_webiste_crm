// Chunked upload utility for large files
export class ChunkedUploader {
  constructor(file, options = {}) {
    this.file = file;
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.headers = options.headers || {};
  }

  async upload() {
    try {
      const totalChunks = Math.ceil(this.file.size / this.chunkSize);
      console.log(`Starting chunked upload: ${totalChunks} chunks of ${this.chunkSize} bytes each`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', this.file.name);
        formData.append('fileType', this.file.type);
        formData.append('fileSize', this.file.size.toString());

        // Add additional form data for the first chunk
        if (i === 0) {
          const additionalData = this.getAdditionalFormData();
          Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
          });
        }

        console.log(`Uploading chunk ${i + 1}/${totalChunks}`);

        const response = await fetch('/api/admin/video-upload-chunk', {
          method: 'POST',
          headers: {
            ...this.headers,
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to upload chunk ${i + 1}`);
        }

        const result = await response.json();
        console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully`);

        // Update progress
        const progress = ((i + 1) / totalChunks) * 100;
        this.onProgress(progress, result.message);

        // If this is the last chunk, the upload is complete
        if (i === totalChunks - 1) {
          console.log('All chunks uploaded successfully');
          this.onSuccess(result);
          return result;
        }
      }
    } catch (error) {
      console.error('Chunked upload error:', error);
      this.onError(error);
      throw error;
    }
  }

  // Override this method to add additional form data
  getAdditionalFormData() {
    return {};
  }
}

// Utility function to check if chunked upload is needed
export function shouldUseChunkedUpload(file, maxSize = 5 * 1024 * 1024) { // 5MB default for Vercel
  return file.size > maxSize;
}

// Utility function to get optimal chunk size based on file size
export function getOptimalChunkSize(fileSize) {
  if (fileSize < 10 * 1024 * 1024) { // < 10MB
    return 512 * 1024; // 512KB - conservative for Vercel
  } else if (fileSize < 50 * 1024 * 1024) { // < 50MB
    return 1024 * 1024; // 1MB
  } else { // >= 50MB
    return 2 * 1024 * 1024; // 2MB
  }
}
