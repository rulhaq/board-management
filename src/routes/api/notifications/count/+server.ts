import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ unread: 0 });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userId = decodedToken.uid;

      if (!db) {
        return json({ unread: 0 });
      }

      try {
        const notificationsSnapshot = await db.collection('notifications')
          .where('userId', '==', userId)
          .where('read', '==', false)
          .get();
        
        return json({ unread: notificationsSnapshot.size });
      } catch (queryError: any) {
        // If query fails (missing index), return 0
        console.warn('Notifications count query failed:', queryError);
        return json({ unread: 0 });
      }
    } catch (authError) {
      // If auth fails, return 0
      return json({ unread: 0 });
    }
  } catch (error) {
    console.error('Notifications count API error:', error);
    return json({ unread: 0 });
  }
};

