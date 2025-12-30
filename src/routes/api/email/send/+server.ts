import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodemailer from 'nodemailer';
import { db } from '$lib/firebase.server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Email configuration - in production, use environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const emailData = await request.json();
    
    // Validate email data
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return json({ error: 'Missing required email fields' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

    // Email options
    const mailOptions = {
      from: `"Board Governance AI" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || stripHtml(emailData.html)
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Log email send to Firestore
    if (db) {
      await addDoc(collection(db, 'emailLogs'), {
        to: emailData.to,
        subject: emailData.subject,
        type: emailData.type || 'general',
        messageId: info.messageId,
        status: 'sent',
        sentAt: serverTimestamp(),
        metadata: emailData.metadata || {}
      });
    }

    return json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email send error:', error);
    
    // Log error to Firestore
    if (db) {
      try {
        await addDoc(collection(db, 'emailLogs'), {
          to: (await request.json()).to || 'unknown',
          subject: (await request.json()).subject || 'unknown',
          type: 'error',
          error: error.message,
          status: 'failed',
          sentAt: serverTimestamp()
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
    }

    return json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
};

// Helper function to strip HTML tags for text version
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
} 