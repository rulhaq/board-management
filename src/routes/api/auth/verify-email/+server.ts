import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/firebase.server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return json({ error: 'Missing verification token' }, { status: 400 });
    }

    // Decode the token (in production, use proper JWT verification)
    let payload;
    try {
      payload = JSON.parse(atob(token));
    } catch (error) {
      return json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Check token expiration
    if (Date.now() > payload.exp) {
      return json({ error: 'Token has expired' }, { status: 400 });
    }

    // Verify token type
    if (payload.type !== 'email_verification') {
      return json({ error: 'Invalid token type' }, { status: 400 });
    }

    if (!adminAuth) {
      return json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Update user's email verification status
    await adminAuth.updateUser(payload.uid, {
      emailVerified: true
    });

    return json({ 
      success: true, 
      uid: payload.uid,
      email: payload.email,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return json({ 
      error: 'Failed to verify email',
      details: error.message 
    }, { status: 500 });
  }
}; 