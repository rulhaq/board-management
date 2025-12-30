import { db } from '$lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: 'welcome' | 'verification' | 'password_reset' | 'mfa_setup';
  metadata?: any;
}

class EmailService {
  async sendWelcomeEmail(userEmail: string, userName: string, tempPassword: string, verificationLink: string): Promise<void> {
    const emailData: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to Board Governance AI',
      html: this.generateWelcomeEmailHTML(userName, tempPassword, verificationLink),
      text: this.generateWelcomeEmailText(userName, tempPassword, verificationLink),
      type: 'welcome',
      metadata: {
        userName,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    };

    await this.sendEmail(emailData);
  }

  async sendVerificationEmail(userEmail: string, userName: string, verificationLink: string): Promise<void> {
    const emailData: EmailTemplate = {
      to: userEmail,
      subject: 'Verify Your Board Governance AI Account',
      html: this.generateVerificationEmailHTML(userName, verificationLink),
      text: this.generateVerificationEmailText(userName, verificationLink),
      type: 'verification',
      metadata: {
        userName,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      }
    };

    await this.sendEmail(emailData);
  }

  async sendMFASetupEmail(userEmail: string, userName: string, setupLink: string): Promise<void> {
    const emailData: EmailTemplate = {
      to: userEmail,
      subject: 'Set Up Multi-Factor Authentication - Board Governance AI',
      html: this.generateMFASetupEmailHTML(userName, setupLink),
      text: this.generateMFASetupEmailText(userName, setupLink),
      type: 'mfa_setup',
      metadata: {
        userName,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    };

    await this.sendEmail(emailData);
  }

  private async sendEmail(emailData: EmailTemplate): Promise<void> {
    try {
      // Store email in Firestore queue for processing
      if (db) {
        await addDoc(collection(db, 'emailQueue'), {
          ...emailData,
          status: 'pending',
          createdAt: serverTimestamp(),
          attempts: 0,
          maxAttempts: 3
        });
      }

      // In production, this would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll use the Firebase Functions approach
      await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      console.log(`Email queued for sending to ${emailData.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  private generateWelcomeEmailHTML(userName: string, tempPassword: string, verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Board Governance AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00A859 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .credentials { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #00A859; margin: 20px 0; }
          .button { display: inline-block; background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .security-notice { background: #fef3c7; padding: 15px; border-radius: 6px; border: 1px solid #f59e0b; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SM</div>
            <h1>Board Governance AI</h1>
            <p>Platform</p>
          </div>
          
          <div class="content">
            <h2>Welcome to the Board Portal, ${userName}!</h2>
            
            <p>You have been added as a board member to Board Governance AI. This secure platform will enable you to:</p>
            
            <ul>
              <li>Access board documents and meeting materials</li>
              <li>Participate in board meetings and voting</li>
              <li>Collaborate with fellow board members</li>
              <li>Access AI-powered insights and reports</li>
            </ul>

            <div class="credentials">
              <h3>Your Temporary Login Credentials:</h3>
              <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
              <p><em>You will be required to change this password on first login.</em></p>
            </div>

            <div class="security-notice">
              <h4>🔒 Important Security Steps:</h4>
              <ol>
                <li><strong>Verify your account</strong> using the link below</li>
                <li><strong>Login</strong> with your temporary password</li>
                <li><strong>Set up Multi-Factor Authentication</strong> for enhanced security</li>
                <li><strong>Change your password</strong> to something secure and unique</li>
              </ol>
            </div>

            <p>
              <a href="${verificationLink}" class="button">Verify Account & Get Started</a>
            </p>

            <p><strong>This verification link expires in 24 hours.</strong></p>

            <h3>Need Help?</h3>
            <p>If you have any questions or need assistance, please contact our IT support team at <a href="mailto:support@boardgovernance.ai">support@boardgovernance.ai</a> or call +974-4003-7777.</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 Board Governance AI. All rights reserved.</p>
            <p>This email was sent to a registered board member. If you received this in error, please contact IT support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(userName: string, tempPassword: string, verificationLink: string): string {
    return `
Welcome to Board Governance AI

Dear ${userName},

You have been added as a board member to Board Governance AI.

Your temporary login credentials:
Temporary Password: ${tempPassword}

Important Security Steps:
1. Verify your account: ${verificationLink}
2. Login with your temporary password
3. Set up Multi-Factor Authentication
4. Change your password

This verification link expires in 24 hours.

For support, contact: support@boardgovernance.ai or +974-4003-7777

© 2024 Board Governance AI. All rights reserved.
    `;
  }

  private generateVerificationEmailHTML(userName: string, verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account - Board Governance AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00A859 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .security-notice { background: #fef3c7; padding: 15px; border-radius: 6px; border: 1px solid #f59e0b; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Account Verification Required</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>To complete your account setup and ensure security, please verify your email address by clicking the button below:</p>

            <p>
              <a href="${verificationLink}" class="button">Verify My Account</a>
            </p>

            <div class="security-notice">
              <p><strong>Security Notice:</strong> This verification link expires in 2 hours for your protection.</p>
            </div>

            <p>If you didn't request this verification or believe this was sent in error, please contact IT support immediately.</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 Board Governance AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateVerificationEmailText(userName: string, verificationLink: string): string {
    return `
Account Verification Required - Board Governance AI

Hello ${userName},

Please verify your email address to complete your account setup:
${verificationLink}

This verification link expires in 2 hours.

If you didn't request this, contact IT support immediately.

© 2024 Board Governance AI. All rights reserved.
    `;
  }

  private generateMFASetupEmailHTML(userName: string, setupLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Set Up Multi-Factor Authentication - Board Governance AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00A859 0%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Multi-Factor Authentication Setup</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>To enhance the security of your Board Governance AI account, please set up Multi-Factor Authentication (MFA) using Google Authenticator.</p>

            <div class="steps">
              <h3>Setup Instructions:</h3>
              <ol>
                <li>Download Google Authenticator app on your mobile device</li>
                <li>Click the setup link below to configure MFA</li>
                <li>Scan the QR code with Google Authenticator</li>
                <li>Enter the 6-digit code to verify setup</li>
              </ol>
            </div>

            <p>
              <a href="${setupLink}" class="button">Set Up MFA Now</a>
            </p>

            <p><strong>This setup link expires in 7 days.</strong></p>

            <p>MFA adds an extra layer of security to protect sensitive board information and ensures compliance with our security policies.</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 Board Governance AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateMFASetupEmailText(userName: string, setupLink: string): string {
    return `
Multi-Factor Authentication Setup - Board Governance AI

Hello ${userName},

Please set up Multi-Factor Authentication for enhanced security:

Setup Instructions:
1. Download Google Authenticator app
2. Use this link: ${setupLink}
3. Scan the QR code
4. Enter the 6-digit code to verify

This setup link expires in 7 days.

© 2024 Board Governance AI. All rights reserved.
    `;
  }
}

export const emailService = new EmailService(); 