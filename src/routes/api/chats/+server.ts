import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const POST: RequestHandler = async ({ request }) => {
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

    const chatData = await request.json();

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const username = userData?.displayName || userData?.email || 'Unknown';

    const { FieldValue } = await import('firebase-admin/firestore');

    // Ensure participants array includes creator
    const participants = chatData.participants || [];
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Create chat in Firestore
    const chatRef = await db.collection('chats').add({
      name: chatData.name || 'Untitled Chat',
      type: chatData.type || 'direct', // 'direct' or 'team'
      description: chatData.description || '',
      participants: participants,
      createdBy: userId,
      createdByUsername: username,
      createdAt: FieldValue.serverTimestamp(),
      lastMessage: '',
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageBy: userId,
      lastMessageByUsername: username,
      // Store initial prompt if provided
      initialPrompt: chatData.initialPrompt || chatData.prompt || '',
      metadata: chatData.metadata || {}
    });

    return json({
      success: true,
      chatId: chatRef.id,
      message: 'Chat created successfully'
    });
  } catch (error: any) {
    console.error('Chat creation error:', error);
    return json({
      error: 'Failed to create chat',
      details: error.message
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ request }) => {
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

    if (!db) {
      return json({ chats: [] });
    }

    try {
      // Get chats where user is a participant
      const chatsSnapshot = await db.collection('chats')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc')
        .get();

      const chats = chatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt
        };
      });

      return json({ chats });
    } catch (queryError: any) {
      // If orderBy fails, try without it
      console.warn('Chats orderBy failed:', queryError);
      const chatsSnapshot = await db.collection('chats')
        .where('participants', 'array-contains', userId)
        .get();

      const chats = chatsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || data.lastMessageAt
          };
        })
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      return json({ chats });
    }
  } catch (error: any) {
    console.error('Chats fetch error:', error);
    return json({ chats: [] }, { status: 500 });
  }
};

