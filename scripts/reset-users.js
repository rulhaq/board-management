#!/usr/bin/env node

/**
 * Board Governance AI - Reset Users Script
 * Removes all existing users and creates new ones
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

try {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

// New users to create
const NEW_USERS = [
  {
    email: 'cto@scalovate.com',
    password: 'iamgettingOldn0w',
    displayName: 'CTO - Super Admin',
    role: 'admin',
    position: 'Chief Technology Officer',
    department: 'Technology',
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
    emailVerified: true,
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
    emailVerified: true,
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
    emailVerified: true,
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
    emailVerified: true,
  },
];

async function deleteAllUsers() {
  console.log('\n🗑️  Deleting all existing users...');
  
  try {
    let nextPageToken;
    let deletedCount = 0;

    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        try {
          await auth.deleteUser(userRecord.uid);
          console.log(`   ✅ Deleted: ${userRecord.email || userRecord.uid}`);
          deletedCount++;
        } catch (error) {
          console.error(`   ❌ Error deleting ${userRecord.email || userRecord.uid}:`, error.message);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n✅ Deleted ${deletedCount} user(s) from Firebase Auth`);

    // Also delete all user documents from Firestore
    console.log('\n🗑️  Deleting user documents from Firestore...');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${snapshot.docs.length} user document(s) from Firestore`);
    } else {
      console.log('ℹ️  No user documents found in Firestore');
    }

  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    throw error;
  }
}

async function createUsers() {
  console.log('\n👥 Creating new users...\n');

  for (const userData of NEW_USERS) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: userData.emailVerified,
        disabled: false,
      });

      console.log(`✅ Created Auth user: ${userData.email} (${userRecord.uid})`);

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role,
        permissions: userData.permissions,
        createdAt: new Date().toISOString(),
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: userRecord.uid,
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

      await db.collection('users').doc(userRecord.uid).set(userProfile);
      console.log(`✅ Created Firestore profile for: ${userData.email}\n`);

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Board Governance AI - User Reset Script');
  console.log('==========================================\n');

  try {
    // Step 1: Delete all existing users
    await deleteAllUsers();

    // Step 2: Create new users
    await createUsers();

    console.log('\n🎉 User reset complete!\n');
    console.log('📋 New User Credentials:');
    console.log('========================\n');
    
    NEW_USERS.forEach((user) => {
      console.log(`👤 ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });

    console.log('⚠️  IMPORTANT: Please change passwords after first login!');
    console.log('\n🌐 Access your application at: http://localhost:5173');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

