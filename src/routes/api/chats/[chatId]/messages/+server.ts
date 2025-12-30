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
    const { chatId } = params;

    const messageData = await request.json();

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get user data for username
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const username = userData?.displayName || userData?.email || 'Unknown';

    const { FieldValue } = await import('firebase-admin/firestore');

    // Save message to Firestore
    const messageRef = await db.collection('messages').add({
      chatId,
      text: messageData.text,
      senderId: userId,
      senderName: username,
      senderEmail: userData?.email || '',
      type: messageData.type || 'text',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      // Store prompt/user input for team chats
      prompt: messageData.text, // Store the user's message/prompt
      metadata: messageData.metadata || {}
    });

    // Update chat's last message
    await db.collection('chats').doc(chatId).update({
      lastMessage: messageData.text,
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageBy: userId,
      lastMessageByUsername: username,
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({
      success: true,
      messageId: messageRef.id,
      message: 'Message saved successfully'
    });
  } catch (error: any) {
    console.error('Message save error:', error);
    return json({
      error: 'Failed to save message',
      details: error.message
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth) {
      return json({ error: 'Admin auth not initialized' }, { status: 500 });
    }

    const token = authHeader.split(' ')[1];
    await adminAuth.verifyIdToken(token);
    const { chatId } = params;

    if (!db) {
      return json({ messages: [] });
    }

    try {
      const messagesSnapshot = await db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .get();

      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      });

      return json({ messages });
    } catch (queryError: any) {
      // If orderBy fails, try without it
      console.warn('Messages orderBy failed:', queryError);
      const messagesSnapshot = await db.collection('messages')
        .where('chatId', '==', chatId)
        .get();

      const messages = messagesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
          };
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return json({ messages });
    }
  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return json({ messages: [] }, { status: 500 });
  }
};

