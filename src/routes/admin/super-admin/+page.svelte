<script>
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
  import { 
    Shield, 
    Database, 
    Users, 
    Activity, 
    Settings, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Server,
    HardDrive,
    Network,
    Lock,
    RefreshCw
  } from 'lucide-svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;

  // Super admin check - only cto@scalovate.com
  $: isSuperAdmin = userProfile?.email === 'cto@scalovate.com';
  
  // Redirect if not super admin
  $: if (userProfile && !isSuperAdmin) {
    goto('/dashboard');
  }

  let stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    totalDocuments: 0,
    storageUsed: 0,
    systemHealth: 'healthy',
    lastBackup: null,
    uptime: '99.9%'
  };

  let recentActivity = [];
  let systemAlerts = [];
  let loading = true;

  onMount(async () => {
    if (!isSuperAdmin) return;
    await loadSuperAdminData();
  });

  async function loadSuperAdminData() {
    loading = true;
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadSystemAlerts()
      ]);
    } catch (error) {
      console.error('Error loading super admin data:', error);
    } finally {
      loading = false;
    }
  }

  async function loadStats() {
    try {
      // Load user stats
      if (db) {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          stats.totalUsers = usersSnapshot.size;
          stats.activeUsers = usersSnapshot.docs.filter(doc => {
            try {
              const data = doc.data();
              const lastActive = data.lastActive?.toDate ? data.lastActive.toDate() : null;
              if (!lastActive) return false;
              const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
              return daysSinceActive < 30;
            } catch {
              return false;
            }
          }).length;
        } catch (error) {
          console.error('Error loading users:', error);
        }

        try {
          const chatsSnapshot = await getDocs(collection(db, 'chats'));
          stats.totalChats = chatsSnapshot.size;
        } catch (error) {
          console.error('Error loading chats:', error);
        }

        try {
          const messagesSnapshot = await getDocs(collection(db, 'messages'));
          stats.totalMessages = messagesSnapshot.size;
        } catch (error) {
          console.error('Error loading messages:', error);
        }

        try {
          const documentsSnapshot = await getDocs(collection(db, 'documents'));
          stats.totalDocuments = documentsSnapshot.size;
        } catch (error) {
          console.error('Error loading documents:', error);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadRecentActivity() {
    try {
      if (db) {
        try {
          // Try to load recent audit logs with orderBy
          const auditQuery = query(
            collection(db, 'auditLogs'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const auditSnapshot = await getDocs(auditQuery);
          recentActivity = auditSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp instanceof Date ? data.timestamp : new Date())
            };
          });
        } catch (orderByError) {
          // If orderBy fails (no index), try without orderBy
          console.warn('orderBy failed, trying without:', orderByError);
          try {
            const auditSnapshot = await getDocs(collection(db, 'auditLogs'));
            recentActivity = auditSnapshot.docs
              .map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp instanceof Date ? data.timestamp : new Date())
                };
              })
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10);
          } catch (error) {
            console.error('Error loading audit logs:', error);
            recentActivity = [];
          }
        }
      } else {
        recentActivity = [];
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
      recentActivity = [];
    }
  }

  async function loadSystemAlerts() {
    try {
      // Check system health
      systemAlerts = [];
      
      // Check database connectivity
      if (!db) {
        systemAlerts.push({
          type: 'error',
          message: 'Database connection not available',
          timestamp: new Date()
        });
      }

      // Check user count
      if (stats.totalUsers === 0) {
        systemAlerts.push({
          type: 'warning',
          message: 'No users found in database',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp instanceof Date 
        ? timestamp 
        : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'N/A';
    }
  }

  function getActionLabel(action) {
    const labels = {
      'user_login': 'User Login',
      'user_logout': 'User Logout',
      'document_upload': 'Document Upload',
      'document_delete': 'Document Delete',
      'message_sent': 'Message Sent',
      'meeting_created': 'Meeting Created',
      'vote_cast': 'Vote Cast',
      'settings_updated': 'Settings Updated'
    };
    return labels[action] || action;
  }
</script>

<svelte:head>
  <title>Super Admin - Board Governance AI</title>
</svelte:head>

{#if !isSuperAdmin}
  <div class="access-denied">
    <Shield size={64} />
    <h1>Access Denied</h1>
    <p>This section is restricted to Super Administrators only.</p>
    <button on:click={() => goto('/dashboard')} class="btn-primary">
      Return to Dashboard
    </button>
  </div>
{:else}
  <div class="super-admin-container">
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <Shield class="title-icon" />
          <div>
            <h1>Super Admin Dashboard</h1>
            <p class="subtitle">System Administration & Monitoring</p>
          </div>
        </div>
        <div class="user-badge">
          <Lock size={16} />
          <span>CTO Access</span>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading system data...</p>
      </div>
    {:else}
      <!-- System Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">
            <Users size={24} />
          </div>
          <div class="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <span class="stat-detail">{stats.activeUsers} active</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon chats">
            <Activity size={24} />
          </div>
          <div class="stat-content">
            <h3>{stats.totalChats}</h3>
            <p>Active Chats</p>
            <span class="stat-detail">{stats.totalMessages} messages</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon documents">
            <Database size={24} />
          </div>
          <div class="stat-content">
            <h3>{stats.totalDocuments}</h3>
            <p>Documents</p>
            <span class="stat-detail">In storage</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon health">
            <CheckCircle size={24} />
          </div>
          <div class="stat-content">
            <h3>{stats.systemHealth}</h3>
            <p>System Health</p>
            <span class="stat-detail">{stats.uptime} uptime</span>
          </div>
        </div>
      </div>

      <!-- System Alerts -->
      {#if systemAlerts.length > 0}
        <div class="alerts-section">
          <h2>
            <AlertTriangle size={20} />
            System Alerts
          </h2>
          <div class="alerts-list">
            {#each systemAlerts as alert}
              <div class="alert-item" class:error={alert.type === 'error'} class:warning={alert.type === 'warning'}>
                {#if alert.type === 'error'}
                  <XCircle size={20} />
                {:else}
                  <AlertTriangle size={20} />
                {/if}
                <div class="alert-content">
                  <p class="alert-message">{alert.message}</p>
                  <span class="alert-time">{formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Recent Activity -->
      <div class="activity-section">
        <h2>
          <Clock size={20} />
          Recent Activity
        </h2>
        <div class="activity-list">
          {#if recentActivity.length === 0}
            <div class="empty-state">
              <Activity size={48} />
              <p>No recent activity</p>
            </div>
          {:else}
            {#each recentActivity as activity}
              <div class="activity-item">
                <div class="activity-icon">
                  <Activity size={16} />
                </div>
                <div class="activity-content">
                  <p class="activity-action">{getActionLabel(activity.action)}</p>
                  <span class="activity-meta">
                    User: {activity.userId || 'Unknown'} • {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <h2>
          <Settings size={20} />
          Quick Actions
        </h2>
        <div class="actions-grid">
          <button class="action-btn" on:click={() => loadSuperAdminData()}>
            <RefreshCw size={20} />
            <span>Refresh Data</span>
          </button>
          <a href="/admin/users" class="action-btn">
            <Users size={20} />
            <span>Manage Users</span>
          </a>
          <a href="/admin/settings" class="action-btn">
            <Settings size={20} />
            <span>System Settings</span>
          </a>
          <a href="/admin/backup" class="action-btn">
            <HardDrive size={20} />
            <span>Backup & Recovery</span>
          </a>
          <a href="/admin/audit" class="action-btn">
            <Activity size={20} />
            <span>Audit Logs</span>
          </a>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .super-admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    color: #6b7280;
  }

  .access-denied h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 1rem 0;
  }

  .header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .title-icon {
    color: #6366f1;
    width: 48px;
    height: 48px;
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .subtitle {
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
  }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon.users {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .stat-icon.chats {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .stat-icon.documents {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
  }

  .stat-icon.health {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  .stat-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .stat-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0.25rem 0;
  }

  .stat-detail {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .alerts-section,
  .activity-section,
  .actions-section {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .alerts-section h2,
  .activity-section h2,
  .actions-section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: #fef3c7;
    border: 1px solid #fcd34d;
  }

  .alert-item.error {
    background: #fee2e2;
    border-color: #f87171;
  }

  .alert-content {
    flex: 1;
  }

  .alert-message {
    font-weight: 500;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .alert-time {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #9ca3af;
  }

  .empty-state p {
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: #f9fafb;
  }

  .activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .activity-content {
    flex: 1;
  }

  .activity-action {
    font-weight: 500;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .activity-meta {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #374151;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
  }

  .action-btn:hover {
    background: #f3f4f6;
    border-color: #6366f1;
    color: #6366f1;
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: #4f46e5;
  }

  @media (max-width: 768px) {
    .super-admin-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

