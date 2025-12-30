<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { logActivity } from '$lib/services/activityLogger';
  import { 
    Settings, Activity, Database, Users, Shield, 
    Save, RefreshCw, AlertCircle, CheckCircle, FileText, Calendar, Vote,
    UserPlus, Edit, Trash2, Search, Download, Lock, Key, HardDrive
  } from 'lucide-svelte';

  $: userProfile = $authStore.profile;
  $: isAdmin = userProfile && userProfile.role === 'admin';

  // Redirect if not admin (only admin, not secretary)
  // Wait for userProfile to load before redirecting
  $: if (userProfile !== undefined && userProfile !== null && userProfile.role !== 'admin') {
    goto('/dashboard');
  }

  let loading = true;
  let saving = false;
  let activeTab = 'users';
  let activities = [];
  let auditLogs = [];
  let users = [];
  let systemStats = {
    totalUsers: 0,
    totalDocuments: 0,
    totalMeetings: 0,
    totalBallots: 0,
    activeUsers: 0,
    storageUsed: 0
  };
  let settings = {
    aiProviders: {
      openai: { enabled: false, apiKey: '', model: 'gpt-4' },
      groq: { enabled: true, apiKey: '', model: 'llama3-8b-8192' },
      ollama: { enabled: false, url: 'http://localhost:11434', model: 'llama2' },
      vllm: { enabled: false, url: 'http://localhost:8000', model: 'default' }
    },
    system: {
      maintenanceMode: false,
      allowRegistrations: true,
      maxFileUploadSize: 10485760
    },
    security: {
      mfaRequired: false,
      passwordExpiry: 90,
      maxLoginAttempts: 5,
      sessionTimeout: 30
    }
  };

  // User Management
  let showUserModal = false;
  let editingUser: any = null;
  let newUser = {
    email: '',
    displayName: '',
    password: '',
    role: 'board_member',
    position: '',
    department: ''
  };
  let userForm = {
    email: '',
    displayName: '',
    password: '',
    role: 'board_member',
    position: '',
    department: ''
  };
  let userSearchTerm = '';

  // Audit Logs
  let auditCategory = 'all';
  let auditSearchTerm = '';

  let notification = { show: false, message: '', type: 'success' };

  onMount(async () => {
    await loadSettings();
    await loadUsers();
    await loadActivities();
    await loadAuditLogs();
    await loadSystemStats();
    loading = false;
  });

  function switchTab(tab: string) {
    activeTab = tab;
    if (tab === 'users') loadUsers();
    if (tab === 'audit') loadAuditLogs();
    if (tab === 'activity') loadActivities();
  }

  async function loadUsers() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        users = data.users || [];
        systemStats.totalUsers = users.length;
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadSystemStats() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const [docsRes, meetingsRes, ballotsRes] = await Promise.all([
        fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/meetings', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/ballots', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      if (docsRes?.ok) {
        const docs = await docsRes.json();
        systemStats.totalDocuments = docs.documents?.length || 0;
      }
      if (meetingsRes?.ok) {
        const meets = await meetingsRes.json();
        systemStats.totalMeetings = meets.meetings?.length || 0;
      }
      if (ballotsRes?.ok) {
        const ballots = await ballotsRes.json();
        systemStats.totalBallots = ballots.ballots?.length || 0;
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  }

  async function loadSettings() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        settings = { ...settings, ...data.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function loadActivities() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/activity?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        activities = data.activities || [];
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function loadAuditLogs() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const url = `/api/admin/audit-logs?limit=100${auditCategory !== 'all' ? `&category=${auditCategory}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        auditLogs = data.logs || [];
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  }

  async function saveSettings() {
    saving = true;
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showNotification('Settings saved successfully!', 'success');
        await logActivity(userProfile.uid, userProfile.displayName, 'Updated system settings', {});
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showNotification('Failed to save settings', 'error');
    } finally {
      saving = false;
    }
  }

  function resetUserForm() {
    userForm = {
      email: '',
      displayName: '',
      password: '',
      role: 'board_member',
      position: '',
      department: ''
    };
  }

  function openUserModal(user: any = null) {
    editingUser = user;
    if (user) {
      userForm = {
        email: user.email || '',
        displayName: user.displayName || '',
        password: '',
        role: user.role || 'board_member',
        position: user.position || '',
        department: user.department || ''
      };
    } else {
      resetUserForm();
    }
    showUserModal = true;
  }

  async function createUserFromForm() {
    if (!userForm.email || !userForm.displayName || !userForm.password) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    saving = true;
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        showNotification('User created successfully!', 'success');
        showUserModal = false;
        resetUserForm();
        await loadUsers();
        await logActivity(userProfile.uid, userProfile.displayName, 'Created user', { email: userForm.email });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to create user', 'error');
    } finally {
      saving = false;
    }
  }

  async function updateUserFromForm() {
    if (!editingUser || !userForm.email || !userForm.displayName) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    saving = true;
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const { id, uid } = editingUser;
      const userId = id || uid;
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, ...userForm })
      });

      if (response.ok) {
        showNotification('User updated successfully!', 'success');
        editingUser = null;
        showUserModal = false;
        resetUserForm();
        await loadUsers();
        await logActivity(userProfile.uid, userProfile.displayName, 'Updated user', { userId });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to update user', 'error');
    } finally {
      saving = false;
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    saving = true;
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showNotification('User deleted successfully!', 'success');
        await loadUsers();
        await logActivity(userProfile.uid, userProfile.displayName, 'Deleted user', { userId });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to delete user', 'error');
    } finally {
      saving = false;
    }
  }

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    notification = { show: true, message, type };
    setTimeout(() => notification.show = false, 3000);
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'secretary': return '#f59e0b';
      case 'board_member': return '#06b6d4';
      default: return '#6b7280';
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log =>
    log.action?.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(auditSearchTerm.toLowerCase())
  );
