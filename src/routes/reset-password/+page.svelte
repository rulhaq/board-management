<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { passwordResetService } from '$lib/services/passwordResetService';
  import { Eye, EyeOff, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-svelte';

  let token = '';
  let email = '';
  let newPassword = '';
  let confirmPassword = '';
  let showPassword = false;
  let showConfirmPassword = false;
  let loading = false;
  let verifying = true;
  let error = '';
  let success = false;
  let tokenValid = false;

  // Password strength indicators
  let passwordStrength = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  };

  onMount(async () => {
    // Get token from URL parameters
    token = $page.url.searchParams.get('token') || '';
    
    if (!token) {
      error = 'Invalid password reset link. Please request a new password reset.';
      verifying = false;
      return;
    }

    // Verify the token
    await verifyResetToken();
  });

  async function verifyResetToken() {
    try {
      const result = await passwordResetService.verifyResetToken(token);
      
      if (result.valid) {
        tokenValid = true;
        email = result.email || '';
      } else {
        error = 'Invalid or expired password reset link. Please request a new password reset.';
      }
    } catch (err) {
      error = 'Unable to verify password reset link. Please try again.';
    } finally {
      verifying = false;
    }
  }

  async function handlePasswordReset() {
    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      const result = await passwordResetService.resetPassword(token, newPassword);
      
      if (result.success) {
        success = true;
        // Redirect to login after 3 seconds
        setTimeout(() => {
          goto('/login?reset=success');
        }, 3000);
      } else {
        error = result.message;
      }
    } catch (err) {
      error = 'Failed to reset password. Please try again.';
    } finally {
      loading = false;
    }
  }

  function validateForm() {
    if (!newPassword) {
      error = 'Please enter a new password';
      return false;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return false;
    }

    if (!isPasswordStrong()) {
      error = 'Password does not meet security requirements';
      return false;
    }

    return true;
  }

  function checkPasswordStrength(password) {
    passwordStrength = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
  }

  function isPasswordStrong() {
    return Object.values(passwordStrength).every(requirement => requirement);
  }

  function getPasswordStrengthScore() {
    return Object.values(passwordStrength).filter(requirement => requirement).length;
  }

  function getPasswordStrengthText() {
    const score = getPasswordStrengthScore();
    if (score < 2) return 'Very Weak';
    if (score < 3) return 'Weak';
    if (score < 4) return 'Fair';
    if (score < 5) return 'Good';
    return 'Strong';
  }

  function getPasswordStrengthColor() {
    const score = getPasswordStrengthScore();
    if (score < 2) return '#ef4444';
    if (score < 3) return '#f97316';
    if (score < 4) return '#eab308';
    if (score < 5) return '#22c55e';
    return '#16a34a';
  }

  $: if (newPassword) {
    checkPasswordStrength(newPassword);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handlePasswordReset();
    }
  }
</script>

<svelte:head>
  <title>Reset Password - Board Governance AI</title>
  <meta name="description" content="Reset your password for Board Governance AI" />
</svelte:head>

