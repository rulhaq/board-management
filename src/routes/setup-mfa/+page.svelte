<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import MFASetup from '$lib/components/MFASetup.svelte';

  let loading = true;
  let validToken = false;
  let error = '';
  let userInfo = null;
  let showMFASetup = false;

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      error = 'Missing MFA setup token';
      loading = false;
      return;
    }

    try {
      // Decode and validate the token
      const payload = JSON.parse(atob(token));
      
      // Check token expiration
      if (Date.now() > payload.exp) {
        error = 'MFA setup link has expired';
        loading = false;
        return;
      }

      // Verify token type
      if (payload.type !== 'mfa_setup') {
        error = 'Invalid setup link';
        loading = false;
        return;
      }

      validToken = true;
      userInfo = payload;
      showMFASetup = true;
      
    } catch (err) {
      console.error('Token validation error:', err);
      error = 'Invalid MFA setup link';
    } finally {
      loading = false;
    }
  });

  function handleMFAComplete() {
    // Redirect to login with success message
    goto('/login?mfa-setup=complete');
  }

  function handleMFACancel() {
    // Redirect to login
    goto('/login');
  }
</script>

<svelte:head>
  <title>Set Up Multi-Factor Authentication - Board Governance AI</title>
  <meta name="description" content="Set up Multi-Factor Authentication for enhanced security on Board Governance AI." />
</svelte:head>

<div class="mfa-setup-container">
  {#if loading}
    <div class="loading-card">
      <div class="loading-spinner">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
      </div>
      <h2>Validating Setup Link</h2>
      <p>Please wait while we validate your MFA setup link...</p>
    </div>
  {:else if error}
    <div class="error-card">
      <div class="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
      </div>
      <h2>Setup Link Invalid</h2>
      <p>{error}</p>
      
      <div class="error-help">
        <h3>What can you do?</h3>
        <ul>
          <li>Check if the setup link has expired (valid for 7 days)</li>
          <li>Make sure you're using the correct link from your email</li>
          <li>Contact IT support to request a new setup link</li>
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
  {:else if validToken && showMFASetup}
    <div class="welcome-section">
      <div class="header">
        <div class="logo">
          <div class="logo-icon">SM</div>
          <div class="logo-text">
            <div class="brand-name">Board Governance AI</div>
            <div class="brand-tagline">Platform</div>
          </div>
        </div>
      </div>
      
      <div class="welcome-content">
        <h1>Welcome to Board Governance AI!</h1>
        <p>Hello <strong>{userInfo?.email}</strong>, let's secure your account with Multi-Factor Authentication.</p>
        
        <div class="security-info">
          <div class="info-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,7.6 15.8,8.6C16.8,9.6 17.4,11 17.4,12.4C17.4,13.8 16.8,15.2 15.8,16.2C14.8,17.2 13.4,17.8 12,17.8C10.6,17.8 9.2,17.2 8.2,16.2C7.2,15.2 6.6,13.8 6.6,12.4C6.6,11 7.2,9.6 8.2,8.6C9.2,7.6 10.6,7 12,7M12,9C11.2,9 10.4,9.3 9.9,9.9C9.3,10.4 9,11.2 9,12C9,12.8 9.3,13.6 9.9,14.1C10.4,14.7 11.2,15 12,15C12.8,15 13.6,14.7 14.1,14.1C14.7,13.6 15,12.8 15,12C15,11.2 14.7,10.4 14.1,9.9C13.6,9.3 12.8,9 12,9Z"/>
            </svg>
          </div>
          <div class="info-content">
            <h3>Why Multi-Factor Authentication?</h3>
            <p>MFA adds an extra layer of security to protect sensitive board information and ensures compliance with our security policies.</p>
          </div>
        </div>
      </div>
    </div>

    <MFASetup on:complete={handleMFAComplete} on:cancel={handleMFACancel} />
  {/if}
</div>

<style>
  .mfa-setup-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: var(--board-spacing-lg);
  }

  .loading-card,
  .error-card {
    background: var(--board-white);
    border-radius: var(--board-border-radius-xl);
    box-shadow: var(--board-shadow-2xl);
    padding: var(--board-spacing-xl);
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
    margin-top: 10vh;
  }

  .loading-spinner {
    color: var(--board-primary);
    animation: spin 1s linear infinite;
    margin-bottom: var(--board-spacing-lg);
  }

  .error-icon {
    color: var(--board-error);
    margin-bottom: var(--board-spacing-lg);
  }

  .welcome-section {
    max-width: 800px;
    margin: 0 auto;
    margin-bottom: var(--board-spacing-xl);
  }

  .header {
    background: linear-gradient(135deg, #00A859 0%, #10B981 100%);
    color: var(--board-white);
    padding: var(--board-spacing-xl);
    text-align: center;
    border-radius: var(--board-border-radius-xl) var(--board-border-radius-xl) 0 0;
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

  .welcome-content {
    background: var(--board-white);
    padding: var(--board-spacing-xl);
    text-align: center;
    border-radius: 0 0 var(--board-border-radius-xl) var(--board-border-radius-xl);
    box-shadow: var(--board-shadow-xl);
  }

  .welcome-content h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-md);
  }

  .welcome-content > p {
    color: var(--board-text-secondary);
    font-size: 1.125rem;
    margin-bottom: var(--board-spacing-xl);
  }

  .security-info {
    display: flex;
    align-items: flex-start;
    gap: var(--board-spacing-md);
    text-align: left;
    background: var(--board-info-50);
    padding: var(--board-spacing-lg);
    border-radius: var(--board-border-radius);
    border: 1px solid var(--board-info-200);
  }

  .info-icon {
    color: var(--board-info-600);
    flex-shrink: 0;
  }

  .info-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--board-info-800);
    margin: 0 0 var(--board-spacing-sm) 0;
  }

  .info-content p {
    color: var(--board-info-700);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
  }

  .error-help {
    text-align: left;
    background: var(--board-gray-50);
    padding: var(--board-spacing-lg);
    border-radius: var(--board-border-radius);
    margin: var(--board-spacing-lg) 0;
  }

  .error-help h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin: 0 0 var(--board-spacing-md) 0;
  }

  .error-help ul {
    color: var(--board-text-secondary);
    line-height: 1.6;
    margin: 0;
    padding-left: var(--board-spacing-lg);
  }

  .error-help li {
    margin-bottom: var(--board-spacing-sm);
  }

  .error-actions {
    display: flex;
    gap: var(--board-spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin: 0 0 var(--board-spacing-md) 0;
  }

  p {
    color: var(--board-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .mfa-setup-container {
      padding: var(--board-spacing-md);
    }

    .welcome-content {
      padding: var(--board-spacing-lg);
    }

    .header {
      padding: var(--board-spacing-lg);
    }

    .logo {
      flex-direction: column;
      gap: var(--board-spacing-sm);
    }

    .security-info {
      flex-direction: column;
      text-align: center;
    }

    .error-actions {
      flex-direction: column;
    }
  }
</style> 