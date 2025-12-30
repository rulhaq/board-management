<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    BarChart3, TrendingUp, Users, FileText, Calendar,
    Download, Filter, RefreshCw, Eye, Share2
  } from 'lucide-svelte';

  let currentUser = null;
  let loading = false;
  let selectedPeriod = 'monthly';
  let selectedCategory = 'all';

  // Sample data
  let reports = {
    overview: {
      totalMeetings: 12,
      totalDocuments: 156,
      totalVotes: 8,
      activeBoardMembers: 8,
      meetingAttendance: 92,
      documentViews: 2341,
      voteParticipation: 87
    },
    meetings: [
      {
        id: 'meeting-1',
        title: 'Monthly Board Meeting - January',
        date: '2024-01-15',
        attendance: 8,
        duration: 120,
        decisions: 5,
        actionItems: 12
      },
      {
        id: 'meeting-2',
        title: 'Emergency Budget Session',
        date: '2024-01-28',
        attendance: 6,
        duration: 90,
        decisions: 3,
        actionItems: 8
      }
    ],
    documents: [
      {
        category: 'Financial Reports',
        count: 45,
        views: 892,
        downloads: 234
      },
      {
        category: 'Board Minutes',
        count: 24,
        views: 567,
        downloads: 189
      },
      {
        category: 'Policy Documents',
        count: 38,
        views: 445,
        downloads: 156
      }
    ],
    voting: [
      {
        title: 'Q1 Budget Approval',
        date: '2024-01-15',
        participation: 87,
        outcome: 'Approved'
      },
      {
        title: 'Research Initiative',
        date: '2024-01-18',
        participation: 75,
        outcome: 'Approved'
      }
    ]
  };

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadReports();
      }
    });

    return unsubscribe;
  });

  function loadReports() {
    // Reports are loaded from the sample data above
    loading = false;
  }

  function canAccessReports() {
    // All authenticated users can access reports
    return currentUser && currentUser.role;
  }

  function exportReport(type) {
    // Mock export functionality
    alert(`Exporting ${type} report...`);
  }

  function refreshData() {
    loading = true;
    setTimeout(() => {
      loading = false;
      // Mock data refresh
    }, 1000);
  }
</script>

<svelte:head>
  <title>Reports - Board Governance AI</title>
</svelte:head>

