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

    if (!adminAuth) {
      return json({ settings: {} });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ settings: {} });
    }
    
    // Check if user is admin
    if (db) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc?.data();
      
      if (userData?.role !== 'admin') {
        return json({ settings: {} });
      }
    }

    if (!db) {
      return json({ settings: {} });
    }

    // Get app settings
    const settingsDoc = await db.collection('appSettings').doc('main').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {
      aiProviders: {
        openai: {
          enabled: false,
          apiKey: '',
          model: 'gpt-4'
        },
        groq: {
          enabled: true,
          apiKey: '',
          model: 'llama3-8b-8192'
        },
        ollama: {
          enabled: false,
          url: 'http://localhost:11434',
          model: 'llama2'
        },
        vllm: {
          enabled: false,
          url: 'http://localhost:8000',
          model: 'default'
        }
      },
      system: {
        maintenanceMode: false,
        allowRegistrations: true,
        maxFileUploadSize: 10485760 // 10MB
      }
    };

    return json({ settings });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return json({ settings: {} }, { status: 500 });
  }
};

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
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user is admin
    if (db) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc?.data();
      
      if (userData?.role !== 'admin') {
        return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    const settings = await request.json();
    const { FieldValue } = await import('firebase-admin/firestore');

    await db.collection('appSettings').doc('main').set({
      ...settings,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid
    }, { merge: true });

    return json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return json({
      error: 'Failed to update settings',
      details: error?.message || String(error)
    }, { status: 500 });
  }
};

