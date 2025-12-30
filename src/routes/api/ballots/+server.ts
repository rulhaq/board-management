import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

// Helper to get username from userId
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
      return json({ ballots: [] });
    }

    if (!adminAuth) {
      return json({ ballots: [] });
    }

    try {
      const token = authHeader.split(' ')[1];
      await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ ballots: [] });
    }

    if (!db) {
      return json({ ballots: [] });
    }

    try {
      const ballotsSnapshot = await db.collection('ballots')
        .orderBy('createdAt', 'desc')
        .get();
      
      const ballots = ballotsSnapshot.docs.map(doc => {
        const data = doc.data();
        const now = new Date();
        const startDate = data.startDate?.toDate ? data.startDate.toDate() : (data.startDate ? new Date(data.startDate) : now);
        const endDate = data.endDate?.toDate ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : now);
        
        // Calculate status
        let status = 'scheduled';
        if (now >= startDate && now <= endDate) {
          status = 'active';
        } else if (now > endDate) {
          status = 'completed';
        }
        
        return {
          id: doc.id,
          ...data,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          status: status,
          totalVotes: data.totalVotes || 0,
          eligibleVoters: data.eligibleVoters || 8,
          hasVoted: data.hasVoted || false,
          userVote: data.userVote || []
        };
      });

      return json({ ballots });
    } catch (queryError) {
      console.warn('orderBy failed, trying without:', queryError);
      try {
        const ballotsSnapshot = await db.collection('ballots').get();
        const ballots = ballotsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const now = new Date();
            const startDate = data.startDate?.toDate ? data.startDate.toDate() : (data.startDate ? new Date(data.startDate) : now);
            const endDate = data.endDate?.toDate ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : now);
            
            // Calculate status
            let status = 'scheduled';
            if (now >= startDate && now <= endDate) {
              status = 'active';
            } else if (now > endDate) {
              status = 'completed';
            }
            
            return {
              id: doc.id,
              ...data,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
              status: status,
              totalVotes: data.totalVotes || 0,
              eligibleVoters: data.eligibleVoters || 8,
              hasVoted: data.hasVoted || false,
              userVote: data.userVote || []
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return json({ ballots });
      } catch (error) {
        console.error('Error loading ballots:', error);
        return json({ ballots: [] });
      }
    }
  } catch (error) {
    console.error('Ballots API error:', error);
    return json({ 
      error: 'Failed to load ballots',
      ballots: []
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = 'unknown';
    
    if (adminAuth) {
      try {
        const token = authHeader.split(' ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (authError) {
        console.warn('Token verification failed:', authError);
        // Will extract from request body as fallback
      }
    }

    let ballotData;
    try {
      ballotData = await request.json();
    } catch (parseError) {
      return json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Extract userId from ballotData if not set from token
    if (userId === 'unknown' && ballotData.createdByUid) {
      userId = ballotData.createdByUid;
    }

    if (!ballotData.title || !ballotData.options || ballotData.options.length < 2) {
      return json({ 
        error: 'Invalid ballot data',
        details: {
          hasTitle: !!ballotData.title,
          optionsCount: ballotData.options?.length || 0
        }
      }, { status: 400 });
    }

    if (!db) {
      return json({ 
        success: true,
        id: 'ballot-' + Date.now(),
        message: 'Database not initialized, ballot not saved (demo mode)'
      });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    
    // Get username - use fallback if userId is unknown
    const username = userId !== 'unknown' 
      ? await getUsername(userId) 
      : (ballotData.createdByName || ballotData.createdBy || 'Unknown');
    
    // Remove the id field if present (Firebase will generate it)
    const { id, ...ballotDataWithoutId } = ballotData;
    
    const ballotRef = await db.collection('ballots').add({
      ...ballotDataWithoutId,
      createdByUid: userId,
      createdByUsername: username,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      startDate: ballotData.startDate ? new Date(ballotData.startDate) : FieldValue.serverTimestamp(),
      endDate: ballotData.endDate ? new Date(ballotData.endDate) : FieldValue.serverTimestamp(),
      // Store initial results
      results: {
        totalVotes: 0,
        optionVotes: ballotData.options?.map((opt) => ({
          optionId: opt.id || opt.text || String(opt),
          votes: 0,
          voters: []
        })) || [],
        submittedAt: null,
        finalizedAt: null
      }
    });

    return json({ 
      success: true,
      id: ballotRef.id,
      message: 'Ballot created successfully'
    });
  } catch (error: any) {
    console.error('Create ballot error:', error);
    console.error('Error stack:', error?.stack);
    return json({ 
      error: 'Failed to create ballot',
      details: error?.message || String(error) || 'Unknown error'
    }, { status: 500 });
  }
};

