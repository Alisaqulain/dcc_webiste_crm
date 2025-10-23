import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

// Verify admin token
const verifyAdminToken = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export default async function handler(req, res) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const admin = verifyAdminToken(req);
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return await getCourseVideos(req, res, id);
      case 'POST':
        return await addVideo(req, res, id);
      case 'PUT':
        return await updateVideo(req, res, id);
      case 'DELETE':
        return await deleteVideo(req, res, id);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(401).json({ message: error.message });
  }
}

// Get all videos for a course
async function getCourseVideos(req, res, courseId) {
  try {
    const course = await Course.findById(courseId).select('videos title');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Sort videos by order
    const sortedVideos = course.videos.sort((a, b) => a.order - b.order);

    res.status(200).json({
      courseTitle: course.title,
      videos: sortedVideos
    });
  } catch (error) {
    console.error('Error fetching course videos:', error);
    res.status(500).json({ message: 'Error fetching course videos' });
  }
}

// Add a new video to a course
async function addVideo(req, res, courseId) {
  try {
    const {
      title,
      description = '',
      youtubeUrl,
      duration,
      isPreview = false
    } = req.body;

    // Validate required fields
    if (!title || !youtubeUrl || !duration) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, youtubeUrl, and duration are required' 
      });
    }

    // Validate YouTube URL
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return res.status(400).json({ 
        message: 'Please provide a valid YouTube URL' 
      });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the next order number
    const nextOrder = course.videos.length > 0 
      ? Math.max(...course.videos.map(v => v.order)) + 1 
      : 1;

    const newVideo = {
      title,
      description,
      youtubeUrl,
      duration,
      order: nextOrder,
      isPreview
    };

    course.videos.push(newVideo);
    await course.save();

    res.status(201).json({
      message: 'Video added successfully',
      video: newVideo
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ message: 'Error adding video' });
  }
}

// Update a video in a course
async function updateVideo(req, res, courseId) {
  try {
    const { videoId } = req.body;
    const updateData = req.body;
    
    // Remove videoId from updateData
    delete updateData.videoId;

    // Validate YouTube URL if provided
    if (updateData.youtubeUrl) {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
      if (!youtubeRegex.test(updateData.youtubeUrl)) {
        return res.status(400).json({ 
          message: 'Please provide a valid YouTube URL' 
        });
      }
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);
    
    if (videoIndex === -1) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Update video
    Object.assign(course.videos[videoIndex], updateData);
    await course.save();

    res.status(200).json({
      message: 'Video updated successfully',
      video: course.videos[videoIndex]
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Error updating video' });
  }
}

// Delete a video from a course
async function deleteVideo(req, res, courseId) {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const videoIndex = course.videos.findIndex(v => v._id.toString() === videoId);
    
    if (videoIndex === -1) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Remove video
    course.videos.splice(videoIndex, 1);
    await course.save();

    res.status(200).json({
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video' });
  }
}
