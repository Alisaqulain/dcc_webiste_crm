const ffmpeg = require('fluent-ffmpeg');
const { writeFile, mkdir } = require('fs/promises');
const { join } = require('path');
const { promisify } = require('util');

// Promisify ffmpeg methods
const ffprobe = promisify(ffmpeg.ffprobe);

/**
 * Generate thumbnail from video file
 * @param {string} videoPath - Path to the video file
 * @param {string} outputPath - Path where thumbnail should be saved
 * @param {number} timeOffset - Time in seconds to capture thumbnail (default: 5)
 * @returns {Promise<string>} - Path to generated thumbnail
 */
async function generateVideoThumbnail(videoPath, outputPath, timeOffset = 5) {
  try {
    // Ensure output directory exists
    const outputDir = join(outputPath, '..');
    await mkdir(outputDir, { recursive: true });

    // Get video duration to ensure we don't exceed it
    const metadata = await ffprobe(videoPath);
    const duration = metadata.format.duration;
    
    // Use 5 seconds or 10% of video duration, whichever is smaller
    const captureTime = Math.min(timeOffset, Math.max(1, duration * 0.1));

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [captureTime],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '320x180' // 16:9 aspect ratio
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully');
          resolve(join(outputDir, 'thumbnail.jpg'));
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          reject(err);
        });
    });
  } catch (error) {
    console.error('Error in generateVideoThumbnail:', error);
    throw error;
  }
}

/**
 * Generate multiple thumbnails from video file
 * @param {string} videoPath - Path to the video file
 * @param {string} outputDir - Directory where thumbnails should be saved
 * @param {number} count - Number of thumbnails to generate (default: 3)
 * @returns {Promise<string[]>} - Array of paths to generated thumbnails
 */
async function generateMultipleThumbnails(videoPath, outputDir, count = 3) {
  try {
    await mkdir(outputDir, { recursive: true });

    // Get video duration
    const metadata = await ffprobe(videoPath);
    const duration = metadata.format.duration;
    
    // Generate timestamps evenly distributed across the video
    const timestamps = [];
    for (let i = 1; i <= count; i++) {
      const time = (duration / (count + 1)) * i;
      timestamps.push(time);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: timestamps,
          filename: 'thumbnail_%i.jpg',
          folder: outputDir,
          size: '320x180'
        })
        .on('end', () => {
          console.log(`${count} thumbnails generated successfully`);
          const thumbnailPaths = timestamps.map((_, index) => 
            join(outputDir, `thumbnail_${index + 1}.jpg`)
          );
          resolve(thumbnailPaths);
        })
        .on('error', (err) => {
          console.error('Error generating thumbnails:', err);
          reject(err);
        });
    });
  } catch (error) {
    console.error('Error in generateMultipleThumbnails:', error);
    throw error;
  }
}

/**
 * Get video metadata
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<Object>} - Video metadata
 */
async function getVideoMetadata(videoPath) {
  try {
    const metadata = await ffprobe(videoPath);
    return {
      duration: metadata.format.duration,
      width: metadata.streams[0].width,
      height: metadata.streams[0].height,
      bitrate: metadata.format.bit_rate,
      codec: metadata.streams[0].codec_name,
      format: metadata.format.format_name
    };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    throw error;
  }
}

module.exports = {
  generateVideoThumbnail,
  generateMultipleThumbnails,
  getVideoMetadata
};
