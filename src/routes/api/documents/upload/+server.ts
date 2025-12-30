import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';
import { getStorage } from 'firebase-admin/storage';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!db) {
      return json({ error: 'Database not initialized' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'general';
    const title = formData.get('title') as string || file.name;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const username = userData?.displayName || userData?.email || 'Unknown';

    // Upload file to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `documents/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: userId,
          uploadedByUsername: username,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable (or use signed URLs for private)
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Extract text using OCR (simplified - in production, use actual OCR service)
    // For now, we'll store the filename and basic metadata
    const ocrText = ''; // Placeholder - integrate with OCR service

    // Save document metadata to Firestore
    const { FieldValue } = await import('firebase-admin/firestore');
    const docRef = await db.collection('documents').add({
      title,
      name: file.name,
      description,
      category,
      type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      size: file.size,
      url: publicUrl,
      storagePath: fileName,
      uploadedBy: userId,
      uploadedByUsername: username,
      uploadedAt: FieldValue.serverTimestamp(),
      ocrText,
      ocrProcessedAt: FieldValue.serverTimestamp(),
      version: 1,
      status: 'active',
      downloadCount: 0,
      isStarred: false
    });

    return json({
      success: true,
      documentId: docRef.id,
      url: publicUrl,
      message: 'Document uploaded successfully'
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return json({
      error: 'Failed to upload document',
      details: error.message
    }, { status: 500 });
  }
};

