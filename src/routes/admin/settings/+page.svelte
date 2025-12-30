<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';

  let loading = true;
  let saving = false;
  let systemSettings = {
    aiProvider: 'groq',
    aiModel: 'mixtral-8x7b-32768',
    maxFileSize: 100, // MB
    sessionTimeout: 30, // minutes
    enableAuditLog: true,
    enableEncryption: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    allowGuestAccess: false,
    emailNotifications: true,
    smsNotifications: false,
    videoConferencing: {
      defaultProvider: 'teams',
      enableRecording: true,
      autoGenerateTranscripts: true
    },
    security: {
      mfaRequired: true,
      passwordExpiry: 90, // days
      maxLoginAttempts: 5,
      ipWhitelisting: false
    }
  };

  $: user = $authStore.user;
  $: userProfile = $authStore.userProfile;

  onMount(async () => {
    // Handle authentication redirect
    const unsubscribe = authStore.subscribe((auth) => {
      if (browser && !auth.loading) {
        if (!auth.user) {
          goto('/landing');
        } else if (auth.userProfile && auth.userProfile.role !== 'admin') {
          goto('/dashboard');
        }
      }
    });

    if (!user || !db) return;
    await loadSystemSettings();
  });

  async function loadSystemSettings() {
    loading = true;
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (settingsDoc.exists()) {
        systemSettings = { ...systemSettings, ...settingsDoc.data() };
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    if (!user || !db) return;
    
    saving = true;
    try {
      await updateDoc(doc(db, 'system', 'settings'), systemSettings);
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>System Settings - Board Governance AI</title>
</svelte:head>

<div class="settings-page">
  <div class="page-header">
    <h1 class="page-title">System Settings</h1>
    <p class="page-description">Configure system-wide settings and preferences</p>
  </div>

  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading system settings...</p>
    </div>
  {:else}
    <div class="settings-container">
      <!-- AI Configuration -->
      <div class="settings-section">
        <h2 class="section-title">AI Configuration</h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="aiProvider" class="setting-label">AI Provider</label>
            <select id="aiProvider" bind:value={systemSettings.aiProvider} class="setting-input">
              <option value="groq">Groq (Llama)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="local">Local LLM</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label for="aiModel" class="setting-label">AI Model</label>
            <select id="aiModel" bind:value={systemSettings.aiModel} class="setting-input">
              {#if systemSettings.aiProvider === 'groq'}
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                <option value="llama2-70b-4096">Llama 2 70B</option>
              {:else if systemSettings.aiProvider === 'openai'}
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              {:else}
                <option value="local-llm">Local LLM</option>
              {/if}
            </select>
          </div>
        </div>
      </div>

      <!-- File Management -->
      <div class="settings-section">
        <h2 class="section-title">File Management</h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="maxFileSize" class="setting-label">Maximum File Size (MB)</label>
            <input 
              id="maxFileSize" 
              type="number" 
              bind:value={systemSettings.maxFileSize} 
              class="setting-input"
              min="1"
              max="500"
            />
          </div>
          
          <div class="setting-item">
            <label for="backupFrequency" class="setting-label">Backup Frequency</label>
            <select id="backupFrequency" bind:value={systemSettings.backupFrequency} class="setting-input">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="settings-section">
        <h2 class="section-title">Security Settings</h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="sessionTimeout" class="setting-label">Session Timeout (minutes)</label>
            <input 
              id="sessionTimeout" 
              type="number" 
              bind:value={systemSettings.sessionTimeout} 
              class="setting-input"
              min="5"
              max="480"
            />
          </div>
          
          <div class="setting-item">
            <label for="maxLoginAttempts" class="setting-label">Max Login Attempts</label>
            <input 
              id="maxLoginAttempts" 
              type="number" 
              bind:value={systemSettings.security.maxLoginAttempts} 
              class="setting-input"
              min="3"
              max="10"
            />
          </div>
          
          <div class="setting-item">
            <label for="passwordExpiry" class="setting-label">Password Expiry (days)</label>
            <input 
              id="passwordExpiry" 
              type="number" 
              bind:value={systemSettings.security.passwordExpiry} 
              class="setting-input"
              min="30"
              max="365"
            />
          </div>
        </div>
        
        <div class="toggle-settings">
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.enableAuditLog}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Enable Audit Logging
            </label>
          </div>
          
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.enableEncryption}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Enable Document Encryption
            </label>
          </div>
          
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.security.mfaRequired}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Require Multi-Factor Authentication
            </label>
          </div>
        </div>
      </div>

      <!-- Video Conferencing -->
      <div class="settings-section">
        <h2 class="section-title">Video Conferencing</h2>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="defaultProvider" class="setting-label">Default Provider</label>
            <select id="defaultProvider" bind:value={systemSettings.videoConferencing.defaultProvider} class="setting-input">
              <option value="teams">Microsoft Teams</option>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
            </select>
          </div>
        </div>
        
        <div class="toggle-settings">
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.videoConferencing.enableRecording}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Enable Meeting Recording
            </label>
          </div>
          
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.videoConferencing.autoGenerateTranscripts}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Auto-Generate Transcripts
            </label>
          </div>
        </div>
      </div>

      <!-- System Maintenance -->
      <div class="settings-section">
        <h2 class="section-title">System Maintenance</h2>
        <div class="toggle-settings">
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.maintenanceMode}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Maintenance Mode
            </label>
          </div>
          
          <div class="toggle-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                bind:checked={systemSettings.emailNotifications}
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Email Notifications
            </label>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button 
          class="btn btn-primary"
          on:click={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-page {
    padding: var(--board-spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: var(--board-spacing-xl);
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-sm);
  }

  .page-description {
    color: var(--board-text-secondary);
    font-size: 1.1rem;
  }

  .settings-container {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-xl);
  }

  .settings-section {
    background: var(--board-white);
    border-radius: var(--board-radius-lg);
    padding: var(--board-spacing-xl);
    box-shadow: var(--board-shadow-sm);
    border: 1px solid var(--board-gray-200);
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-lg);
    padding-bottom: var(--board-spacing-sm);
    border-bottom: 2px solid var(--board-primary-100);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--board-spacing-lg);
    margin-bottom: var(--board-spacing-lg);
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-sm);
  }

  .setting-label {
    font-weight: 500;
    color: var(--board-text-primary);
    font-size: 0.9rem;
  }

  .setting-input {
    padding: var(--board-spacing-md);
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-radius-md);
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .setting-input:focus {
    outline: none;
    border-color: var(--board-primary-500);
    box-shadow: 0 0 0 3px var(--board-primary-100);
  }

  .toggle-settings {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-md);
  }

  .toggle-item {
    display: flex;
    align-items: center;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-md);
    cursor: pointer;
    font-weight: 500;
    color: var(--board-text-primary);
  }

  .toggle-input {
    display: none;
  }

  .toggle-slider {
    width: 50px;
    height: 24px;
    background-color: var(--board-gray-300);
    border-radius: 12px;
    position: relative;
    transition: background-color 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--board-white);
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-input:checked + .toggle-slider {
    background-color: var(--board-primary-500);
  }

  .toggle-input:checked + .toggle-slider::before {
    transform: translateX(26px);
  }

  .settings-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--board-spacing-xl);
    border-top: 1px solid var(--board-gray-200);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--board-spacing-xxl);
    gap: var(--board-spacing-lg);
  }

  .loading-container p {
    color: var(--board-text-secondary);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .settings-page {
      padding: var(--board-spacing-lg);
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 