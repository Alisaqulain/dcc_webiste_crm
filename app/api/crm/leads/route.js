import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { computeLeadStats } from '@/lib/leadStats';

export async function GET(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const User = (await import('@/models/User')).default;
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const leads = await Lead.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      leads,
      stats: computeLeadStats(leads),
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return Response.json({ 
      message: 'Error fetching leads',
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const User = (await import('@/models/User')).default;
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const { date, clientEmail, service, country } = await request.json();

    // Validate required fields
    if (!date || !clientEmail || !service || !country) {
      return Response.json({ 
        message: 'All fields are required' 
      }, { status: 400 });
    }

    // Create new lead
    const lead = await Lead.create({
      user: user._id,
      date: new Date(date),
      clientEmail: clientEmail.toLowerCase().trim(),
      service: service.trim(),
      country: country.trim(),
      status: 'pending',
      amount: 100
    });

    const allLeads = await Lead.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(
      {
        message: 'Lead added successfully',
        lead,
        stats: computeLeadStats(allLeads),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding lead:', error);
    return Response.json({ 
      message: 'Error adding lead',
      error: error.message 
    }, { status: 500 });
  }
}

