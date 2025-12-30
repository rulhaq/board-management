import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticator } from 'otplib';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { secret, token, userId } = await request.json();
    
    // Validate input
    if (!secret || !token || !userId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(token)) {
      return json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Configure authenticator
    authenticator.options = {
      step: 30, // 30 second time window
      window: 1 // Allow 1 step tolerance for time drift
    };

    // Verify TOTP token
    const isValid = authenticator.verify({
      token: token,
      secret: secret
    });

    if (isValid) {
      return json({ 
        success: true, 
        message: 'TOTP token verified successfully' 
      });
    } else {
      return json({ 
        error: 'Invalid TOTP token' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('TOTP verification error:', error);
    return json({ 
      error: 'Failed to verify TOTP token',
      details: error.message 
    }, { status: 500 });
  }
}; 