</script>

<svelte:head>
  <title>Admin Console - Board Governance AI</title>
</svelte:head>

<div class="admin-console">
  <div class="console-header">
    <h1>Admin Console</h1>
    <p>Manage and monitor the Board Governance AI platform</p>
  </div>

  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <div class="console-tabs">
      <button 
        class="tab" 
        class:active={activeTab === 'users'}
        on:click={() => switchTab('users')}
      >
        <Users size={20} />
        <span>User Management</span>
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'settings'}
        on:click={() => switchTab('settings')}
      >
        <Settings size={20} />
        <span>AI & System Settings</span>
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'audit'}
        on:click={() => switchTab('audit')}
      >
        <Shield size={20} />
        <span>Audit Logs</span>
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'activity'}
        on:click={() => switchTab('activity')}
      >
        <Activity size={20} />
        <span>App Activity</span>
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'monitoring'}
        on:click={() => switchTab('monitoring')}
      >
        <Database size={20} />
        <span>System Monitoring</span>
      </button>
    </div>

    <div class="console-content">
      <!-- User Management -->
      {#if activeTab === 'users'}
      <div class="users-section">
        <div class="section-header">
          <h2>User Management</h2>
          <button class="btn-primary" on:click={() => openUserModal()}>
            <UserPlus size={18} />
            Add User
          </button>
        </div>

        <div class="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            bind:value={userSearchTerm}
          />
        </div>

        <div class="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as user}
                <tr>
                  <td>{user.displayName || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <span class="role-badge" style="background: {getRoleColor(user.role)}">
                      {user.role || 'board_member'}
                    </span>
                  </td>
                  <td>{user.position || 'N/A'}</td>
                  <td>
                    <span class="status-badge {user.status || 'active'}">
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" on:click={() => openUserModal(user)}>
                        <Edit size={16} />
                      </button>
                      <button class="btn-icon danger" on:click={() => deleteUser(user.id || user.uid)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="6" class="empty-state">No users found</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if showUserModal}
        <div class="modal-overlay" on:click={() => { showUserModal = false; editingUser = null; resetUserForm(); }}>
          <div class="modal" on:click|stopPropagation>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" bind:value={userForm.email} disabled={!!editingUser} />
            </div>
            <div class="form-group">
              <label>Display Name *</label>
              <input type="text" bind:value={userForm.displayName} />
            </div>
            {#if !editingUser}
            <div class="form-group">
              <label>Password *</label>
              <input type="password" bind:value={userForm.password} />
            </div>
            {/if}
            <div class="form-group">
              <label>Role</label>
              <select bind:value={userForm.role}>
                <option value="board_member">Board Member</option>
                <option value="secretary">Secretary</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div class="form-group">
              <label>Position</label>
              <input type="text" bind:value={userForm.position} />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input type="text" bind:value={userForm.department} />
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" on:click={() => { showUserModal = false; editingUser = null; resetUserForm(); }}>
                Cancel
              </button>
              <button class="btn-primary" on:click={() => editingUser ? updateUserFromForm() : createUserFromForm()} disabled={saving}>
                {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
        {/if}
      </div>
      {/if}

      <!-- AI & System Settings -->
      {#if activeTab === 'settings'}
      <div class="settings-section">
        <h2>AI Provider Configuration</h2>
        
        <div class="settings-grid">
          <div class="setting-card">
            <h3>OpenAI</h3>
            <label>
              <input type="checkbox" bind:checked={settings.aiProviders.openai.enabled} />
              Enable OpenAI
            </label>
            <input type="text" placeholder="API Key" bind:value={settings.aiProviders.openai.apiKey} class="api-key-input" />
            <input type="text" placeholder="Model (e.g., gpt-4)" bind:value={settings.aiProviders.openai.model} />
          </div>

          <div class="setting-card">
            <h3>Groq</h3>
            <label>
              <input type="checkbox" bind:checked={settings.aiProviders.groq.enabled} />
              Enable Groq
            </label>
            <input type="text" placeholder="API Key" bind:value={settings.aiProviders.groq.apiKey} class="api-key-input" />
            <input type="text" placeholder="Model" bind:value={settings.aiProviders.groq.model} />
          </div>

          <div class="setting-card">
            <h3>Ollama</h3>
            <label>
              <input type="checkbox" bind:checked={settings.aiProviders.ollama.enabled} />
              Enable Ollama
            </label>
            <input type="text" placeholder="URL (e.g., http://localhost:11434)" bind:value={settings.aiProviders.ollama.url} />
            <input type="text" placeholder="Model" bind:value={settings.aiProviders.ollama.model} />
          </div>

          <div class="setting-card">
            <h3>VLLM</h3>
            <label>
              <input type="checkbox" bind:checked={settings.aiProviders.vllm.enabled} />
              Enable VLLM
            </label>
            <input type="text" placeholder="URL (e.g., http://localhost:8000)" bind:value={settings.aiProviders.vllm.url} />
            <input type="text" placeholder="Model" bind:value={settings.aiProviders.vllm.model} />
          </div>
        </div>

        <h2>System Settings</h2>
        <div class="system-settings">
          <label>
            <input type="checkbox" bind:checked={settings.system.maintenanceMode} />
            Maintenance Mode
          </label>
          <label>
            <input type="checkbox" bind:checked={settings.system.allowRegistrations} />
            Allow New Registrations
          </label>
          <label>
            Max File Upload Size (bytes):
            <input type="number" bind:value={settings.system.maxFileUploadSize} />
          </label>
        </div>

        <h2>Security Settings</h2>
        <div class="system-settings">
          <label>
            <input type="checkbox" bind:checked={settings.security.mfaRequired} />
            Require Multi-Factor Authentication
          </label>
          <label>
            Password Expiry (days):
            <input type="number" bind:value={settings.security.passwordExpiry} />
          </label>
          <label>
            Max Login Attempts:
            <input type="number" bind:value={settings.security.maxLoginAttempts} />
          </label>
          <label>
            Session Timeout (minutes):
            <input type="number" bind:value={settings.security.sessionTimeout} />
          </label>
        </div>

        <button class="save-btn" on:click={saveSettings} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      {/if}

      <!-- Audit Logs -->
      {#if activeTab === 'audit'}
      <div class="audit-section">
        <div class="section-header">
          <h2>Audit Logs</h2>
          <button class="btn-secondary" on:click={loadAuditLogs}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div class="filters">
          <div class="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search audit logs..." bind:value={auditSearchTerm} />
          </div>
          <select bind:value={auditCategory} on:change={loadAuditLogs}>
            <option value="all">All Categories</option>
            <option value="authentication">Authentication</option>
            <option value="document">Documents</option>
            <option value="voting">Voting</option>
            <option value="meeting">Meetings</option>
            <option value="user_management">User Management</option>
            <option value="security">Security</option>
          </select>
        </div>

        <div class="audit-list">
          {#each filteredAuditLogs as log}
            <div class="audit-item">
              <div class="audit-icon">
                <Activity size={16} />
              </div>
              <div class="audit-details">
                <div class="audit-action">{log.action || 'Unknown Action'}</div>
                <div class="audit-user">{log.userName || 'Unknown'} ({log.userId || 'N/A'})</div>
                <div class="audit-resource">{log.entityType || 'N/A'}: {log.entityId || 'N/A'}</div>
                <div class="audit-time">{formatDate(log.timestamp)}</div>
              </div>
            </div>
          {:else}
            <div class="empty-state">No audit logs found</div>
          {/each}
        </div>
      </div>
      {/if}

      <!-- App Activity -->
      {#if activeTab === 'activity'}
      <div class="activity-section">
        <div class="section-header">
          <h2>Recent App Activity</h2>
          <button class="btn-secondary" on:click={loadActivities}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div class="activity-list">
          {#each activities as activity}
            <div class="activity-item">
              <div class="activity-icon">
                <Activity size={16} />
              </div>
              <div class="activity-details">
                <div class="activity-action">{activity.action}</div>
                <div class="activity-user">{activity.userName} ({activity.userId})</div>
                <div class="activity-time">{formatDate(activity.timestamp)}</div>
              </div>
            </div>
          {:else}
            <div class="empty-state">No activities found</div>
          {/each}
        </div>
      </div>
      {/if}

      <!-- System Monitoring -->
      {#if activeTab === 'monitoring'}
      <div class="monitoring-section">
        <div class="section-header">
          <h2>System Statistics</h2>
          <button class="btn-secondary" on:click={loadSystemStats}>
            <RefreshCw size={18} />
            Refresh Stats
          </button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <Users size={24} />
            </div>
            <div class="stat-content">
              <div class="stat-value">{systemStats.totalUsers}</div>
              <div class="stat-label">Total Users</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <FileText size={24} />
            </div>
            <div class="stat-content">
              <div class="stat-value">{systemStats.totalDocuments}</div>
              <div class="stat-label">Total Documents</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <Calendar size={24} />
            </div>
            <div class="stat-content">
              <div class="stat-value">{systemStats.totalMeetings}</div>
              <div class="stat-label">Total Meetings</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <Vote size={24} />
            </div>
            <div class="stat-content">
              <div class="stat-value">{systemStats.totalBallots}</div>
              <div class="stat-label">Total Ballots</div>
            </div>
          </div>
        </div>
      </div>
      {/if}
    </div>
  {/if}

  {#if notification.show}
    <div class="notification {notification.type}">
      {notification.message}
    </div>
  {/if}
</div>

<style>
  .admin-console {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .console-header {
    margin-bottom: 2rem;
  }

  .console-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .console-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .tab {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    font-size: 1rem;
  }

  .tab:hover {
    color: #00a859;
  }

  .tab.active {
    color: #00a859;
    border-bottom-color: #00a859;
    font-weight: 600;
  }

  .console-content {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: none;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #00a859;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #008a47;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #1f2937;
    border: 1px solid #e5e7eb;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
  }

  .search-bar input {
    flex: 1;
    border: none;
    outline: none;
  }

  .users-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    font-weight: 600;
    color: #1f2937;
    background: #f9fafb;
  }

  .role-badge, .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
  }

  .status-badge.active {
    background: #10b981;
  }

  .status-badge.inactive {
    background: #6b7280;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: #6b7280;
    transition: color 0.2s;
  }

  .btn-icon:hover {
    color: #00a859;
  }

  .btn-icon.danger:hover {
    color: #ef4444;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
  }

  .modal h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #1f2937;
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .setting-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .setting-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #1f2937;
  }

  .setting-card label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .setting-card input[type="text"],
  .setting-card input[type="number"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .api-key-input {
    font-family: monospace;
  }

  .system-settings {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .system-settings label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .save-btn {
    background: #00a859;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .save-btn:hover:not(:disabled) {
    background: #008a47;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .filters select {
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
  }

  .activity-list, .audit-list {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    max-height: 600px;
    overflow-y: auto;
  }

  .activity-item, .audit-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .activity-item:last-child, .audit-item:last-child {
    border-bottom: none;
  }

  .activity-icon, .audit-icon {
    color: #00a859;
  }

  .activity-details, .audit-details {
    flex: 1;
  }

  .activity-action, .audit-action {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .activity-user, .audit-user {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .audit-resource {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 0.25rem;
  }

  .activity-time, .audit-time {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #9ca3af;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    color: #00a859;
    background: #f0fdf4;
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .notification {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 1000;
  }

  .notification.success {
    background: #10b981;
  }

  .notification.error {
    background: #ef4444;
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }
</style>
