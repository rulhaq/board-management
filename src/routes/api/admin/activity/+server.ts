import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ activities: [] });
    }

    if (!adminAuth) {
      return json({ activities: [] });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ activities: [] });
    }
    
    // Check if user is admin - if not, return empty array instead of error
    if (db) {
      try {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc?.data();
        
        if (userData?.role !== 'admin') {
          return json({ activities: [] });
        }
      } catch (error) {
        // If user doc doesn't exist or error, return empty array
        return json({ activities: [] });
      }
    }

    if (!db) {
      return json({ activities: [] });
    }

    const limit = parseInt(request.url.searchParams.get('limit') || '100');
    const userId = request.url.searchParams.get('userId');

    try {
      let query: any = db.collection('activityLogs');
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      const snapshot = await query.get();
      const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        };
      });

      return json({ activities });
    } catch (queryError: any) {
      console.warn('Activity query failed:', queryError);
      // Try without orderBy
      let query: any = db.collection('activityLogs');
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      const snapshot = await query.limit(limit).get();
      const activities = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return json({ activities });
    }
  } catch (error: any) {
    console.error('Activity API error:', error);
    return json({ activities: [] }, { status: 500 });
  }
};

