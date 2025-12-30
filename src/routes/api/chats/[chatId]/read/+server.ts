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

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const { chatId } = params;

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { FieldValue } = await import('firebase-admin/firestore');

    // Mark chat as read for this user
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update user's read status in chat
    const chatData = chatDoc.data();
    const readBy = chatData.readBy || {};
    readBy[userId] = FieldValue.serverTimestamp();

    await db.collection('chats').doc(chatId).update({
      readBy,
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({ success: true, message: 'Chat marked as read' });
  } catch (error: any) {
    console.error('Mark chat read error:', error);
    return json({
      error: 'Failed to mark chat as read',
      details: error.message
    }, { status: 500 });
  }
};

