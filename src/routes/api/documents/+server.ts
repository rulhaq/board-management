import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/firebase.server';
import { adminAuth } from '$lib/firebase.server';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ documents: [] });
    }

    try {
      if (!adminAuth) {
        return json({ documents: [] });
      }
      
      const token = authHeader.split(' ')[1];
      await adminAuth.verifyIdToken(token);

      if (!db) {
        return json({ documents: [] });
      }

      try {
        const documentsSnapshot = await db.collection('documents')
          .orderBy('createdAt', 'desc')
          .get();
        
        const documents = documentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          };
        });

        return json({ documents });
      } catch (queryError: any) {
        // If orderBy fails (missing index), try without it
        console.warn('Documents orderBy failed, trying without:', queryError);
        const documentsSnapshot = await db.collection('documents').get();
        const documents = documentsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return json({ documents });
      }
    } catch (authError) {
      return json({ documents: [] });
    }
  } catch (error) {
    console.error('Documents API error:', error);
    return json({ documents: [] });
  }
};

