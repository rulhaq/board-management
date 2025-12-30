<script>
  import { createEventDispatcher } from 'svelte';
  import { googleAuthService } from '$lib/auth/googleAuth';

  const dispatch = createEventDispatcher();

  let email = '';
  let loading = false;
  let success = false;
  let error = '';

  async function handlePasswordReset() {
    if (!email || !email.includes('@')) {
      error = 'Please enter a valid email address';
      return;
    }

    if (!auth) {
      error = 'Authentication service not available';
      return;
    }

    loading = true;
    error = '';

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      success = true;
      
      // Log the password reset attempt for audit purposes
      await logPasswordResetAttempt(email);
      
    } catch (err) {
      console.error('Password reset error:', err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          error = 'No account found with this email address. Please contact your administrator.';
          break;
        case 'auth/invalid-email':
          error = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          error = 'Too many password reset attempts. Please try again later.';
          break;
        default:
          error = 'Failed to send password reset email. Please try again or contact support.';
      }
    } finally {
      loading = false;
    }
  }

  async function logPasswordResetAttempt(email) {
    try {
      // Log to audit trail
      const auditData = {
        action: 'password_reset_requested',
        email: email,
        timestamp: new Date().toISOString(),
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent
      };

      // Send to audit logging endpoint
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData)
      });
    } catch (error) {
      console.error('Failed to log password reset attempt:', error);
    }
  }

  async function getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="password-reset-modal">
  <div class="modal-overlay" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">Reset Password</h2>
        <button class="modal-close" on:click={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        {#if success}
          <div class="success-message">
            <div class="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
              </svg>
            </div>
            <h3>Password Reset Email Sent</h3>
            <p>We've sent a password reset link to <strong>{email}</strong>.</p>
            <p>Please check your email and follow the instructions to reset your password.</p>
            <div class="security-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,7.6 15.8,8.6C16.8,9.6 17.4,11 17.4,12.4C17.4,13.8 16.8,15.2 15.8,16.2C14.8,17.2 13.4,17.8 12,17.8C10.6,17.8 9.2,17.2 8.2,16.2C7.2,15.2 6.6,13.8 6.6,12.4C6.6,11 7.2,9.6 8.2,8.6C9.2,7.6 10.6,7 12,7M12,9C11.2,9 10.4,9.3 9.9,9.9C9.3,10.4 9,11.2 9,12C9,12.8 9.3,13.6 9.9,14.1C10.4,14.7 11.2,15 12,15C12.8,15 13.6,14.7 14.1,14.1C14.7,13.6 15,12.8 15,12C15,11.2 14.7,10.4 14.1,9.9C13.6,9.3 12.8,9 12,9Z"/>
              </svg>
              <span>For security reasons, this link will expire in 1 hour.</span>
            </div>
          </div>
        {:else}
          <div class="reset-form">
            <p class="form-description">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form on:submit|preventDefault={handlePasswordReset}>
              {#if error}
                <div class="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  {error}
                </div>
              {/if}

              <div class="form-group">
                <label for="reset-email" class="form-label">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  bind:value={email}
                  class="form-input"
                  placeholder="your.email@boardgovernance.ai"
                  required
                  disabled={loading}
                  autocomplete="email"
                />
              </div>

              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  on:click={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={loading || !email}
                >
                  {#if loading}
                    <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                    </svg>
                    Sending...
                  {:else}
                    Send Reset Link
                  {/if}
                </button>
              </div>
            </form>

            <div class="security-info">
              <h4>Security Information</h4>
              <ul>
                <li>Password reset links expire after 1 hour</li>
                <li>Only one reset link is active at a time</li>
                <li>All password reset attempts are logged for security</li>
                <li>Contact IT support if you don't receive the email</li>
              </ul>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .password-reset-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    position: relative;
    background: var(--board-white);
    border-radius: var(--board-border-radius-lg);
    box-shadow: var(--board-shadow-xl);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--board-spacing-lg);
    border-bottom: 1px solid var(--board-gray-200);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--board-text-secondary);
    cursor: pointer;
    padding: var(--board-spacing-sm);
    border-radius: var(--board-border-radius);
    transition: var(--board-transition);
  }

  .modal-close:hover {
    color: var(--board-text-primary);
    background: var(--board-gray-100);
  }

  .modal-body {
    padding: var(--board-spacing-lg);
  }

  .success-message {
    text-align: center;
    padding: var(--board-spacing-lg) 0;
  }

  .success-icon {
    color: var(--board-success);
    margin-bottom: var(--board-spacing-lg);
  }

  .success-message h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-md);
  }

  .success-message p {
    color: var(--board-text-secondary);
    margin-bottom: var(--board-spacing-md);
    line-height: 1.6;
  }

  .security-notice {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-sm);
    padding: var(--board-spacing-md);
    background: var(--board-warning-50);
    border: 1px solid var(--board-warning-200);
    border-radius: var(--board-border-radius);
    color: var(--board-warning-800);
    font-size: 0.875rem;
    margin-top: var(--board-spacing-lg);
  }

  .form-description {
    color: var(--board-text-secondary);
    margin-bottom: var(--board-spacing-lg);
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: var(--board-spacing-lg);
  }

  .form-label {
    display: block;
    font-weight: 500;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-sm);
  }

  .form-input {
    width: 100%;
    padding: var(--board-spacing-md);
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-border-radius);
    font-size: 1rem;
    transition: var(--board-transition);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--board-primary);
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .form-input:disabled {
    background: var(--board-gray-50);
    color: var(--board-text-secondary);
  }

  .form-actions {
    display: flex;
    gap: var(--board-spacing-md);
    justify-content: flex-end;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-sm);
    padding: var(--board-spacing-md);
    background: var(--board-error-50);
    border: 1px solid var(--board-error-200);
    border-radius: var(--board-border-radius);
    color: var(--board-error-800);
    font-size: 0.875rem;
    margin-bottom: var(--board-spacing-lg);
  }

  .security-info {
    margin-top: var(--board-spacing-xl);
    padding-top: var(--board-spacing-lg);
    border-top: 1px solid var(--board-gray-200);
  }

  .security-info h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-md);
  }

  .security-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .security-info li {
    font-size: 0.875rem;
    color: var(--board-text-secondary);
    margin-bottom: var(--board-spacing-sm);
    padding-left: var(--board-spacing-md);
    position: relative;
  }

  .security-info li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--board-primary);
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      margin: var(--board-spacing-md);
    }

    .modal-header,
    .modal-body {
      padding: var(--board-spacing-md);
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style> 