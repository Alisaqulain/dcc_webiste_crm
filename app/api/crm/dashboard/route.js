import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Referral from '@/models/Referral';
import Lead from '@/models/Lead';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user by ID or email (fallback)
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Get leads for this user
    const leads = await Lead.find({ user: user._id }).lean();
    
    // Get referral earnings with course data (for referral section)
    const referrals = await Referral.find({ referrer: user._id })
      .populate('course', 'title')
      .lean();
    
    // Calculate earnings from LEADS (100 rupees per approved lead)
    const approvedLeads = leads.filter(lead => lead.status === 'approved' || lead.status === 'paid');
    const paidLeads = leads.filter(lead => lead.status === 'paid');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's earnings (from leads approved today, regardless of 24 hours)
    const todayApprovedLeads = approvedLeads.filter(lead => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      return approvedDate >= today && approvedDate < tomorrow;
    });
    const todayEarnings = todayApprovedLeads.reduce((sum, lead) => sum + (lead.amount || 100), 0);

    // Total earnings (all approved leads that were approved more than 24 hours ago)
    // This means leads approved today show in "Today Earning", and after 24 hours move to "Total Earning"
    const totalEarningLeads = approvedLeads.filter(lead => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      const hoursSinceApproval = (today - approvedDate) / (1000 * 60 * 60);
      return hoursSinceApproval >= 24;
    });
    const totalEarning = totalEarningLeads.reduce((sum, lead) => sum + (lead.amount || 100), 0);

    // Get last month's date range
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const lastMonthApprovedLeads = approvedLeads.filter(lead => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      return approvedDate >= lastMonth && approvedDate < today;
    });
    const lastMonthEarnings = lastMonthApprovedLeads.reduce((sum, lead) => sum + (lead.amount || 100), 0);

    // Calculate percentage change
    const earningsChange = lastMonthEarnings > 0 
      ? ((totalEarning - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
      : totalEarning > 0 ? '100' : '0';

    // Total leads count (only approved leads)
    const totalLeads = approvedLeads.length;
    const lastMonthLeads = lastMonthApprovedLeads.length;
    
    const leadsChange = lastMonthLeads > 0
      ? ((totalLeads - lastMonthLeads) / lastMonthLeads * 100).toFixed(1)
      : totalLeads > 0 ? '100' : '0';

    // Recent leads (last 10 leads)
    const recentLeads = leads
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((lead, index) => ({
        sr: index + 1,
        date: new Date(lead.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        clientEmail: lead.clientEmail || '-',
        service: lead.service || '-',
        country: lead.country || '-',
        status: lead.status || 'pending'
      }));

    // Conversion rate (approved leads / total leads)
    const conversionRate = leads.length > 0
      ? ((approvedLeads.length / leads.length) * 100).toFixed(1)
      : 0;
    
    // Grand total (all approved leads - both approved and paid)
    const grandTotalEarning = approvedLeads.reduce((sum, lead) => sum + (lead.amount || 100), 0);
    
    // Pending withdrawal (approved but not paid)
    const pendingWithdrawal = approvedLeads
      .filter(lead => lead.status === 'approved')
      .reduce((sum, lead) => sum + (lead.amount || 100), 0);

    return Response.json({
      totalLeads,
      leadsChange: parseFloat(leadsChange),
      totalEarning,
      earningsChange: parseFloat(earningsChange),
      todayEarning: todayEarnings,
      todayEarningsChange: 0,
      conversionRate: parseFloat(conversionRate),
      conversionRateChange: 0,
      grandTotalEarning,
      pendingWithdrawal,
      recentLeads,
      // Referral data (for referral section)
      referrals: referrals.map((ref, index) => ({
        sr: index + 1,
        date: new Date(ref.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        clientEmail: ref.referredEmail || '-',
        service: ref.course?.title || 'Course',
        country: '-',
        status: ref.status || 'pending',
        amount: ref.amount || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching CRM dashboard data:', error);
    return Response.json({ 
      message: 'Error fetching dashboard data',
      error: error.message 
    }, { status: 500 });
  }
}

