import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { testEmail = 'test@example.com' } = body;

    // Test email content
    const testSubject = 'Contact Form Test - Digital Career Center';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Contact Form Test</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Email Configuration Test</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            This is a test email to verify that the contact form email system is working correctly.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Test Details:</h3>
            <p style="color: #6b7280; margin: 10px 0;"><strong>Test Email:</strong> ${testEmail}</p>
            <p style="color: #6b7280; margin: 10px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #6b7280; margin: 10px 0;"><strong>Status:</strong> ✅ Email system is working!</p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            If you received this email, your contact form email configuration is working correctly.
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">
            This is a test email from Digital Career Center contact form system.
          </p>
        </div>
      </div>
    `;

    const testText = `
Contact Form Test - Digital Career Center

This is a test email to verify that the contact form email system is working correctly.

Test Details:
- Test Email: ${testEmail}
- Timestamp: ${new Date().toLocaleString()}
- Status: ✅ Email system is working!

If you received this email, your contact form email configuration is working correctly.
    `;

    // Send test email
    const result = await sendEmail({
      to: testEmail,
      subject: testSubject,
      html: testHtml,
      text: testText
    });

    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: `Test email sent successfully to ${testEmail}`,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          message: 'Failed to send test email. Check your email configuration.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Internal server error while testing email'
      },
      { status: 500 }
    );
  }
}
