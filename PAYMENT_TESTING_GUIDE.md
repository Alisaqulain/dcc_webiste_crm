# Payment & Referral System Testing Guide

## 🚀 **Complete Payment Integration with Razorpay**

This guide will help you test the complete payment flow, email notifications, and referral system.

## 📋 **Prerequisites**

### 1. Environment Variables Setup
Make sure your `.env.local` file contains:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/dcc

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=Dcchelp1@gmail.com
EMAIL_PASS=your-app-password-here

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Environment
NODE_ENV=development
```

### 2. Razorpay Setup
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your **Key ID** and **Key Secret** from API Keys section
3. Add them to your `.env.local` file
4. Make sure you're using **Test Mode** for development

### 3. Email Setup
1. For Gmail: Enable 2FA and generate an App Password
2. Use the App Password as `EMAIL_PASS` (not your regular password)

## 🧪 **Testing Steps**

### **Step 1: Start the Application**
```bash
npm run dev
```
- Application will run on `http://localhost:3001`

### **Step 2: Test Admin Panel**
1. Go to `http://localhost:3001/admin/login`
2. Login with: `admin@gmail.com` / `Admin@786786`
3. Create a test course:
   - Course Name: "Test Course"
   - Description: "This is a test course"
   - Price: 1000
   - Category: "Digital Marketing"
   - Level: "Beginner"
   - Instructor Name: "Test Instructor"
   - Upload a course thumbnail image
   - Click "Create Course"

### **Step 3: Test User Registration with Referral**
1. Go to `http://localhost:3001/signup`
2. Fill out the registration form
3. Note: The referral code field will be auto-populated if you visit `/signup?ref=REFCODE123`
4. Complete registration
5. Check your email for welcome message

### **Step 4: Test Course Purchase Flow**
1. Go to `http://localhost:3001/courses`
2. Find your test course
3. Click "Purchase" button
4. Payment modal should open with:
   - Course details
   - Price display
   - Referral code input (optional)
   - Pay button

### **Step 5: Test Razorpay Payment**
1. In the payment modal, click "Pay ₹1000"
2. Razorpay checkout should open
3. Use test card details:
   - **Card Number**: `4111 1111 1111 1111`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: `123`
   - **Name**: Any name
4. Complete the payment

### **Step 6: Verify Payment Success**
1. After successful payment, you should be redirected to `/my-courses`
2. Check your email for:
   - Purchase confirmation email
   - Course details and payment information
   - Your referral code for future use

### **Step 7: Test Referral System**
1. Go to `http://localhost:3001/referral`
2. You should see:
   - Your referral code
   - Your referral link
   - Earnings dashboard (initially ₹0)
   - Social sharing buttons

### **Step 8: Test Referral Flow**
1. Copy your referral link from the referral page
2. Open it in a new browser/incognito window
3. Register a new user using the referral link
4. Purchase a course with the new user
5. Check if the referrer's earnings increased

### **Step 9: Test Email Notifications**
Check emails for:
- ✅ Welcome email (new user registration)
- ✅ Purchase confirmation (course purchase)
- ✅ Referral bonus notification (when someone uses your code)

## 🔧 **API Endpoints Testing**

### **Test Payment Order Creation**
```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"courseId": "COURSE_ID", "referralCode": "REFCODE123"}'
```

### **Test Payment Verification**
```bash
curl -X POST http://localhost:3001/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "razorpay_order_id": "order_id",
    "razorpay_payment_id": "payment_id", 
    "razorpay_signature": "signature",
    "courseId": "COURSE_ID",
    "referralCode": "REFCODE123"
  }'
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Razorpay Not Loading**
- **Solution**: Check if Razorpay Key ID is correct in `.env.local`
- **Solution**: Ensure you're using HTTPS in production

### **Issue 2: Payment Verification Failing**
- **Solution**: Check Razorpay Key Secret is correct
- **Solution**: Verify the signature calculation

### **Issue 3: Email Not Sending**
- **Solution**: Check email credentials in `.env.local`
- **Solution**: For Gmail, use App Password, not regular password
- **Solution**: Check if 2FA is enabled on Gmail account

### **Issue 4: Referral Code Not Working**
- **Solution**: Check if referral code exists in database
- **Solution**: Ensure referral code is uppercase
- **Solution**: Check User model has correct referral fields

### **Issue 5: Course Not Added to User**
- **Solution**: Check if course ID is valid
- **Solution**: Verify user authentication
- **Solution**: Check database connection

## 📊 **Database Verification**

### **Check User Referral Data**
```javascript
// In MongoDB shell or compass
db.users.findOne({email: "user@example.com"}, {
  referralCode: 1,
  referralEarnings: 1,
  referralCount: 1,
  referredBy: 1
})
```

### **Check Course Enrollment**
```javascript
// Check if course was added to user
db.users.findOne({email: "user@example.com"}, {
  courses: 1
})
```

### **Check Course Enrollment Count**
```javascript
// Check if enrollment count increased
db.courses.findOne({_id: ObjectId("COURSE_ID")}, {
  enrollmentCount: 1
})
```

## 🎯 **Expected Results**

### **After Successful Payment:**
1. ✅ User redirected to `/my-courses`
2. ✅ Course appears in user's course list
3. ✅ Course enrollment count increased
4. ✅ Purchase confirmation email sent
5. ✅ Referral bonus email sent (if referral code used)

### **After Referral Usage:**
1. ✅ Referrer's earnings increased by 10% of course price
2. ✅ Referrer's referral count increased by 1
3. ✅ Referral bonus email sent to referrer

### **Email Notifications:**
1. ✅ Welcome email with referral code
2. ✅ Purchase confirmation with course details
3. ✅ Referral bonus notification with earnings

## 🚀 **Production Deployment Checklist**

Before going live:
- [ ] Update Razorpay to Live Mode
- [ ] Update email credentials for production
- [ ] Test with real payment methods
- [ ] Verify all email templates
- [ ] Test referral system thoroughly
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Test on mobile devices

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Check the server logs in terminal
3. Verify all environment variables
4. Test API endpoints individually
5. Check database for data consistency

---

**Happy Testing! 🎉**

The payment system is now fully integrated with Razorpay, email notifications, and a complete referral system. Users can purchase courses, earn through referrals, and receive confirmation emails for all transactions.
