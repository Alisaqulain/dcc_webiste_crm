import { NextResponse } from 'next/server';
import {
  testEmailConnection,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '@/lib/email';

/**
 * POST /api/test/email — send test emails (welcome | password-reset).
 * Restored App Router equivalent of pages/api/test-email.js
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { testType, email, name } = body;

    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email connection failed',
          error: connectionTest.error,
        },
        { status: 500 }
      );
    }

    let emailResult;

    switch (testType) {
      case 'welcome':
        if (!email || !name) {
          return NextResponse.json(
            {
              success: false,
              message: 'Email and name are required for welcome email test',
            },
            { status: 400 }
          );
        }
        emailResult = await sendWelcomeEmail(email, name);
        break;

      case 'password-reset':
        if (!email) {
          return NextResponse.json(
            {
              success: false,
              message: 'Email is required for password reset test',
            },
            { status: 400 }
          );
        }
        {
          const testResetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=test-token-123`;
          emailResult = await sendPasswordResetEmail(email, testResetLink);
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid testType. Use "welcome" or "password-reset"',
          },
          { status: 400 }
        );
    }

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `${testType} email sent successfully`,
        from: process.env.EMAIL_USER || 'Dcchelp1@gmail.com',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Failed to send ${testType} email`,
        error: emailResult.error,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
