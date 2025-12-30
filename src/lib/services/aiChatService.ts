import { db } from '$lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { get } from 'svelte/store';
import { user, userProfile } from '$lib/stores/auth';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  userId: string;
  sessionId: string;
  model?: string;
  provider?: string;
  metadata?: any;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct' | 'ai';
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  description?: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  roomId: string;
  timestamp: Date;
  read: boolean;
  edited?: boolean;
  editedAt?: Date;
}

class AIChatService {
  private currentUser = get(user);
  private currentProfile = get(userProfile);

  async sendAIMessage(content: string, sessionId?: string): Promise<ChatMessage> {
    if (!this.currentUser || !db) {
      throw new Error('User not authenticated or database not available');
    }

    const newSessionId = sessionId || `session-${this.currentUser.uid}-${Date.now()}`;
    
    // Save user message to Firebase
    const userMessage: Omit<ChatMessage, 'id'> = {
      content,
      role: 'user',
      timestamp: new Date(),
      userId: this.currentUser.uid,
      sessionId: newSessionId
    };

    const userMessageRef = await addDoc(collection(db, 'aiChatLogs'), {
      ...userMessage,
      timestamp: serverTimestamp()
    });

    // Get AI response
    const aiResponse = await this.getAIResponse(content);
    
    // Save AI response to Firebase
    const aiMessage: Omit<ChatMessage, 'id'> = {
      content: aiResponse.content,
      role: 'assistant',
      timestamp: new Date(),
      userId: this.currentUser.uid,
      sessionId: newSessionId,
      model: aiResponse.model,
      provider: aiResponse.provider,
      metadata: aiResponse.metadata
    };

    const aiMessageRef = await addDoc(collection(db, 'aiChatLogs'), {
      ...aiMessage,
      timestamp: serverTimestamp()
    });

    return {
      id: aiMessageRef.id,
      ...aiMessage
    };
  }

  private async getAIResponse(userMessage: string): Promise<{
    content: string;
    model: string;
    provider: string;
    metadata: any;
  }> {
    const profile = get(userProfile);
    const provider = profile?.preferences?.aiProvider || 'groq';
    const model = profile?.preferences?.aiModel || 'mixtral-8x7b-32768';

    try {
      if (provider === 'groq') {
        const response = await fetch('/api/ai/groq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            model: model,
            context: 'board_governance'
          }),
        });

        if (!response.ok) {
          throw new Error('AI service unavailable');
        }

