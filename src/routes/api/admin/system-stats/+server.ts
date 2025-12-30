import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !db) {
      return json({ stats: { totalUsers: 0, totalDocuments: 0, totalMeetings: 0, totalBallots: 0 } });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ stats: { totalUsers: 0, totalDocuments: 0, totalMeetings: 0, totalBallots: 0 } });
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin') {
      return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get counts from collections
    const [usersSnapshot, documentsSnapshot, meetingsSnapshot, ballotsSnapshot] = await Promise.all([
      db.collection('users').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection('documents').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection('meetings').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection('ballots').count().get().catch(() => ({ data: () => ({ count: 0 }) }))
    ]);

    const stats = {
      totalUsers: usersSnapshot.data().count || 0,
      totalDocuments: documentsSnapshot.data().count || 0,
      totalMeetings: meetingsSnapshot.data().count || 0,
      totalBallots: ballotsSnapshot.data().count || 0,
    };

    return json({ stats });
  } catch (error: any) {
    console.error('System Stats API error:', error);
    return json({ stats: { totalUsers: 0, totalDocuments: 0, totalMeetings: 0, totalBallots: 0 } }, { status: 500 });
  }
};

