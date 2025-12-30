import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth) {
      return json({ error: 'Admin auth not initialized' }, { status: 500 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const { id } = params;

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { FieldValue } = await import('firebase-admin/firestore');

    await db.collection('notifications').doc(id).update({
      read: true,
      readAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return json({
      error: 'Failed to mark notification as read',
      details: error.message
    }, { status: 500 });
  }
};

