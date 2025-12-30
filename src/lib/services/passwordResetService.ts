import { auth, db } from '$lib/firebase';
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface PasswordResetRequest {
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  userId?: string;
}

class PasswordResetService {
  private readonly RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds
  private readonly MAX_RESET_ATTEMPTS = 3;

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address format');
      }

      // Check if user exists (for security, we don't reveal if user exists)
      const userExists = await this.checkUserExists(email);
      
      if (auth) {
        // Use Firebase Auth for password reset
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/login?reset=success`,
          handleCodeInApp: false,
        });
      } else {
        // Fallback: Generate custom reset token
        await this.generateCustomResetToken(email);
      }

      // Log the password reset attempt for audit
      await this.logPasswordResetAttempt(email, 'reset_email_sent');

      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      };

    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Log failed attempt
      await this.logPasswordResetAttempt(email, 'reset_email_failed', error.message);

      // Return generic message for security
      return {
        success: false,
        message: 'Unable to process password reset request. Please try again later.'
      };
    }
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      if (auth) {
        // Verify Firebase reset code
        const email = await verifyPasswordResetCode(auth, token);
        return { valid: true, email };
      } else {
        // Verify custom token
        return await this.verifyCustomResetToken(token);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      if (auth) {
        // Use Firebase Auth to confirm password reset
        await confirmPasswordReset(auth, token, newPassword);
      } else {
        // Handle custom password reset
        await this.handleCustomPasswordReset(token, newPassword);
      }

      // Log successful password reset
      await this.logPasswordResetAttempt('', 'password_reset_completed');

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      };

    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      
      await this.logPasswordResetAttempt('', 'password_reset_failed', error.message);

      return {
        success: false,
        message: this.getPasswordResetErrorMessage(error)
      };
    }
  }

  private async generateCustomResetToken(email: string): Promise<void> {
    if (!db) return;

    const token = this.generateSecureToken();
    const resetRequest: PasswordResetRequest = {
      email,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.RESET_TOKEN_EXPIRY),
      used: false
    };

    // Store reset request in Firestore
    await setDoc(doc(db, 'passwordResets', token), {
      ...resetRequest,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + this.RESET_TOKEN_EXPIRY)
    });

    // Send custom reset email
    await this.sendCustomResetEmail(email, token);
  }

  private async verifyCustomResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    if (!db) return { valid: false };

    try {
      const resetDoc = await getDoc(doc(db, 'passwordResets', token));
      
      if (!resetDoc.exists()) {
        return { valid: false };
      }

      const resetData = resetDoc.data() as PasswordResetRequest;
      const now = new Date();

      // Check if token is expired or already used
      if (resetData.expiresAt < now || resetData.used) {
        return { valid: false };
      }

      return { valid: true, email: resetData.email };
    } catch (error) {
      console.error('Custom token verification error:', error);
      return { valid: false };
    }
  }

  private async handleCustomPasswordReset(token: string, newPassword: string): Promise<void> {
    if (!db) throw new Error('Database not available');

    const resetDoc = await getDoc(doc(db, 'passwordResets', token));
    if (!resetDoc.exists()) {
      throw new Error('Invalid or expired reset token');
    }

    const resetData = resetDoc.data() as PasswordResetRequest;
    
    // Mark token as used
    await setDoc(doc(db, 'passwordResets', token), {
      ...resetData,
      used: true
    });

    // In a real implementation, you would update the user's password hash here
    // For demo purposes, we'll just log the action
    console.log('Password reset for:', resetData.email);
  }

  private async sendCustomResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
    
    // In production, this would integrate with your email service
    const emailData = {
      to: email,
      subject: 'Board Governance AI - Password Reset Request',
      html: this.generateResetEmailHTML(resetUrl),
      text: this.generateResetEmailText(resetUrl)
    };

    // Mock email sending - replace with actual email service
    await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    }).catch(() => {
      // Fail silently for demo
    });
  }

  private generateResetEmailHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - Board Governance AI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00a859 0%, #34d399 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #00a859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .warning { background: #fef3c7; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Board Governance AI</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your Board Governance AI account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>Contact IT support if you have concerns: support@boardgovernance.ai</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Board Governance AI. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateResetEmailText(resetUrl: string): string {
    return `
Board Governance AI - Password Reset Request

Hello,

We received a request to reset your password for your Board Governance AI account.

Please click the following link to reset your password:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Never share this link with anyone
- Contact IT support if you have concerns: support@boardgovernance.ai

© 2024 Board Governance AI. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }

  private async checkUserExists(email: string): Promise<boolean> {
    // In production, check if user exists in your database
    // For demo, assume user exists if email contains certain domains
    const allowedDomains = ['boardgovernance.ai', 'example.com'];
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }

  private validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }

    return { isValid: true, message: 'Password is strong' };
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getPasswordResetErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/expired-action-code':
        return 'Password reset link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'Invalid password reset link. Please request a new one.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      default:
        return 'Unable to reset password. Please try again or contact support.';
    }
  }

  private async logPasswordResetAttempt(email: string, action: string, details?: string): Promise<void> {
    try {
      const logData = {
        action,
        email: email || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: await this.getUserIP(),
        details: details || null
      };

      // Send to audit logging endpoint
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      }).catch(() => {
        // Fail silently for demo
      });
    } catch (error) {
      console.error('Failed to log password reset attempt:', error);
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

export const passwordResetService = new PasswordResetService(); 