import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/firebase.server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, displayName, password, emailVerified = false } = await request.json();
    
    // Validate input
    if (!email || !displayName || !password) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminAuth) {
      return json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      displayName,
      password,
      emailVerified,
      disabled: false
    });

    // Set custom claims based on role (if provided)
    const customClaims = {
      role: 'board_member', // Default role
      permissions: [],
      createdAt: new Date().toISOString()
    };

    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);

    return json({ 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    let errorMessage = 'Failed to create user';
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'A user with this email already exists';
      statusCode = 409;
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
      statusCode = 400;
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
      statusCode = 400;
    }

    return json({ 
      error: errorMessage,
      details: error.message 
    }, { status: statusCode });
  }
}; 