#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enhanced user profiles with AI and chat capabilities
const USER_PROFILES = {
  // Admin (formerly chairman)
  'admin@sidra.com': {
    uid: 'admin-uid-001',
    email: 'admin@sidra.com',
    displayName: 'Dr. Ahmed Al-Thani',
    role: 'admin',
    position: 'Board Administrator',
    department: 'Executive Leadership',
    avatar: '/avatars/admin.jpg',
    phone: '+974 4003 3301',
    bio: 'Experienced healthcare administrator with over 20 years in medical governance and strategic leadership.',
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
      canManageIntegrations: true
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'mixtral-8x7b-32768',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'teams',
        autoJoin: false
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-15T00:00:00.000Z'
  },

  // Secretary
  'secretary@sidra.com': {
    uid: 'secretary-uid-001',
    email: 'secretary@sidra.com',
    displayName: 'Ms. Fatima Al-Kuwari',
    role: 'secretary',
    position: 'Board Secretary',
    department: 'Corporate Governance',
    avatar: '/avatars/secretary.jpg',
    phone: '+974 4003 3302',
    bio: 'Corporate governance specialist with expertise in board operations and regulatory compliance.',
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
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'llama2-70b-4096',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'zoom',
        autoJoin: true
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-20T00:00:00.000Z'
  },

  // Board Members
  'dr.khalil@sidra.com': {
    uid: 'member-uid-001',
    email: 'dr.khalil@sidra.com',
    displayName: 'Dr. Khalil Al-Mansouri',
    role: 'board_member',
    position: 'Chief Medical Officer',
    department: 'Clinical Affairs',
    avatar: '/avatars/khalil.jpg',
    phone: '+974 4003 3303',
    bio: 'Renowned pediatric surgeon and healthcare innovator with 25+ years of clinical excellence.',
    specialties: ['Pediatric Surgery', 'Medical Innovation', 'Clinical Governance'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'mixtral-8x7b-32768',
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'teams',
        autoJoin: false
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-01T00:00:00.000Z'
  },

  'dr.sarah@sidra.com': {
    uid: 'member-uid-002',
    email: 'dr.sarah@sidra.com',
    displayName: 'Dr. Sarah Johnson',
    role: 'board_member',
    position: 'Director of Research',
    department: 'Research & Development',
    avatar: '/avatars/sarah.jpg',
    phone: '+974 4003 3304',
    bio: 'Leading researcher in pediatric medicine with focus on genetic disorders and precision medicine.',
    specialties: ['Genetics', 'Pediatric Research', 'Precision Medicine'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'local',
      aiModel: 'llama-3.1-8b',
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        chat: false,
        meetings: true
      },
      videoConferencing: {
        preferred: 'google_meet',
        autoJoin: true
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-05T00:00:00.000Z'
  },

  'prof.omar@sidra.com': {
    uid: 'member-uid-003',
    email: 'prof.omar@sidra.com',
    displayName: 'Prof. Omar Al-Dosari',
    role: 'board_member',
    position: 'Head of Cardiology',
    department: 'Cardiovascular Medicine',
    avatar: '/avatars/omar.jpg',
    phone: '+974 4003 3305',
    bio: 'Distinguished cardiologist and medical educator with expertise in congenital heart disease.',
    specialties: ['Pediatric Cardiology', 'Congenital Heart Disease', 'Medical Education'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'llama2-70b-4096',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'zoom',
        autoJoin: false
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-10T00:00:00.000Z'
  },

  'dr.maryam@sidra.com': {
    uid: 'member-uid-004',
    email: 'dr.maryam@sidra.com',
    displayName: 'Dr. Maryam Al-Naimi',
    role: 'board_member',
    position: 'Chief Nursing Officer',
    department: 'Nursing Excellence',
    avatar: '/avatars/maryam.jpg',
    phone: '+974 4003 3306',
    bio: 'Nursing leader dedicated to advancing patient care standards and nursing education.',
    specialties: ['Nursing Leadership', 'Patient Safety', 'Quality Improvement'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'mixtral-8x7b-32768',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'teams',
        autoJoin: true
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-15T00:00:00.000Z'
  },

  'mr.hassan@sidra.com': {
    uid: 'member-uid-005',
    email: 'mr.hassan@sidra.com',
    displayName: 'Mr. Hassan Al-Kaabi',
    role: 'board_member',
    position: 'Chief Financial Officer',
    department: 'Finance & Operations',
    avatar: '/avatars/hassan.jpg',
    phone: '+974 4003 3307',
    bio: 'Financial strategist with extensive experience in healthcare economics and strategic planning.',
    specialties: ['Healthcare Finance', 'Strategic Planning', 'Risk Management'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'local',
      aiModel: 'llama-3.1-70b',
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        chat: false,
        meetings: true
      },
      videoConferencing: {
        preferred: 'google_meet',
        autoJoin: false
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-20T00:00:00.000Z'
  },

  'dr.layla@sidra.com': {
    uid: 'member-uid-006',
    email: 'dr.layla@sidra.com',
    displayName: 'Dr. Layla Al-Mohannadi',
    role: 'board_member',
    position: 'Director of Quality & Safety',
    department: 'Quality Assurance',
    avatar: '/avatars/layla.jpg',
    phone: '+974 4003 3308',
    bio: 'Quality and safety expert committed to maintaining the highest standards of patient care.',
    specialties: ['Patient Safety', 'Quality Management', 'Risk Assessment'],
    permissions: {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canViewAllDocuments: true,
      canManageDocuments: false,
      canScheduleMeetings: false,
      canManageVoting: false,
      canAccessReports: true,
      canManageAI: false,
      canManageIntegrations: false
    },
    preferences: {
      aiProvider: 'groq',
      aiModel: 'llama2-70b-4096',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'zoom',
        autoJoin: true
      }
    },
    status: 'active',
    lastActive: new Date().toISOString(),
    joinedDate: '2024-02-25T00:00:00.000Z'
  }
};

// Enhanced documents with AI categorization
const DOCUMENTS = [
  {
    id: 'doc-001',
    title: 'Strategic Plan 2024-2027',
    type: 'strategic',
    category: 'Planning',
    description: 'Comprehensive strategic roadmap for Sidra Medicine\'s next phase of growth',
    uploadedBy: 'admin@sidra.com',
    uploadedAt: new Date('2024-01-15').toISOString(),
    lastModified: new Date('2024-01-20').toISOString(),
    size: 2450000,
    mimeType: 'application/pdf',
    tags: ['strategy', 'planning', 'growth', 'healthcare'],
    status: 'approved',
    aiSummary: 'Strategic document outlining expansion plans, research priorities, and operational improvements for 2024-2027.',
    confidentialityLevel: 'restricted',
    version: '2.1',
    approvedBy: 'admin@sidra.com',
    reviewers: ['secretary@sidra.com', 'dr.khalil@sidra.com'],
    comments: []
  },
  {
    id: 'doc-002',
    title: 'Q4 Financial Report',
    type: 'financial',
    category: 'Finance',
    description: 'Quarterly financial performance and budget analysis',
    uploadedBy: 'mr.hassan@sidra.com',
    uploadedAt: new Date('2024-01-10').toISOString(),
    lastModified: new Date('2024-01-12').toISOString(),
    size: 1800000,
    mimeType: 'application/pdf',
    tags: ['finance', 'quarterly', 'budget', 'performance'],
    status: 'approved',
    aiSummary: 'Financial report showing strong performance with 12% revenue growth and improved operational efficiency.',
    confidentialityLevel: 'confidential',
    version: '1.0',
    approvedBy: 'admin@sidra.com',
    reviewers: ['secretary@sidra.com'],
    comments: []
  },
  {
    id: 'doc-003',
    title: 'Research Ethics Guidelines',
    type: 'policy',
    category: 'Governance',
    description: 'Updated guidelines for research ethics and patient consent',
    uploadedBy: 'dr.sarah@sidra.com',
    uploadedAt: new Date('2024-01-05').toISOString(),
    lastModified: new Date('2024-01-08').toISOString(),
    size: 950000,
    mimeType: 'application/pdf',
    tags: ['research', 'ethics', 'policy', 'compliance'],
    status: 'under_review',
    aiSummary: 'Comprehensive ethics framework for research activities, including patient consent protocols and data protection measures.',
    confidentialityLevel: 'internal',
    version: '3.2',
    approvedBy: null,
    reviewers: ['dr.khalil@sidra.com', 'dr.layla@sidra.com'],
    comments: []
  }
];

// Enhanced meetings with video conferencing integration
const MEETINGS = [
  {
    id: 'meeting-001',
    title: 'Monthly Board Meeting - January 2024',
    type: 'board_meeting',
    description: 'Regular monthly board meeting to discuss strategic initiatives and operational updates',
    scheduledBy: 'secretary@sidra.com',
    scheduledAt: new Date('2024-01-25T14:00:00').toISOString(),
    endTime: new Date('2024-01-25T16:00:00').toISOString(),
    location: 'Board Room A / Virtual',
    status: 'completed',
    attendees: [
      { email: 'admin@sidra.com', status: 'attended', joinedAt: '2024-01-25T13:58:00.000Z' },
      { email: 'secretary@sidra.com', status: 'attended', joinedAt: '2024-01-25T13:55:00.000Z' },
      { email: 'dr.khalil@sidra.com', status: 'attended', joinedAt: '2024-01-25T14:02:00.000Z' },
      { email: 'dr.sarah@sidra.com', status: 'attended', joinedAt: '2024-01-25T14:00:00.000Z' },
      { email: 'prof.omar@sidra.com', status: 'attended', joinedAt: '2024-01-25T14:05:00.000Z' },
      { email: 'dr.maryam@sidra.com', status: 'excused', reason: 'Medical emergency' },
      { email: 'mr.hassan@sidra.com', status: 'attended', joinedAt: '2024-01-25T14:01:00.000Z' },
      { email: 'dr.layla@sidra.com', status: 'attended', joinedAt: '2024-01-25T13:59:00.000Z' }
    ],
    agenda: [
      'Strategic Plan Review',
      'Financial Performance Q4',
      'Research Updates',
      'Quality Metrics',
      'New Business'
    ],
    documents: ['doc-001', 'doc-002'],
    videoConference: {
      platform: 'teams',
      meetingId: 'teams-meeting-001',
      joinUrl: 'https://teams.microsoft.com/l/meetup-join/...',
      recordingAvailable: true,
      recordingUrl: '/recordings/meeting-001.mp4'
    },
    aiSummary: 'Productive meeting covering strategic initiatives, financial performance, and research updates. Key decisions made on budget allocation and research priorities.',
    minutes: 'Meeting minutes available in attached document.',
    actionItems: [
      { task: 'Review budget allocations', assignee: 'mr.hassan@sidra.com', dueDate: '2024-02-01' },
      { task: 'Update research protocols', assignee: 'dr.sarah@sidra.com', dueDate: '2024-02-05' }
    ]
  },
  {
    id: 'meeting-002',
    title: 'Emergency Board Session - Strategic Planning',
    type: 'emergency',
    description: 'Emergency session to address urgent strategic decisions',
    scheduledBy: 'admin@sidra.com',
    scheduledAt: new Date('2024-02-15T10:00:00').toISOString(),
    endTime: new Date('2024-02-15T11:30:00').toISOString(),
    location: 'Virtual Only',
    status: 'scheduled',
    attendees: [
      { email: 'admin@sidra.com', status: 'confirmed' },
      { email: 'secretary@sidra.com', status: 'confirmed' },
      { email: 'dr.khalil@sidra.com', status: 'confirmed' },
      { email: 'dr.sarah@sidra.com', status: 'pending' },
      { email: 'prof.omar@sidra.com', status: 'confirmed' },
      { email: 'dr.maryam@sidra.com', status: 'confirmed' },
      { email: 'mr.hassan@sidra.com', status: 'confirmed' },
      { email: 'dr.layla@sidra.com', status: 'pending' }
    ],
    agenda: [
      'Strategic Partnership Opportunity',
      'Budget Reallocation',
      'Risk Assessment',
      'Next Steps'
    ],
    documents: [],
    videoConference: {
      platform: 'zoom',
      meetingId: 'zoom-meeting-002',
      joinUrl: 'https://zoom.us/j/1234567890',
      recordingAvailable: false,
      recordingUrl: null
    },
    aiSummary: null,
    minutes: null,
    actionItems: []
  }
];

// System settings with AI and integrations
const SYSTEM_SETTINGS = {
  general: {
    organizationName: 'Sidra Medicine',
    timezone: 'Asia/Qatar',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    language: 'en',
    currency: 'QAR'
  },
  ai: {
    providers: {
      groq: {
        enabled: true,
        apiKey: process.env.GROQ_API_KEY || '',
        models: ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it'],
        defaultModel: 'mixtral-8x7b-32768',
        maxTokens: 4096,
        temperature: 0.7
      },
      local: {
        enabled: true,
        endpoint: process.env.LOCAL_LLM_ENDPOINT || 'http://localhost:11434',
        models: ['llama-3.1-8b', 'llama-3.1-70b', 'mistral-7b'],
        defaultModel: 'llama-3.1-8b',
        maxTokens: 4096,
        temperature: 0.7
      }
    },
    features: {
      documentSummary: true,
      meetingTranscription: true,
      chatAssistant: true,
      decisionSupport: true,
      riskAnalysis: true
    }
  },
  integrations: {
    videoConferencing: {
      teams: {
        enabled: true,
        clientId: process.env.TEAMS_CLIENT_ID || '',
        tenantId: process.env.TEAMS_TENANT_ID || '',
        redirectUri: process.env.TEAMS_REDIRECT_URI || ''
      },
      zoom: {
        enabled: true,
        apiKey: process.env.ZOOM_API_KEY || '',
        apiSecret: process.env.ZOOM_API_SECRET || '',
        webhookSecret: process.env.ZOOM_WEBHOOK_SECRET || ''
      },
      googleMeet: {
        enabled: true,
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
      }
    },
    chat: {
      enabled: true,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif'],
      messageRetention: 365, // days
      encryption: true
    }
  },
  security: {
    sessionTimeout: 480, // minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      preventReuse: 5
    },
    twoFactorAuth: {
      enabled: true,
      required: false,
      methods: ['totp', 'sms', 'email']
    },
    auditLogging: {
      enabled: true,
      retention: 2555, // days (7 years)
      events: ['login', 'logout', 'document_access', 'document_modify', 'meeting_join', 'admin_action']
    }
  }
};

// Chat rooms and conversations
const CHAT_ROOMS = [
  {
    id: 'room-general',
    name: 'General Discussion',
    type: 'group',
    description: 'General board discussions and announcements',
    createdBy: 'admin@sidra.com',
    createdAt: new Date('2024-01-15').toISOString(),
    members: Object.keys(USER_PROFILES),
    isPrivate: false,
    settings: {
      allowFileSharing: true,
      allowAI: true,
      messageRetention: 365
    }
  },
  {
    id: 'room-executive',
    name: 'Executive Committee',
    type: 'group',
    description: 'Executive-level strategic discussions',
    createdBy: 'admin@sidra.com',
    createdAt: new Date('2024-01-15').toISOString(),
    members: ['admin@sidra.com', 'secretary@sidra.com', 'dr.khalil@sidra.com', 'mr.hassan@sidra.com'],
    isPrivate: true,
    settings: {
      allowFileSharing: true,
      allowAI: true,
      messageRetention: 2555
    }
  }
];

// Roles and permissions system
const ROLES_PERMISSIONS = {
  admin: {
    name: 'Administrator',
    description: 'Full system access and control',
    permissions: [
      'manage_users', 'manage_roles', 'manage_settings', 'view_all_documents',
      'manage_documents', 'schedule_meetings', 'manage_voting', 'access_reports',
      'manage_ai', 'manage_integrations', 'view_audit_logs', 'manage_chat'
    ],
    isSystem: true
  },
  secretary: {
    name: 'Board Secretary',
    description: 'Administrative support and document management',
    permissions: [
      'view_all_documents', 'manage_documents', 'schedule_meetings',
      'access_reports', 'manage_chat'
    ],
    isSystem: true
  },
  board_member: {
    name: 'Board Member',
    description: 'Standard board member access',
    permissions: [
      'view_all_documents', 'access_reports', 'join_meetings', 'participate_voting'
    ],
    isSystem: true
  }
};

async function importData() {
  console.log('🏛️  Importing enhanced production data to Firestore...');
  
  const batch = writeBatch(db);
  
  try {
    // Import user profiles
    for (const [email, profile] of Object.entries(USER_PROFILES)) {
      const userRef = doc(db, 'users', profile.uid);
      batch.set(userRef, profile);
    }
    console.log('✅ User profiles imported');
    
    // Import documents
    for (const document of DOCUMENTS) {
      const docRef = doc(db, 'documents', document.id);
      batch.set(docRef, document);
    }
    console.log('✅ Documents imported');
    
    // Import meetings
    for (const meeting of MEETINGS) {
      const meetingRef = doc(db, 'meetings', meeting.id);
      batch.set(meetingRef, meeting);
    }
    console.log('✅ Meetings imported');
    
    // Import system settings
    const settingsRef = doc(db, 'settings', 'system');
    batch.set(settingsRef, SYSTEM_SETTINGS);
    console.log('✅ System settings imported');
    
    // Import chat rooms
    for (const room of CHAT_ROOMS) {
      const roomRef = doc(db, 'chat_rooms', room.id);
      batch.set(roomRef, room);
    }
    console.log('✅ Chat rooms imported');
    
    // Import roles and permissions
    const rolesRef = doc(db, 'settings', 'roles_permissions');
    batch.set(rolesRef, ROLES_PERMISSIONS);
    console.log('✅ Roles and permissions imported');
    
    // Commit all changes
    await batch.commit();
    
    console.log('\n🎉 All enhanced data imported successfully!\n');
    console.log('Login credentials:');
    console.log('Administrator: admin@sidra.com / Admin2024!');
    console.log('Secretary: secretary@sidra.com / Secretary2024!');
    console.log('Board Members:');
    console.log('  - dr.khalil@sidra.com / Member2024!');
    console.log('  - dr.sarah@sidra.com / Member2024!');
    console.log('  - prof.omar@sidra.com / Member2024!');
    console.log('  - dr.maryam@sidra.com / Member2024!');
    console.log('  - mr.hassan@sidra.com / Member2024!');
    console.log('  - dr.layla@sidra.com / Member2024!');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

// Run the import
importData().catch(console.error); 