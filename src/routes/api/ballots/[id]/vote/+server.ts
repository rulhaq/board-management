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

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id } = params;
    const voteData = await request.json();

    if (!id || !voteData.selectedOptions || voteData.selectedOptions.length === 0) {
      return json({ error: 'Invalid vote data' }, { status: 400 });
    }

    if (!db) {
      return json({ 
        success: true,
        message: 'Database not initialized, vote not saved (demo mode)'
      });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    
    // Get the ballot
    const ballotDoc = await db.collection('ballots').doc(id).get();
    if (!ballotDoc.exists) {
      return json({ error: 'Ballot not found' }, { status: 404 });
    }

    const ballot = ballotDoc.data();
    
    // Check if user already voted
    const votesSnapshot = await db.collection('votes')
      .where('ballotId', '==', id)
      .where('userId', '==', voteData.userId)
      .get();

    if (!votesSnapshot.empty) {
      return json({ error: 'You have already voted on this ballot' }, { status: 400 });
    }

    // Get username
    const username = await getUsername(userId);

    // Save the vote with username and timestamp
    await db.collection('votes').add({
      ballotId: id,
      userId: userId,
      username: username,
      userEmail: decodedToken.email || '',
      selectedOptions: voteData.selectedOptions,
      comments: voteData.comments || '',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      isAnonymous: ballot.isAnonymous || false,
      // Store results
      results: {
        options: voteData.selectedOptions,
        submittedAt: FieldValue.serverTimestamp()
      }
    });

    // Update ballot vote counts
    const updatedOptions = ballot.options.map((option) => {
      if (voteData.selectedOptions.includes(option.id)) {
        return {
          ...option,
          votes: (option.votes || 0) + 1,
          voters: ballot.isAnonymous 
            ? option.voters 
            : [...(option.voters || []), voteData.userId]
        };
      }
      return option;
    });

    // Update ballot with results
    const currentTotalVotes = (ballot.totalVotes || 0) + 1;
    const updatedResults = {
      totalVotes: currentTotalVotes,
      optionVotes: updatedOptions.map((opt: any) => ({
        optionId: opt.id,
        votes: opt.votes || 0,
        voters: opt.voters || []
      })),
      lastVoteAt: FieldValue.serverTimestamp(),
      lastVoteBy: userId,
      lastVoteByUsername: username
    };

    await db.collection('ballots').doc(id).update({
      options: updatedOptions,
      totalVotes: currentTotalVotes,
      updatedAt: FieldValue.serverTimestamp(),
      results: updatedResults
    });

    return json({ 
      success: true,
      message: 'Vote submitted successfully'
    });
  } catch (error) {
    console.error('Vote submission error:', error);
    return json({ 
      error: 'Failed to submit vote',
      details: error.message 
    }, { status: 500 });
  }
};