<div class="reset-container">
  <!-- Background Elements -->
  <div class="reset-background">
    <div class="bg-pattern"></div>
    <div class="bg-gradient"></div>
  </div>

  <!-- Reset Content -->
  <div class="reset-content">
    <!-- Header Section -->
    <div class="reset-header">
      <div class="logo-section">
        <div class="main-logo">
          <div class="logo-icon">SM</div>
          <div class="logo-text">
            <div class="brand-name">Board Governance AI</div>
            <div class="brand-tagline">Board Portal</div>
          </div>
        </div>
      </div>
    </div>

    {#if verifying}
      <!-- Verifying Token -->
      <div class="verifying-state">
        <div class="verifying-icon">
          <Shield size={32} />
        </div>
        <h2>Verifying Reset Link</h2>
        <p>Please wait while we verify your password reset link...</p>
        <div class="loading-spinner"></div>
      </div>

    {:else if success}
      <!-- Success State -->
      <div class="success-state">
        <div class="success-icon">
          <CheckCircle size={48} />
        </div>
        <h2>Password Reset Successful!</h2>
        <p>Your password has been reset successfully.</p>
        <p class="redirect-message">You will be redirected to the login page in a few seconds...</p>
        <div class="success-actions">
          <button class="btn btn-primary" on:click={() => goto('/login?reset=success')}>
            Go to Login
          </button>
        </div>
      </div>

    {:else if !tokenValid}
      <!-- Invalid Token State -->
      <div class="error-state">
        <div class="error-icon">
          <AlertCircle size={48} />
        </div>
        <h2>Invalid Reset Link</h2>
        <p>{error}</p>
        <div class="error-actions">
          <button class="btn btn-outline" on:click={() => goto('/login')}>
            Back to Login
          </button>
          <button class="btn btn-primary" on:click={() => goto('/login?forgot=true')}>
            Request New Reset
          </button>
        </div>
      </div>

    {:else}
      <!-- Password Reset Form -->
      <div class="reset-form-container">
        <div class="form-header">
          <div class="form-icon">
            <Lock size={24} />
          </div>
          <h2>Reset Your Password</h2>
          <p>Enter a new secure password for your account</p>
          {#if email}
            <p class="reset-email">Resetting password for: <strong>{email}</strong></p>
          {/if}
        </div>

        <form on:submit|preventDefault={handlePasswordReset} class="reset-form">
          <!-- New Password Field -->
          <div class="form-group">
            <label for="newPassword" class="form-label">
              <Lock size={16} />
              New Password
            </label>
            <div class="password-input-container">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                bind:value={newPassword}
                placeholder="Enter your new password"
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

          <!-- Password Strength Indicator -->
          {#if newPassword}
            <div class="password-strength">
              <div class="strength-header">
                <span>Password Strength: </span>
                <span class="strength-text" style="color: {getPasswordStrengthColor()}">
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  style="width: {(getPasswordStrengthScore() / 5) * 100}%; background: {getPasswordStrengthColor()}"
                ></div>
              </div>
              <div class="strength-requirements">
                <div class="requirement" class:met={passwordStrength.length}>
                  {#if passwordStrength.length}
                    <CheckCircle size={12} />
                  {:else}
                    <div class="requirement-dot"></div>
                  {/if}
                  At least 8 characters
                </div>
                <div class="requirement" class:met={passwordStrength.lowercase}>
                  {#if passwordStrength.lowercase}
                    <CheckCircle size={12} />
                  {:else}
                    <div class="requirement-dot"></div>
                  {/if}
                  One lowercase letter
                </div>
                <div class="requirement" class:met={passwordStrength.uppercase}>
                  {#if passwordStrength.uppercase}
                    <CheckCircle size={12} />
                  {:else}
                    <div class="requirement-dot"></div>
                  {/if}
                  One uppercase letter
                </div>
                <div class="requirement" class:met={passwordStrength.number}>
                  {#if passwordStrength.number}
                    <CheckCircle size={12} />
                  {:else}
                    <div class="requirement-dot"></div>
                  {/if}
                  One number
                </div>
                <div class="requirement" class:met={passwordStrength.special}>
                  {#if passwordStrength.special}
                    <CheckCircle size={12} />
                  {:else}
                    <div class="requirement-dot"></div>
                  {/if}
                  One special character (@$!%*?&)
                </div>
              </div>
            </div>
          {/if}

          <!-- Confirm Password Field -->
          <div class="form-group">
            <label for="confirmPassword" class="form-label">
              <Lock size={16} />
              Confirm Password
            </label>
            <div class="password-input-container">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                bind:value={confirmPassword}
                placeholder="Confirm your new password"
                class="form-input password-input"
                class:error={confirmPassword && newPassword !== confirmPassword}
                disabled={loading}
                on:keypress={handleKeyPress}
                required
              />
              <button
                type="button"
                class="password-toggle"
                on:click={() => showConfirmPassword = !showConfirmPassword}
                disabled={loading}
              >
                {#if showConfirmPassword}
                  <EyeOff size={16} />
                {:else}
                  <Eye size={16} />
                {/if}
              </button>
            </div>
            {#if confirmPassword && newPassword !== confirmPassword}
              <div class="field-error">
                Passwords do not match
              </div>
            {/if}
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          {/if}

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="reset-button" 
            disabled={loading || !isPasswordStrong() || newPassword !== confirmPassword}
          >
            {#if loading}
              <div class="loading-spinner"></div>
              Resetting Password...
            {:else}
              Reset Password
            {/if}
          </button>

          <!-- Back to Login Link -->
          <div class="form-footer">
            <button type="button" class="back-to-login-link" on:click={() => goto('/login')}>
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Footer -->
    <div class="reset-footer">
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
  .reset-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }

  .reset-background {
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

  .reset-content {
    position: relative;
    width: 100%;
    max-width: 480px;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .reset-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .main-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
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

  .verifying-state,
  .success-state,
  .error-state {
    text-align: center;
    padding: 2rem 0;
  }

  .verifying-icon,
  .success-icon,
  .error-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .verifying-icon {
    background: linear-gradient(135deg, rgba(0, 168, 89, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
    color: #00a859;
  }

  .success-icon {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%);
    color: #22c55e;
  }

  .error-icon {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%);
    color: #ef4444;
  }

  .verifying-state h2,
  .success-state h2,
  .error-state h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .verifying-state p,
  .success-state p,
  .error-state p {
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .redirect-message {
    font-size: 0.875rem;
    color: #00a859;
    font-weight: 500;
  }

  .success-actions,
  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin: 0 auto 1rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .form-header p {
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .reset-email {
    font-size: 0.875rem;
    color: #00a859;
    font-weight: 500;
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

  .form-input.error {
    border-color: #ef4444;
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

  .password-strength {
    margin-top: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .strength-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .strength-text {
    font-weight: 600;
  }

  .strength-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .strength-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .strength-requirements {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    transition: color 0.2s;
  }

  .requirement.met {
    color: #16a34a;
  }

  .requirement-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #d1d5db;
  }

  .field-error {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #ef4444;
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

  .reset-button {
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

  .reset-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .reset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .form-footer {
    text-align: center;
  }

  .back-to-login-link {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
  }

  .back-to-login-link:hover {
    color: #00a859;
  }

  .reset-footer {
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    margin-top: 2rem;
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

  .verifying-state .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 3px;
    margin: 0 auto;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    border: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .btn-outline {
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .btn-outline:hover {
    color: #374151;
    border-color: #9ca3af;
    background: #f9fafb;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .reset-content {
      margin: 1rem;
      padding: 1.5rem;
    }

    .form-header h2 {
      font-size: 1.25rem;
    }

    .strength-requirements {
      grid-template-columns: 1fr;
    }

    .success-actions,
    .error-actions {
      flex-direction: column;
    }
  }
</style> 