<div class="reports-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Board Reports</h1>
        <p>Analytics and insights for board governance and operations</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" on:click={refreshData}>
          <RefreshCw size={14} />
          Refresh
        </button>
        {#if canAccessReports()}
          <button class="btn btn-primary btn-sm" on:click={() => exportReport('full')}>
            <Download size={14} />
            Export
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-section">
    <div class="filter-group">
      <label>Period:</label>
      <select bind:value={selectedPeriod} class="filter-select">
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Category:</label>
      <select bind:value={selectedCategory} class="filter-select">
        <option value="all">All Reports</option>
        <option value="meetings">Meetings</option>
        <option value="documents">Documents</option>
        <option value="voting">Voting</option>
        <option value="governance">Governance</option>
      </select>
    </div>
  </div>

  <!-- Reports content accessible to all users -->
  {#if !loading}
    <!-- Overview Cards -->
    <div class="overview-section">
      <h2>Overview</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon meetings">
            <Calendar size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.totalMeetings}</div>
            <div class="metric-label">Total Meetings</div>
            <div class="metric-change">+2 this month</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon documents">
            <FileText size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.totalDocuments}</div>
            <div class="metric-label">Documents</div>
            <div class="metric-change">+18 this month</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon voting">
            <BarChart3 size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.totalVotes}</div>
            <div class="metric-label">Votes Conducted</div>
            <div class="metric-change">+1 this month</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon members">
            <Users size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.activeBoardMembers}</div>
            <div class="metric-label">Active Members</div>
            <div class="metric-change">100% active</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon attendance">
            <TrendingUp size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.meetingAttendance}%</div>
            <div class="metric-label">Avg Attendance</div>
            <div class="metric-change">+5% vs last month</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon engagement">
            <Eye size={16} />
          </div>
          <div class="metric-content">
            <div class="metric-value">{reports.overview.documentViews.toLocaleString()}</div>
            <div class="metric-label">Document Views</div>
            <div class="metric-change">+12% this month</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Reports -->
    <div class="reports-grid">
      <!-- Meeting Reports -->
      <div class="report-card">
        <div class="report-header">
          <h3>Meeting Summary</h3>
          <div class="report-actions">
            <button class="action-btn" on:click={() => exportReport('meetings')}>
              <Download size={12} />
            </button>
            <button class="action-btn">
              <Share2 size={12} />
            </button>
          </div>
        </div>
        
        <div class="report-content">
          {#each reports.meetings as meeting}
            <div class="report-item">
              <div class="item-header">
                <span class="item-title">{meeting.title}</span>
                <span class="item-date">{new Date(meeting.date).toLocaleDateString()}</span>
              </div>
              <div class="item-stats">
                <div class="stat">
                  <span class="stat-label">Attendance:</span>
                  <span class="stat-value">{meeting.attendance}/8</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Duration:</span>
                  <span class="stat-value">{meeting.duration}min</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Decisions:</span>
                  <span class="stat-value">{meeting.decisions}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Action Items:</span>
                  <span class="stat-value">{meeting.actionItems}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Document Reports -->
      <div class="report-card">
        <div class="report-header">
          <h3>Document Analytics</h3>
          <div class="report-actions">
            <button class="action-btn" on:click={() => exportReport('documents')}>
              <Download size={12} />
            </button>
            <button class="action-btn">
              <Share2 size={12} />
            </button>
          </div>
        </div>
        
        <div class="report-content">
          {#each reports.documents as category}
            <div class="report-item">
              <div class="item-header">
                <span class="item-title">{category.category}</span>
                <span class="item-count">{category.count} docs</span>
              </div>
              <div class="item-stats">
                <div class="stat">
                  <span class="stat-label">Views:</span>
                  <span class="stat-value">{category.views.toLocaleString()}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Downloads:</span>
                  <span class="stat-value">{category.downloads}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Engagement:</span>
                  <span class="stat-value">{Math.round((category.downloads / category.views) * 100)}%</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Voting Reports -->
      <div class="report-card">
        <div class="report-header">
          <h3>Voting Activity</h3>
          <div class="report-actions">
            <button class="action-btn" on:click={() => exportReport('voting')}>
              <Download size={12} />
            </button>
            <button class="action-btn">
              <Share2 size={12} />
            </button>
          </div>
        </div>
        
        <div class="report-content">
          {#each reports.voting as vote}
            <div class="report-item">
              <div class="item-header">
                <span class="item-title">{vote.title}</span>
                <span class="item-date">{new Date(vote.date).toLocaleDateString()}</span>
              </div>
              <div class="item-stats">
                <div class="stat">
                  <span class="stat-label">Participation:</span>
                  <span class="stat-value">{vote.participation}%</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Outcome:</span>
                  <span class="stat-value outcome-{vote.outcome.toLowerCase()}">{vote.outcome}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Governance Metrics -->
      <div class="report-card">
        <div class="report-header">
          <h3>Governance Metrics</h3>
          <div class="report-actions">
            <button class="action-btn" on:click={() => exportReport('governance')}>
              <Download size={12} />
            </button>
            <button class="action-btn">
              <Share2 size={12} />
            </button>
          </div>
        </div>
        
        <div class="report-content">
          <div class="governance-metrics">
            <div class="governance-item">
              <div class="governance-label">Board Meeting Frequency</div>
              <div class="governance-value">Monthly</div>
              <div class="governance-status compliant">✓ Compliant</div>
            </div>
            
            <div class="governance-item">
              <div class="governance-label">Quorum Achievement</div>
              <div class="governance-value">100%</div>
              <div class="governance-status compliant">✓ Excellent</div>
            </div>
            
            <div class="governance-item">
              <div class="governance-label">Document Retention</div>
              <div class="governance-value">7 years</div>
              <div class="governance-status compliant">✓ Policy Compliant</div>
            </div>
            
            <div class="governance-item">
              <div class="governance-label">Audit Trail Coverage</div>
              <div class="governance-value">100%</div>
              <div class="governance-status compliant">✓ Complete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .reports-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    font-size: 0.875rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .title-section p {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .filters-section {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    white-space: nowrap;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    background: white;
    min-width: 120px;
  }

  .access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .access-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .access-denied h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .access-denied p {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .overview-section {
    margin-bottom: 2rem;
  }

  .overview-section h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .metric-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .metric-icon {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .metric-icon.meetings { background: #3b82f6; }
  .metric-icon.documents { background: #10b981; }
  .metric-icon.voting { background: #f59e0b; }
  .metric-icon.members { background: #8b5cf6; }
  .metric-icon.attendance { background: #06b6d4; }
  .metric-icon.engagement { background: #ef4444; }

  .metric-content {
    flex: 1;
    min-width: 0;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .metric-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 0.125rem;
  }

  .metric-change {
    font-size: 0.625rem;
    color: #10b981;
    font-weight: 500;
  }

  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .report-card {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .report-header h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .report-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.25rem;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    color: #374151;
    background: #e5e7eb;
  }

  .report-content {
    padding: 1rem;
  }

  .report-item {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .report-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .item-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1f2937;
  }

  .item-date,
  .item-count {
    font-size: 0.625rem;
    color: #9ca3af;
  }

  .item-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-label {
    font-size: 0.625rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .stat-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1f2937;
  }

  .stat-value.outcome-approved {
    color: #10b981;
  }

  .stat-value.outcome-rejected {
    color: #ef4444;
  }

  .governance-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .governance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  .governance-label {
    font-size: 0.75rem;
    color: #6b7280;
    flex: 1;
  }

  .governance-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1f2937;
    margin-right: 0.75rem;
  }

  .governance-status {
    font-size: 0.625rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  .governance-status.compliant {
    background: #dcfce7;
    color: #166534;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    text-decoration: none;
    border: none;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.625rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 168, 89, 0.2);
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

  @media (max-width: 768px) {
    .reports-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 1.5rem;
    }

    .filters-section {
      flex-direction: column;
      gap: 0.75rem;
    }

    .metrics-grid {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .reports-grid {
      grid-template-columns: 1fr;
    }

    .item-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style> 