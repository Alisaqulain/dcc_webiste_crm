import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailSubject = `Contact Form Submission: ${subject}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Contact Details</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #374151; margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="color: #374151; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            ${phone ? `<p style="color: #374151; margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
            <p style="color: #374151; margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <h3 style="color: #374151; margin-bottom: 15px;">Message:</h3>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
            <p style="color: #dc2626; margin: 0; font-size: 14px;">
              <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">
            This email was sent from the Digital Career Center contact form.
          </p>
        </div>
      </div>
    `;

    const emailText = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}

Message:
${message}

Please respond to this inquiry within 24 hours.
    `;

    // Determine admin email address - use EMAIL_USER as primary
    const adminEmail = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'Dcchelp1@gmail.com';
    
    console.log('Sending contact form email to:', adminEmail);
    console.log('Environment variables:', {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      EMAIL_USER: process.env.EMAIL_USER
    });

    // Send email to admin
    const adminEmailResult = await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    });

    if (!adminEmailResult.success) {
      console.error('Failed to send admin email:', adminEmailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    const userConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Digital Career Center</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Hello ${name},
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            We have received your message regarding "${subject}" and will get back to you within 24 hours.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Your Message:</h3>
            <p style="color: #6b7280; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            In the meantime, feel free to explore our courses and resources:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/courses" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 5px;">
              Browse Courses
            </a>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/blog" 
               style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 5px;">
              Read Our Blog
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Best regards,<br>
            Digital Career Center Team<br>
            <a href="tel:+917599863007" style="color: #dc2626;">+91-75998 63007</a> | 
            <a href="mailto:info@digitalcareercenter.com" style="color: #dc2626;">info@digitalcareercenter.com</a>
          </p>
        </div>
      </div>
    `;

    const userConfirmationResult = await sendEmail({
      to: email,
      subject: 'Thank You for Contacting Digital Career Center',
      html: userConfirmationHtml,
      text: `Thank you for contacting Digital Career Center! We have received your message regarding "${subject}" and will get back to you within 24 hours.`
    });

    if (!userConfirmationResult.success) {
      console.error('Failed to send user confirmation email:', userConfirmationResult.error);
      // Don't fail the request if user confirmation fails
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully! We will get back to you within 24 hours.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
