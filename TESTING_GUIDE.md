# Course Management System - Testing Guide

## Prerequisites
1. Make sure the development server is running: `npm run dev`
2. Ensure MongoDB is connected and running
3. Have admin credentials ready (or create admin account)

## Step 1: Admin Panel Testing

### 1.1 Access Admin Panel
1. Navigate to `http://localhost:3001/admin/login`
2. Login with admin credentials:
   - **Email:** `admin@gmail.com`
   - **Password:** `Admin@786786`
3. Verify you can access the admin dashboard

### 1.2 Create a Test Course
1. Go to `http://localhost:3001/admin/courses`
2. Click "Add New Course" button
3. Fill in the simplified course form with test data:
   ```
   Course Title: "Test Digital Marketing Course"
   Description: "Learn digital marketing from scratch with practical projects"
   Price: 2999
   Category: "Digital Marketing"
   Level: "Beginner"
   Instructor Name: "John Doe"
   ```
4. **Upload Course Thumbnail:**
   - Click "Choose File" and select an image file
   - Verify image preview appears
   - Note: Only file upload is available (no URL option)
5. Check "Publish immediately"
6. Click "Create Course"
7. Verify the course appears in the courses list

### 1.3 Test Course Management
1. Verify the course shows in the admin courses table
2. Test the "Edit" functionality
3. Test the "Videos" link (should go to videos management)
4. Test the publish/unpublish toggle
5. Test the delete functionality

## Step 2: Public Course Display Testing

### 2.1 Browse Courses Page
1. Navigate to `http://localhost:3001/courses`
2. Verify the course you created appears
3. Check the course card displays:
   - Course image
   - Title and description
   - Price and original price
   - Category and level badges
   - Instructor information
   - Purchase button

### 2.2 Test Course Filtering
1. Use the search bar to search for "digital marketing"
2. Filter by category "Digital Marketing"
3. Filter by level "Beginner"
4. Test different sort options (price, newest, etc.)
5. Verify filters work correctly

## Step 3: User Authentication Testing

### 3.1 Test Signup Flow
1. Navigate to `http://localhost:3001/signup`
2. Fill in the signup form:
   ```
   First Name: "Test"
   Last Name: "User"
   Email: "test@example.com"
   Mobile: "9876543210"
   Password: "password123"
   State: "Delhi"
   ```
3. Select a package (any)
4. Select payment method (any)
5. Check "I agree to terms"
6. Click "Create Account & Get Started"
7. Verify you're redirected to `/courses` page

### 3.2 Test Login Flow
1. Navigate to `http://localhost:3001/login`
2. Login with the credentials you just created
3. Verify you can access the site

## Step 4: Course Purchase Testing

### 4.1 Test Purchase Flow
1. While logged in, go to `http://localhost:3000/courses`
2. Click "Purchase" on the test course
3. Verify you're redirected to `/purchase/[courseId]`
4. Check the purchase page displays:
   - Course details
   - Price information
   - Purchase button
   - Security badges

### 4.2 Complete Purchase
1. Click the "Purchase for ₹2,999" button
2. Verify the purchase processes (this is a mock purchase)
3. Check you're redirected to `/my-courses?purchased=true`
4. Verify the success message appears

## Step 5: My Courses Testing

### 5.1 Access My Courses
1. Navigate to `http://localhost:3000/my-courses`
2. Verify the purchased course appears
3. Check the course card shows:
   - "Purchased" badge
   - Course image and details
   - Progress bar (0%)
   - "Start Learning" button

### 5.2 Test Navigation
1. Click on "My Courses" in the header navigation
2. Verify it works on both desktop and mobile
3. Test the mobile hamburger menu

## Step 6: Navigation Testing

### 6.1 Test Header Navigation
1. Verify "My Courses" appears for logged-in users
2. Verify "Browse Courses" appears for non-logged-in users
3. Test all navigation links work correctly

### 6.2 Test Mobile Navigation
1. Resize browser to mobile width
2. Click hamburger menu
3. Verify "My Courses" appears in mobile menu
4. Test all mobile navigation links

