<script>
  import { goto } from '$app/navigation';
  import { login, user } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle } from 'lucide-svelte';
  import MFASetup from '$lib/components/MFASetup.svelte';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let showPasswordReset = false;
  let showMFA = false;
  let mfaCode = '';
  let mfaError = '';
  let showPassword = false;
  let resetEmail = '';
  let resetLoading = false;
  let resetMessage = '';

  onMount(() => {
    // Redirect if already authenticated
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser) {
        goto('/dashboard');
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    loading = true;
    error = '';

    try {
      await login(email, password);
      // After successful login, check if MFA is required
      // For now, redirect to dashboard
      goto('/dashboard');
    } catch (err) {
      error = err.message || 'Login failed';
      // If MFA is required, show MFA form
      if (err.code === 'mfa-required') {
        showMFA = true;
      }
    } finally {
      loading = false;
    }
  }

  async function handleMFA() {
    if (!mfaCode) {
      mfaError = 'Please enter your MFA code';
      return;
    }

    loading = true;
    mfaError = '';

    try {
      // Verify MFA code
      await verifyMFA(mfaCode);
      goto('/dashboard');
    } catch (err) {
      mfaError = err.message || 'Invalid MFA code';
    } finally {
      loading = false;
    }
  }

  async function handlePasswordReset() {
    if (!resetEmail) {
      resetMessage = 'Please enter your email address';
      return;
    }

    resetLoading = true;
    resetMessage = '';

    try {
      // Send password reset email
      await sendPasswordResetEmail(resetEmail);
      resetMessage = 'Password reset email sent! Check your inbox.';
    } catch (err) {
      resetMessage = err.message || 'Failed to send reset email';
    } finally {
      resetLoading = false;
    }
  }

  async function sendPasswordResetEmail(email) {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const { auth } = await import('$lib/firebase');
    
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    await sendPasswordResetEmail(auth, email);
  }

  async function verifyMFA(code) {
    // Mock implementation - replace with actual MFA verification
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === '123456') {
          resolve();
        } else {
          reject(new Error('Invalid MFA code'));
        }
      }, 1000);
    });
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      if (showMFA) {
        handleMFA();
      } else {
        handleLogin();
      }
    }
  }
</script>

<svelte:head>
  <title>Sign In - Board Governance AI</title>
  <meta name="description" content="Secure access to Board Governance AI for authorized board members and staff." />
</svelte:head>

