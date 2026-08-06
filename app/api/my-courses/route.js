import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserPurchasedListings } from '@/lib/myPurchases';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { items, error, status } = await getUserPurchasedListings(session, 'course');
    if (error) {
      return Response.json({ message: error }, { status });
    }

    return Response.json({ courses: items });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return Response.json(
      { message: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