## Step 7: Error Handling Testing

### 7.1 Test Unauthenticated Access
1. Logout from the application
2. Try to access `/my-courses`
3. Verify you're redirected to login page
4. Try to access `/purchase/[courseId]`
5. Verify you're redirected to login page

### 7.2 Test Invalid Course Access
1. Try to access `/purchase/invalid-course-id`
2. Verify error page appears
3. Test the "Browse Courses" button works

## Step 8: Database Verification

### 8.1 Check User Data
1. Open MongoDB Compass or your preferred MongoDB client
2. Check the `users` collection
3. Verify the test user has the purchased course in their `courses` array
4. Check the course data includes purchase date and status

### 8.2 Check Course Data
1. Check the `courses` collection
2. Verify the test course has `enrollmentCount` increased
3. Verify the course is marked as published

## Step 9: Admin Panel - Course Management

### 9.1 Test Course Updates
1. Go back to admin panel
2. Edit the test course
3. Change the price or description
4. Save changes
5. Verify changes reflect on the public courses page

### 9.2 Test Course Publishing
1. Unpublish the test course
2. Go to public courses page
3. Verify the course no longer appears
4. Publish it again
5. Verify it appears again

## Step 10: Complete User Journey Testing

### 10.1 Full User Flow
1. **New User Journey:**
   - Visit homepage
   - Click "Signup"
   - Complete registration
   - Get redirected to courses page
   - Browse courses
   - Purchase a course
   - Access "My Courses"
   - View purchased course

2. **Returning User Journey:**
   - Login
   - Go to "My Courses"
   - View purchased courses
   - Browse for more courses
   - Purchase additional courses

## Troubleshooting Common Issues

### Issue: Course not appearing on public page
**Solution:** Check if course is published (`isPublished: true`)

### Issue: Purchase not working
**Solution:** Check if user is logged in and course exists

### Issue: My Courses page empty
**Solution:** Check if course was added to user's courses array

### Issue: Admin panel not accessible
**Solution:** Verify admin credentials and JWT token

## Test Data Examples

### Sample Course Data
```json
{
  "title": "Complete Web Development Course",
  "description": "Learn full-stack web development with modern technologies",
  "shortDescription": "Master HTML, CSS, JavaScript, React, and Node.js",
  "price": 4999,
  "originalPrice": 6999,
  "category": "Web Development",
  "level": "Beginner",
  "duration": "8 weeks",
  "instructor": {
    "name": "Jane Smith"
  },
  "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
  "features": [
    "Live Projects",
    "Certificate of Completion",
    "Lifetime Access",
    "24/7 Support"
  ],
  "isPublished": true
}
```

### Sample User Data
```json
{
  "email": "test@example.com",
  "profile": {
    "firstName": "Test",
    "lastName": "User"
  },
  "courses": [
    {
      "courseId": "course_id_here",
      "purchasedAt": "2024-01-01T00:00:00.000Z",
      "status": "active",
      "progress": 0
    }
  ]
}
```

## Performance Testing

### 10.1 Load Testing
1. Create multiple courses (10-20)
2. Test pagination on courses page
3. Test search performance with large datasets
4. Test admin panel with many courses

### 10.2 Mobile Testing
1. Test on different mobile devices
2. Test responsive design
3. Test touch interactions
4. Test mobile navigation

## Security Testing

### 11.1 Authentication Testing
1. Test JWT token expiration
2. Test unauthorized access attempts
3. Test session management
4. Test password requirements

### 11.2 Data Validation Testing
1. Test invalid course data submission
2. Test SQL injection attempts
3. Test XSS prevention
4. Test input sanitization

---

## Quick Test Checklist

- [ ] Admin can login
- [ ] Admin can create course
- [ ] Course appears on public page
- [ ] User can signup
- [ ] User can login
- [ ] User can browse courses
- [ ] User can purchase course
- [ ] User can view "My Courses"
- [ ] Navigation works correctly
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Database updates correctly

This testing guide covers all the major functionality of the course management system. Follow these steps to ensure everything is working correctly!