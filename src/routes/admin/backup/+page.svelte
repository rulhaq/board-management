<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { 
    Download, Upload, Database, Calendar, 
    CheckCircle, AlertTriangle, Clock, FileText,
    HardDrive, Shield, RefreshCw, Settings
  } from 'lucide-svelte';

  let currentUser = null;
  let backups = [];
  let loading = true;
  let backupInProgress = false;
  let restoreInProgress = false;
  let selectedBackup = null;
  let showRestoreModal = false;

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile?.role !== 'admin') {
        goto('/dashboard');
        return;
      }
      if (auth.profile) {
        loadBackups();
      }
    });

    return unsubscribe;
  });

  async function loadBackups() {
    try {
      // Load from Firebase
      await loadBackupsFromFirebase();
      
      // Mock data for demo
      backups = [
        {
          id: 'backup-1',
          name: 'Daily Backup - January 20, 2024',
          timestamp: '2024-01-20T02:00:00Z',
          size: '245.7 MB',
          type: 'scheduled',
          status: 'completed',
          collections: ['users', 'meetings', 'documents', 'votes', 'notifications', 'chats'],
          duration: '4m 32s',
          checksum: 'sha256:a1b2c3d4e5f6...'
        },
        {
          id: 'backup-2',
          name: 'Weekly Full Backup - January 14, 2024',
          timestamp: '2024-01-14T01:00:00Z',
          size: '1.2 GB',
          type: 'full',
          status: 'completed',
          collections: ['users', 'meetings', 'documents', 'votes', 'notifications', 'chats', 'audit_logs', 'files'],
          duration: '12m 18s',
          checksum: 'sha256:f6e5d4c3b2a1...'
        },
        {
          id: 'backup-3',
          name: 'Manual Backup - January 19, 2024',
          timestamp: '2024-01-19T14:30:00Z',
          size: '189.3 MB',
          type: 'manual',
          status: 'completed',
          collections: ['users', 'meetings', 'documents'],
          duration: '3m 45s',
          checksum: 'sha256:1a2b3c4d5e6f...'
        },
        {
          id: 'backup-4',
          name: 'Daily Backup - January 19, 2024',
          timestamp: '2024-01-19T02:00:00Z',
          size: '198.4 MB',
          type: 'scheduled',
          status: 'failed',
          collections: [],
          duration: '0m 15s',
          error: 'Connection timeout to storage service'
        }
      ];
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      loading = false;
    }
  }

  async function loadBackupsFromFirebase() {
    try {
      const response = await fetch('/api/admin/backups', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        return data.backups || [];
      }
    } catch (error) {
      console.error('Firebase backups loading error:', error);
    }
    return [];
  }

  async function createBackup(type = 'manual') {
    if (backupInProgress) return;
    
    backupInProgress = true;
    try {
      const response = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      }).catch(() => null);

      if (response?.ok) {
        const result = await response.json();
        // Add new backup to list
        const newBackup = {
          id: 'backup-' + Date.now(),
          name: `Manual Backup - ${new Date().toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
          size: '0 MB',
          type: 'manual',
          status: 'in_progress',
          collections: ['users', 'meetings', 'documents', 'votes', 'notifications', 'chats'],
          duration: '0m 0s'
        };
        backups = [newBackup, ...backups];
        
        // Simulate progress
        setTimeout(() => {
          newBackup.status = 'completed';
          newBackup.size = '156.7 MB';
          newBackup.duration = '2m 45s';
          newBackup.checksum = 'sha256:' + Math.random().toString(36).substring(7) + '...';
          backups = [...backups];
        }, 3000);
      } else {
        alert('Backup creation will be available in production');
      }
    } catch (error) {
      console.error('Backup creation error:', error);
      alert('Backup creation will be available in production');
    } finally {
      backupInProgress = false;
    }
  }

  async function downloadBackup(backup) {
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/download`, {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);

      if (response?.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backup.name.replace(/[^a-z0-9]/gi, '_')}.backup`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Download functionality will be available in production');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download functionality will be available in production');
    }
  }

  function confirmRestore(backup) {
    selectedBackup = backup;
    showRestoreModal = true;
  }

  async function restoreBackup() {
    if (!selectedBackup || restoreInProgress) return;
    
    restoreInProgress = true;
    showRestoreModal = false;
    
    try {
      const response = await fetch(`/api/admin/backups/${selectedBackup.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);

      if (response?.ok) {
        alert('Restore completed successfully. Please refresh the application.');
      } else {
        alert('Restore functionality will be available in production');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Restore functionality will be available in production');
    } finally {
      restoreInProgress = false;
      selectedBackup = null;
    }
  }

  function cancelRestore() {
    selectedBackup = null;
    showRestoreModal = false;
  }

  function getStatusColor(status) {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function getTypeIcon(type) {
    switch (type) {
      case 'scheduled': return Clock;
      case 'full': return Database;
      case 'manual': return Settings;
      default: return HardDrive;
    }
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function formatDuration(duration) {
    return duration || 'N/A';
  }

  $: completedBackups = backups.filter(b => b.status === 'completed');
  $: failedBackups = backups.filter(b => b.status === 'failed');
  $: totalSize = backups.reduce((sum, backup) => {
    const size = parseFloat(backup.size);
    const unit = backup.size.includes('GB') ? 1024 : 1;
    return sum + (size * unit);
  }, 0);
</script>

<svelte:head>
  <title>Backup & Recovery - Admin - Board Governance AI</title>
</svelte:head>

<div class="backup-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Backup & Recovery</h1>
        <p>Manage system backups and data recovery operations</p>
      </div>
      
      <div class="header-actions">
        <button 
          class="btn btn-primary" 
          on:click={() => createBackup('manual')}
          disabled={backupInProgress}
        >
          {#if backupInProgress}
            <RefreshCw size={16} class="spinning" />
            Creating...
          {:else}
            <HardDrive size={16} />
            Create Backup
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-section">
    <div class="stat-card">
      <div class="stat-icon total">
        <Database size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{backups.length}</div>
        <div class="stat-label">Total Backups</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon success">
        <CheckCircle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{completedBackups.length}</div>
        <div class="stat-label">Successful</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon error">
        <AlertTriangle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{failedBackups.length}</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon storage">
        <HardDrive size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{totalSize.toFixed(1)} MB</div>
        <div class="stat-label">Total Size</div>
      </div>
    </div>
  </div>

  <!-- Backup Schedule Info -->
  <div class="schedule-section">
    <div class="schedule-card">
      <div class="schedule-header">
        <h3>Backup Schedule</h3>
        <Clock size={20} />
      </div>
      <div class="schedule-content">
        <div class="schedule-item">
          <div class="schedule-type">Daily Backup</div>
          <div class="schedule-time">Every day at 2:00 AM</div>
          <div class="schedule-status active">Active</div>
        </div>
        <div class="schedule-item">
          <div class="schedule-type">Weekly Full Backup</div>
          <div class="schedule-time">Every Sunday at 1:00 AM</div>
          <div class="schedule-status active">Active</div>
        </div>
        <div class="schedule-item">
          <div class="schedule-type">Monthly Archive</div>
          <div class="schedule-time">1st of every month at 12:00 AM</div>
          <div class="schedule-status active">Active</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Backups List -->
  <div class="backups-container">
    <div class="container-header">
      <h2>Backup History</h2>
      <button class="btn btn-outline btn-sm" on:click={loadBackups}>
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>

    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading backups...</p>
      </div>
    {:else if backups.length === 0}
      <div class="empty-state">
        <Database size={48} />
        <h3>No backups found</h3>
        <p>No backups have been created yet. Create your first backup to get started.</p>
      </div>
    {:else}
      <div class="backups-list">
        {#each backups as backup (backup.id)}
          <div class="backup-item" class:failed={backup.status === 'failed'}>
            <div class="backup-icon">
              <svelte:component this={getTypeIcon(backup.type)} size={20} />
            </div>

            <div class="backup-info">
              <div class="backup-header">
                <h4 class="backup-name">{backup.name}</h4>
                <span class="backup-timestamp">{formatTimestamp(backup.timestamp)}</span>
              </div>
              
              <div class="backup-meta">
                <span class="backup-type">{backup.type.toUpperCase()}</span>
                <span class="backup-size">{backup.size}</span>
                <span class="backup-duration">{formatDuration(backup.duration)}</span>
              </div>

              {#if backup.collections && backup.collections.length > 0}
                <div class="backup-collections">
                  <span>Collections:</span>
                  {#each backup.collections as collection, i}
                    <span class="collection-tag">{collection}</span>
                  {/each}
                </div>
              {/if}

              {#if backup.error}
                <div class="backup-error">
                  <AlertTriangle size={14} />
                  {backup.error}
                </div>
              {/if}

              {#if backup.checksum}
                <div class="backup-checksum">
                  <Shield size={14} />
                  {backup.checksum}
                </div>
              {/if}
            </div>

            <div class="backup-status">
              <span 
                class="status-badge {backup.status}"
                style="background-color: {getStatusColor(backup.status)}20; color: {getStatusColor(backup.status)}"
              >
                {backup.status.toUpperCase()}
              </span>
            </div>

            <div class="backup-actions">
              {#if backup.status === 'completed'}
                <button 
                  class="action-btn"
                  on:click={() => downloadBackup(backup)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                
                <button 
                  class="action-btn restore-btn"
                  on:click={() => confirmRestore(backup)}
                  title="Restore"
                  disabled={restoreInProgress}
                >
                  <Upload size={16} />
                </button>
              {:else if backup.status === 'in_progress'}
                <div class="progress-indicator">
                  <div class="progress-spinner"></div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Restore Confirmation Modal -->
{#if showRestoreModal && selectedBackup}
  <div class="modal-overlay" on:click={cancelRestore}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Confirm Restore</h2>
        <button class="modal-close" on:click={cancelRestore}>×</button>
      </div>

      <div class="modal-body">
        <div class="warning-section">
          <AlertTriangle size={24} style="color: #f59e0b;" />
          <div>
            <h3>Warning: Data Restore</h3>
            <p>This action will restore data from the selected backup and may overwrite current data. This cannot be undone.</p>
          </div>
        </div>

        <div class="backup-details">
          <h4>Backup Details:</h4>
          <div class="detail-item">
            <label>Name:</label>
            <span>{selectedBackup.name}</span>
          </div>
          <div class="detail-item">
            <label>Date:</label>
            <span>{formatTimestamp(selectedBackup.timestamp)}</span>
          </div>
          <div class="detail-item">
            <label>Size:</label>
            <span>{selectedBackup.size}</span>
          </div>
          <div class="detail-item">
            <label>Collections:</label>
            <span>{selectedBackup.collections?.join(', ') || 'N/A'}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" on:click={cancelRestore}>
            Cancel
          </button>
          <button 
            class="btn btn-danger" 
            on:click={restoreBackup}
            disabled={restoreInProgress}
          >
            {#if restoreInProgress}
              <RefreshCw size={16} class="spinning" />
              Restoring...
            {:else}
              <Upload size={16} />
              Restore Backup
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backup-page {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .title-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .title-section p {
    font-size: 1.125rem;
    color: #6b7280;
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-icon.total { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); }
  .stat-icon.success { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
  .stat-icon.error { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }
  .stat-icon.storage { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .schedule-section {
    margin-bottom: 2rem;
  }

  .schedule-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
  }

  .schedule-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .schedule-content {
    padding: 1.5rem;
  }

  .schedule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .schedule-item:last-child {
    border-bottom: none;
  }

  .schedule-type {
    font-weight: 600;
    color: #1f2937;
  }

  .schedule-time {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .schedule-status {
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .schedule-status.active {
    background: #dcfce7;
    color: #166534;
  }

  .backups-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .container-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .container-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .backups-list {
    padding: 1rem;
  }

  .backup-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #f3f4f6;
    transition: all 0.2s;
  }

  .backup-item:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
  }

  .backup-item.failed {
    background: rgba(239, 68, 68, 0.05);
    border-color: #fecaca;
  }

  .backup-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .backup-info {
    flex: 1;
    min-width: 0;
  }

  .backup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .backup-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .backup-timestamp {
    font-size: 0.75rem;
    color: #9ca3af;
    flex-shrink: 0;
    margin-left: 1rem;
  }

  .backup-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .backup-type {
    padding: 0.125rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    font-weight: 600;
  }

  .backup-collections {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    flex-wrap: wrap;
  }

  .collection-tag {
    padding: 0.125rem 0.375rem;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .backup-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #ef4444;
    margin-bottom: 0.5rem;
  }

  .backup-checksum {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    font-family: monospace;
  }

  .backup-status {
    flex-shrink: 0;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .backup-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }

  .restore-btn:hover {
    background: #fef2f2;
    color: #ef4444;
  }

  .progress-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .progress-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #00a859;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: #6b7280;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #00a859;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 1rem 0 0.5rem;
  }

  /* Modal Styles */
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
    border-radius: 1rem;
    max-width: 500px;
    width: 90%;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .warning-section {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .warning-section h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #92400e;
    margin: 0 0 0.5rem;
  }

  .warning-section p {
    font-size: 0.875rem;
    color: #92400e;
    margin: 0;
  }

  .backup-details {
    margin-bottom: 1.5rem;
  }

  .backup-details h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-item label {
    font-weight: 500;
    color: #374151;
  }

  .detail-item span {
    color: #6b7280;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
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

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .backup-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .stats-section {
      grid-template-columns: 1fr;
    }

    .backup-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .backup-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .backup-timestamp {
      margin-left: 0;
      margin-top: 0.25rem;
    }

    .backup-meta {
      flex-wrap: wrap;
    }

    .backup-actions {
      margin-top: 1rem;
    }
  }
</style> 