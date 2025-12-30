<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    documents, meetings, votes, users,
    upcomingMeetings, activeVotes, recentDocuments, unreadNotificationsCount
  } from '$lib/stores/firebaseStore';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { 
    FileText, Calendar, Users, Vote, TrendingUp, Bell,
    Plus, ChevronDown, ArrowRight, Clock, CheckCircle,
    AlertCircle, BarChart3, MessageSquare, Settings
  } from 'lucide-svelte';

  let currentUser = null;
  let loading = true;
  let showQuickActions = false;
  let notifications = [];
  let recentActivity = [];
  
  let dashboardStats = {
    totalDocuments: 156,
    upcomingMeetings: 3,
    activeVotes: 2,
    boardMembers: 8,
    pendingActions: 5,
    completedMeetings: 12
  };

  let quickAccessItems = [
    {
      title: 'Board Minutes',
      description: 'Access meeting minutes and records',
      icon: FileText,
      route: '/documents?category=board-minutes',
      count: 24,
      color: 'blue'
    },
    {
      title: 'Documents',
      description: 'Manage board documents and files',
      icon: FileText,
      route: '/documents',
      count: 156,
      color: 'green'
    },
    {
      title: 'Voting',
      description: 'Participate in board decisions',
      icon: Vote,
      route: '/voting',
      count: 2,
      color: 'purple'
    },
    {
      title: 'Members',
      description: 'View board member profiles',
      icon: Users,
      route: '/members',
      count: 8,
      color: 'orange'
    }
  ];

  let quickActions = [
    {
      title: 'Schedule Meeting',
      description: 'Create a new board meeting',
      icon: Calendar,
      action: () => goto('/meetings?create=true')
    },
    {
      title: 'Create Vote',
      description: 'Start a new voting ballot',
      icon: Vote,
      action: () => goto('/voting?create=true')
    },
    {
      title: 'Start Chat',
      description: 'Begin team discussion',
      icon: MessageSquare,
      action: () => goto('/chat')
    },
    {
      title: 'Upload Document',
      description: 'Add new board document',
      icon: FileText,
      action: () => goto('/documents?upload=true')
    }
  ];

  onMount(async () => {
    const unsubscribe = authStore.subscribe((auth) => {
      currentUser = auth.profile;
      if (browser && !auth.loading && !auth.user) {
        goto('/landing');
      }
    });

    await loadDashboardData();
    loading = false;

    return unsubscribe;
  });

  async function loadDashboardData() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) return;

      const token = await auth.currentUser.getIdToken();

      // Load stats from Firebase
      const [documentsRes, meetingsRes, ballotsRes, membersRes, activityRes] = await Promise.all([
        fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/meetings', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/ballots', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/members', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/admin/activity?limit=10', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      // Update stats
      if (documentsRes?.ok) {
        const docs = await documentsRes.json();
        dashboardStats.totalDocuments = docs.documents?.length || 0;
      }
      if (meetingsRes?.ok) {
        const meets = await meetingsRes.json();
        const upcoming = meets.meetings?.filter((m) => {
          const meetingDate = new Date(m.date);
          return meetingDate > new Date();
        }) || [];
        dashboardStats.upcomingMeetings = upcoming.length;
        dashboardStats.completedMeetings = meets.meetings?.filter((m) => {
          const meetingDate = new Date(m.date);
          return meetingDate < new Date();
        }).length || 0;
      }
      if (ballotsRes?.ok) {
        const ballots = await ballotsRes.json();
        const active = ballots.ballots?.filter((b) => b.status === 'active') || [];
        dashboardStats.activeVotes = active.length;
      }
      if (membersRes?.ok) {
        const members = await membersRes.json();
        dashboardStats.boardMembers = members.members?.length || 0;
      }
      if (activityRes?.ok) {
        const activity = await activityRes.json();
        recentActivity = activity.activities?.slice(0, 10).map((a) => ({
          id: a.id,
          action: a.action,
          user: a.userName || a.userEmail || 'Unknown',
          target: `${a.resourceType}: ${a.resourceId || 'N/A'}`,
          time: new Date(a.timestamp).toLocaleString(),
          icon: Calendar
        })) || [];
      }

      // Update quick access counts
      quickAccessItems[0].count = dashboardStats.totalDocuments;
      quickAccessItems[1].count = dashboardStats.totalDocuments;
      quickAccessItems[2].count = dashboardStats.activeVotes;
      quickAccessItems[3].count = dashboardStats.boardMembers;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    // Load notifications (mock for now)
    notifications = [
      {
        id: 1,
        type: 'meeting',
        title: 'Upcoming Board Meeting',
        message: 'Monthly board meeting scheduled for tomorrow at 2:00 PM',
        time: '2 hours ago',
        read: false
      },
      {
        id: 2,
        type: 'document',
        title: 'New Document Added',
        message: 'Q1 Financial Report has been uploaded',
        time: '4 hours ago',
        read: false
      },
      {
        id: 3,
        type: 'vote',
        title: 'Vote Required',
        message: 'Budget Approval vote is now active - your input needed',
        time: '1 day ago',
        read: true
      }
    ];

    // Fallback recent activity if Firebase fails
    if (recentActivity.length === 0) {
      recentActivity = [
        {
          id: 1,
          action: 'Meeting scheduled',
          user: 'Board Secretary',
          target: 'Monthly Board Meeting - February',
          time: '1 hour ago',
          icon: Calendar
        },
        {
          id: 2,
          action: 'Document uploaded',
          user: 'Hassan Al-Kuwari',
          target: 'Q1 Financial Report.pdf',
          time: '3 hours ago',
          icon: FileText
        },
        {
          id: 3,
          action: 'Vote created',
          user: 'Dr. Sarah Mitchell',
          target: 'Research Initiative Approval',
          time: '5 hours ago',
          icon: Vote
        }
      ];
    }
  }

  function toggleQuickActions() {
    showQuickActions = !showQuickActions;
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'meeting': return Calendar;
      case 'document': return FileText;
      case 'vote': return Vote;
      default: return Bell;
    }
  }

  function markNotificationRead(id) {
    notifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
  }

  function formatTime(timeString) {
    return timeString;
  }
