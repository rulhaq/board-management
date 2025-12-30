#!/usr/bin/env node

/**
 * Sidra Board System - Initial Admin Setup
 * Creates the first admin user for the system
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

console.log('🏛️  Sidra Board System - Admin Setup');
console.log('====================================\n');

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default admin user credentials
const DEFAULT_ADMIN = {
  email: 'admin@sidra.com',
  password: 'SidraAdmin2024!',
  displayName: 'System Administrator',
  role: 'admin'
};

async function createAdminUser() {
  try {
    console.log('Creating initial admin user...');
    console.log(`Email: ${DEFAULT_ADMIN.email}`);
    console.log(`Password: ${DEFAULT_ADMIN.password}`);
    console.log('');

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      DEFAULT_ADMIN.email, 
      DEFAULT_ADMIN.password
    );
    
    const user = userCredential.user;
    console.log('✅ Admin user created in Firebase Auth');

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: DEFAULT_ADMIN.email,
      displayName: DEFAULT_ADMIN.displayName,
      role: DEFAULT_ADMIN.role,
      permissions: ['*'], // All permissions
      lastLogin: new Date(),
      isActive: true,
      createdAt: new Date(),
      createdBy: 'system',
      department: 'Administration',
      phone: '',
      position: 'System Administrator'
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ Admin profile created in Firestore');

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
    console.log('\n🌐 Access your application at: http://localhost:5173');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Admin user already exists');
      console.log('\n📋 Default Login Credentials:');
      console.log(`   Email: ${DEFAULT_ADMIN.email}`);
      console.log(`   Password: ${DEFAULT_ADMIN.password}`);
      console.log('\n🌐 Access your application at: http://localhost:5173');
    } else {
      console.error('❌ Error creating admin user:', error.message);
      console.log('\nCommon issues:');
      console.log('- Check your Firebase configuration in .env');
      console.log('- Ensure Firebase project is properly set up');
      console.log('- Verify internet connection');
    }
  }
}

// Additional users you can create
const SAMPLE_USERS = [
  {
    email: 'secretary@sidra.com',
    password: 'Secretary2024!',
    displayName: 'Board Secretary',
    role: 'secretary',
    department: 'Administration',
    position: 'Secretary'
  },
  {
    email: 'member1@sidra.com',
    password: 'Member2024!',
    displayName: 'John Smith',
    role: 'board_member',
    department: 'Board',
    position: 'Board Member'
  },
  {
    email: 'viewer@sidra.com',
    password: 'Viewer2024!',
    displayName: 'Guest Viewer',
    role: 'viewer',
    department: 'External',
    position: 'Observer'
  }
];

async function createSampleUsers() {
  console.log('\n📝 Would you like to create sample users for testing?');
  console.log('Sample users:');
  SAMPLE_USERS.forEach(user => {
    console.log(`   ${user.email} (${user.role}) - Password: ${user.password}`);
  });
  
  // Note: In a real setup, you'd prompt for user input here
  // For now, we'll just show the credentials
}

// Run setup
async function runSetup() {
  await createAdminUser();
  await createSampleUsers();
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:5173 in your browser');
  console.log('3. Login with the admin credentials above');
  console.log('4. Change the admin password in Settings');
  console.log('5. Create additional users as needed');
  
  process.exit(0);
}

runSetup().catch(console.error); 