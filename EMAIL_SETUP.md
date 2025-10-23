# Email Configuration Setup

This project is configured to use `Dcchelp1@gmail.com` as the sender email for forgot password links and welcome emails.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=Dcchelp1@gmail.com
EMAIL_PASS=your-app-password-here
```

### 2. Gmail App Password Setup

To use Gmail for sending emails, you need to:

1. **Enable 2-Factor Authentication** on the Gmail account `Dcchelp1@gmail.com`
2. **Generate an App Password**:
   - Go to Google Account settings
   - Navigate to Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Use this 16-character password as `EMAIL_PASS` in your `.env.local`

### 3. Testing Email Configuration

You can test the email setup using the test endpoint:

#### Test Welcome Email
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "welcome", "email": "test@example.com", "name": "Test User"}'
```

#### Test Password Reset Email
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "password-reset", "email": "test@example.com"}'
```

### 4. Email Functions

The following email functions are available:

- `sendWelcomeEmail(email, name)` - Sends welcome email to new users
- `sendPasswordResetEmail(email, resetLink)` - Sends password reset email
- `testEmailConnection()` - Tests the email server connection

### 5. Email Templates

Both email templates include:
- Professional Digital Career Center branding
- Responsive HTML design
- Clear call-to-action buttons
- Security information for password reset emails

## Troubleshooting

- **Authentication Error**: Make sure you're using an App Password, not your regular Gmail password
- **Connection Error**: Verify that 2FA is enabled and the app password is correct
- **Email Not Received**: Check spam folder and verify the recipient email address

## Security Notes

- Never commit your `.env.local` file to version control
- Use App Passwords instead of your main Gmail password
- The password reset links expire after 1 hour for security
