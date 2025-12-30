import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ logs: [] });
    }

    if (!adminAuth || !db) {
      return json({ logs: [] });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ logs: [] });
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin') {
      return json({ logs: [] });
    }

    const limit = parseInt(url.searchParams.get('limit') || '100');
    const category = url.searchParams.get('category') || 'all';
    const userId = url.searchParams.get('userId');

    try {
      let query: any = db.collection('audit_logs');
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      const snapshot = await query.get();
      let logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
        };
      });

      // Filter by category if needed
      if (category !== 'all') {
        logs = logs.filter(log => log.entityType === category || log.action?.includes(category));
      }

      return json({ logs });
    } catch (queryError: any) {
      console.warn('Audit query failed:', queryError);
      // Try without orderBy
      let query: any = db.collection('audit_logs');
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      const snapshot = await query.limit(limit).get();
      let logs = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (category !== 'all') {
        logs = logs.filter(log => log.entityType === category || log.action?.includes(category));
      }

      return json({ logs });
    }
  } catch (error: any) {
    console.error('Audit logs API error:', error);
    return json({ logs: [] }, { status: 500 });
  }
};

