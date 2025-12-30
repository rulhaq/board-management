#!/usr/bin/env node

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
  });
} catch (error) {
  // App already initialized
}

const auth = admin.auth();
const db = admin.firestore();

const USERS = [
  {
    uid: 'admin-uid-001',
    email: 'admin@sidra.com',
    password: 'SidraAdmin2024!',
    displayName: 'System Administrator',
    profile: {
      role: 'admin',
      permissions: ['*'],
      department: 'Administration',
      position: 'System Administrator',
      phone: '+1-555-0001',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'secretary-uid-001',
    email: 'secretary@sidra.com',
    password: 'Secretary2024!',
    displayName: 'Sarah Johnson',
    profile: {
      role: 'secretary',
      permissions: ['documents.read', 'documents.create', 'documents.edit', 'meetings.read', 'meetings.create', 'meetings.edit', 'votes.create', 'reports.read', 'reports.create'],
      department: 'Administration',
      position: 'Board Secretary',
      phone: '+1-555-0002',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'chairman-uid-001',
    email: 'chairman@sidra.com',
    password: 'Chairman2024!',
    displayName: 'Robert Wilson',
    profile: {
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Chairman',
      phone: '+1-555-0003',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'member1-uid-001',
    email: 'member1@sidra.com',
    password: 'Member2024!',
    displayName: 'Michael Brown',
    profile: {
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Board Member',
      phone: '+1-555-0004',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'member2-uid-001',
    email: 'member2@sidra.com',
    password: 'Member2024!',
    displayName: 'Emily Davis',
    profile: {
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Board Member',
      phone: '+1-555-0005',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'treasurer-uid-001',
    email: 'treasurer@sidra.com',
    password: 'Treasurer2024!',
    displayName: 'David Miller',
    profile: {
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Finance',
      position: 'Treasurer',
      phone: '+1-555-0006',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  },
  {
    uid: 'viewer-uid-001',
    email: 'viewer@sidra.com',
    password: 'Viewer2024!',
    displayName: 'Guest Observer',
    profile: {
      role: 'viewer',
      permissions: ['documents.read', 'meetings.read', 'reports.read'],
      department: 'External',
      position: 'Observer',
      phone: '+1-555-0007',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    }
  }
];

const DOCUMENTS = [
  {
    id: 'doc-001',
    title: 'Annual Financial Report 2024',
    description: 'Comprehensive financial overview for fiscal year 2024',
    category: 'Financial',
    confidentialityLevel: 'restricted',
    tags: ['financial', 'annual', '2024', 'report'],
    accessList: ['admin-uid-001', 'chairman-uid-001', 'treasurer-uid-001', 'secretary-uid-001'],
    fileName: 'annual-financial-report-2024.pdf',
    fileSize: 2456789,
    uploadedBy: 'secretary-uid-001',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    version: '1.0',
    isArchived: false,
    downloadCount: 12,
    viewCount: 45,
    encryption: {
      isEncrypted: true,
      algorithm: 'AES-256-CBC',
      keyId: 'key-001'
    }
  },
  {
    id: 'doc-002',
    title: 'Strategic Plan 2025-2027',
    description: 'Three-year strategic planning document outlining organizational goals',
    category: 'Strategic',
    confidentialityLevel: 'confidential',
    tags: ['strategy', 'planning', '2025', 'goals'],
    accessList: ['admin-uid-001', 'chairman-uid-001', 'member1-uid-001', 'member2-uid-001', 'secretary-uid-001'],
    fileName: 'strategic-plan-2025-2027.pdf',
    fileSize: 1234567,
    uploadedBy: 'admin-uid-001',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    version: '2.1',
    isArchived: false,
    downloadCount: 8,
    viewCount: 32,
    encryption: {
      isEncrypted: true,
      algorithm: 'AES-256-CBC',
      keyId: 'key-002'
    }
  },
  {
    id: 'doc-003',
    title: 'Board Meeting Minutes - October 2024',
    description: 'Minutes from the October board meeting including decisions and action items',
    category: 'Minutes',
    confidentialityLevel: 'restricted',
    tags: ['minutes', 'october', '2024', 'decisions'],
    accessList: ['admin-uid-001', 'chairman-uid-001', 'member1-uid-001', 'member2-uid-001', 'treasurer-uid-001', 'secretary-uid-001'],
    fileName: 'board-minutes-oct-2024.pdf',
    fileSize: 567890,
    uploadedBy: 'secretary-uid-001',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    version: '1.0',
    isArchived: false,
    downloadCount: 15,
    viewCount: 67,
    encryption: {
      isEncrypted: true,
      algorithm: 'AES-256-CBC',
      keyId: 'key-003'
    }
  },
  {
    id: 'doc-004',
    title: 'Compliance Audit Report Q3 2024',
    description: 'Third quarter compliance audit findings and recommendations',
    category: 'Compliance',
    confidentialityLevel: 'top-secret',
    tags: ['compliance', 'audit', 'q3', '2024'],
    accessList: ['admin-uid-001', 'chairman-uid-001', 'treasurer-uid-001'],
    fileName: 'compliance-audit-q3-2024.pdf',
    fileSize: 3456789,
    uploadedBy: 'admin-uid-001',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    version: '1.0',
    isArchived: false,
    downloadCount: 3,
    viewCount: 8,
    encryption: {
      isEncrypted: true,
      algorithm: 'AES-256-CBC',
      keyId: 'key-004'
    }
  }
];

const MEETINGS = [
  {
    id: 'meeting-001',
    title: 'Q4 Board Meeting 2024',
    description: 'Quarterly board meeting to review financial performance and strategic initiatives',
    date: admin.firestore.Timestamp.fromDate(new Date('2024-12-15T10:00:00')),
    startTime: '10:00',
    endTime: '12:00',
    location: 'Conference Room A, Sidra HQ',
    isVirtual: false,
    virtualLink: '',
    organizer: 'chairman-uid-001',
    attendees: ['admin-uid-001', 'chairman-uid-001', 'member1-uid-001', 'member2-uid-001', 'treasurer-uid-001', 'secretary-uid-001'],
    status: 'scheduled',
    agenda: [
      {
        id: 'agenda-001',
        title: 'Financial Review Q4',
        description: 'Review of quarterly financial performance',
        duration: 30,
        presenter: 'treasurer-uid-001',
        documents: ['doc-001'],
        order: 1
      },
      {
        id: 'agenda-002',
        title: 'Strategic Planning Discussion',
        description: 'Discussion on 2025 strategic initiatives',
        duration: 45,
        presenter: 'chairman-uid-001',
        documents: ['doc-002'],
        order: 2
      },
      {
        id: 'agenda-003',
        title: 'Budget Approval Vote',
        description: 'Vote on 2025 budget proposal',
        duration: 15,
        presenter: 'treasurer-uid-001',
        documents: [],
        order: 3
      }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'secretary-uid-001'
  },
  {
    id: 'meeting-002',
    title: 'Budget Review Meeting',
    description: 'Special meeting to review and approve the 2025 budget',
    date: admin.firestore.Timestamp.fromDate(new Date('2024-12-20T14:00:00')),
    startTime: '14:00',
    endTime: '16:00',
    location: 'Virtual Meeting',
    isVirtual: true,
    virtualLink: 'https://meet.google.com/abc-defg-hij',
    organizer: 'treasurer-uid-001',
    attendees: ['admin-uid-001', 'chairman-uid-001', 'member1-uid-001', 'treasurer-uid-001', 'secretary-uid-001'],
    status: 'scheduled',
    agenda: [
      {
        id: 'agenda-004',
        title: 'Budget Presentation',
        description: 'Detailed presentation of 2025 budget proposal',
        duration: 60,
        presenter: 'treasurer-uid-001',
        documents: [],
        order: 1
      }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'treasurer-uid-001'
  }
];

async function createUsers() {
  console.log('Creating users in Firebase Authentication...');
  
  for (const userData of USERS) {
    try {
      await auth.createUser({
        uid: userData.uid,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: true,
        disabled: false
      });
      
      // Set custom claims for role-based access
      await auth.setCustomUserClaims(userData.uid, {
        role: userData.profile.role,
        permissions: userData.profile.permissions
      });
      
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
  }
}

async function createUserProfiles() {
  console.log('Creating user profiles in Firestore...');
  
  const batch = db.batch();
  
  for (const userData of USERS) {
    const userRef = db.collection('users').doc(userData.uid);
    const profile = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      ...userData.profile,
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(userRef, profile);
  }
  
  await batch.commit();
  console.log('✅ User profiles created');
}

async function createDocuments() {
  console.log('Creating documents in Firestore...');
  
  const batch = db.batch();
  
  for (const docData of DOCUMENTS) {
    const docRef = db.collection('documents').doc(docData.id);
    batch.set(docRef, docData);
  }
  
  await batch.commit();
  console.log('✅ Documents created');
}

async function createMeetings() {
  console.log('Creating meetings in Firestore...');
  
  const batch = db.batch();
  
  for (const meetingData of MEETINGS) {
    const meetingRef = db.collection('meetings').doc(meetingData.id);
    batch.set(meetingRef, meetingData);
  }
  
  await batch.commit();
  console.log('✅ Meetings created');
}

async function createSystemSettings() {
  console.log('Creating system settings...');
  
  const systemSettings = {
    systemName: 'Sidra Board Portal',
    version: '1.0.0',
    maintenanceMode: false,
    allowRegistration: false,
    maxFileSize: 52428800,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    sessionTimeout: 3600,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditRetention: 2555,
    backupFrequency: 'daily',
    encryptionEnabled: true,
    twoFactorRequired: false,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'system'
  };
  
  await db.collection('settings').doc('system').set(systemSettings);
  console.log('✅ System settings created');
}

async function main() {
  console.log('🏛️  Setting up Sidra Board System...');
  console.log('=====================================\n');
  
  try {
    await createUsers();
    await createUserProfiles();
    await createDocuments();
    await createMeetings();
    await createSystemSettings();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@sidra.com / SidraAdmin2024!');
    console.log('Secretary: secretary@sidra.com / Secretary2024!');
    console.log('Chairman: chairman@sidra.com / Chairman2024!');
    console.log('Member: member1@sidra.com / Member2024!');
    console.log('Viewer: viewer@sidra.com / Viewer2024!');
    console.log('\n🌐 Access at: http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main(); 