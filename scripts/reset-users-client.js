#!/usr/bin/env node

/**
 * Board Governance AI - Reset Users Script (Client SDK Version)
 * Creates new users using Firebase Client SDK
 * Note: To delete existing users, use Firebase Console or run reset-users.js with Admin SDK credentials
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID?.split(',')[0] // Remove trailing comma if present
};

// Validate Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.log('❌ Missing Firebase configuration keys in .env file:');
  missingKeys.forEach(key => console.log(`   - VITE_FIREBASE_${key.toUpperCase()}`));
  console.log('\nPlease update your .env file with the correct Firebase configuration.');
  process.exit(1);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// New users to create
const NEW_USERS = [
  {
    email: 'cto@scalovate.com',
    password: 'iamgettingOldn0w',
    displayName: 'CTO - Super Admin',
    role: 'admin',
    position: 'Administrator',
    department: 'Administration',
    permissions: {
      canManageUsers: true,
      canManageRoles: true,
      canManageSettings: true,
      canViewAllDocuments: true,
      canManageDocuments: true,
      canScheduleMeetings: true,
      canManageVoting: true,
      canAccessReports: true,
      canManageAI: true,
      canManageIntegrations: true,
    },
    emailVerified: true,
  },
  {
    email: 'admin@boardgovernance.ai',
    password: 'Admin2024!',
    displayName: 'System Administrator',
    role: 'admin',
    position: 'System Administrator',
    department: 'Administration',
    permissions: {
      canManageUsers: true,
      canManageRoles: true,
      canManageSettings: true,
      canViewAllDocuments: true,
      canManageDocuments: true,
      canScheduleMeetings: true,
      canManageVoting: true,
      canAccessReports: true,
      canManageAI: true,
      canManageIntegrations: true,
    },
    emailVerified: false,
  },
  {
    email: 'secretary@boardgovernance.ai',
    password: 'Secretary2024!',
    displayName: 'Board Secretary',
    role: 'secretary',
    position: 'Board Secretary',
    department: 'Administration',
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: true,
      canScheduleMeetings: true,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false,
    },
    emailVerified: false,
  },
  {
    email: 'board.member1@boardgovernance.ai',
    password: 'Board2024!',
    displayName: 'Board Member 1',
    role: 'board_member',
    position: 'Board Member',
    department: 'Board',
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: true,
      canManageIntegrations: false,
    },
    emailVerified: false,
  },
  {
    email: 'board.member2@boardgovernance.ai',
    password: 'Board2024!',
    displayName: 'Board Member 2',
    role: 'board_member',
    position: 'Board Member',
    department: 'Board',
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: true,
      canManageIntegrations: false,
    },
    emailVerified: false,
  },
];

async function deleteFirestoreUsers() {
  console.log('\n🗑️  Deleting user documents from Firestore...');
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const deletePromises = [];
    snapshot.docs.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, 'users', docSnapshot.id)));
    });
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deletePromises.length} user document(s) from Firestore`);
    } else {
      console.log('ℹ️  No user documents found in Firestore');
    }
  } catch (error) {
    console.error('❌ Error deleting Firestore users:', error.message);
  }
}

async function createUsers() {
  console.log('\n👥 Creating new users...\n');

  for (const userData of NEW_USERS) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;
      console.log(`✅ Created Auth user: ${userData.email} (${user.uid})`);

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        position: userData.position,
        department: userData.department,
        permissions: userData.permissions,
        preferences: {
          aiProvider: 'groq',
          aiModel: 'llama3-8b-8192',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            chat: true,
            meetings: true,
          },
          videoConferencing: {
            preferred: 'teams',
            autoJoin: false,
          },
        },
        status: 'active',
        emailVerified: userData.emailVerified,
        mfaEnabled: false,
        joinedDate: new Date().toISOString(),
        lastActive: null,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log(`✅ Created Firestore profile for: ${userData.email}\n`);

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User ${userData.email} already exists, skipping...\n`);
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 Board Governance AI - User Reset Script (Client SDK)');
  console.log('======================================================\n');

  try {
    // Step 1: Delete Firestore user documents (we can't delete Auth users with client SDK)
    await deleteFirestoreUsers();

    console.log('\n⚠️  NOTE: To delete existing Firebase Auth users, you need to:');
    console.log('   1. Use Firebase Console: Authentication > Users > Delete');
    console.log('   2. Or set up Firebase Admin SDK credentials and run: node scripts/reset-users.js\n');

    // Step 2: Create new users
    await createUsers();

    console.log('\n🎉 User creation complete!\n');
    console.log('📋 New User Credentials:');
    console.log('========================\n');
    
    NEW_USERS.forEach((user) => {
      console.log(`👤 ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });

    console.log('⚠️  IMPORTANT:');
    console.log('   - Please delete old users manually from Firebase Console');
    console.log('   - Change passwords after first login');
    console.log('\n🌐 Access your application at: http://localhost:5173');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

