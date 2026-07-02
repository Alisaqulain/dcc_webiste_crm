import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { verifyAdminToken } from '@/lib/adminAuth';
import {
  incrementLifetimeLeadEarnings,
  isEarningLeadStatus,
} from '@/lib/leadLifetimeEarnings';

async function buildLeadSearchFilter(search) {
  const q = search.trim();
  if (!q) return { filter: {}, matchedUsers: [] };

  const userQuery = {
    $or: [
      { email: { $regex: q, $options: 'i' } },
      { 'profile.firstName': { $regex: q, $options: 'i' } },
      { 'profile.lastName': { $regex: q, $options: 'i' } },
      { 'profile.mobile': { $regex: q, $options: 'i' } },
    ],
  };

  const matchingUsers = await User.find(userQuery)
    .select('_id email profile')
    .lean();

  // Email search: show leads submitted by that user (affiliate who sent the lead)
  if (q.includes('@') && matchingUsers.length > 0) {
    return {
      filter: { user: { $in: matchingUsers.map((u) => u._id) } },
      matchedUsers: matchingUsers,
    };
  }

  const userIds = matchingUsers.map((u) => u._id);
  const or = [{ clientEmail: { $regex: q, $options: 'i' } }];
  if (userIds.length) or.push({ user: { $in: userIds } });

  return { filter: { $or: or }, matchedUsers: matchingUsers };
}

function buildSearchSummary(leads) {
  const summary = {
    total: leads.length,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  };

  for (const lead of leads) {
    if (summary[lead.status] !== undefined) {
      summary[lead.status] += 1;
    }
  }

  return summary;
}

async function buildUserLeadBreakdown(matchedUsers) {
  if (!matchedUsers?.length) return [];

  const breakdown = [];
  for (const u of matchedUsers) {
    const userLeads = await Lead.find({ user: u._id }).select('status').lean();
    const stats = buildSearchSummary(userLeads);
    const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ').trim();
    breakdown.push({
      email: u.email,
      name: name || null,
      ...stats,
    });
  }

  return breakdown.sort((a, b) => b.total - a.total);
}

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const search = (searchParams.get('search') || '').trim();
    const skip = (page - 1) * limit;

    const { filter, matchedUsers } = await buildLeadSearchFilter(search);
    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate('user', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    let searchSummary = null;
    if (search) {
      const matched = await Lead.find(filter).select('status').lean();
      searchSummary = buildSearchSummary(matched);
      if (matchedUsers.length) {
        searchSummary.userBreakdown = await buildUserLeadBreakdown(matchedUsers);
      }
    }

    return Response.json({
      leads,
      search: search || null,
      searchSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin GET leads error', error);
    return Response.json({ message: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, status } = await request.json();

    if (!id || !status) {
      return Response.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const current = await Lead.findById(id);
    if (!current) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    const updateData = { status };
    if (status === 'approved' && !current.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (status === 'paid' && !current.paidAt) {
      updateData.paidAt = new Date();
    }

    const updated = await Lead.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'email profile')
      .lean();

    if (!updated) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    const wasEarning = isEarningLeadStatus(current.status);
    const isEarning = isEarningLeadStatus(status);
    if (!wasEarning && isEarning) {
      await incrementLifetimeLeadEarnings(
        current.user,
        current.amount || 100
      );
    }

    return Response.json({ ok: true, lead: updated });
  } catch (error) {
    console.error('Admin PUT leads error', error);
    return Response.json({ message: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return Response.json({ message: 'Lead id is required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Lead.findByIdAndDelete(id).lean();
    if (!deleted) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ ok: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Admin DELETE leads error', error);
    return Response.json({ message: 'Failed to delete lead' }, { status: 500 });
  }
}
