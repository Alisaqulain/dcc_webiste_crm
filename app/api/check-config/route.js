import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'Not set',
      EMAIL_USER: process.env.EMAIL_USER || 'Not set',
      EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    };

    return NextResponse.json({
      success: true,
      message: 'Current email configuration',
      config
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
