import { auth } from '$lib/firebase';
import { 
  sendPasswordResetEmail, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

class GoogleAuthService {
  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      // Log the password reset attempt
      await this.logAuthEvent('password_reset_requested', { email });
      
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  async sendVerificationEmail(user: any): Promise<void> {
    if (!user) {
      throw new Error('No user provided for verification');
    }

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      });
      
      // Log the verification email send
      await this.logAuthEvent('verification_email_sent', { 
        email: user.email,
        uid: user.uid 
      });
      
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleAuthError(error);
    }
  }

  async linkGoogleAccount(user: any): Promise<void> {
    if (!user) {
      throw new Error('No user provided for Google linking');
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential && user) {
        await linkWithCredential(user, credential);
        
        // Log the account linking
        await this.logAuthEvent('google_account_linked', { 
          email: user.email,
          uid: user.uid 
        });
      }
      
    } catch (error) {
      console.error('Google account linking error:', error);
      throw this.handleAuthError(error);
    }
  }

  async reauthenticateWithGoogle(user: any): Promise<void> {
    if (!user) {
      throw new Error('No user provided for reauthentication');
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential) {
        await reauthenticateWithCredential(user, credential);
        
        // Log the reauthentication
        await this.logAuthEvent('google_reauthentication', { 
          email: user.email,
          uid: user.uid 
        });
      }
      
    } catch (error) {
      console.error('Google reauthentication error:', error);
      throw this.handleAuthError(error);
    }
  }

  private handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('No account found with this email address. Please contact your administrator.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/too-many-requests':
        return new Error('Too many requests. Please try again later.');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection and try again.');
      case 'auth/email-already-in-use':
        return new Error('This email is already associated with an account.');
      case 'auth/weak-password':
        return new Error('Password is too weak. Please choose a stronger password.');
      default:
        return new Error(error.message || 'An authentication error occurred. Please try again.');
    }
  }

  private async logAuthEvent(action: string, data: any): Promise<void> {
    try {
      const logData = {
        action,
        ...data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: await this.getUserIP()
      };

      // Send to audit logging endpoint
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}

export const googleAuthService = new GoogleAuthService(); 