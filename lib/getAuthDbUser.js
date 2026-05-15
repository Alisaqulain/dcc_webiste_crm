import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/** Load the MongoDB user for the current session (email is source of truth). */
export async function getAuthDbUser(session) {
  const s = session ?? (await getServerSession(authOptions));
  const rawEmail = s?.user?.email;
  if (!rawEmail) return { session: s, user: null, userId: null };

  await connectDB();
  const email = String(rawEmail).toLowerCase().trim();
  const user = await User.findOne({ email }).select('_id email').lean();
  return {
    session: s,
    user,
    userId: user?._id?.toString() || null,
    email,
  };
}
