import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserPurchasedListings } from '@/lib/myPurchases';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { items, error, status } = await getUserPurchasedListings(session, 'app');
    if (error) {
      return Response.json({ message: error }, { status });
    }

    return Response.json({ apps: items });
  } catch (error) {
    console.error('Error fetching user apps:', error);
    return Response.json({ message: 'Error fetching apps' }, { status: 500 });
  }
}
