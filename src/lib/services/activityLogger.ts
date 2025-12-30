import { db } from '$lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { UserProfile } from '$lib/stores/auth';

export interface ActivityLog {
  id?: string;
  userId: string;
  username: string;
  userEmail: string;
  action: string;
  resourceType: string; // 'document', 'meeting', 'vote', 'user', 'chat', etc.
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
}

class ActivityLoggerService {
  private collectionName = 'activityLogs';

  async logActivity(
    user: UserProfile | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!db || !user) return;

    try {
      const activityLog: Omit<ActivityLog, 'id'> = {
        userId: user.uid,
        username: user.displayName,
        userEmail: user.email,
        action,
        resourceType,
        resourceId,
        details: details || {},
        ipAddress: await this.getClientIP(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, this.collectionName), activityLog);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should not break the app
    }
  }

  async getRecentActivities(limitCount: number = 100): Promise<ActivityLog[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      } as ActivityLog));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivitiesByUser(userId: string, limitCount: number = 50): Promise<ActivityLog[]> {
    if (!db) return [];

    try {
      const { where } = await import('firebase/firestore');
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      } as ActivityLog));
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

export const activityLogger = new ActivityLoggerService();

// Simple wrapper function for easier usage
export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  if (!db) {
    console.warn('Firestore not initialized, cannot log activity.');
    return;
  }
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      userName,
      action,
      details,
      timestamp: serverTimestamp(),
    });
    console.log(`Activity logged: ${action} by ${userName}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

