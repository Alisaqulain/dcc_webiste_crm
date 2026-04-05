import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';
import { cleanupExpiredCrmFiles } from '@/lib/services/crmFileCleanup';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  try {
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return true;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    // Verify admin token
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    // Remove CRM files older than 30 days (disk + DB) whenever an admin loads this list
    try {
      await cleanupExpiredCrmFiles(30);
    } catch (cleanupErr) {
      console.error('CRM purchasers: auto cleanup failed:', cleanupErr);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // First, find all courses with CRM access
    const crmCourses = await Course.find({ hasCrmAccess: true }).select('_id title');
    const crmCourseIds = crmCourses.map(c => c._id);

    console.log('CRM Courses found:', crmCourses.length, crmCourses.map(c => ({ id: c._id, title: c.title })));

    if (crmCourseIds.length === 0) {
      return Response.json({
        users: [],
        totalUsers: 0,
        currentPage: page,
        totalPages: 0,
        message: 'No courses with CRM access found. Please enable CRM access for at least one course.'
      });
    }

    // Convert to strings for comparison
    const crmCourseIdStrings = crmCourseIds.map(id => id.toString());

    // Build search query - find users who have any of these course IDs in their courses array
    let searchQuery = {
      'courses.courseId': { $in: crmCourseIds }
    };

    if (search) {
      searchQuery = {
        $and: [
          {
            'courses.courseId': { $in: crmCourseIds }
          },
          {
            $or: [
              { email: { $regex: search, $options: 'i' } },
              { 'profile.firstName': { $regex: search, $options: 'i' } },
              { 'profile.lastName': { $regex: search, $options: 'i' } },
              { 'profile.mobile': { $regex: search, $options: 'i' } }
            ]
          }
        ]
      };
    }

    // Get total count
    const totalUsers = await User.countDocuments(searchQuery);

    // Use native MongoDB driver to get users (Mongoose might not return nested objects correctly)
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Get users with pagination
    const users = await usersCollection
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Users found:', users.length);

    // Populate course details and filter to only show CRM courses
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // Get course details for this user
      const courseIds = (user.courses || []).map(c => c.courseId);
      const courses = await Course.find({ _id: { $in: courseIds } }).select('title hasCrmAccess');
      
      const crmPurchases = courses
        .filter(c => crmCourseIdStrings.includes(c._id.toString()))
        .map(c => {
          const purchase = user.courses.find(p => p.courseId.toString() === c._id.toString());
          return {
            courseId: c._id,
            title: c.title,
            purchasedAt: purchase?.purchasedAt || user.createdAt
          };
        });

      return {
        _id: user._id,
        email: user.email,
        profile: user.profile,
        crmCourses: crmPurchases,
        crmFiles: user.crmFiles || [], // Array of files
        crmFile: user.crmFile || (user.crmFiles && user.crmFiles.length > 0 ? user.crmFiles[user.crmFiles.length - 1] : null), // Latest file for backward compatibility
        crmFileDownloaded: user.crmFileDownloaded || false,
        crmFileDownloadedAt: user.crmFileDownloadedAt,
        createdAt: user.createdAt
      };
    }));

    return Response.json({
      users: formattedUsers,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit)
    });

  } catch (error) {
    console.error('Admin CRM purchasers API error:', error);
    return Response.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}