</script>

<svelte:head>
  <title>Dashboard - Board Governance AI</title>
</svelte:head>

<div class="dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-content">
      <div class="welcome-section">
        <h1>Welcome back, {currentUser?.displayName || 'Board Member'}</h1>
        <p>Here's what's happening with Board Governance AI</p>
      </div>
      
      <div class="header-actions">
        <div class="quick-actions-container">
          <button class="btn btn-primary" on:click={toggleQuickActions}>
            <Plus size={16} />
            Quick Actions
            <span class="dropdown-icon" class:rotated={showQuickActions}>
              <ChevronDown size={14} />
            </span>
          </button>
          
          {#if showQuickActions}
            <div class="quick-actions-dropdown">
              {#each quickActions as action}
                <button class="quick-action-item" on:click={action.action}>
                  <svelte:component this={action.icon} size={16} />
                  <div class="action-content">
                    <span class="action-title">{action.title}</span>
                    <span class="action-description">{action.description}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Overview -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon documents">
        <FileText size={24} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{dashboardStats.totalDocuments}</div>
        <div class="stat-label">Total Documents</div>
        <div class="stat-change">+12 this month</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon meetings">
        <Calendar size={24} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{dashboardStats.upcomingMeetings}</div>
        <div class="stat-label">Upcoming Meetings</div>
        <div class="stat-change">Next: Tomorrow</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon votes">
        <Vote size={24} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{dashboardStats.activeVotes}</div>
        <div class="stat-label">Active Votes</div>
        <div class="stat-change">Action required</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon members">
        <Users size={24} />
      </div>
      <div class="stat-content">
        <div class="stat-value">{dashboardStats.boardMembers}</div>
        <div class="stat-label">Board Members</div>
        <div class="stat-change">All active</div>
      </div>
    </div>
  </div>

  <!-- Quick Access Section -->
  <div class="quick-access-section">
    <h2>Quick Access</h2>
    <div class="quick-access-grid">
      {#each quickAccessItems as item}
        <a href={item.route} class="quick-access-card {item.color}">
          <div class="access-header">
            <div class="access-icon">
              <svelte:component this={item.icon} size={20} />
            </div>
            <div class="access-count">{item.count}</div>
          </div>
          <div class="access-content">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
          <div class="access-arrow">
            <ArrowRight size={16} />
          </div>
        </a>
      {/each}
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="main-content-grid">
    <!-- Notifications -->
    <div class="content-card">
      <div class="card-header">
        <h3>Notifications</h3>
        <span class="notification-count">{notifications.filter(n => !n.read).length}</span>
      </div>
      <div class="notifications-list">
        {#each notifications.slice(0, 5) as notification}
          <div class="notification-item" class:unread={!notification.read}>
            <div class="notification-icon">
              <svelte:component this={getNotificationIcon(notification.type)} size={16} />
            </div>
            <div class="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span class="notification-time">{notification.time}</span>
            </div>
            {#if !notification.read}
              <button class="mark-read-btn" on:click={() => markNotificationRead(notification.id)}>
                <CheckCircle size={14} />
              </button>
            {/if}
          </div>
        {/each}
      </div>
      <a href="/notifications" class="view-all-link">View all notifications</a>
    </div>

    <!-- Recent Activity -->
    <div class="content-card">
      <div class="card-header">
        <h3>Recent Activity</h3>
        <a href="/activity" class="view-more">View more</a>
      </div>
      <div class="activity-list">
        {#each recentActivity as activity}
          <div class="activity-item">
            <div class="activity-icon">
              <svelte:component this={activity.icon} size={16} />
            </div>
            <div class="activity-content">
              <p>
                <strong>{activity.user}</strong> {activity.action}
                <span class="activity-target">"{activity.target}"</span>
              </p>
              <span class="activity-time">{activity.time}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Upcoming Events -->
    <div class="content-card">
      <div class="card-header">
        <h3>Upcoming Events</h3>
        <a href="/meetings" class="view-more">View calendar</a>
      </div>
      <div class="events-list">
        <div class="event-item">
          <div class="event-date">
            <div class="event-day">15</div>
            <div class="event-month">Feb</div>
          </div>
          <div class="event-content">
            <h4>Monthly Board Meeting</h4>
            <p>2:00 PM - 4:00 PM</p>
            <span class="event-location">Board Room A</span>
          </div>
        </div>
        
        <div class="event-item">
          <div class="event-date">
            <div class="event-day">18</div>
            <div class="event-month">Feb</div>
          </div>
          <div class="event-content">
            <h4>Budget Review Session</h4>
            <p>10:00 AM - 12:00 PM</p>
            <span class="event-location">Virtual Meeting</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="content-card">
      <div class="card-header">
        <h3>Board Performance</h3>
        <a href="/reports" class="view-more">View reports</a>
      </div>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-value">95%</div>
          <div class="metric-label">Meeting Attendance</div>
          <div class="metric-trend positive">+2%</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">87%</div>
          <div class="metric-label">Vote Participation</div>
          <div class="metric-trend positive">+5%</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">12</div>
          <div class="metric-label">Decisions Made</div>
          <div class="metric-trend neutral">This month</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">3.2</div>
          <div class="metric-label">Avg Meeting Duration (hrs)</div>
          <div class="metric-trend negative">-0.3</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    min-height: calc(100vh - 4rem);
  }

  .dashboard-header {
    margin-bottom: 2rem;
    box-shadow: none;
  }
  
  .welcome-section {
    box-shadow: none;
  }
  
  .header-content {
    box-shadow: none;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .welcome-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .welcome-section p {
    font-size: 1.125rem;
    color: #6b7280;
  }

  .header-actions {
    flex-shrink: 0;
  }

  .quick-actions-container {
    position: relative;
  }

  .dropdown-icon {
    transition: transform 0.2s;
  }

  .dropdown-icon.rotated {
    transform: rotate(180deg);
  }

  .quick-actions-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 280px;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
    z-index: 10001;
    padding: 0.5rem;
  }

  .quick-action-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: none;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .quick-action-item:hover {
    background: #f9fafb;
  }

  .action-content {
    flex: 1;
  }

  .action-title {
    display: block;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .action-description {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
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

  .stat-icon.documents { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); }
  .stat-icon.meetings { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
  .stat-icon.votes { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); }
  .stat-icon.members { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }

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
    margin-bottom: 0.25rem;
  }

  .stat-change {
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 500;
  }

  .quick-access-section {
    margin-bottom: 2rem;
  }

  .quick-access-section h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .quick-access-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .quick-access-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .quick-access-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.15);
  }

  .quick-access-card.blue { border-left: 4px solid #3b82f6; }
  .quick-access-card.green { border-left: 4px solid #10b981; }
  .quick-access-card.purple { border-left: 4px solid #8b5cf6; }
  .quick-access-card.orange { border-left: 4px solid #f59e0b; }

  .access-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .access-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    background: #f3f4f6;
  }

  .access-count {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }

  .access-content {
    flex: 1;
  }

  .access-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .access-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .access-arrow {
    color: #9ca3af;
    opacity: 0;
    transition: all 0.2s;
  }

  .quick-access-card:hover .access-arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  .main-content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .content-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .card-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .notification-count {
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    min-width: 20px;
    text-align: center;
  }

  .view-more,
  .view-all-link {
    font-size: 0.875rem;
    color: #00a859;
    text-decoration: none;
    font-weight: 500;
  }

  .view-more:hover,
  .view-all-link:hover {
    color: #059669;
  }

  .notifications-list,
  .activity-list,
  .events-list {
    padding: 1rem;
  }

  .notification-item,
  .activity-item,
  .event-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .notification-item:last-child,
  .activity-item:last-child,
  .event-item:last-child {
    border-bottom: none;
  }

  .notification-item.unread {
    background: #f0f9ff;
    margin: 0 -1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
  }

  .notification-icon,
  .activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #6b7280;
    flex-shrink: 0;
  }

  .notification-content,
  .activity-content {
    flex: 1;
  }

  .notification-content h4,
  .event-content h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .notification-content p,
  .activity-content p,
  .event-content p {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .notification-time,
  .activity-time {
    font-size: 0.625rem;
    color: #9ca3af;
  }

  .activity-target {
    color: #00a859;
    font-weight: 500;
  }

  .mark-read-btn {
    background: none;
    border: none;
    color: #10b981;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background 0.2s;
  }

  .mark-read-btn:hover {
    background: #f0fdf4;
  }

  .event-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background: #00a859;
    color: white;
    border-radius: 0.5rem;
    min-width: 48px;
    flex-shrink: 0;
  }

  .event-day {
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1;
  }

  .event-month {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .event-location {
    font-size: 0.625rem;
    color: #9ca3af;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
  }

  .metric-item {
    text-align: center;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .metric-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .metric-trend {
    font-size: 0.625rem;
    font-weight: 500;
  }

  .metric-trend.positive { color: #10b981; }
  .metric-trend.negative { color: #ef4444; }
  .metric-trend.neutral { color: #6b7280; }

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

  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .welcome-section h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .quick-access-grid {
      grid-template-columns: 1fr;
    }

    .main-content-grid {
      grid-template-columns: 1fr;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 