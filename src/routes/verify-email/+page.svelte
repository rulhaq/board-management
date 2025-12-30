<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let loading = true;
  let success = false;
  let error = '';
  let userInfo = null;

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      error = 'Missing verification token';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (response.ok) {
        success = true;
        userInfo = result;
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          goto('/login?verified=true');
        }, 3000);
        
      } else {
        error = result.error || 'Verification failed';
      }
    } catch (err) {
      console.error('Verification error:', err);
      error = 'Failed to verify email. Please try again.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Email Verification - Board Governance AI</title>
  <meta name="description" content="Email verification for Board Governance AI access." />
</svelte:head>

<div class="verification-container">
  <div class="verification-card">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">SM</div>
        <div class="logo-text">
          <div class="brand-name">Board Governance AI</div>
          <div class="brand-tagline">Platform</div>
        </div>
      </div>
    </div>

    <div class="content">
      {#if loading}
        <div class="loading-state">
          <div class="loading-spinner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
          </div>
          <h2>Verifying Your Email</h2>
          <p>Please wait while we verify your email address...</p>
        </div>
      {:else if success}
        <div class="success-state">
          <div class="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
            </svg>
          </div>
          <h2>Email Verified Successfully!</h2>
          <p>Welcome to Board Governance AI, <strong>{userInfo?.email}</strong>!</p>
          
          <div class="next-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>You'll be redirected to the login page shortly</li>
              <li>Sign in with your temporary password</li>
              <li>Set up Multi-Factor Authentication for enhanced security</li>
              <li>Change your password to something secure and memorable</li>
            </ol>
          </div>

          <div class="redirect-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,17H11V15H13V17M13,13H11V7H13V13Z"/>
            </svg>
            <span>You'll be automatically redirected to the login page in a few seconds.</span>
          </div>

          <div class="manual-action">
            <a href="/login?verified=true" class="btn btn-primary">
              Continue to Login
            </a>
          </div>
        </div>
      {:else if error}
        <div class="error-state">
          <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
          </div>
          <h2>Verification Failed</h2>
          <p>{error}</p>
          
          <div class="error-help">
            <h3>What can you do?</h3>
            <ul>
              <li>Check if the verification link has expired</li>
              <li>Make sure you're using the correct link from your email</li>
              <li>Contact IT support if the problem persists</li>
            </ul>
          </div>

          <div class="error-actions">
            <a href="/login" class="btn btn-secondary">
              Back to Login
            </a>
            <a href="mailto:support@boardgovernance.ai" class="btn btn-primary">
              Contact Support
            </a>
          </div>
        </div>
      {/if}
    </div>

    <div class="footer">
      <p>© 2024 Board Governance AI. All rights reserved.</p>
      <p>For technical support: <a href="mailto:support@boardgovernance.ai">support@boardgovernance.ai</a> | +974 4003 3333</p>
    </div>
  </div>
</div>

<style>
  .verification-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: var(--board-spacing-lg);
  }

  .verification-card {
    background: var(--board-white);
    border-radius: var(--board-border-radius-xl);
    box-shadow: var(--board-shadow-2xl);
    width: 100%;
    max-width: 600px;
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #00A859 0%, #10B981 100%);
    color: var(--board-white);
    padding: var(--board-spacing-xl);
    text-align: center;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--board-spacing-md);
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--board-border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.25rem;
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .brand-tagline {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .content {
    padding: var(--board-spacing-xl);
    text-align: center;
  }

  .loading-state,
  .success-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--board-spacing-lg);
  }

  .loading-spinner {
    color: var(--board-primary);
    animation: spin 1s linear infinite;
  }

  .success-icon {
    color: var(--board-success);
  }

  .error-icon {
    color: var(--board-error);
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin: 0;
  }

  p {
    color: var(--board-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .next-steps,
  .error-help {
    text-align: left;
    background: var(--board-gray-50);
    padding: var(--board-spacing-lg);
    border-radius: var(--board-border-radius);
    width: 100%;
    max-width: 400px;
  }

  .next-steps h3,
  .error-help h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin: 0 0 var(--board-spacing-md) 0;
  }

  .next-steps ol,
  .error-help ul {
    color: var(--board-text-secondary);
    line-height: 1.6;
    margin: 0;
    padding-left: var(--board-spacing-lg);
  }

  .next-steps li,
  .error-help li {
    margin-bottom: var(--board-spacing-sm);
  }

  .redirect-notice {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-sm);
    padding: var(--board-spacing-md);
    background: var(--board-info-50);
    border: 1px solid var(--board-info-200);
    border-radius: var(--board-border-radius);
    color: var(--board-info-800);
    font-size: 0.875rem;
  }

  .manual-action,
  .error-actions {
    display: flex;
    gap: var(--board-spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .footer {
    background: var(--board-gray-50);
    padding: var(--board-spacing-lg);
    text-align: center;
    color: var(--board-text-secondary);
    font-size: 0.875rem;
    border-top: 1px solid var(--board-gray-200);
  }

  .footer p {
    margin: var(--board-spacing-xs) 0;
  }

  .footer a {
    color: var(--board-primary);
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .verification-container {
      padding: var(--board-spacing-md);
    }

    .content {
      padding: var(--board-spacing-lg);
    }

    .header {
      padding: var(--board-spacing-lg);
    }

    .logo {
      flex-direction: column;
      gap: var(--board-spacing-sm);
    }

    .error-actions {
      flex-direction: column;
    }
  }
</style> 