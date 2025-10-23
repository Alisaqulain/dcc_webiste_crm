// Test Setup Script for Course Management System
// Run this script to create test data for testing

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const Course = require('../models/Course');
const Admin = require('../models/Admin');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestData = async () => {
  try {
    await connectDB();

    // Create test admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'admin@test.com',
        password: 'admin123', // This will be hashed
        name: 'Test Admin'
      });
      await admin.save();
      console.log('✅ Test admin created: admin@test.com / admin123');
    } else {
      console.log('✅ Test admin already exists');
    }

    // Create test courses
    const testCourses = [
      {
        title: 'Complete Digital Marketing Course',
        description: 'Master digital marketing from beginner to advanced level. Learn SEO, social media marketing, Google Ads, and more.',
        shortDescription: 'Master digital marketing with practical projects',
        price: 2999,
        originalPrice: 4999,
        category: 'Digital Marketing',
        level: 'Beginner',
        duration: '6 weeks',
        language: 'English',
        instructor: {
          name: 'John Smith',
          bio: 'Digital Marketing Expert with 10+ years experience'
        },
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
        features: [
          'Live Projects',
          'Certificate of Completion',
          'Lifetime Access',
          '24/7 Support',
          'Mobile App Access'
        ],
        requirements: [
          'Basic computer knowledge',
          'Internet connection',
          'Dedication to learn'
        ],
        whatYouWillLearn: [
          'SEO optimization techniques',
          'Social media marketing strategies',
          'Google Ads management',
          'Content marketing',
          'Analytics and reporting'
        ],
        tags: ['digital-marketing', 'seo', 'social-media', 'google-ads'],
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 0
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Learn full-stack web development with modern technologies. Build real-world projects and land your dream job.',
        shortDescription: 'Complete web development course with projects',
        price: 4999,
        originalPrice: 7999,
        category: 'Web Development',
        level: 'Intermediate',
        duration: '12 weeks',
        language: 'English',
        instructor: {
          name: 'Sarah Johnson',
          bio: 'Full-stack Developer and Tech Lead'
        },
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
        features: [
          'Real-world Projects',
          'Job Placement Assistance',
          'Code Reviews',
          'Portfolio Building',
          'Interview Preparation'
        ],
        requirements: [
          'Basic programming knowledge',
          'Computer with internet',
          'Time commitment: 20 hours/week'
        ],
        whatYouWillLearn: [
          'HTML, CSS, JavaScript',
          'React.js and Node.js',
          'Database management',
          'API development',
          'Deployment and DevOps'
        ],
        tags: ['web-development', 'javascript', 'react', 'nodejs'],
        isPublished: true,
        isFeatured: false,
        enrollmentCount: 0
      },
      {
        title: 'Data Science with Python',
        description: 'Learn data science, machine learning, and AI with Python. Work on real datasets and build predictive models.',
        shortDescription: 'Master data science and machine learning',
        price: 6999,
        originalPrice: 9999,
        category: 'Data Science',
        level: 'Advanced',
        duration: '10 weeks',
        language: 'English',
        instructor: {
          name: 'Dr. Michael Chen',
          bio: 'Data Scientist and AI Researcher'
        },
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500',
        features: [
          'Hands-on Projects',
          'Industry Datasets',
          'ML Model Deployment',
          'Career Guidance',
          'Research Opportunities'
        ],
        requirements: [
          'Python programming basics',
          'Mathematics knowledge',
          'Statistical concepts'
        ],
        whatYouWillLearn: [
          'Python for data science',
          'Machine learning algorithms',
          'Deep learning with TensorFlow',
          'Data visualization',
          'Model deployment'
        ],
        tags: ['data-science', 'python', 'machine-learning', 'ai'],
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 0
      }
    ];

    // Clear existing test courses
    await Course.deleteMany({ title: { $regex: /Test|Complete|Data Science/ } });
    console.log('🧹 Cleared existing test courses');

    // Create test courses
    for (const courseData of testCourses) {
      const course = new Course(courseData);
      await course.save();
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create test user if not exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (!existingUser) {
      const user = new User({
        email: 'test@example.com',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        auth: {
          passwordHash: '$2a$10$example.hash.here', // This would be properly hashed
          emailVerified: true
        },
        courses: []
      });
      await user.save();
      console.log('✅ Test user created: test@example.com');
    } else {
      console.log('✅ Test user already exists');
    }

    console.log('\n🎉 Test data setup completed!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@test.com / admin123');
    console.log('User: test@example.com (password: password123)');
    console.log('\n🚀 You can now test the system!');
    console.log('1. Start the server: npm run dev');
    console.log('2. Admin panel: http://localhost:3000/admin/login');
    console.log('3. Courses page: http://localhost:3000/courses');
    console.log('4. User signup: http://localhost:3000/signup');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createTestData();
