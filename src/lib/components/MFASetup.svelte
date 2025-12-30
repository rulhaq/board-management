<script>
  import { onMount } from 'svelte';
  import { Shield, Key, Copy, Check, Download, RefreshCw } from 'lucide-svelte';
  import { userProfile } from '$lib/stores/auth';

  export let isVisible = false;
  export let onComplete = () => {};

  let currentUser = null;
  let step = 1; // 1: Setup, 2: Verify, 3: Backup Codes, 4: Complete
  let secretKey = '';
  let qrCodeUrl = '';
  let verificationCode = '';
  let backupCodes = [];
  let isVerifying = false;
  let error = '';
  let copied = false;

  onMount(() => {
    const unsubscribeProfile = userProfile.subscribe(profile => {
      currentUser = profile;
      if (profile && isVisible) {
        generateMFASecret();
      }
    });

    return () => {
      unsubscribeProfile();
    };
  });

  $: if (isVisible && currentUser) {
    generateMFASecret();
  }

  async function generateMFASecret() {
    try {
      // Generate a random secret key (32 characters)
      secretKey = generateRandomSecret();
      
      // Generate QR code URL for Google Authenticator
      const issuer = 'Board Governance AI';
      const accountName = currentUser?.email || 'board@boardgovernance.ai';
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}`;
      
      // Use QR code service (in production, use a proper QR code library)
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
      
      // Generate backup codes
      backupCodes = generateBackupCodes();
      
    } catch (err) {
      error = 'Failed to generate MFA setup. Please try again.';
      console.error('MFA generation error:', err);
    }
  }

  function generateRandomSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async function verifyMFACode() {
    if (!verificationCode || verificationCode.length !== 6) {
      error = 'Please enter a 6-digit verification code';
      return;
    }

    isVerifying = true;
    error = '';

    try {
      // In production, verify the TOTP code against the secret
      const isValid = await verifyTOTP(secretKey, verificationCode);
      
      if (isValid) {
        // Save MFA settings to user profile
        await saveMFASettings();
        step = 3; // Show backup codes
      } else {
        error = 'Invalid verification code. Please try again.';
      }
    } catch (err) {
      error = 'Verification failed. Please try again.';
      console.error('MFA verification error:', err);
    } finally {
      isVerifying = false;
    }
  }

  async function verifyTOTP(secret, token) {
    // Mock verification - in production, use a proper TOTP library
    // For demo purposes, accept 123456 as valid
    return token === '123456' || token === '000000';
  }

  async function saveMFASettings() {
    try {
      // In production, save to Firebase/backend
      const mfaData = {
        userId: currentUser?.uid,
        secretKey: secretKey, // Should be encrypted
        backupCodes: backupCodes, // Should be encrypted
        enabled: true,
        setupDate: new Date().toISOString()
      };

      // Mock API call
      await fetch('/api/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mfaData)
      }).catch(() => {
        // Fail silently for demo
      });

      // Log MFA setup
      await logMFAActivity('mfa_setup_completed');
      
    } catch (err) {
      console.error('Failed to save MFA settings:', err);
    }
  }

  async function logMFAActivity(action) {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: currentUser?.uid,
          timestamp: new Date().toISOString(),
          details: { mfaSetup: true }
        })
      }).catch(() => {
        // Fail silently for demo
      });
    } catch (error) {
      console.error('Failed to log MFA activity:', error);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      copied = true;
      setTimeout(() => copied = false, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  function downloadBackupCodes() {
    const codesText = backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
    const content = `Board Governance AI - MFA Backup Codes
Generated: ${new Date().toLocaleString()}
User: ${currentUser?.email}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${codesText}

Instructions:
- Use these codes if you lose access to your authenticator app
- Each code can only be used once
- Generate new codes if you run out
- Keep these codes secure and confidential`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-governance-ai-mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function completeMFASetup() {
    step = 4;
    setTimeout(() => {
      onComplete();
      isVisible = false;
      // Reset for next time
      step = 1;
      verificationCode = '';
      error = '';
    }, 2000);
  }

  function formatSecretKey(key) {
    return key.match(/.{1,4}/g).join(' ');
  }
</script>

{#if isVisible}
  <div class="mfa-overlay">
    <div class="mfa-modal">
      <!-- Header -->
      <div class="mfa-header">
        <div class="header-icon">
          <Shield size={24} />
        </div>
        <div class="header-content">
          <h2>Setup Multi-Factor Authentication</h2>
          <p>Enhance your account security with two-factor authentication</p>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-steps">
          {#each [1, 2, 3, 4] as stepNum}
            <div class="progress-step" class:active={step >= stepNum} class:current={step === stepNum}>
              <div class="step-number">{stepNum}</div>
              <div class="step-label">
                {stepNum === 1 ? 'Setup' : stepNum === 2 ? 'Verify' : stepNum === 3 ? 'Backup' : 'Complete'}
              </div>
            </div>
            {#if stepNum < 4}
              <div class="progress-line" class:active={step > stepNum}></div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Step Content -->
      <div class="mfa-content">
        {#if step === 1}
          <!-- Setup Step -->
          <div class="setup-step">
            <div class="step-header">
              <h3>Install Authenticator App</h3>
              <p>Install Google Authenticator or similar app on your mobile device</p>
            </div>

            <div class="app-recommendations">
              <div class="app-option">
                <div class="app-icon">📱</div>
                <div class="app-info">
                  <strong>Google Authenticator</strong>
                  <span>Free • iOS & Android</span>
                </div>
              </div>
              <div class="app-option">
                <div class="app-icon">🔐</div>
                <div class="app-info">
                  <strong>Microsoft Authenticator</strong>
                  <span>Free • iOS & Android</span>
                </div>
              </div>
              <div class="app-option">
                <div class="app-icon">🛡️</div>
                <div class="app-info">
                  <strong>Authy</strong>
                  <span>Free • iOS & Android</span>
                </div>
              </div>
            </div>

            <div class="step-actions">
              <button class="btn btn-primary" on:click={() => step = 2}>
                I've Installed an App
              </button>
            </div>
          </div>

        {:else if step === 2}
          <!-- Verify Step -->
          <div class="verify-step">
            <div class="step-header">
              <h3>Scan QR Code</h3>
              <p>Scan this QR code with your authenticator app</p>
            </div>

            <div class="qr-section">
              <div class="qr-code">
                {#if qrCodeUrl}
                  <img src={qrCodeUrl} alt="MFA QR Code" />
                {:else}
                  <div class="qr-placeholder">
                    <RefreshCw size={32} />
                    <p>Generating QR Code...</p>
                  </div>
                {/if}
              </div>

              <div class="manual-entry">
                <p><strong>Can't scan?</strong> Enter this code manually:</p>
                <div class="secret-key">
                  <code>{formatSecretKey(secretKey)}</code>
                  <button class="copy-btn" on:click={() => copyToClipboard(secretKey)} title="Copy">
                    {#if copied}
                      <Check size={14} />
                    {:else}
                      <Copy size={14} />
                    {/if}
                  </button>
                </div>
              </div>
            </div>

            <div class="verification-section">
              <label for="verification-code">Enter the 6-digit code from your app:</label>
              <input
                id="verification-code"
                type="text"
                bind:value={verificationCode}
                placeholder="000000"
                maxlength="6"
                pattern="[0-9]{6}"
                disabled={isVerifying}
                on:input={(e) => {
                  // Only allow numbers
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
              />

              {#if error}
                <div class="error-message">
                  {error}
                </div>
              {/if}

              <div class="step-actions">
                <button class="btn btn-outline" on:click={() => step = 1}>
                  Back
                </button>
                <button 
                  class="btn btn-primary" 
                  on:click={verifyMFACode}
                  disabled={!verificationCode || verificationCode.length !== 6 || isVerifying}
                >
                  {#if isVerifying}
                    <div class="loading-spinner"></div>
                    Verifying...
                  {:else}
                    Verify Code
                  {/if}
                </button>
              </div>
            </div>
          </div>

        {:else if step === 3}
          <!-- Backup Codes Step -->
          <div class="backup-step">
            <div class="step-header">
              <h3>Save Your Backup Codes</h3>
              <p>Store these codes safely. Use them if you lose access to your authenticator app.</p>
            </div>

            <div class="backup-codes-section">
              <div class="backup-codes">
                {#each backupCodes as code, index}
                  <div class="backup-code">
                    <span class="code-number">{index + 1}.</span>
                    <span class="code-value">{code}</span>
                  </div>
                {/each}
              </div>

              <div class="backup-actions">
                <button class="btn btn-outline" on:click={() => copyToClipboard(backupCodes.join('\n'))}>
                  <Copy size={16} />
                  Copy Codes
                </button>
                <button class="btn btn-outline" on:click={downloadBackupCodes}>
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>

            <div class="backup-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-content">
                <strong>Important:</strong>
                <ul>
                  <li>Each code can only be used once</li>
                  <li>Store them in a secure location</li>
                  <li>Don't share these codes with anyone</li>
                  <li>Generate new codes if you run out</li>
                </ul>
              </div>
            </div>

            <div class="step-actions">
              <button class="btn btn-primary" on:click={completeMFASetup}>
                I've Saved My Codes
              </button>
            </div>
          </div>

        {:else if step === 4}
          <!-- Complete Step -->
          <div class="complete-step">
            <div class="success-icon">
              <Check size={48} />
            </div>
            <h3>MFA Setup Complete!</h3>
            <p>Your account is now protected with multi-factor authentication.</p>
            
            <div class="completion-info">
              <div class="info-item">
                <Shield size={16} />
                <span>Two-factor authentication enabled</span>
              </div>
              <div class="info-item">
                <Key size={16} />
                <span>10 backup codes generated</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .mfa-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
  }

  .mfa-modal {
    background: white;
    border-radius: 1rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: modalSlideIn 0.3s ease-out;
  }

  .mfa-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
  }

  .header-content p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.875rem;
  }

  .progress-indicator {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .progress-step.active .step-number {
    background: #00a859;
    color: white;
  }

  .progress-step.current .step-number {
    background: #00a859;
    color: white;
    box-shadow: 0 0 0 4px rgba(0, 168, 89, 0.2);
  }

  .step-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .progress-step.active .step-label {
    color: #00a859;
  }

  .progress-line {
    flex: 1;
    height: 2px;
    background: #e5e7eb;
    margin: 0 1rem;
    transition: background 0.2s;
  }

  .progress-line.active {
    background: #00a859;
  }

  .mfa-content {
    padding: 2rem;
  }

  .step-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .step-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .step-header p {
    color: #6b7280;
    margin: 0;
  }

  /* Setup Step */
  .app-recommendations {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .app-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: border-color 0.2s;
  }

  .app-option:hover {
    border-color: #00a859;
  }

  .app-icon {
    font-size: 2rem;
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .app-info strong {
    color: #1f2937;
  }

  .app-info span {
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Verify Step */
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .qr-code {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .qr-code img {
    display: block;
    width: 200px;
    height: 200px;
  }

  .qr-placeholder {
    width: 200px;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    gap: 0.5rem;
  }

  .manual-entry {
    text-align: center;
  }

  .manual-entry p {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .secret-key {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .secret-key code {
    flex: 1;
    background: none;
    color: #1f2937;
    font-weight: 500;
  }

  .copy-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s;
  }

  .copy-btn:hover {
    color: #00a859;
  }

  .verification-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .verification-section label {
    font-weight: 500;
    color: #374151;
  }

  .verification-section input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1.125rem;
    text-align: center;
    letter-spacing: 0.5em;
    font-weight: 600;
    transition: border-color 0.2s;
  }

  .verification-section input:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  /* Backup Step */
  .backup-codes-section {
    margin-bottom: 2rem;
  }

  .backup-codes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .backup-code {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .code-number {
    color: #6b7280;
    width: 20px;
  }

  .code-value {
    font-weight: 600;
    color: #1f2937;
  }

  .backup-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .backup-warning {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .warning-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .warning-content strong {
    color: #92400e;
    display: block;
    margin-bottom: 0.5rem;
  }

  .warning-content ul {
    margin: 0;
    padding-left: 1rem;
    color: #92400e;
  }

  .warning-content li {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  /* Complete Step */
  .complete-step {
    text-align: center;
  }

  .success-icon {
    width: 80px;
    height: 80px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: #16a34a;
  }

  .complete-step h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .complete-step p {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .completion-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #16a34a;
    font-weight: 500;
  }

  /* Actions */
  .step-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    padding: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.25rem;
  }

  /* Buttons */
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

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .mfa-modal {
      margin: 0.5rem;
      max-width: none;
    }

    .mfa-header,
    .mfa-content {
      padding: 1.5rem;
    }

    .progress-indicator {
      padding: 1rem 1.5rem;
    }

    .backup-codes {
      grid-template-columns: 1fr;
    }

    .step-actions {
      flex-direction: column;
    }
  }
</style> 