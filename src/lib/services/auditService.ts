import { db } from '$lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import type { UserProfile } from '$lib/stores/auth';

export interface AuditLog {
  id?: string;
  userId: string;
  username: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  private collectionName = 'auditLogs';

  async logAudit(
    user: UserProfile | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    resourceName?: string,
    changes?: { before?: Record<string, any>; after?: Record<string, any> },
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!db || !user) return;

    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        userId: user.uid,
        username: user.displayName,
        userEmail: user.email,
        action,
        resourceType,
        resourceId,
        resourceName,
        changes,
        metadata: metadata || {},
        ipAddress: await this.getClientIP(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, this.collectionName), auditLog);
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  async getAuditLogs(limitCount: number = 100, filters?: {
    userId?: string;
    resourceType?: string;
    action?: string;
  }): Promise<AuditLog[]> {
    if (!db) return [];

    try {
      let q: any = collection(db, this.collectionName);

      if (filters?.userId) {
        const { where: whereFn } = await import('firebase/firestore');
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters?.resourceType) {
        const { where: whereFn } = await import('firebase/firestore');
        q = query(q, where('resourceType', '==', filters.resourceType));
      }
      if (filters?.action) {
        const { where: whereFn } = await import('firebase/firestore');
        q = query(q, where('action', '==', filters.action));
      }

      q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      } as AuditLog));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
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

export const auditService = new AuditService();

// Simple wrapper function for easier usage
export async function audit(
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValue: any = null,
  newValue: any = null,
  ipAddress: string = 'N/A',
  userAgent: string = 'N/A'
): Promise<void> {
  if (!db) {
    console.warn('Firestore not initialized, cannot log audit.');
    return;
  }
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      userName,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      timestamp: serverTimestamp(),
    });
    console.log(`Audit logged: ${action} on ${entityType}:${entityId} by ${userName}`);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

