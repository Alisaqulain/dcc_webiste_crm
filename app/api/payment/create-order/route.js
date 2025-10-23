import connectDB from '@/lib/mongodb';
import razorpay from '@/lib/razorpay';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, referralCode } = await request.json();

    if (!courseId) {
      return Response.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    // Calculate amount (in paise for Razorpay)
    const amount = Math.round(course.price * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `crs_${Date.now().toString().slice(-8)}`, // Shorter receipt ID (max 40 chars)
      notes: {
        courseId: courseId,
        userId: session.user.email,
        referralCode: referralCode || null
      }
    });

    return Response.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return Response.json({ 
      message: 'Error creating payment order',
      error: error.message 
    }, { status: 500 });
  }
}
