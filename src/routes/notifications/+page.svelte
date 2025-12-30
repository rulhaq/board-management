<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    Bell, CheckCircle, AlertTriangle, Info, Calendar,
    FileText, Users, Vote, MessageSquare, Trash2,
    CheckCheck, Settings
  } from 'lucide-svelte';

  let currentUser = null;
  let notifications = [];
  let loading = true;
  let filter = 'all'; // all, unread, read
  let selectedNotifications = [];

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadNotifications();
      }
    });

    return unsubscribe;
  });

  async function loadNotifications() {
    try {
      // Load from Firebase
      await loadNotificationsFromFirebase();
      
      // Mock notifications for demo
      notifications = [
        {
          id: 'notif-1',
          type: 'meeting',
          title: 'Upcoming Board Meeting',
          message: 'Monthly board meeting scheduled for tomorrow at 2:00 PM in Board Room A',
          timestamp: '2024-01-20T14:30:00Z',
          read: false,
          priority: 'high',
          actionUrl: '/meetings',
          createdBy: 'Board Secretary'
        },
        {
          id: 'notif-2',
          type: 'document',
          title: 'New Document Added',
          message: 'Q1 Financial Report has been uploaded by Hassan Al-Kuwari',
          timestamp: '2024-01-20T10:15:00Z',
          read: false,
          priority: 'medium',
          actionUrl: '/documents',
          createdBy: 'Hassan Al-Kuwari'
        },
        {
          id: 'notif-3',
          type: 'vote',
          title: 'Vote Required',
          message: 'Budget Approval vote is now active - your input needed',
          timestamp: '2024-01-19T16:45:00Z',
          read: true,
          priority: 'high',
          actionUrl: '/voting',
          createdBy: 'System'
        },
        {
          id: 'notif-4',
          type: 'member',
          title: 'New Board Member',
          message: 'Dr. Ahmed Al-Thani has joined the board as Director of Research',
          timestamp: '2024-01-18T09:30:00Z',
          read: true,
          priority: 'medium',
          actionUrl: '/members',
          createdBy: 'Admin'
        },
        {
          id: 'notif-5',
          type: 'chat',
          title: 'New Message',
          message: 'You have a new message from Dr. Sarah Mitchell in Strategic Planning channel',
          timestamp: '2024-01-17T14:20:00Z',
          read: false,
          priority: 'low',
          actionUrl: '/chat',
          createdBy: 'Dr. Sarah Mitchell'
        }
      ];
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      loading = false;
    }
  }

  async function loadNotificationsFromFirebase() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        return [];
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response?.ok) {
        const data = await response.json();
        return data.notifications || [];
      }
    } catch (error) {
      console.error('Firebase notifications loading error:', error);
    }
    return [];
  }

  async function markAsRead(notificationId) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      notifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      notifications = notifications.map(n => ({ ...n, read: true }));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      notifications = notifications.filter(n => n.id !== notificationId);
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'meeting': return Calendar;
      case 'document': return FileText;
      case 'vote': return Vote;
      case 'member': return Users;
      case 'chat': return MessageSquare;
      default: return Bell;
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  }

  function handleNotificationClick(notification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }

  $: filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  $: unreadCount = notifications.filter(n => !n.read).length;
</script>

<svelte:head>
  <title>Notifications - Board Governance AI</title>
</svelte:head>

