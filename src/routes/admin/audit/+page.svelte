<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { 
    Search, Filter, Download, Eye, Shield, 
    Calendar, User, FileText, MessageSquare,
    AlertTriangle, CheckCircle, Clock, Activity
  } from 'lucide-svelte';

  let currentUser = null;
  let auditLogs = [];
  let loading = true;
  let searchTerm = '';
  let filterType = 'all';
  let filterDate = 'today';
  let selectedLog = null;
  let showDetails = false;

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'secretary') {
        goto('/dashboard');
        return;
      }
      if (auth.profile) {
        loadAuditLogs();
      }
    });

    return unsubscribe;
  });

  async function loadAuditLogs() {
    try {
      // Load from Firebase
      await loadAuditLogsFromFirebase();
      
      // Mock data for demo
      auditLogs = [
        {
          id: 'audit-1',
          timestamp: '2024-01-20T14:30:00Z',
          action: 'login',
          user: 'Dr. Hassan Al-Kuwari',
          userId: 'user-1',
          details: 'Successful login from 192.168.1.100',
          category: 'authentication',
          severity: 'info',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 'audit-2',
          timestamp: '2024-01-20T14:25:00Z',
          action: 'document_upload',
          user: 'Dr. Sarah Mitchell',
          userId: 'user-2',
          details: 'Uploaded Q1 Financial Report.pdf',
          category: 'document',
          severity: 'info',
          ipAddress: '192.168.1.101',
          resourceId: 'doc-123',
          resourceName: 'Q1 Financial Report.pdf'
        },
        {
          id: 'audit-3',
          timestamp: '2024-01-20T14:20:00Z',
          action: 'vote_cast',
          user: 'Dr. Ahmed Al-Thani',
          userId: 'user-3',
          details: 'Cast vote on Budget Approval ballot',
          category: 'voting',
          severity: 'info',
          ipAddress: '192.168.1.102',
          resourceId: 'vote-456'
        },
        {
          id: 'audit-4',
          timestamp: '2024-01-20T14:15:00Z',
          action: 'user_role_change',
          user: 'Board Secretary',
          userId: 'user-admin',
          details: 'Changed role of Dr. John Smith from board_member to secretary',
          category: 'user_management',
          severity: 'warning',
          ipAddress: '192.168.1.103',
          targetUserId: 'user-4',
          oldValue: 'board_member',
          newValue: 'secretary'
        },
        {
          id: 'audit-5',
          timestamp: '2024-01-20T14:10:00Z',
          action: 'failed_login',
          user: 'Unknown',
          userId: null,
          details: 'Failed login attempt for admin@boardgovernance.ai',
          category: 'security',
          severity: 'warning',
          ipAddress: '10.0.0.50',
          attemptedEmail: 'admin@boardgovernance.ai'
        },
        {
          id: 'audit-6',
          timestamp: '2024-01-20T14:05:00Z',
          action: 'meeting_created',
          user: 'Board Secretary',
          userId: 'user-admin',
          details: 'Created new meeting: Monthly Board Review',
          category: 'meeting',
          severity: 'info',
          ipAddress: '192.168.1.103',
          resourceId: 'meeting-789',
          resourceName: 'Monthly Board Review'
        }
      ];
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      loading = false;
    }
  }

  async function loadAuditLogsFromFirebase() {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        return data.logs || [];
      }
    } catch (error) {
      console.error('Firebase audit logs loading error:', error);
    }
    return [];
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#06b6d4';
      case 'success': return '#10b981';
      default: return '#6b7280';
    }
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'authentication': return Shield;
      case 'document': return FileText;
      case 'voting': return CheckCircle;
      case 'meeting': return Calendar;
      case 'user_management': return User;
      case 'security': return AlertTriangle;
      case 'chat': return MessageSquare;
      default: return Activity;
    }
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function viewDetails(log) {
    selectedLog = log;
    showDetails = true;
  }

  function closeDetails() {
    selectedLog = null;
    showDetails = false;
  }

  async function exportLogs() {
    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: { type: filterType, date: filterDate, search: searchTerm }
        })
      }).catch(() => null);

      if (response?.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Export functionality will be available in production');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export functionality will be available in production');
    }
  }

  $: filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.category === filterType;
    
    const logDate = new Date(log.timestamp);
    const today = new Date();
    const matchesDate = filterDate === 'all' || 
      (filterDate === 'today' && logDate.toDateString() === today.toDateString()) ||
      (filterDate === 'week' && (today - logDate) / (1000 * 60 * 60 * 24) <= 7) ||
      (filterDate === 'month' && (today - logDate) / (1000 * 60 * 60 * 24) <= 30);

    return matchesSearch && matchesType && matchesDate;
  });
</script>

<svelte:head>
  <title>Audit Logs - Admin - Board Governance AI</title>
</svelte:head>