<div class="login-container">
  <!-- Background Elements -->
  <div class="login-background">
    <div class="bg-pattern"></div>
    <div class="bg-gradient"></div>
  </div>

  <!-- Login Content -->
  <div class="login-content">
    <!-- Header Section -->
    <div class="login-header">
      <div class="logo-section">
        <div class="main-logo">
          <img src="/src/lib/assets/logo.svg" alt="Board Governance AI" class="login-logo" />
        </div>
      </div>
      
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome Back</h1>
        <p class="welcome-subtitle">
          Sign in to access Board Governance AI
        </p>
      </div>
    </div>

    <!-- Login Form -->
    {#if !showMFA && !showPasswordReset}
      <div class="login-form-container">
        <form on:submit|preventDefault={handleLogin} class="login-form">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email" class="form-label">
              <Mail size={16} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="Enter your email address"
              class="form-input"
              disabled={loading}
              on:keypress={handleKeyPress}
              required
            />
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password" class="form-label">
              <Lock size={16} />
              Password
            </label>
            <div class="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                bind:value={password}
                placeholder="Enter your password"
                class="form-input password-input"
                disabled={loading}
                on:keypress={handleKeyPress}
                required
              />
              <button
                type="button"
                class="password-toggle"
                on:click={() => showPassword = !showPassword}
                disabled={loading}
              >
                {#if showPassword}
                  <EyeOff size={16} />
                {:else}
                  <Eye size={16} />
                {/if}
              </button>
            </div>
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          {/if}

          <!-- Submit Button -->
          <button type="submit" class="login-button" disabled={loading}>
            {#if loading}
              <div class="loading-spinner"></div>
              Signing In...
            {:else}
              Sign In
            {/if}
          </button>

          <!-- Forgot Password Link -->
          <div class="form-footer">
            <button type="button" class="forgot-password-link" on:click={() => showPasswordReset = true}>
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- MFA Form -->
    {#if showMFA}
      <div class="mfa-container">
        <div class="mfa-header">
          <Shield size={32} />
          <h2>Two-Factor Authentication</h2>
          <p>Enter the 6-digit code from your authenticator app</p>
        </div>

        <form on:submit|preventDefault={handleMFA} class="mfa-form">
          <div class="form-group">
            <input
              type="text"
              bind:value={mfaCode}
              placeholder="000000"
              class="mfa-input"
              maxlength="6"
              disabled={loading}
              on:keypress={handleKeyPress}
              required
            />
          </div>

          {#if mfaError}
            <div class="error-message">
              <AlertCircle size={16} />
              {mfaError}
            </div>
          {/if}

          <button type="submit" class="login-button" disabled={loading}>
            {#if loading}
              <div class="loading-spinner"></div>
              Verifying...
            {:else}
              Verify Code
            {/if}
          </button>

          <button type="button" class="back-button" on:click={() => showMFA = false}>
            Back to Sign In
          </button>
        </form>
      </div>
    {/if}

    <!-- Password Reset Form -->
    {#if showPasswordReset}
      <div class="reset-container">
        <div class="reset-header">
          <Mail size={32} />
          <h2>Reset Password</h2>
          <p>Enter your email address and we'll send you a reset link</p>
        </div>

        <form on:submit|preventDefault={handlePasswordReset} class="reset-form">
          <div class="form-group">
            <input
              type="email"
              bind:value={resetEmail}
              placeholder="Enter your email address"
              class="form-input"
              disabled={resetLoading}
              required
            />
          </div>

          {#if resetMessage}
            <div class="info-message">
              {resetMessage}
            </div>
          {/if}

          <button type="submit" class="login-button" disabled={resetLoading}>
            {#if resetLoading}
              <div class="loading-spinner"></div>
              Sending...
            {:else}
              Send Reset Link
            {/if}
          </button>

          <button type="button" class="back-button" on:click={() => showPasswordReset = false}>
            Back to Sign In
          </button>
        </form>
      </div>
    {/if}

    <!-- Footer -->
    <div class="login-footer">
      <p class="footer-text">
        © 2024 Board Governance AI. All rights reserved.
      </p>
      <div class="footer-links">
        <a href="/privacy" class="footer-link">Privacy Policy</a>
        <a href="/terms" class="footer-link">Terms of Service</a>
        <a href="/support" class="footer-link">Support</a>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }

  .login-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .bg-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(0, 168, 89, 0.1) 1px, transparent 0);
    background-size: 20px 20px;
  }

  .bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0, 168, 89, 0.05) 0%, rgba(0, 102, 204, 0.05) 100%);
  }

  .login-content {
    position: relative;
    width: 100%;
    max-width: 420px;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .main-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .logo-text {
    text-align: left;
  }

  .brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .brand-tagline {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .welcome-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .welcome-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .login-form-container,
  .mfa-container,
  .reset-container {
    margin-bottom: 2rem;
  }

  .mfa-header,
  .reset-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .mfa-header h2,
  .reset-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0.75rem 0 0.5rem;
  }

  .mfa-header p,
  .reset-header p {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    transition: all 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .password-input-container {
    position: relative;
  }

  .password-input {
    padding-right: 2.5rem;
  }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s;
  }

  .password-toggle:hover {
    color: #374151;
  }

  .mfa-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.5em;
    background: white;
    transition: all 0.2s;
  }

  .mfa-input:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .login-button {
    width: 100%;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .login-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .back-button {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-button:hover {
    color: #374151;
    border-color: #9ca3af;
    background: #f9fafb;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .info-message {
    padding: 0.75rem;
    background: #f0f9ff;
    color: #0369a1;
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .form-footer {
    text-align: center;
  }

  .forgot-password-link {
    background: none;
    border: none;
    color: #00a859;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .forgot-password-link:hover {
    color: #059669;
  }

  .login-footer {
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .footer-text {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.75rem;
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .footer-link {
    font-size: 0.75rem;
    color: #6b7280;
    text-decoration: none;
  }

  .footer-link:hover {
    color: #00a859;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .login-content {
      margin: 1rem;
      padding: 1.5rem;
    }

    .welcome-title {
      font-size: 1.5rem;
    }
  }
</style> 