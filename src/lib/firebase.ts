import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { browser } from '$app/environment';

const firebaseConfig = {
  // These will be set via environment variables
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'demo-api-key' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'board-governance';

if (browser && !isFirebaseConfigured) {
  console.warn('⚠️ Firebase is not properly configured. Please set up your .env file with Firebase credentials.');
  console.warn('Expected environment variables:');
  console.warn('  VITE_FIREBASE_API_KEY');
  console.warn('  VITE_FIREBASE_AUTH_DOMAIN');
  console.warn('  VITE_FIREBASE_PROJECT_ID');
  console.warn('  VITE_FIREBASE_STORAGE_BUCKET');
  console.warn('  VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.warn('  VITE_FIREBASE_APP_ID');
}

// Initialize Firebase with proper singleton pattern
let app;
if (typeof window !== 'undefined') {
  // Client-side initialization
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      if (browser) {
        console.error('Please check your Firebase configuration in .env file');
      }
    }
  } else {
    app = getApps()[0];
  }
} else {
  // Server-side - use a different app name to avoid conflicts
  const serverApps = getApps().filter(a => a.name === 'server');
  if (serverApps.length === 0) {
    try {
      app = initializeApp(firebaseConfig, 'server');
    } catch (error) {
      console.error('Failed to initialize Firebase on server:', error);
    }
  } else {
    app = serverApps[0];
  }
}

export { app };

// Initialize Firebase services only on the client side
// Only initialize if app was successfully created
export const auth = browser && app ? getAuth(app) : null;
export const db = browser && app ? getFirestore(app) : null;
export const storage = browser && app ? getStorage(app) : null; 