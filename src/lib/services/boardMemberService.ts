import { db } from '$lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from './emailService';

export interface NewBoardMember {
  email: string;
  displayName: string;
  position: string;
  department: string;
  phone: string;
  bio?: string;
  specialties?: string[];
  role: 'board_member' | 'secretary' | 'admin';
}

class BoardMemberService {
  async createBoardMember(memberData: NewBoardMember): Promise<string> {
    try {
      // Generate temporary password
      const tempPassword = this.generateTempPassword();
      
      // Create user in Firebase Auth via API
      const authResponse = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: memberData.email,
          displayName: memberData.displayName,
          password: tempPassword,
          emailVerified: false
        })
      });

      if (!authResponse.ok) {
        throw new Error('Failed to create user account');
      }

      const { uid } = await authResponse.json();

      // Create user profile in Firestore
      const userProfile = {
        uid,
        email: memberData.email,
        displayName: memberData.displayName,
        role: memberData.role,
        position: memberData.position,
        department: memberData.department,
        phone: memberData.phone,
        bio: memberData.bio || '',
        specialties: memberData.specialties || [],
        avatar: `/avatars/default-${memberData.role}.jpg`,
        permissions: this.getDefaultPermissions(memberData.role),
        preferences: this.getDefaultPreferences(),
        status: 'pending_verification',
        joinedDate: new Date().toISOString(),
        lastActive: null,
        mfaEnabled: false,
        emailVerified: false,
        createdAt: serverTimestamp(),
        createdBy: 'admin' // TODO: Get actual admin user ID
      };

      // Save to Firestore
      if (db) {
        await setDoc(doc(db, 'users', uid), userProfile);
      }

      // Generate verification link
      const verificationLink = await this.generateVerificationLink(uid, memberData.email);

      // Send welcome email with verification link
      await emailService.sendWelcomeEmail(
        memberData.email,
        memberData.displayName,
        tempPassword,
        verificationLink
      );

      // Log the creation
      await this.logBoardMemberCreation(uid, memberData);

      return uid;

    } catch (error) {
      console.error('Error creating board member:', error);
      throw new Error(`Failed to create board member: ${error.message}`);
    }
  }

  async verifyBoardMember(token: string): Promise<boolean> {
    try {
      // Verify the token via API
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Invalid verification token');
      }

      const { uid, email } = await response.json();

      // Update user profile
      if (db) {
        await setDoc(doc(db, 'users', uid), {
          emailVerified: true,
          status: 'verified',
          verifiedAt: serverTimestamp()
        }, { merge: true });
      }

      // Send MFA setup email
      const setupLink = await this.generateMFASetupLink(uid, email);
      const user = await this.getUserProfile(uid);
      
      if (user) {
        await emailService.sendMFASetupEmail(email, user.displayName, setupLink);
      }

      return true;

    } catch (error) {
      console.error('Error verifying board member:', error);
      return false;
    }
  }

  private generateTempPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateVerificationLink(uid: string, email: string): Promise<string> {
    // Generate a verification token
    const token = await this.generateSecureToken(uid, email, 'email_verification');
    return `${window.location.origin}/verify-email?token=${token}`;
  }

  private async generateMFASetupLink(uid: string, email: string): Promise<string> {
    // Generate an MFA setup token
    const token = await this.generateSecureToken(uid, email, 'mfa_setup');
    return `${window.location.origin}/setup-mfa?token=${token}`;
  }

  private async generateSecureToken(uid: string, email: string, type: string): Promise<string> {
    // In production, this should use a proper JWT library with signing
    const payload = {
      uid,
      email,
      type,
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      iat: Date.now()
    };

    // For now, use base64 encoding (in production, use proper JWT signing)
    return btoa(JSON.stringify(payload));
  }

  private getDefaultPermissions(role: string) {
    const permissions = {
      admin: {
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
      secretary: {
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
      board_member: {
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
      }
    };

    return permissions[role] || permissions.board_member;
  }

  private getDefaultPreferences() {
    return {
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
    };
  }

  private async getUserProfile(uid: string) {
    if (!db) return null;
    
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async logBoardMemberCreation(uid: string, memberData: NewBoardMember) {
    try {
      if (db) {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'board_member_created',
          targetUserId: uid,
          targetEmail: memberData.email,
          details: {
            displayName: memberData.displayName,
            role: memberData.role,
            position: memberData.position,
            department: memberData.department
          },
          timestamp: serverTimestamp(),
          createdBy: 'admin' // TODO: Get actual admin user ID
        });
      }
    } catch (error) {
      console.error('Error logging board member creation:', error);
    }
  }
}

export const boardMemberService = new BoardMemberService(); 