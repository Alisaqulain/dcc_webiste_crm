const nodemailer = require('nodemailer');

// Create transporter based on email service
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'Dcchelp1@gmail.com',
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  if (emailService === 'outlook') {
    return nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
  }
  
  if (emailService === 'yahoo') {
    return nodemailer.createTransport({
      service: 'yahoo',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
  }
  
  // GoDaddy SMTP configuration for digitalcareercenter.com
  return nodemailer.createTransport({
    host: 'smtp.secureserver.net', // GoDaddy SMTP server
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // Info@digitalcareercenter.com
      pass: process.env.EMAIL_PASS, // 786786Abc@
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const transporter = createTransporter();

// Test email configuration
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return { success: true };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Dcchelp1@gmail.com',
    to: email,
    subject: 'Password Reset - Digital Career Center',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Digital Career Center</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Hello,
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Digital Career Center account. 
            If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          
          <p style="color: #dc2626; word-break: break-all; background-color: #fef2f2; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetLink}
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Best regards,<br>
            Digital Career Center Team
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">
            This email was sent from Digital Career Center. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Generic email sending function
export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Dcchelp1@gmail.com',
    to,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'Dcchelp1@gmail.com',
    to: email,
    subject: 'Welcome to Digital Career Center!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Digital Career Center</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Welcome to DCC, ${name}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining Digital Career Center. We're excited to have you on board!
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Your account has been successfully created. You can now:
          </p>
          
          <ul style="color: #6b7280; line-height: 1.8; margin-bottom: 20px;">
            <li>Access your personalized dashboard</li>
            <li>Browse our comprehensive course catalog</li>
            <li>Track your learning progress</li>
            <li>Earn through our referral program</li>
            <li>Connect with our community</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Go to My Profile
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions or need assistance, don't hesitate to reach out to our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Best regards,<br>
            Digital Career Center Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: error.message };
  }
};
