import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token if adminAuth is available
    if (adminAuth) {
      try {
        const token = authHeader.split(' ')[1];
        await adminAuth.verifyIdToken(token);
      } catch (authError) {
        // If auth fails, still allow but log warning
        console.warn('Token verification failed:', authError);
      }
    }

    // Load members from Firestore
    if (!db) {
      // Return empty array if database not initialized (for demo)
      return json({ members: [] });
    }

    try {
      const { collection, getDocs, query, orderBy } = await import('firebase-admin/firestore');
      const membersRef = db.collection('users');
      
      try {
        const membersSnapshot = await membersRef.orderBy('displayName', 'asc').get();
        const members = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamps to ISO strings
            joinDate: data.joinDate?.toDate?.()?.toISOString() || data.joinDate,
            lastActive: data.lastActive?.toDate?.()?.toISOString() || data.lastActive
          };
        });
        return json({ members });
      } catch (orderByError) {
        // If orderBy fails (no index), try without it
        console.warn('orderBy failed, trying without:', orderByError);
        const membersSnapshot = await membersRef.get();
        const members = membersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              joinDate: data.joinDate?.toDate?.()?.toISOString() || data.joinDate,
              lastActive: data.lastActive?.toDate?.()?.toISOString() || data.lastActive
            };
          })
          .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        return json({ members });
      }
    } catch (error) {
      console.error('Error loading members:', error);
      return json({ members: [] });
    }
  } catch (error) {
    console.error('Members API error:', error);
    return json({ 
      error: 'Failed to load members',
      members: [] // Return empty array instead of error
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberData = await request.json();

    if (!db) {
      return json({ 
        success: true,
        message: 'Database not initialized, member not saved (demo mode)'
      });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    
    await db.collection('users').add({
      ...memberData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({ success: true, message: 'Member created successfully' });
  } catch (error) {
    console.error('Create member error:', error);
    return json({ 
      error: 'Failed to create member',
      details: error.message 
    }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...memberData } = await request.json();

    if (!id) {
      return json({ error: 'Member ID is required' }, { status: 400 });
    }

    if (!db) {
      return json({ 
        success: true,
        message: 'Database not initialized, member not updated (demo mode)'
      });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    
    await db.collection('users').doc(id).update({
      ...memberData,
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({ success: true, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    return json({ 
      error: 'Failed to update member',
      details: error.message 
    }, { status: 500 });
  }
};

