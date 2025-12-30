import { db } from '$lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
}

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'document.upload'
  | 'document.download'
  | 'document.view'
  | 'document.edit'
  | 'document.delete'
  | 'document.share'
  | 'meeting.create'
  | 'meeting.join'
  | 'meeting.leave'
  | 'meeting.edit'
  | 'meeting.delete'
  | 'vote.cast'
  | 'vote.create'
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.activate'
  | 'user.deactivate'
  | 'system.backup'
  | 'system.restore'
  | 'security.violation'
  | 'data.export'
  | 'data.delete';

/**
 * Log user activity for audit trail
 */
export const logAuditEvent = async (
  userId: string,
  userName: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  details?: any
): Promise<void> => {
  if (!db) {
    console.warn('Database not initialized, skipping audit log');
    return;
  }

  try {
    const auditLog: Omit<AuditLog, 'id'> = {
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      timestamp: serverTimestamp() as any,
      ipAddress: await getUserIP(),
      userAgent: navigator.userAgent,
      sessionId: getSessionId()
    };

    await addDoc(collection(db, 'audit_logs'), auditLog);
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking user workflow
  }
};

/**
 * Log document access
 */
export const logDocumentAccess = async (
  userId: string,
  userName: string,
  action: 'view' | 'download' | 'upload' | 'edit' | 'delete',
  documentId: string,
  documentTitle: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    userName,
    `document.${action}` as AuditAction,
    'document',
    documentId,
    { documentTitle }
  );
};

/**
 * Log meeting activity
 */
export const logMeetingActivity = async (
  userId: string,
  userName: string,
  action: 'create' | 'join' | 'leave' | 'edit' | 'delete',
  meetingId: string,
  meetingTitle: string
): Promise<void> => {
  await logAuditEvent(
    userId,
    userName,
    `meeting.${action}` as AuditAction,
    'meeting',
    meetingId,
    { meetingTitle }
  );
};

/**
 * Log voting activity
 */
export const logVotingActivity = async (
  userId: string,
  userName: string,
  action: 'cast' | 'create',
  voteId: string,
  voteTitle: string,
  details?: any
): Promise<void> => {
  await logAuditEvent(
    userId,
    userName,
    `vote.${action}` as AuditAction,
    'vote',
    voteId,
    { voteTitle, ...details }
  );
};

/**
 * Log user management activities
 */
export const logUserActivity = async (
  adminUserId: string,
  adminUserName: string,
  action: 'create' | 'edit' | 'delete' | 'activate' | 'deactivate',
  targetUserId: string,
  targetUserName: string
): Promise<void> => {
  await logAuditEvent(
    adminUserId,
    adminUserName,
    `user.${action}` as AuditAction,
    'user',
    targetUserId,
    { targetUserName }
  );
};

/**
 * Log authentication events
 */
export const logAuthEvent = async (
  userId: string,
  userName: string,
  action: 'login' | 'logout',
  details?: any
): Promise<void> => {
  await logAuditEvent(
    userId,
    userName,
    action,
    'auth',
    userId,
    details
  );
};

/**
 * Log security violations
 */
export const logSecurityViolation = async (
  userId: string,
  userName: string,
  violationType: string,
  details: any
): Promise<void> => {
  await logAuditEvent(
    userId,
    userName,
    'security.violation',
    'security',
    userId,
    { violationType, ...details }
  );
};

/**
 * Get user's IP address (simplified version)
 */
const getUserIP = async (): Promise<string> => {
  try {
    // In production, implement proper IP detection
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Get current session ID
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('board_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('board_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create audit report for compliance
 */
export const generateAuditReport = async (
  startDate: Date,
  endDate: Date,
  userId?: string,
  action?: AuditAction
): Promise<AuditLog[]> => {
  if (!db) throw new Error('Database not initialized');

  try {
    // In production, implement proper Firestore query with date range and filters
    // This is a simplified version
    console.log('Generating audit report', { startDate, endDate, userId, action });
    return [];
  } catch (error) {
    console.error('Error generating audit report:', error);
    throw error;
  }
}; 