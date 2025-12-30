import { writable, derived } from 'svelte/store';
import { firebaseService } from '$lib/services/firebaseService';
import { authStore } from './auth';

// Main data stores
export const users = writable([]);
export const documents = writable([]);
export const meetings = writable([]);
export const votes = writable([]);
export const notifications = writable([]);
export const chats = writable([]);
export const messages = writable([]);

// Loading states
export const loading = writable({
  users: false,
  documents: false,
  meetings: false,
  votes: false,
  notifications: false,
  chats: false,
  messages: false
});

// Error states
export const errors = writable({
  users: null,
  documents: null,
  meetings: null,
  votes: null,
  notifications: null,
  chats: null,
  messages: null
});

// Subscriptions for real-time updates
let unsubscribes = {};

// Initialize Firebase subscriptions
export function initializeFirebaseSubscriptions(userId) {
  // Clean up existing subscriptions
  Object.values(unsubscribes).forEach(unsub => unsub && unsub());
  unsubscribes = {};

  try {
    // Subscribe to users
    unsubscribes.users = firebaseService.subscribe('users', (data) => {
      users.set(data);
      loading.update(l => ({ ...l, users: false }));
    });

    // Subscribe to documents
    unsubscribes.documents = firebaseService.subscribe('documents', (data) => {
      documents.set(data);
      loading.update(l => ({ ...l, documents: false }));
    }, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Subscribe to meetings
    unsubscribes.meetings = firebaseService.subscribe('meetings', (data) => {
      meetings.set(data);
      loading.update(l => ({ ...l, meetings: false }));
    }, {
      orderBy: { field: 'date', direction: 'desc' }
    });

    // Subscribe to votes
    unsubscribes.votes = firebaseService.subscribe('votes', (data) => {
      votes.set(data);
      loading.update(l => ({ ...l, votes: false }));
    }, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    // Subscribe to user notifications
    if (userId) {
      unsubscribes.notifications = firebaseService.subscribe('notifications', (data) => {
        notifications.set(data);
        loading.update(l => ({ ...l, notifications: false }));
      }, {
        where: { field: 'userId', operator: '==', value: userId },
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      // Subscribe to user chats
      unsubscribes.chats = firebaseService.subscribe('chats', (data) => {
        chats.set(data);
        loading.update(l => ({ ...l, chats: false }));
      }, {
        where: { field: 'participants', operator: 'array-contains', value: userId },
        orderBy: { field: 'lastMessageAt', direction: 'desc' }
      });
    }

    console.log('Firebase subscriptions initialized');
  } catch (error) {
    console.error('Error initializing Firebase subscriptions:', error);
  }
}

// Clean up subscriptions
export function cleanupFirebaseSubscriptions() {
  Object.values(unsubscribes).forEach(unsub => unsub && unsub());
  unsubscribes = {};
}

// CRUD operations with store updates
export const firebaseActions = {
  // Users
  async createUser(userData) {
    loading.update(l => ({ ...l, users: true }));
    try {
      const newUser = await firebaseService.createUser(userData);
      users.update(list => [newUser, ...list]);
      return newUser;
    } catch (error) {
      errors.update(e => ({ ...e, users: error.message }));
      throw error;
    } finally {
      loading.update(l => ({ ...l, users: false }));
    }
  },

  async updateUser(userId, userData) {
    try {
      const updatedUser = await firebaseService.updateUser(userId, userData);
      users.update(list => list.map(u => u.id === userId ? updatedUser : u));
      return updatedUser;
    } catch (error) {
      errors.update(e => ({ ...e, users: error.message }));
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      await firebaseService.delete('users', userId);
      users.update(list => list.filter(u => u.id !== userId));
    } catch (error) {
      errors.update(e => ({ ...e, users: error.message }));
      throw error;
    }
  },

  // Documents
  async createDocument(documentData) {
    loading.update(l => ({ ...l, documents: true }));
    try {
      const newDoc = await firebaseService.createDocument(documentData);
      documents.update(list => [newDoc, ...list]);
      return newDoc;
    } catch (error) {
      errors.update(e => ({ ...e, documents: error.message }));
      throw error;
    } finally {
      loading.update(l => ({ ...l, documents: false }));
    }
  },

  async uploadFile(file, path) {
    try {
      return await firebaseService.uploadFile(file, path);
    } catch (error) {
      errors.update(e => ({ ...e, documents: error.message }));
      throw error;
    }
  },

  async deleteDocument(docId) {
    try {
      await firebaseService.delete('documents', docId);
      documents.update(list => list.filter(d => d.id !== docId));
    } catch (error) {
      errors.update(e => ({ ...e, documents: error.message }));
      throw error;
    }
  },

  // Meetings
  async createMeeting(meetingData) {
    loading.update(l => ({ ...l, meetings: true }));
    try {
      const newMeeting = await firebaseService.createMeeting(meetingData);
      meetings.update(list => [newMeeting, ...list]);
      return newMeeting;
    } catch (error) {
      errors.update(e => ({ ...e, meetings: error.message }));
      throw error;
    } finally {
      loading.update(l => ({ ...l, meetings: false }));
    }
  },

  async updateMeeting(meetingId, meetingData) {
    try {
      const updatedMeeting = await firebaseService.updateMeeting(meetingId, meetingData);
      meetings.update(list => list.map(m => m.id === meetingId ? updatedMeeting : m));
      return updatedMeeting;
    } catch (error) {
      errors.update(e => ({ ...e, meetings: error.message }));
      throw error;
    }
  },

  // Voting
  async createVote(voteData) {
    loading.update(l => ({ ...l, votes: true }));
    try {
      const newVote = await firebaseService.createVote(voteData);
      votes.update(list => [newVote, ...list]);
      return newVote;
    } catch (error) {
      errors.update(e => ({ ...e, votes: error.message }));
      throw error;
    } finally {
      loading.update(l => ({ ...l, votes: false }));
    }
  },

  async castVote(voteId, userId, selections) {
    try {
      await firebaseService.castVote(voteId, userId, selections);
      // The vote will be updated via the real-time subscription
    } catch (error) {
      errors.update(e => ({ ...e, votes: error.message }));
      throw error;
    }
  },

  // Notifications
  async markNotificationAsRead(notificationId) {
    try {
      await firebaseService.markNotificationAsRead(notificationId);
      notifications.update(list => 
        list.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      errors.update(e => ({ ...e, notifications: error.message }));
      throw error;
    }
  },

  // Chat
  async createChat(chatData) {
    try {
      const newChat = await firebaseService.createChat(chatData);
      chats.update(list => [newChat, ...list]);
      return newChat;
    } catch (error) {
      errors.update(e => ({ ...e, chats: error.message }));
      throw error;
    }
  },

  async sendMessage(messageData) {
    try {
      const newMessage = await firebaseService.sendMessage(messageData);
      messages.update(list => [...list, newMessage]);
      return newMessage;
    } catch (error) {
      errors.update(e => ({ ...e, messages: error.message }));
      throw error;
    }
  }
};

// Derived stores for computed values
export const unreadNotificationsCount = derived(
  notifications,
  $notifications => $notifications.filter(n => !n.read).length
);

export const upcomingMeetings = derived(
  meetings,
  $meetings => {
    const now = new Date();
    return $meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate > now;
    }).slice(0, 5);
  }
);

export const activeVotes = derived(
  votes,
  $votes => $votes.filter(vote => vote.status === 'active')
);

export const recentDocuments = derived(
  documents,
  $documents => $documents.slice(0, 10)
);

// Initialize when auth state changes
authStore.subscribe(auth => {
  if (auth.user && auth.profile) {
    initializeFirebaseSubscriptions(auth.user.uid);
  } else {
    cleanupFirebaseSubscriptions();
    // Reset all stores
    users.set([]);
    documents.set([]);
    meetings.set([]);
    votes.set([]);
    notifications.set([]);
    chats.set([]);
    messages.set([]);
  }
});

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupFirebaseSubscriptions);
} 