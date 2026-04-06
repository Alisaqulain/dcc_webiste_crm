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

    const yesterdayApprovedLeads = approvedLeads.filter((lead) => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      return approvedDate >= yesterday && approvedDate < today;
    });
    const yesterdayEarnings = yesterdayApprovedLeads.reduce(
      (sum, lead) => sum + (lead.amount || 100),
      0
    );
    const todayEarningsChange = parseFloat(
      (yesterdayEarnings > 0
        ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100
        : todayEarnings > 0
          ? 100
          : 0
      ).toFixed(1)
    );

    // Earnings by calendar month (approval / update date) for lead commissions
    const monthKey = (d) => {
      const x = new Date(d);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
    };
    const monthLabel = (key) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const totalsByMonth = new Map();
    for (const lead of approvedLeads) {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      const key = monthKey(approvedDate);
      const amt = lead.amount || 100;
      totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + amt);
    }

    const sortedMonthKeys = [...totalsByMonth.keys()].sort((a, b) => b.localeCompare(a));
    const earningsByMonth = sortedMonthKeys.map((k) => ({
      monthKey: k,
      label: monthLabel(k),
      amount: totalsByMonth.get(k),
    }));

    // "Total Earning" KPI = current calendar month only (resets each new month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthKey = monthKey(startOfMonth);
    const currentMonthLabel = monthLabel(currentMonthKey);

    const currentMonthEarnings = approvedLeads.reduce((sum, lead) => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      if (approvedDate >= startOfMonth && approvedDate < startOfNextMonth) {
        return sum + (lead.amount || 100);
      }
      return sum;
    }, 0);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = startOfMonth;
    const previousMonthEarnings = approvedLeads.reduce((sum, lead) => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      if (approvedDate >= prevMonthStart && approvedDate < prevMonthEnd) {
        return sum + (lead.amount || 100);
      }
      return sum;
    }, 0);
    const previousMonthLabel = monthLabel(monthKey(prevMonthStart));
    const previousMonthLeadCount = approvedLeads.filter((lead) => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      return approvedDate >= prevMonthStart && approvedDate < prevMonthEnd;
    }).length;

    const totalEarning = currentMonthEarnings;

    const earningsChange = previousMonthEarnings > 0
      ? ((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings * 100).toFixed(1)
      : currentMonthEarnings > 0 ? '100' : '0';

    // Rolling ~last 30 days vs today for "Total leads" KPI % (unchanged behavior)
    const lastMonthRolling = new Date();
    lastMonthRolling.setMonth(lastMonthRolling.getMonth() - 1);
    lastMonthRolling.setHours(0, 0, 0, 0);
    const lastMonthApprovedLeads = approvedLeads.filter((lead) => {
      const approvedDate = lead.approvedAt ? new Date(lead.approvedAt) : new Date(lead.updatedAt);
      return approvedDate >= lastMonthRolling && approvedDate < today;
    });

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
      currentMonthLabel,
      previousMonthLabel,
      previousMonthEarning: previousMonthEarnings,
      previousMonthLeadCount,
      earningsByMonth,
      earningsChange: parseFloat(earningsChange),
      todayEarning: todayEarnings,
      todayEarningsChange,
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

