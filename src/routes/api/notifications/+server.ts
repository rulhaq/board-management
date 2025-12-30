import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ notifications: [] }, { status: 200 });
    }

    let userId = null;

    if (adminAuth) {
      try {
        const token = authHeader.split(' ')[1];
        if (token) {
          const decodedToken = await adminAuth.verifyIdToken(token);
          userId = decodedToken.uid;
        }
      } catch (authError) {
        console.warn('Token verification failed:', authError);
        // Continue without userId - return empty array
      }
    }

    if (!db || !userId) {
      return json({ notifications: [] }, { status: 200 });
    }

    try {
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const notifications = notificationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        };
      });

      return json({ notifications });
    } catch (queryError: any) {
      console.warn('Notifications query failed:', queryError);
      // Try without orderBy
      try {
        const notificationsSnapshot = await db.collection('notifications')
          .where('userId', '==', userId)
          .limit(100)
          .get();

        const notifications = notificationsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return dateB - dateA;
          });

        return json({ notifications });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return json({ notifications: [] }, { status: 200 });
      }
    }
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return json({ notifications: [] }, { status: 200 });
  }
};

