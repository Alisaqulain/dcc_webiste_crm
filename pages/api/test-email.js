import { testEmailConnection, sendPasswordResetEmail, sendWelcomeEmail } from '../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { testType, email, name } = req.body;

    // Test email connection
    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: 'Email connection failed',
        error: connectionTest.error
      });
    }

    let emailResult;

    switch (testType) {
      case 'welcome':
        if (!email || !name) {
          return res.status(400).json({
            success: false,
            message: 'Email and name are required for welcome email test'
          });
        }
        emailResult = await sendWelcomeEmail(email, name);
        break;

      case 'password-reset':
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email is required for password reset test'
          });
        }
        const testResetLink = `${process.env.NEXTAUTH_URL || 'https://www.digitalcareercenter.com'}/reset-password?token=test-token-123`;
        emailResult = await sendPasswordResetEmail(email, testResetLink);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid test type. Use "welcome" or "password-reset"'
        });
    }

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: `${testType} email sent successfully`,
        from: process.env.EMAIL_USER || 'Dcchelp1@gmail.com'
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send ${testType} email`,
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}