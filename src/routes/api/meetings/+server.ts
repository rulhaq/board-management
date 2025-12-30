import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

// Helper to get username
async function getUsername(userId: string): Promise<string> {
  if (!db) return 'Unknown';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.displayName || userData?.email || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ meetings: [] });
    }

    if (!adminAuth) {
      return json({ meetings: [] });
    }

    try {
      const token = authHeader.split(' ')[1];
      await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ meetings: [] });
    }

    if (!db) {
      return json({ meetings: [] });
    }

    try {
      const meetingsSnapshot = await db.collection('meetings')
        .orderBy('date', 'desc')
        .get();

      const meetings = meetingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });

      return json({ meetings });
    } catch (queryError: any) {
      console.warn('Meetings orderBy failed:', queryError);
      const meetingsSnapshot = await db.collection('meetings').get();
      const meetings = meetingsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.()?.toISOString() || data.date,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return json({ meetings });
    }
  } catch (error: any) {
    console.error('Meetings API error:', error);
    return json({ meetings: [] }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const meetingData = await request.json();

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    const username = await getUsername(userId);
    const { FieldValue } = await import('firebase-admin/firestore');

    // Combine date and time into a single datetime
    const meetingDateTime = meetingData.date && meetingData.time
      ? new Date(`${meetingData.date}T${meetingData.time}`)
      : FieldValue.serverTimestamp();

    const meetingRef = await db.collection('meetings').add({
      ...meetingData,
      createdBy: userId,
      createdByUsername: username,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      date: meetingDateTime,
      status: 'scheduled',
      attendees: meetingData.attendees || [],
      metadata: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdVia: 'web_app'
      }
    });

    return json({
      success: true,
      meetingId: meetingRef.id,
      message: 'Meeting created successfully'
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    return json({
      error: 'Failed to create meeting',
      details: error.message
    }, { status: 500 });
  }
};

