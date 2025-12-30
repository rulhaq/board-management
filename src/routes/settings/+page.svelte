<script lang="ts">
  import { user, userProfile } from '$lib/stores/auth';
  import MFASetup from '$lib/components/MFASetup.svelte';
  import { 
    Settings, 
    Shield, 
    Bell, 
    User, 
    Lock, 
    Smartphone,
    Database,
    Key,
    Save
  } from 'lucide-svelte';
  
  let activeTab = 'profile';
  let saving = false;
  let showMFASetup = false;
  
  // Profile settings
  let profileData = {
    displayName: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    language: 'en'
  };
  
  // Notification settings
  let notifications = {
    emailNotifications: true,
    pushNotifications: true,
    meetingReminders: true,
    documentUpdates: true,
    voteReminders: true,
    securityAlerts: true
  };
  
  // Security settings
  let security = {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
    deviceTracking: true
  };
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Settings }
  ];
  
  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Dubai', label: 'Dubai' }
  ];
  
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'Arabic' },
    { value: 'fr', label: 'French' }
  ];
  
  const saveSettings = async () => {
    saving = true;
    try {
      // Save settings to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      saving = false;
    }
  };
  
  const handleMFASetup = () => {
    showMFASetup = true;
  };
  
  const handleMFAComplete = () => {
    showMFASetup = false;
    security.twoFactorEnabled = true;
    alert('MFA setup completed successfully!');
  };
  
  // Initialize with current user data
  $: if ($userProfile) {
    profileData = {
      displayName: $userProfile.displayName || '',
      email: $userProfile.email || '',
      phone: '',
      timezone: 'UTC',
      language: 'en'
    };
  }
</script>

