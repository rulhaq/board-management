import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const auditData = await request.json();
    
    // Validate audit data
    if (!auditData.action) {
      return json({ error: 'Missing required audit action' }, { status: 400 });
    }

    // Enhance audit data with server information
    const enhancedAuditData = {
      ...auditData,
      serverTimestamp: serverTimestamp(),
      clientIP: getClientAddress(),
      timestamp: new Date().toISOString(),
      source: 'web_app'
    };

    // Store in Firestore
    if (db) {
      await addDoc(collection(db, 'auditLogs'), enhancedAuditData);
    }

    return json({ 
      success: true, 
      message: 'Audit log recorded successfully' 
    });

  } catch (error) {
    console.error('Audit logging error:', error);
    return json({ 
      error: 'Failed to record audit log',
      details: error.message 
    }, { status: 500 });
  }
}; 