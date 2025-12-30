import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !db) {
      return json({ users: [] });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ users: [] });
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin' && userData?.role !== 'secretary') {
      return json({ users: [] });
    }

    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return json({ users });
  } catch (error: any) {
    console.error('Get users error:', error);
    return json({ users: [] }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !db) {
      return json({ error: 'Service not initialized' }, { status: 500 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const userData_req = await request.json();
    const { email, password, displayName, role, position, department } = userData_req;

    if (!email || !password || !displayName) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create user profile in Firestore
    const { FieldValue } = await import('firebase-admin/firestore');
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: role || 'board_member',
      position: position || '',
      department: department || '',
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return json({ 
      success: true, 
      user: {
        id: userRecord.uid,
        email,
        displayName,
        role: role || 'board_member'
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return json({ 
      error: error.message || 'Failed to create user'
    }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !db) {
      return json({ error: 'Service not initialized' }, { status: 500 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    
    // Update Firestore
    await db.collection('users').doc(id).update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update Firebase Auth if email or displayName changed
    if (updateData.email || updateData.displayName) {
      await adminAuth.updateUser(id, {
        email: updateData.email,
        displayName: updateData.displayName
      });
    }

    return json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return json({ 
      error: error.message || 'Failed to update user'
    }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !db) {
      return json({ error: 'Service not initialized' }, { status: 500 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc?.data();
    
    if (userData?.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = url.searchParams.get('id');
    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId);

    return json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return json({ 
      error: error.message || 'Failed to delete user'
    }, { status: 500 });
  }
};

