const { writeFile, mkdir } = require('fs/promises');
const { join } = require('path');

/**
 * Generate a simple thumbnail placeholder for videos
 * This is a fallback when FFmpeg is not available
 * @param {string} videoPath - Path to the video file
 * @param {string} outputPath - Path where thumbnail should be saved
 * @returns {Promise<string>} - Path to generated thumbnail
 */
async function generateVideoThumbnailFallback(videoPath, outputPath) {
  try {
    // Ensure output directory exists
    const outputDir = join(outputPath, '..');
    await mkdir(outputDir, { recursive: true });

    // Create a simple SVG thumbnail placeholder
    const svgContent = `
      <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)"/>
        <circle cx="160" cy="90" r="30" fill="white" fill-opacity="0.9"/>
        <polygon points="150,75 150,105 180,90" fill="#3B82F6"/>
        <text x="160" y="130" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Video Thumbnail</text>
      </svg>
    `;

    // Save as SVG
    await writeFile(outputPath.replace('.jpg', '.svg'), svgContent);
    
    console.log('Fallback thumbnail generated:', outputPath.replace('.jpg', '.svg'));
    return outputPath.replace('.jpg', '.svg');
  } catch (error) {
    console.error('Error generating fallback thumbnail:', error);
    throw error;
  }
}

/**
 * Check if FFmpeg is available
 * @returns {Promise<boolean>} - True if FFmpeg is available
 */
async function isFFmpegAvailable() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateVideoThumbnailFallback,
  isFFmpegAvailable
};
