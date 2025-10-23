# CRM Access Testing Guide

## 🎯 **Testing CRM Visibility Based on Course Purchases**

This guide will help you test the new CRM access feature that shows/hides the CRM link in the navbar based on whether users have purchased courses with CRM access.

## 📋 **What's Changed**

1. **Admin Course Form:**
   - ❌ Removed "Publish immediately" checkbox
   - ✅ Added "Include CRM Access" checkbox
   - Admin can now choose which courses grant CRM access

2. **Course Model:**
   - ✅ Added `hasCrmAccess` field to Course schema
   - Defaults to `false`

3. **User Experience:**
   - ✅ CRM link only appears in navbar if user has purchased courses with CRM access
   - ✅ Works in both desktop and mobile navigation

## 🧪 **Testing Steps**

### **Step 1: Test Admin Course Creation**
1. Go to `http://localhost:3001/admin/login`
2. Login with: `admin@gmail.com` / `Admin@786786`
3. Click "Add Course"
4. Fill out the course form:
   - Course Title: "Test Course with CRM"
   - Description: "This course includes CRM access"
   - Price: 2000
   - Category: "Digital Marketing"
   - Level: "Beginner"
   - Instructor Name: "Test Instructor"
   - Upload a thumbnail image
   - ✅ **Check the "Include CRM Access" checkbox**
5. Click "Create Course"

### **Step 2: Create Another Course Without CRM Access**
1. Click "Add Course" again
2. Fill out the form:
   - Course Title: "Test Course without CRM"
   - Description: "This course does not include CRM access"
   - Price: 1000
   - Category: "Web Development"
   - Level: "Beginner"
   - Instructor Name: "Test Instructor"
   - Upload a thumbnail image
   - ❌ **Leave "Include CRM Access" unchecked**
3. Click "Create Course"

### **Step 3: Test User Registration and Purchase**
1. Go to `http://localhost:3001/signup`
2. Register a new user
3. Go to `http://localhost:3001/courses`
4. **Before purchasing any course:**
   - Check the navbar - CRM link should NOT be visible
   - Check mobile menu - CRM link should NOT be visible

### **Step 4: Purchase Course Without CRM Access**
1. Purchase "Test Course without CRM" (₹1000)
2. After successful payment:
   - Check the navbar - CRM link should still NOT be visible
   - Check mobile menu - CRM link should still NOT be visible

### **Step 5: Purchase Course With CRM Access**
1. Purchase "Test Course with CRM" (₹2000)
2. After successful payment:
   - Check the navbar - CRM link should NOW be visible
   - Check mobile menu - CRM link should NOW be visible
   - Click on CRM link - should work properly

### **Step 6: Test API Endpoint**
Test the CRM access API directly:
```bash
# Get session token first by logging in
curl -X GET http://localhost:3001/api/user/crm-access \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

Expected response:
```json
{
  "hasCrmAccess": true,
  "crmCourses": [
    {
      "id": "course_id",
      "title": "Test Course with CRM"
    }
  ]
}
```

## 🔍 **Expected Results**

### **Before Any Purchase:**
- ❌ CRM link not visible in navbar
- ❌ CRM link not visible in mobile menu

### **After Purchasing Course Without CRM:**
- ❌ CRM link still not visible in navbar
- ❌ CRM link still not visible in mobile menu

### **After Purchasing Course With CRM:**
- ✅ CRM link visible in navbar
- ✅ CRM link visible in mobile menu
- ✅ CRM link works and redirects to `/crm`

## 🐛 **Troubleshooting**

### **Issue 1: CRM Link Not Appearing After Purchase**
- **Check:** Did you check the "Include CRM Access" checkbox when creating the course?
- **Check:** Is the course marked as `hasCrmAccess: true` in the database?
- **Check:** Did the payment complete successfully?

### **Issue 2: CRM Link Appearing Before Purchase**
- **Check:** Clear browser cache and cookies
- **Check:** Make sure you're testing with a fresh user account

### **Issue 3: API Error**
- **Check:** User authentication is working
- **Check:** Database connection is working
- **Check:** Course data is properly saved

## 📊 **Database Verification**

### **Check Course CRM Access:**
```javascript
// In MongoDB shell or compass
db.courses.findOne({title: "Test Course with CRM"}, {
  title: 1,
  hasCrmAccess: 1
})
```

### **Check User's Purchased Courses:**
```javascript
// Check user's courses
db.users.findOne({email: "user@example.com"}, {
  courses: 1
})
```

## 🎉 **Success Criteria**

The feature is working correctly if:
1. ✅ Admin can create courses with/without CRM access
2. ✅ CRM link is hidden by default
3. ✅ CRM link appears only after purchasing a course with CRM access
4. ✅ CRM link works in both desktop and mobile views
5. ✅ API returns correct CRM access status

---

**Happy Testing! 🚀**

The CRM visibility feature is now fully implemented and ready for testing!
