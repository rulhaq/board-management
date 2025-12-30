#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const USERS = [
  {
    email: 'admin@sidra.com',
    password: 'SidraAdmin2024!',
    profile: {
      displayName: 'System Administrator',
      role: 'admin',
      permissions: ['*'],
      department: 'Administration',
      position: 'System Administrator',
      phone: '+1-555-0001',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'secretary@sidra.com',
    password: 'Secretary2024!',
    profile: {
      displayName: 'Sarah Johnson',
      role: 'secretary',
      permissions: ['documents.read', 'documents.create', 'documents.edit', 'meetings.read', 'meetings.create', 'meetings.edit', 'votes.create', 'reports.read', 'reports.create'],
      department: 'Administration',
      position: 'Board Secretary',
      phone: '+1-555-0002',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'chairman@sidra.com',
    password: 'Chairman2024!',
    profile: {
      displayName: 'Robert Wilson',
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Chairman',
      phone: '+1-555-0003',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'member1@sidra.com',
    password: 'Member2024!',
    profile: {
      displayName: 'Michael Brown',
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Board Member',
      phone: '+1-555-0004',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'member2@sidra.com',
    password: 'Member2024!',
    profile: {
      displayName: 'Emily Davis',
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Board',
      position: 'Board Member',
      phone: '+1-555-0005',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'treasurer@sidra.com',
    password: 'Treasurer2024!',
    profile: {
      displayName: 'David Miller',
      role: 'board_member',
      permissions: ['documents.read', 'meetings.read', 'votes.cast', 'reports.read'],
      department: 'Finance',
      position: 'Treasurer',
      phone: '+1-555-0006',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  },
  {
    email: 'viewer@sidra.com',
    password: 'Viewer2024!',
    profile: {
      displayName: 'Guest Observer',
      role: 'viewer',
      permissions: ['documents.read', 'meetings.read', 'reports.read'],
      department: 'External',
      position: 'Observer',
      phone: '+1-555-0007',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      createdBy: 'system'
    }
  }
];

const DOCUMENTS = [
  {
    title: 'Annual Financial Report 2024',
    description: 'Comprehensive financial overview for fiscal year 2024',
    category: 'Financial',
    confidentialityLevel: 'restricted',
    tags: ['financial', 'annual', '2024', 'report'],
    accessList: ['admin', 'chairman', 'treasurer', 'secretary'],
    fileName: 'annual-financial-report-2024.pdf',
    fileSize: 2456789,
    uploadedBy: 'secretary@sidra.com',
    uploadedAt: new Date('2024-11-15'),
    version: '1.0',
    isArchived: false
  },
  {
    title: 'Strategic Plan 2025-2027',
    description: 'Three-year strategic planning document outlining organizational goals',
    category: 'Strategic',
    confidentialityLevel: 'confidential',
    tags: ['strategy', 'planning', '2025', 'goals'],
    accessList: ['admin', 'chairman', 'member1', 'member2', 'secretary'],
    fileName: 'strategic-plan-2025-2027.pdf',
    fileSize: 1234567,
    uploadedBy: 'admin@sidra.com',
    uploadedAt: new Date('2024-11-20'),
    version: '2.1',
    isArchived: false
  },
  {
    title: 'Board Meeting Minutes - October 2024',
    description: 'Minutes from the October board meeting including decisions and action items',
    category: 'Minutes',
    confidentialityLevel: 'restricted',
    tags: ['minutes', 'october', '2024', 'decisions'],
    accessList: ['admin', 'chairman', 'member1', 'member2', 'treasurer', 'secretary'],
    fileName: 'board-minutes-oct-2024.pdf',
    fileSize: 567890,
    uploadedBy: 'secretary@sidra.com',
    uploadedAt: new Date('2024-10-25'),
    version: '1.0',
    isArchived: false
  },
  {
    title: 'Compliance Audit Report Q3 2024',
    description: 'Third quarter compliance audit findings and recommendations',
    category: 'Compliance',
    confidentialityLevel: 'top-secret',
    tags: ['compliance', 'audit', 'q3', '2024'],
    accessList: ['admin', 'chairman', 'treasurer'],
    fileName: 'compliance-audit-q3-2024.pdf',
    fileSize: 3456789,
    uploadedBy: 'admin@sidra.com',
    uploadedAt: new Date('2024-11-01'),
    version: '1.0',
    isArchived: false
  },
  {
    title: 'Policy Update - Remote Work Guidelines',
    description: 'Updated remote work policies and procedures for board members',
    category: 'Policy',
    confidentialityLevel: 'confidential',
    tags: ['policy', 'remote-work', 'guidelines', 'update'],
    accessList: ['admin', 'chairman', 'member1', 'member2', 'treasurer', 'secretary', 'viewer'],
    fileName: 'remote-work-policy-2024.pdf',
    fileSize: 234567,
    uploadedBy: 'secretary@sidra.com',
    uploadedAt: new Date('2024-11-10'),
    version: '1.2',
    isArchived: false
  }
];

const MEETINGS = [
  {
    title: 'Q4 Board Meeting 2024',
    description: 'Quarterly board meeting to review financial performance and strategic initiatives',
    date: new Date('2024-12-15T10:00:00'),
    startTime: '10:00',
    endTime: '12:00',
    location: 'Conference Room A, Sidra HQ',
    isVirtual: false,
    virtualLink: '',
    organizer: 'chairman@sidra.com',
    attendees: ['admin@sidra.com', 'chairman@sidra.com', 'member1@sidra.com', 'member2@sidra.com', 'treasurer@sidra.com', 'secretary@sidra.com'],
    status: 'scheduled',
    agenda: [
      {
        title: 'Financial Review Q4',
        description: 'Review of quarterly financial performance',
        duration: 30,
        presenter: 'treasurer@sidra.com',
        documents: []
      },
      {
        title: 'Strategic Planning Discussion',
        description: 'Discussion on 2025 strategic initiatives',
        duration: 45,
        presenter: 'chairman@sidra.com',
        documents: []
      },
      {
        title: 'Budget Approval Vote',
        description: 'Vote on 2025 budget proposal',
        duration: 15,
        presenter: 'treasurer@sidra.com',
        documents: []
      }
    ],
    createdAt: new Date(),
    createdBy: 'secretary@sidra.com'
  },
  {
    title: 'Budget Review Meeting',
    description: 'Special meeting to review and approve the 2025 budget',
    date: new Date('2024-12-20T14:00:00'),
    startTime: '14:00',
    endTime: '16:00',
    location: 'Virtual Meeting',
    isVirtual: true,
    virtualLink: 'https://meet.google.com/abc-defg-hij',
    organizer: 'treasurer@sidra.com',
    attendees: ['admin@sidra.com', 'chairman@sidra.com', 'member1@sidra.com', 'treasurer@sidra.com', 'secretary@sidra.com'],
    status: 'scheduled',
    agenda: [
      {
        title: 'Budget Presentation',
        description: 'Detailed presentation of 2025 budget proposal',
        duration: 60,
        presenter: 'treasurer@sidra.com',
        documents: []
      },
      {
        title: 'Q&A Session',
        description: 'Questions and discussion on budget items',
        duration: 45,
        presenter: 'treasurer@sidra.com',
        documents: []
      },
      {
        title: 'Final Vote',
        description: 'Final vote on budget approval',
        duration: 15,
        presenter: 'chairman@sidra.com',
        documents: []
      }
    ],
    createdAt: new Date(),
    createdBy: 'treasurer@sidra.com'
  },
  {
    title: 'Emergency Board Session',
    description: 'Emergency session to address urgent compliance matters',
    date: new Date('2024-11-25T09:00:00'),
    startTime: '09:00',
    endTime: '11:00',
    location: 'Conference Room B, Sidra HQ',
    isVirtual: false,
    virtualLink: '',
    organizer: 'chairman@sidra.com',
    attendees: ['admin@sidra.com', 'chairman@sidra.com', 'member1@sidra.com', 'member2@sidra.com', 'secretary@sidra.com'],
    status: 'completed',
    agenda: [
      {
        title: 'Compliance Issue Review',
        description: 'Review of urgent compliance findings',
        duration: 90,
        presenter: 'admin@sidra.com',
        documents: []
      },
      {
        title: 'Action Plan Approval',
        description: 'Approval of remediation action plan',
        duration: 30,
        presenter: 'chairman@sidra.com',
        documents: []
      }
    ],
    createdAt: new Date('2024-11-20'),
    createdBy: 'admin@sidra.com'
  }
];

const AUDIT_LOGS = [
  {
    userId: 'admin-uid',
    userName: 'System Administrator',
    action: 'login',
    resource: 'auth',
    resourceId: 'admin-uid',
    timestamp: new Date(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session_admin_001'
  },
  {
    userId: 'secretary-uid',
    userName: 'Sarah Johnson',
    action: 'document.upload',
    resource: 'document',
    resourceId: 'doc-001',
    details: { documentTitle: 'Annual Financial Report 2024' },
    timestamp: new Date('2024-11-15T14:30:00'),
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session_secretary_001'
  },
  {
    userId: 'chairman-uid',
    userName: 'Robert Wilson',
    action: 'meeting.create',
    resource: 'meeting',
    resourceId: 'meeting-001',
    details: { meetingTitle: 'Q4 Board Meeting 2024' },
    timestamp: new Date('2024-11-10T09:15:00'),
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session_chairman_001'
  }
];

const NOTIFICATIONS = [
  {
    userId: 'member1-uid',
    title: 'New Document Available',
    message: 'Annual Financial Report 2024 has been uploaded and is available for review.',
    type: 'document',
    priority: 'high',
    isRead: false,
    createdAt: new Date('2024-11-15T14:35:00'),
    relatedId: 'doc-001'
  },
  {
    userId: 'member2-uid',
    title: 'Upcoming Meeting Reminder',
    message: 'Q4 Board Meeting 2024 is scheduled for December 15, 2024 at 10:00 AM.',
    type: 'meeting',
    priority: 'medium',
    isRead: false,
    createdAt: new Date('2024-12-10T08:00:00'),
    relatedId: 'meeting-001'
  }
];

async function createUser(userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    const profile = {
      uid: user.uid,
      email: userData.email,
      ...userData.profile
    };
    
    await setDoc(doc(db, 'users', user.uid), profile);
    return user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // User exists, just return a placeholder UID
      return `${userData.email.split('@')[0]}-uid`;
    }
    throw error;
  }
}

async function populateDocuments(userIds) {
  for (const docData of DOCUMENTS) {
    const document = {
      ...docData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accessList: docData.accessList.map(email => userIds[email] || email),
      uploadedBy: userIds[docData.uploadedBy] || docData.uploadedBy,
      uploadedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      downloadCount: Math.floor(Math.random() * 50),
      viewCount: Math.floor(Math.random() * 100),
      encryption: {
        isEncrypted: true,
        algorithm: 'AES-256-CBC',
        keyId: `key-${Date.now()}`
      }
    };
    
    await addDoc(collection(db, 'documents'), document);
  }
}

async function populateMeetings(userIds) {
  for (const meetingData of MEETINGS) {
    const meeting = {
      ...meetingData,
      id: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizer: userIds[meetingData.organizer] || meetingData.organizer,
      attendees: meetingData.attendees.map(email => userIds[email] || email),
      createdBy: userIds[meetingData.createdBy] || meetingData.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'meetings'), meeting);
  }
}

async function populateAuditLogs() {
  for (const logData of AUDIT_LOGS) {
    const auditLog = {
      ...logData,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'audit_logs'), auditLog);
  }
}

async function populateNotifications() {
  for (const notificationData of NOTIFICATIONS) {
    const notification = {
      ...notificationData,
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'notifications'), notification);
  }
}

async function populateSettings() {
  const systemSettings = {
    systemName: 'Sidra Board Portal',
    version: '1.0.0',
    maintenanceMode: false,
    allowRegistration: false,
    maxFileSize: 52428800, // 50MB
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    sessionTimeout: 3600, // 1 hour
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditRetention: 2555, // 7 years in days
    backupFrequency: 'daily',
    encryptionEnabled: true,
    twoFactorRequired: false,
    lastUpdated: serverTimestamp(),
    updatedBy: 'system'
  };
  
  await setDoc(doc(db, 'settings', 'system'), systemSettings);
}

async function main() {
  console.log('🏛️  Populating Firebase with test data...');
  
  try {
    // Create users and collect UIDs
    const userIds = {};
    for (const userData of USERS) {
      const uid = await createUser(userData);
      userIds[userData.email] = uid;
    }
    
    // Populate documents
    await populateDocuments(userIds);
    
    // Populate meetings
    await populateMeetings(userIds);
    
    // Populate audit logs
    await populateAuditLogs();
    
    // Populate notifications
    await populateNotifications();
    
    // Populate system settings
    await populateSettings();
    
    console.log('✅ Firebase populated successfully');
    console.log('\n📋 Login Credentials:');
    USERS.forEach(user => {
      console.log(`   ${user.profile.displayName}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating Firebase:', error.message);
  }
}

main(); 