        const data = await response.json();
        return {
          content: data.response,
          model: model,
          provider: 'groq',
          metadata: {
            usage: data.usage,
            responseTime: data.responseTime
          }
        };
      } else {
        // Fallback response
        return {
          content: "I'm here to help with board governance matters. How can I assist you today?",
          model: 'fallback',
          provider: 'system',
          metadata: {}
        };
      }
    } catch (error) {
      console.error('AI service error:', error);
      return {
        content: "I'm experiencing technical difficulties. Please try again later or contact support.",
        model: 'error',
        provider: 'system',
        metadata: { error: error.message }
      };
    }
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    if (!db || !this.currentUser) return [];

    try {
      const q = query(
        collection(db, 'aiChatLogs'),
        where('sessionId', '==', sessionId),
        where('userId', '==', this.currentUser.uid),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ChatMessage));
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  async getUserChatSessions(): Promise<string[]> {
    if (!db || !this.currentUser) return [];

    try {
      const q = query(
        collection(db, 'aiChatLogs'),
        where('userId', '==', this.currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const sessions = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        sessions.add(doc.data().sessionId);
      });

      return Array.from(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  // Member-to-member chat functionality
  async sendDirectMessage(receiverId: string, content: string): Promise<DirectMessage> {
    if (!this.currentUser || !db) {
      throw new Error('User not authenticated or database not available');
    }

    const roomId = this.getDirectMessageRoomId(this.currentUser.uid, receiverId);

    const message: Omit<DirectMessage, 'id'> = {
      content,
      senderId: this.currentUser.uid,
      receiverId,
      roomId,
      timestamp: new Date(),
      read: false
    };

    const messageRef = await addDoc(collection(db, 'directMessages'), {
      ...message,
      timestamp: serverTimestamp()
    });

    // Update chat room last activity
    await this.updateChatRoomActivity(roomId);

    return {
      id: messageRef.id,
      ...message
    };
  }

  async getDirectMessages(otherUserId: string): Promise<DirectMessage[]> {
    if (!db || !this.currentUser) return [];

    const roomId = this.getDirectMessageRoomId(this.currentUser.uid, otherUserId);

    try {
      const q = query(
        collection(db, 'directMessages'),
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as DirectMessage));
    } catch (error) {
      console.error('Error loading direct messages:', error);
      return [];
    }
  }

  subscribeToDirectMessages(otherUserId: string, callback: (messages: DirectMessage[]) => void) {
    if (!db || !this.currentUser) return () => {};

    const roomId = this.getDirectMessageRoomId(this.currentUser.uid, otherUserId);

    const q = query(
      collection(db, 'directMessages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as DirectMessage));
      
      callback(messages);
    });
  }

  async markMessagesAsRead(otherUserId: string): Promise<void> {
    if (!db || !this.currentUser) return;

    const roomId = this.getDirectMessageRoomId(this.currentUser.uid, otherUserId);

    try {
      const q = query(
        collection(db, 'directMessages'),
        where('roomId', '==', roomId),
        where('receiverId', '==', this.currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(docSnapshot => 
        updateDoc(doc(db!, 'directMessages', docSnapshot.id), { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    if (!db || !this.currentUser) return [];

    try {
      const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', this.currentUser.uid),
        orderBy('lastActivity', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate() || new Date()
      } as ChatRoom));
    } catch (error: any) {
      // If query fails due to missing index, try without orderBy
      if (error.code === 'failed-precondition') {
        console.warn('Index missing for chatRooms, trying without orderBy:', error);
        try {
          const fallbackQ = query(
            collection(db, 'chatRooms'),
            where('participants', 'array-contains', this.currentUser.uid)
          );
          const snapshot = await getDocs(fallbackQ);
          const rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastActivity: doc.data().lastActivity?.toDate() || new Date()
          } as ChatRoom));
          // Sort in memory
          rooms.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
          return rooms;
        } catch (fallbackError) {
          console.error('Error loading chat rooms (fallback):', fallbackError);
          return [];
        }
      }
      console.error('Error loading chat rooms:', error);
      return [];
    }
  }

  async createChatRoom(name: string, participants: string[], description?: string): Promise<ChatRoom> {
    if (!this.currentUser || !db) {
      throw new Error('User not authenticated or database not available');
    }

    const room: Omit<ChatRoom, 'id'> = {
      name,
      type: 'group',
      participants: [...participants, this.currentUser.uid],
      createdBy: this.currentUser.uid,
      createdAt: new Date(),
      lastActivity: new Date(),
      description
    };

    const roomRef = await addDoc(collection(db, 'chatRooms'), {
      ...room,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp()
    });

    return {
      id: roomRef.id,
      ...room
    };
  }

  private getDirectMessageRoomId(userId1: string, userId2: string): string {
    // Create consistent room ID regardless of user order
    return [userId1, userId2].sort().join('-');
  }

  private async updateChatRoomActivity(roomId: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'chatRooms', roomId), {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat room activity:', error);
    }
  }

  // Analytics and reporting
  async getChatAnalytics(): Promise<{
    totalAIChats: number;
    totalDirectMessages: number;
    mostActiveUsers: string[];
    popularTopics: string[];
  }> {
    if (!db || !this.currentUser) {
      return {
        totalAIChats: 0,
        totalDirectMessages: 0,
        mostActiveUsers: [],
        popularTopics: []
      };
    }

    try {
      // Get AI chat count
      const aiChatsQuery = query(
        collection(db, 'aiChatLogs'),
        where('userId', '==', this.currentUser.uid)
      );
      const aiChatsSnapshot = await getDocs(aiChatsQuery);

      // Get direct messages count
      const directMessagesQuery = query(
        collection(db, 'directMessages'),
        where('senderId', '==', this.currentUser.uid)
      );
      const directMessagesSnapshot = await getDocs(directMessagesQuery);

      return {
        totalAIChats: aiChatsSnapshot.size,
        totalDirectMessages: directMessagesSnapshot.size,
        mostActiveUsers: [], // TODO: Implement user activity analysis
        popularTopics: [] // TODO: Implement topic analysis
      };
    } catch (error) {
      console.error('Error loading chat analytics:', error);
      return {
        totalAIChats: 0,
        totalDirectMessages: 0,
        mostActiveUsers: [],
        popularTopics: []
      };
    }
  }
}

export const aiChatService = new AIChatService(); 