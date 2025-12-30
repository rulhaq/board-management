import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
// Use environment variables with fallbacks for development
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'board-member-app';

let app;

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    app = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      projectId: FIREBASE_PROJECT_ID
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
} else {
  app = getApps()[0];
}

export const adminAuth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export { app }; 