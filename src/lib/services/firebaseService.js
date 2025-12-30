import { db, auth, storage } from '$lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class FirebaseService {
  constructor() {
    this.collections = {
      users: 'users',
      meetings: 'meetings', 
      documents: 'documents',
      votes: 'votes',
      notifications: 'notifications',
      chats: 'chats',
      messages: 'messages',
      auditLogs: 'auditLogs'
    };
  }

  // Generic CRUD operations
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating ${collectionName}:`, error);
      throw error;
    }
  }

  async read(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error reading ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  async update(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Error updating ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  async delete(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return true;
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  async list(collectionName, filters = {}) {
    try {
      let q = collection(db, collectionName);
      
      if (filters.where) {
        q = query(q, where(filters.where.field, filters.where.operator, filters.where.value));
      }
      
      if (filters.orderBy) {
        q = query(q, orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc'));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      // If query fails due to missing index, try without orderBy
      if (error.code === 'failed-precondition' && filters.orderBy) {
        console.warn(`Index missing for ${collectionName}, trying without orderBy:`, error);
        try {
          let q = collection(db, collectionName);
          if (filters.where) {
            q = query(q, where(filters.where.field, filters.where.operator, filters.where.value));
          }
          if (filters.limit) {
            q = query(q, limit(filters.limit));
          }
          const querySnapshot = await getDocs(q);
          const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort in memory if orderBy was requested
          if (filters.orderBy) {
            const direction = filters.orderBy.direction || 'asc';
            results.sort((a, b) => {
              const aVal = a[filters.orderBy.field];
              const bVal = b[filters.orderBy.field];
              if (aVal === bVal) return 0;
              const comparison = aVal > bVal ? 1 : -1;
              return direction === 'desc' ? -comparison : comparison;
            });
          }
          return results;
        } catch (fallbackError) {
          console.error(`Error listing ${collectionName} (fallback):`, fallbackError);
          return [];
        }
      }
      console.error(`Error listing ${collectionName}:`, error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribe(collectionName, callback, filters = {}) {
    try {
      let q = collection(db, collectionName);
      
      if (filters.where) {
        q = query(q, where(filters.where.field, filters.where.operator, filters.where.value));
      }
      
      if (filters.orderBy) {
        q = query(q, orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc'));
      }

      return onSnapshot(q, 
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(data);
        },
        (error) => {
          // If query fails due to missing index, try without orderBy
          if (error.code === 'failed-precondition' && filters.orderBy) {
            console.warn(`Index missing for ${collectionName} subscription, trying without orderBy:`, error);
            try {
              let fallbackQ = collection(db, collectionName);
              if (filters.where) {
                fallbackQ = query(fallbackQ, where(filters.where.field, filters.where.operator, filters.where.value));
              }
              return onSnapshot(fallbackQ, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort in memory if orderBy was requested
                if (filters.orderBy) {
                  const direction = filters.orderBy.direction || 'asc';
                  data.sort((a, b) => {
                    const aVal = a[filters.orderBy.field];
                    const bVal = b[filters.orderBy.field];
                    if (aVal === bVal) return 0;
                    const comparison = aVal > bVal ? 1 : -1;
                    return direction === 'desc' ? -comparison : comparison;
                  });
                }
                callback(data);
              });
            } catch (fallbackError) {
              console.error(`Error subscribing to ${collectionName} (fallback):`, fallbackError);
              callback([]);
            }
          } else {
            console.error(`Error subscribing to ${collectionName}:`, error);
            callback([]);
          }
        }
      );
    } catch (error) {
      console.error(`Error subscribing to ${collectionName}:`, error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  // Users/Members
  async getUsers() {
    return this.list(this.collections.users, {
      orderBy: { field: 'displayName' }
    });
  }

  async createUser(userData) {
    return this.create(this.collections.users, userData);
  }

  async updateUser(userId, userData) {
    return this.update(this.collections.users, userId, userData);
  }

  async getUserProfile(userId) {
    return this.read(this.collections.users, userId);
  }

  // Meetings
  async getMeetings() {
    return this.list(this.collections.meetings, {
      orderBy: { field: 'date', direction: 'desc' }
    });
  }

  async createMeeting(meetingData) {
    const meeting = await this.create(this.collections.meetings, meetingData);
    
    // Create notification
    await this.createNotification({
      type: 'meeting',
      title: 'New Meeting Scheduled',
      message: `${meetingData.title} has been scheduled for ${meetingData.date}`,
      actionUrl: '/meetings',
      createdBy: meetingData.createdBy
    });

    return meeting;
  }

  async updateMeeting(meetingId, meetingData) {
    return this.update(this.collections.meetings, meetingId, meetingData);
  }

  // Documents
  async getDocuments() {
    return this.list(this.collections.documents, {
      orderBy: { field: 'uploadedAt', direction: 'desc' }
    });
  }

  async createDocument(documentData) {
    const document = await this.create(this.collections.documents, documentData);
    
    // Create notification
    await this.createNotification({
      type: 'document',
      title: 'New Document Added',
      message: `${documentData.title} has been uploaded`,
      actionUrl: '/documents',
      createdBy: documentData.uploadedBy
    });

    return document;
  }

  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, path };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Voting
  async getVotes() {
    return this.list(this.collections.votes, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async createVote(voteData) {
    const vote = await this.create(this.collections.votes, voteData);
    
    // Create notification
    await this.createNotification({
      type: 'vote',
      title: 'New Vote Created',
      message: `${voteData.title} - Your vote is needed`,
      actionUrl: '/voting',
      createdBy: voteData.createdBy
    });

    return vote;
  }

  async castVote(voteId, userId, selections) {
    try {
      const voteRef = doc(db, this.collections.votes, voteId);
      const voteDoc = await getDoc(voteRef);
      
      if (!voteDoc.exists()) {
        throw new Error('Vote not found');
      }

      const voteData = voteDoc.data();
      const updatedOptions = voteData.options.map(option => {
        if (selections.includes(option.id)) {
          return {
            ...option,
            votes: option.votes + 1,
            voters: [...(option.voters || []), userId]
          };
        }
        return option;
      });

      await updateDoc(voteRef, {
        options: updatedOptions,
        totalVotes: voteData.totalVotes + 1,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  // Notifications
  async getNotifications(userId) {
    return this.list(this.collections.notifications, {
      where: { field: 'userId', operator: '==', value: userId },
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async createNotification(notificationData) {
    // Send to all users (in production, you'd filter by roles/permissions)
    const users = await this.getUsers();
    const notifications = users.map(user => ({
      ...notificationData,
      userId: user.id,
      read: false,
      priority: notificationData.priority || 'medium'
    }));

    const promises = notifications.map(notification => 
      this.create(this.collections.notifications, notification)
    );

    return Promise.all(promises);
  }

  async markNotificationAsRead(notificationId) {
    return this.update(this.collections.notifications, notificationId, { read: true });
  }

  async getUnreadNotificationsCount(userId) {
    try {
      const notifications = await this.list(this.collections.notifications, {
        where: { field: 'userId', operator: '==', value: userId }
      });
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Chat/Messages
  async getChats(userId) {
    return this.list(this.collections.chats, {
      where: { field: 'participants', operator: 'array-contains', value: userId },
      orderBy: { field: 'lastMessageAt', direction: 'desc' }
    });
  }

  async createChat(chatData) {
    return this.create(this.collections.chats, chatData);
  }

  async getMessages(chatId) {
    return this.list(this.collections.messages, {
      where: { field: 'chatId', operator: '==', value: chatId },
      orderBy: { field: 'createdAt', direction: 'asc' }
    });
  }

  async sendMessage(messageData) {
    const message = await this.create(this.collections.messages, messageData);
    
    // Update chat's last message
    await this.update(this.collections.chats, messageData.chatId, {
      lastMessage: messageData.text,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: messageData.senderId
    });

    // Log for audit
    await this.logAuditEvent('message_sent', {
      chatId: messageData.chatId,
      messageId: message.id,
      senderId: messageData.senderId
    });

    return message;
  }

  // Audit Logging
  async logAuditEvent(action, data) {
    return this.create(this.collections.auditLogs, {
      action,
      data,
      userId: auth.currentUser?.uid,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side' // In production, get from server
    });
  }

  // Real-time subscriptions for UI updates
  subscribeToNotifications(userId, callback) {
    return this.subscribe(this.collections.notifications, callback, {
      where: { field: 'userId', operator: '==', value: userId },
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  subscribeToMessages(chatId, callback) {
    return this.subscribe(this.collections.messages, callback, {
      where: { field: 'chatId', operator: '==', value: chatId },
      orderBy: { field: 'createdAt', direction: 'asc' }
    });
  }

  subscribeToMeetings(callback) {
    return this.subscribe(this.collections.meetings, callback, {
      orderBy: { field: 'date', direction: 'desc' }
    });
  }

  subscribeToVotes(callback) {
    return this.subscribe(this.collections.votes, callback, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 