const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Course schema (simplified for migration)
const courseSchema = new mongoose.Schema({
  videos: [{
    title: String,
    description: String,
    youtubeUrl: String,
    videoPath: String,
    duration: String,
    order: Number,
    isPreview: Boolean,
    fileSize: Number,
    mimeType: String,
    uploadedAt: Date,
    createdAt: Date
  }]
});

const Course = mongoose.model('Course', courseSchema);

async function migrateVideos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dcc');
    console.log('Connected to MongoDB');

    // Find all courses with videos
    const courses = await Course.find({ videos: { $exists: true, $ne: [] } });
    console.log(`Found ${courses.length} courses with videos`);

    for (const course of courses) {
      let needsUpdate = false;
      
      for (const video of course.videos) {
        // If video has youtubeUrl but no videoPath, it's an old YouTube video
        if (video.youtubeUrl && !video.videoPath) {
          console.log(`Course "${course.title}" - Video "${video.title}" is a YouTube video (keeping as is)`);
        }
        // If video has videoPath but no youtubeUrl, it's a new uploaded video
        else if (video.videoPath && !video.youtubeUrl) {
          console.log(`Course "${course.title}" - Video "${video.title}" is an uploaded video (keeping as is)`);
        }
        // If video has both or neither, it needs fixing
        else if ((video.youtubeUrl && video.videoPath) || (!video.youtubeUrl && !video.videoPath)) {
          console.log(`Course "${course.title}" - Video "${video.title}" has invalid configuration, fixing...`);
          
          if (video.videoPath) {
            // Prefer videoPath over youtubeUrl
            video.youtubeUrl = undefined;
            console.log(`  -> Removed youtubeUrl, keeping videoPath`);
          } else if (video.youtubeUrl) {
            // Keep youtubeUrl if no videoPath
            console.log(`  -> Keeping youtubeUrl`);
          } else {
            // If neither exists, this is an invalid video - remove it
            console.log(`  -> Removing invalid video (no youtubeUrl or videoPath)`);
            course.videos = course.videos.filter(v => v._id.toString() !== video._id.toString());
          }
          
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await course.save();
        console.log(`Updated course: ${course.title}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateVideos();
