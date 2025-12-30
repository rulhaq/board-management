import { writable } from 'svelte/store';
import type { UserProfile } from './auth';

// Mock authentication for development/testing
export const mockUsers = [
  {
    uid: 'admin-uid-001',
    email: 'admin@boardgovernance.ai',
    displayName: 'System Administrator',
    password: 'admin123',
    profile: {
      uid: 'admin-uid-001',
      email: 'admin@boardgovernance.ai',
      displayName: 'System Administrator',
      role: 'admin' as const,
      position: 'System Administrator',
      department: 'Administration',
      avatar: '/avatars/admin.jpg',
      phone: '+974-4003-7777',
      bio: 'System administrator responsible for board governance platform management and security.',
      specialties: ['System Administration', 'Security Management', 'Platform Governance'],
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
        aiProvider: 'groq' as const,
        aiModel: 'mixtral-8x7b-32768',
        theme: 'light' as const,
        notifications: {
          email: true,
          push: true,
          chat: true,
          meetings: true
        },
        videoConferencing: {
          preferred: 'teams' as const,
          autoJoin: false
        }
      },
      status: 'active' as const,
      lastActive: '2024-01-15T10:30:00.000Z',
      joinedDate: '2023-01-01T00:00:00.000Z'
    }
  },
  {
    uid: 'secretary-uid-001',
    email: 'secretary@boardgovernance.ai',
    displayName: 'Board Secretary',
    password: 'sec123',
    profile: {
      uid: 'secretary-uid-001',
      email: 'secretary@boardgovernance.ai',
      displayName: 'Board Secretary',
      role: 'secretary' as const,
      position: 'Board Secretary',
      department: 'Board Administration',
      avatar: '/avatars/secretary.jpg',
      phone: '+974-4003-7888',
      bio: 'Board secretary responsible for meeting coordination, documentation, and administrative support.',
      specialties: ['Meeting Management', 'Documentation', 'Administrative Support'],
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
        aiProvider: 'groq' as const,
        aiModel: 'mixtral-8x7b-32768',
        theme: 'light' as const,
        notifications: {
          email: true,
          push: true,
          chat: true,
          meetings: true
        },
        videoConferencing: {
          preferred: 'teams' as const,
          autoJoin: true
        }
      },
      status: 'active' as const,
      lastActive: '2024-01-15T09:45:00.000Z',
      joinedDate: '2023-02-01T00:00:00.000Z'
    }
  },
  {
    uid: 'khalil-uid-001',
    email: 'dr.khalil@boardgovernance.ai',
    displayName: 'Dr. Khalil Al-Mansouri',
    password: 'board123',
    profile: {
      uid: 'khalil-uid-001',
      email: 'dr.khalil@boardgovernance.ai',
      displayName: 'Dr. Khalil Al-Mansouri',
      role: 'board_member' as const,
      position: 'Chief Medical Officer',
      department: 'Clinical Affairs',
      avatar: '/avatars/khalil.jpg',
      phone: '+974-4003-7001',
      bio: 'Renowned surgeon and healthcare innovator with 25+ years of clinical excellence. Leading clinical transformation and quality initiatives.',
      specialties: ['Pediatric Surgery', 'Medical Innovation', 'Clinical Governance', 'Quality Improvement'],
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
        canManageIntegrations: false
      },
      preferences: {
        aiProvider: 'groq' as const,
        aiModel: 'mixtral-8x7b-32768',
        theme: 'light' as const,
        notifications: {
          email: true,
          push: false,
          chat: true,
          meetings: true
        },
        videoConferencing: {
          preferred: 'teams' as const,
          autoJoin: false
        }
      },
      status: 'active' as const,
      lastActive: '2024-01-15T08:20:00.000Z',
      joinedDate: '2020-03-01T00:00:00.000Z'
    }
  }
];

export const mockUser = writable(null);
export const mockUserProfile = writable<UserProfile | null>(null);
export const mockLoading = writable(false);

export async function mockLogin(email: string, password: string) {
  mockLoading.set(true);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    mockUser.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: true
    });
    mockUserProfile.set(user.profile);
    mockLoading.set(false);
    return { user: { uid: user.uid, email: user.email } };
  } else {
    mockLoading.set(false);
    throw new Error('Invalid credentials');
  }
}

export function mockLogout() {
  mockUser.set(null);
  mockUserProfile.set(null);
}

export function enableMockAuth() {
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' ||
          window.location.search.includes('mock=true'));
} 