<div class="audit-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Audit Logs</h1>
        <p>Monitor and track all system activities for compliance and security</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-outline" on:click={exportLogs}>
          <Download size={16} />
          Export Logs
        </button>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-section">
    <div class="search-filter">
      <div class="search-input">
        <Search size={16} />
        <input 
          type="text" 
          placeholder="Search logs by user, action, or details..."
          bind:value={searchTerm}
        />
      </div>
    </div>

    <div class="filter-controls">
      <div class="filter-group">
        <label>Category:</label>
        <select bind:value={filterType}>
          <option value="all">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="document">Documents</option>
          <option value="voting">Voting</option>
          <option value="meeting">Meetings</option>
          <option value="user_management">User Management</option>
          <option value="security">Security</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Time Period:</label>
        <select bind:value={filterDate}>
          <option value="today">Today</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-section">
    <div class="stat-card">
      <div class="stat-icon total">
        <Activity size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{filteredLogs.length}</div>
        <div class="stat-label">Total Events</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon warning">
        <AlertTriangle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{filteredLogs.filter(l => l.severity === 'warning').length}</div>
        <div class="stat-label">Warnings</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon error">
        <Shield size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{filteredLogs.filter(l => l.category === 'security').length}</div>
        <div class="stat-label">Security Events</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon success">
        <CheckCircle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{filteredLogs.filter(l => l.severity === 'info').length}</div>
        <div class="stat-label">Normal Activity</div>
      </div>
    </div>
  </div>

  <!-- Audit Logs Table -->
  <div class="logs-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading audit logs...</p>
      </div>
    {:else if filteredLogs.length === 0}
      <div class="empty-state">
        <Activity size={48} />
        <h3>No logs found</h3>
        <p>No audit logs match your current filters.</p>
      </div>
    {:else}
      <div class="logs-table">
        <div class="table-header">
          <div class="header-cell time">Timestamp</div>
          <div class="header-cell user">User</div>
          <div class="header-cell action">Action</div>
          <div class="header-cell category">Category</div>
          <div class="header-cell details">Details</div>
          <div class="header-cell severity">Severity</div>
          <div class="header-cell actions">Actions</div>
        </div>

        {#each filteredLogs as log (log.id)}
          <div class="table-row" class:warning={log.severity === 'warning'} class:error={log.severity === 'error'}>
            <div class="table-cell time">
              <Clock size={14} />
              {formatTimestamp(log.timestamp)}
            </div>
            
            <div class="table-cell user">
              <User size={14} />
              {log.user || 'System'}
            </div>
            
            <div class="table-cell action">
              <svelte:component this={getCategoryIcon(log.category)} size={14} />
              {log.action.replace('_', ' ').toUpperCase()}
            </div>
            
            <div class="table-cell category">
              <span class="category-badge" style="background-color: {getSeverityColor(log.severity)}20; color: {getSeverityColor(log.severity)}">
                {log.category}
              </span>
            </div>
            
            <div class="table-cell details">
              {log.details}
            </div>
            
            <div class="table-cell severity">
              <span 
                class="severity-badge {log.severity}"
                style="background-color: {getSeverityColor(log.severity)}20; color: {getSeverityColor(log.severity)}"
              >
                {log.severity.toUpperCase()}
              </span>
            </div>
            
            <div class="table-cell actions">
              <button class="action-btn" on:click={() => viewDetails(log)} title="View Details">
                <Eye size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Details Modal -->
{#if showDetails && selectedLog}
  <div class="modal-overlay" on:click={closeDetails}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Audit Log Details</h2>
        <button class="modal-close" on:click={closeDetails}>×</button>
      </div>

      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Timestamp:</label>
            <span>{formatTimestamp(selectedLog.timestamp)}</span>
          </div>

          <div class="detail-item">
            <label>User:</label>
            <span>{selectedLog.user || 'System'}</span>
          </div>

          <div class="detail-item">
            <label>Action:</label>
            <span>{selectedLog.action.replace('_', ' ').toUpperCase()}</span>
          </div>

          <div class="detail-item">
            <label>Category:</label>
            <span class="category-badge" style="background-color: {getSeverityColor(selectedLog.severity)}20; color: {getSeverityColor(selectedLog.severity)}">
              {selectedLog.category}
            </span>
          </div>

          <div class="detail-item">
            <label>Severity:</label>
            <span class="severity-badge {selectedLog.severity}" style="background-color: {getSeverityColor(selectedLog.severity)}20; color: {getSeverityColor(selectedLog.severity)}">
              {selectedLog.severity.toUpperCase()}
            </span>
          </div>

          <div class="detail-item">
            <label>IP Address:</label>
            <span>{selectedLog.ipAddress}</span>
          </div>

          {#if selectedLog.resourceId}
            <div class="detail-item">
              <label>Resource ID:</label>
              <span>{selectedLog.resourceId}</span>
            </div>
          {/if}

          {#if selectedLog.resourceName}
            <div class="detail-item">
              <label>Resource Name:</label>
              <span>{selectedLog.resourceName}</span>
            </div>
          {/if}

          <div class="detail-item full-width">
            <label>Details:</label>
            <span>{selectedLog.details}</span>
          </div>

          {#if selectedLog.userAgent}
            <div class="detail-item full-width">
              <label>User Agent:</label>
              <span class="user-agent">{selectedLog.userAgent}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .audit-page {
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

  .filters-section {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .search-filter {
    margin-bottom: 1.5rem;
  }

  .search-input {
    position: relative;
    max-width: 400px;
  }

  .search-input svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .filter-controls {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .filter-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
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
  .stat-icon.warning { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
  .stat-icon.error { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }
  .stat-icon.success { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }

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

  .logs-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .logs-table {
    overflow-x: auto;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 150px 120px 120px 100px 1fr 80px 60px;
    gap: 1rem;
    padding: 1rem 1.5rem;
    align-items: center;
  }

  .table-header {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }

  .table-row {
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
  }

  .table-row:hover {
    background: #f9fafb;
  }

  .table-row.warning {
    background: rgba(245, 158, 11, 0.05);
    border-left: 4px solid #f59e0b;
  }

  .table-row.error {
    background: rgba(239, 68, 68, 0.05);
    border-left: 4px solid #ef4444;
  }

  .table-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .category-badge, .severity-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
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
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
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

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-item label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .detail-item span {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .user-agent {
    word-break: break-all;
    font-family: monospace;
    font-size: 0.75rem;
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
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .audit-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .filter-controls {
      flex-direction: column;
    }

    .stats-section {
      grid-template-columns: 1fr;
    }

    .table-header, .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .table-cell {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 