<div class="notifications-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Notifications</h1>
        <p>Stay updated with board activities and important announcements</p>
      </div>
      
      <div class="header-actions">
        {#if unreadCount > 0}
          <button class="btn btn-outline" on:click={markAllAsRead}>
            <CheckCircle size={16} />
            Mark All Read
          </button>
        {/if}
        <button class="btn btn-primary">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-section">
    <div class="stat-card">
      <div class="stat-icon total">
        <Bell size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{notifications.length}</div>
        <div class="stat-label">Total</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon unread">
        <AlertTriangle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{unreadCount}</div>
        <div class="stat-label">Unread</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon read">
        <CheckCircle size={20} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{notifications.length - unreadCount}</div>
        <div class="stat-label">Read</div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-section">
    <div class="filter-tabs">
      <button 
        class="filter-tab"
        class:active={filter === 'all'}
        on:click={() => filter = 'all'}
      >
        All ({notifications.length})
      </button>
      <button 
        class="filter-tab"
        class:active={filter === 'unread'}
        on:click={() => filter = 'unread'}
      >
        Unread ({unreadCount})
      </button>
      <button 
        class="filter-tab"
        class:active={filter === 'read'}
        on:click={() => filter = 'read'}
      >
        Read ({notifications.length - unreadCount})
      </button>
    </div>
  </div>

  <!-- Notifications List -->
  <div class="notifications-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    {:else if filteredNotifications.length === 0}
      <div class="empty-state">
        <Bell size={48} />
        <h3>No notifications</h3>
        <p>
          {#if filter === 'unread'}
            You're all caught up! No unread notifications.
          {:else if filter === 'read'}
            No read notifications to display.
          {:else}
            You don't have any notifications yet.
          {/if}
        </p>
      </div>
    {:else}
      <div class="notifications-list">
        {#each filteredNotifications as notification (notification.id)}
          <div 
            class="notification-item"
            class:unread={!notification.read}
            on:click={() => handleNotificationClick(notification)}
          >
            <div class="notification-icon" style="color: {getPriorityColor(notification.priority)}">
              <svelte:component this={getNotificationIcon(notification.type)} size={20} />
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <h4 class="notification-title">{notification.title}</h4>
                <span class="notification-time">{formatTime(notification.timestamp)}</span>
              </div>
              
              <p class="notification-message">{notification.message}</p>
              
              <div class="notification-meta">
                <span class="notification-sender">From: {notification.createdBy}</span>
                <span class="notification-priority" style="color: {getPriorityColor(notification.priority)}">
                  {notification.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div class="notification-actions">
              {#if !notification.read}
                <button 
                  class="action-btn"
                  on:click|stopPropagation={() => markAsRead(notification.id)}
                  title="Mark as read"
                >
                  <CheckCircle size={16} />
                </button>
              {/if}
              
              <button 
                class="action-btn delete-btn"
                on:click|stopPropagation={() => deleteNotification(notification.id)}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {#if !notification.read}
              <div class="unread-indicator"></div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .notifications-page {
    padding: 2rem;
    max-width: 1200px;
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

  .header-actions {
    display: flex;
    gap: 1rem;
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
    transition: all 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .stat-icon.total {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  }

  .stat-icon.unread {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  }

  .stat-icon.read {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .filters-section {
    margin-bottom: 2rem;
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .filter-tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    text-align: center;
  }

  .filter-tab:hover {
    color: #00a859;
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .filter-tab.active {
    background: #00a859;
    color: white;
    border-color: #00a859;
  }

  .notifications-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
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

  .notifications-list {
    padding: 1rem;
  }

  .notification-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #f3f4f6;
  }

  .notification-item:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
  }

  .notification-item.unread {
    background: #f0f9ff;
    border-color: #bae6fd;
  }

  .notification-item.unread:hover {
    background: #e0f2fe;
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .notification-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .notification-time {
    font-size: 0.75rem;
    color: #9ca3af;
    flex-shrink: 0;
    margin-left: 1rem;
  }

  .notification-message {
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.5;
    margin: 0 0 0.75rem 0;
  }

  .notification-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .notification-sender {
    color: #6b7280;
  }

  .notification-priority {
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: rgba(0, 0, 0, 0.05);
  }

  .notification-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .notification-item:hover .notification-actions {
    opacity: 1;
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

  .delete-btn:hover {
    background: #fef2f2;
    color: #ef4444;
  }

  .unread-indicator {
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 4px;
    background: #00a859;
    border-radius: 50%;
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
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .notifications-page {
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

    .filter-tabs {
      flex-direction: column;
    }

    .notification-item {
      padding: 1rem;
    }

    .notification-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .notification-time {
      margin-left: 0;
      margin-top: 0.25rem;
    }
  }
</style> 