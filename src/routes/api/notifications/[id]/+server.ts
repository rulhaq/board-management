import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const DELETE: RequestHandler = async ({ request, params }) => {
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

    // Verify the notification belongs to the user
    const notificationDoc = await db.collection('notifications').doc(id).get();
    if (!notificationDoc.exists) {
      return json({ error: 'Notification not found' }, { status: 404 });
    }

    const notificationData = notificationDoc.data();
    if (notificationData?.userId !== userId) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.collection('notifications').doc(id).delete();

    return json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return json({
      error: 'Failed to delete notification',
      details: error.message
    }, { status: 500 });
  }
};