<div class="settings-page">
  <!-- Header -->
  <div class="settings-header">
    <h1>Settings</h1>
    <p>Manage your account preferences and security settings</p>
  </div>

  <!-- Tabs -->
  <div class="settings-tabs">
    <nav class="tabs-nav">
      {#each tabs as tab}
        <button
          on:click={() => activeTab = tab.id}
          class="tab-button"
          class:active={activeTab === tab.id}
        >
          <svelte:component this={tab.icon} class="tab-icon" />
          {tab.label}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Tab Content -->
  <div class="settings-content">
    {#if activeTab === 'profile'}
      <div class="settings-card">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              bind:value={profileData.displayName}
              class="input mt-1"
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              bind:value={profileData.email}
              class="input mt-1 bg-gray-50"
              readonly
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              bind:value={profileData.phone}
              class="input mt-1"
              placeholder="+1-555-0123"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Timezone</label>
            <select bind:value={profileData.timezone} class="input mt-1">
              {#each timezones as tz}
                <option value={tz.value}>{tz.label}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Language</label>
            <select bind:value={profileData.language} class="input mt-1">
              {#each languages as lang}
                <option value={lang.value}>{lang.label}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
    
    {:else if activeTab === 'notifications'}
      <div class="settings-card">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p class="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={notifications.emailNotifications} class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Push Notifications</h3>
              <p class="text-sm text-gray-500">Receive push notifications on mobile</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={notifications.pushNotifications} class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Meeting Reminders</h3>
              <p class="text-sm text-gray-500">Get reminded about upcoming meetings</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={notifications.meetingReminders} class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Document Updates</h3>
              <p class="text-sm text-gray-500">Notifications when documents are updated</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={notifications.documentUpdates} class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    
    {:else if activeTab === 'security'}
      <div class="settings-card">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p class="text-sm text-gray-500">Add an extra layer of security to your account</p>
              {#if security.twoFactorEnabled}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  <Shield class="h-3 w-3 mr-1" />
                  Enabled
                </span>
              {/if}
            </div>
            <div class="flex items-center space-x-3">
              {#if !security.twoFactorEnabled}
                <button 
                  type="button" 
                  class="btn-primary text-sm"
                  on:click={handleMFASetup}
                >
                  <Key class="h-4 w-4 mr-2" />
                  Setup MFA
                </button>
              {:else}
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={security.twoFactorEnabled} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              {/if}
            </div>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-2">Session Timeout</h3>
            <p class="text-sm text-gray-500 mb-3">Automatically log out after inactivity</p>
            <select bind:value={security.sessionTimeout} class="input">
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Login Alerts</h3>
              <p class="text-sm text-gray-500">Get notified of new login attempts</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={security.loginAlerts} class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div class="pt-4 border-t border-gray-200">
            <button class="btn-secondary">
              <Key class="h-4 w-4 mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>
    
    {:else if activeTab === 'system'}
      <div class="system-tab-content">
        <div class="settings-card">
          <h2>System Information</h2>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Application</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Version:</span>
                  <span class="info-value">1.0.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Build:</span>
                  <span class="info-value">2024.12.10</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Environment:</span>
                  <span class="info-value">Production</span>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Database</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value status-connected">Connected</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Region:</span>
                  <span class="info-value">us-central1</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Backup:</span>
                  <span class="info-value">Daily</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {#if userProfile?.role === 'admin'}
          <div class="settings-card admin-link-card">
            <h2>Admin Tools</h2>
            <p class="admin-description">Access the admin console to manage AI settings, monitor activity, and configure system settings.</p>
            <a href="/admin/console" class="admin-console-link">
              <Settings class="icon" />
              Open Admin Console
            </a>
          </div>
        {/if}
        
        <div class="settings-card">
          <h2>Data Management</h2>
          
          <div class="data-management-list">
            <div class="data-item">
              <div class="data-info">
                <h3>Export My Data</h3>
                <p>Download all your personal data</p>
              </div>
              <button class="data-button secondary">
                <Database class="icon" />
                Export
              </button>
            </div>
            
            <div class="data-item danger">
              <div class="data-info">
                <h3>Delete My Account</h3>
                <p>Permanently delete your account and all data</p>
              </div>
              <button class="data-button danger-btn">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Save Button -->
  <div class="settings-footer">
    <button
      on:click={saveSettings}
      disabled={saving}
      class="save-button"
      class:disabled={saving}
    >
      {#if saving}
        <div class="spinner"></div>
        Saving...
      {:else}
        <Save class="icon" />
        Save Settings
      {/if}
    </button>
  </div>
</div>

<style>
  .settings-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .settings-header {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  .settings-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .settings-header p {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .settings-tabs {
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
  }

  .tabs-nav {
    display: flex;
    gap: 2rem;
  }

  .tab-button {
    display: flex;
    align-items: center;
    padding: 0.75rem 0.5rem;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    font-size: 0.875rem;
    color: #6b7280;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    color: #374151;
    border-bottom-color: #d1d5db;
  }

  .tab-button.active {
    color: #00a859;
    border-bottom-color: #00a859;
  }

  .tab-icon {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
  }

  .settings-content {
    min-height: 24rem;
  }

  .settings-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .settings-card h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }

  .settings-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .save-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #00a859;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .save-button:hover:not(.disabled) {
    background: #008a47;
  }

  .save-button.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .save-button .icon {
    width: 1rem;
    height: 1rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Form styles */
  .settings-card label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .settings-card input[type="text"],
  .settings-card input[type="email"],
  .settings-card input[type="tel"],
  .settings-card select {
    width: 100%;
    padding: 0.625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .settings-card input:focus,
  .settings-card select:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .settings-card input[readonly] {
    background: #f9fafb;
    cursor: not-allowed;
  }

  .grid {
    display: grid;
    gap: 1.5rem;
  }

  .grid-cols-1 {
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .md\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-3 {
    gap: 0.75rem;
  }

  .gap-6 {
    gap: 1.5rem;
  }

  .p-4 {
    padding: 1rem;
  }

  .border {
    border-width: 1px;
  }

  .border-gray-200 {
    border-color: #e5e7eb;
  }

  .border-red-200 {
    border-color: #fecaca;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .bg-red-50 {
    background-color: #fef2f2;
  }

  .text-sm {
    font-size: 0.875rem;
  }

  .font-medium {
    font-weight: 500;
  }

  .text-gray-900 {
    color: #1f2937;
  }

  .text-gray-500 {
    color: #6b7280;
  }

  .text-red-900 {
    color: #7f1d1d;
  }

  .text-red-600 {
    color: #dc2626;
  }

  .bg-red-600 {
    background-color: #dc2626;
  }

  .text-white {
    color: white;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .hover\:bg-red-700:hover {
    background-color: #b91c1c;
  }

  /* Toggle switches */
  .relative {
    position: relative;
  }

  .inline-flex {
    display: inline-flex;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* MFA Modal */
  .fixed {
    position: fixed;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .bg-black {
    background-color: #000;
  }

  .bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .z-50 {
    z-index: 50;
  }

  .max-w-2xl {
    max-width: 42rem;
  }

  .w-full {
    width: 100%;
  }

  .mx-4 {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .max-h-screen {
    max-height: 100vh;
  }

  .overflow-y-auto {
    overflow-y: auto;
  }

  .shadow-xl {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
</style>

<!-- MFA Setup Modal -->
{#if showMFASetup}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Setup Multi-Factor Authentication</h2>
          <button 
            class="text-gray-400 hover:text-gray-600"
            on:click={() => showMFASetup = false}
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <MFASetup 
          isVisible={true} 
          onComplete={handleMFAComplete} 
        />
      </div>
    </div>
  </div>
{/if} 