import { writable, get, derived } from 'svelte/store';
import { auth, db } from '$lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { browser } from '$app/environment';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'secretary' | 'board_member';
  position: string;
  department: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  permissions: {
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManageSettings: boolean;
    canViewAllDocuments: boolean;
    canManageDocuments: boolean;
    canScheduleMeetings: boolean;
    canManageVoting: boolean;
    canAccessReports: boolean;
    canManageAI: boolean;
    canManageIntegrations: boolean;
  };
  preferences: {
    aiProvider: 'groq' | 'local';
    aiModel: string;
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
      chat: boolean;
      meetings: boolean;
    };
    videoConferencing: {
      preferred: 'teams' | 'zoom' | 'google_meet';
      autoJoin: boolean;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  joinedDate: string;
}

// Create individual stores
export const user = writable<User | null>(null);
export const userProfile = writable<UserProfile | null>(null);
export const loading = writable(true);

// Mock users for development
const mockUsers = [
  {
    uid: 'admin-001',
    email: 'admin@boardgovernance.ai',
    displayName: 'System Administrator',
    role: 'admin' as const,
    position: 'System Administrator',
    department: 'IT',
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
    preferences: {
      aiProvider: 'groq' as const,
      aiModel: 'llama3-8b-8192',
      theme: 'light' as const,
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true,
      },
      videoConferencing: {
        preferred: 'teams' as const,
        autoJoin: false,
      },
    },
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-01T00:00:00.000Z',
  },
  {
    uid: 'secretary-001',
    email: 'secretary@boardgovernance.ai',
    displayName: 'Board Secretary',
    role: 'secretary' as const,
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
    preferences: {
      aiProvider: 'groq' as const,
      aiModel: 'llama3-8b-8192',
      theme: 'light' as const,
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true,
      },
      videoConferencing: {
        preferred: 'teams' as const,
        autoJoin: false,
      },
    },
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-01T00:00:00.000Z',
  },
  {
    uid: 'board-001',
    email: 'board.member1@boardgovernance.ai',
    displayName: 'Board Member 1',
    role: 'board_member' as const,
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
    preferences: {
      aiProvider: 'groq' as const,
      aiModel: 'llama3-8b-8192',
      theme: 'light' as const,
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true,
      },
      videoConferencing: {
        preferred: 'teams' as const,
        autoJoin: false,
      },
    },
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-01T00:00:00.000Z',
  },
  {
    uid: 'board-002',
    email: 'board.member2@boardgovernance.ai',
    displayName: 'Board Member 2',
    role: 'board_member' as const,
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
    preferences: {
      aiProvider: 'groq' as const,
      aiModel: 'llama3-8b-8192',
      theme: 'light' as const,
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true,
      },
      videoConferencing: {
        preferred: 'teams' as const,
        autoJoin: false,
      },
    },
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    joinedDate: '2024-01-01T00:00:00.000Z',
  }
];

// Mock authentication function
async function mockLogin(email: string, password: string) {
  const mockUser = mockUsers.find(u => u.email === email);
  if (!mockUser) {
    throw new Error('User not found');
  }

  // Simulate password validation (in real app, this would be handled by Firebase)
  const validPasswords = {
    'admin@boardgovernance.ai': 'Admin2024!',
    'secretary@boardgovernance.ai': 'Secretary2024!',
    'board.member1@boardgovernance.ai': 'Board2024!',
    'board.member2@boardgovernance.ai': 'Board2024!',
    'cto@scalovate.com': 'iamgettingOldn0w'
  };

  if (validPasswords[email] !== password) {
    throw new Error('Invalid password');
  }

  // Create mock Firebase user object
  const mockFirebaseUser = {
    uid: mockUser.uid,
    email: mockUser.email,
    displayName: mockUser.displayName,
    emailVerified: true,
    photoURL: null,
    phoneNumber: null,
    metadata: {
      creationTime: mockUser.joinedDate,
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
  } as User;

  // Set user and profile
  user.set(mockFirebaseUser);
  userProfile.set(mockUser);
  loading.set(false);

  return mockFirebaseUser;
}

// Initialize auth state listener only on the client side
if (browser) {
  if (auth && db) {
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.set(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            userProfile.set(profile);
            
            await updateDoc(doc(db!, 'users', firebaseUser.uid), {
              lastActive: new Date().toISOString()
            });
          } else {
            console.warn('User profile not found in Firestore for uid:', firebaseUser.uid);
            // Create a basic profile from Firebase user data
            const basicProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
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
              preferences: {
                aiProvider: 'groq',
                aiModel: 'mixtral-8x7b-32768',
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
              lastActive: new Date().toISOString(),
              joinedDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            
            // Save the basic profile to Firestore
            try {
              await setDoc(doc(db!, 'users', firebaseUser.uid), basicProfile);
            } catch (saveError) {
              console.error('Failed to save basic profile to Firestore:', saveError);
            }
            
            userProfile.set(basicProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          userProfile.set(null);
        }
      } else {
        userProfile.set(null);
      }
      
      loading.set(false);
    });
  } else {
    console.warn('Firebase Auth or Firestore not initialized. Authentication will not work.');
    loading.set(false);
  }
} else {
  loading.set(false);
}

// Auth actions
export async function login(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
  }

  if (!browser) {
    throw new Error('Authentication can only be performed in the browser');
  }

  try {
    // Use Firebase Authentication
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    
    // Load user profile from Firestore
    if (db && firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          userProfile.set(profile);
          
          // Update last active timestamp
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastActive: new Date().toISOString()
          });
        } else {
          // If profile doesn't exist, create a basic one from Firebase user data
          console.warn('User profile not found in Firestore, creating basic profile');
          const basicProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || email.split('@')[0],
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
            preferences: {
              aiProvider: 'groq',
              aiModel: 'mixtral-8x7b-32768',
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
            lastActive: new Date().toISOString(),
            joinedDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
          
          // Save the basic profile to Firestore
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), basicProfile);
          } catch (saveError) {
            console.error('Failed to save basic profile to Firestore:', saveError);
          }
          
          userProfile.set(basicProfile);
        }
      } catch (profileError) {
        console.error('Error loading user profile:', profileError);
        // Continue with login even if profile load fails
      }
    }
    
    return firebaseUser;
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Login failed';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

export async function logout() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Clear stores
  user.set(null);
  userProfile.set(null);
}

// Create a combined authStore for backward compatibility
export const authStore = derived(
  [user, userProfile, loading],
  ([$user, $userProfile, $loading]) => ({
    user: $user,
    profile: $userProfile,
    loading: $loading,
    isAuthenticated: !!$user,
    login,
    logout
  })
);

// Export board members data (deprecated - use Firebase instead)
export const boardMembers = writable([]); 