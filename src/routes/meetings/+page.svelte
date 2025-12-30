<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { videoConferencingService } from '$lib/services/videoConferencing';
  import { calendarExport } from '$lib/services/calendarExport';
  import { activityLogger } from '$lib/services/activityLogger';
  import { auditService } from '$lib/services/auditService';
  import { 
    Calendar, Plus, Video, Users, Clock, MapPin, FileText,
    Edit3, Trash2, Eye, Send, CheckCircle, AlertCircle, Download
  } from 'lucide-svelte';

  let currentUser = null;
  let meetings = [];
  let loading = false;
  let showCreateMeeting = false;
  let selectedMeeting = null;
  let viewMode = 'upcoming';

  // Create meeting form
  let newMeeting = {
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    isVirtual: false,
    meetingUrl: '',
    videoPlatform: 'teams', // teams, zoom, google_meet
    agenda: ['']
  };
  
  let creatingMeeting = false;
  let notification = { show: false, message: '', type: 'success' };

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadMeetings();
      }
    });

    return unsubscribe;
  });

  function loadMeetings() {
    // Sample meetings data
    meetings = [
      {
        id: 'meeting-1',
        title: 'Monthly Board Meeting - February 2024',
        description: 'Regular monthly board meeting to discuss strategic initiatives and operational updates.',
        date: '2024-02-15',
        time: '14:00',
        duration: 120,
        location: 'Board Room A',
        isVirtual: false,
        agenda: [
          'Review of January financial results',
          'Q1 strategic initiatives update',
          'New research partnerships discussion'
        ],
        createdBy: 'Board Secretary',
        createdAt: '2024-02-01T10:00:00Z',
        status: 'scheduled'
      },
      {
        id: 'meeting-2',
        title: 'Emergency Budget Review',
        description: 'Emergency session to address urgent budget reallocation.',
        date: '2024-01-28',
        time: '16:00',
        duration: 90,
        location: 'Virtual Meeting',
        isVirtual: true,
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/...',
        agenda: [
          'Budget requirements review',
          'Funding source identification',
          'Timeline and milestones'
        ],
        createdBy: 'Dr. Khalil Al-Rashid',
        createdAt: '2024-01-26T09:00:00Z',
        status: 'completed'
      }
    ];
  }

  function canManageMeetings() {
    return currentUser?.permissions?.canScheduleMeetings || 
           currentUser?.role === 'admin' || 
           currentUser?.role === 'secretary';
  }

  function addAgendaItem() {
    newMeeting.agenda = [...newMeeting.agenda, ''];
  }

  function removeAgendaItem(index) {
    if (newMeeting.agenda.length > 1) {
      newMeeting.agenda = newMeeting.agenda.filter((_, i) => i !== index);
    }
  }

  async function createMeeting() {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) {
      alert('Please fill in all required fields');
      return;
    }

    creatingMeeting = true;
    let meetingUrl = newMeeting.meetingUrl;
    
    try {
      // If virtual meeting, create video conference meeting
      if (newMeeting.isVirtual && newMeeting.videoPlatform !== 'manual') {
        const startDateTime = new Date(`${newMeeting.date}T${newMeeting.time}`);
        const endDateTime = new Date(startDateTime.getTime() + newMeeting.duration * 60000);
        
        const videoConfig = {
          platform: newMeeting.videoPlatform as 'teams' | 'zoom' | 'google_meet',
          title: newMeeting.title,
          description: newMeeting.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          attendees: [], // Add attendees from your board members list
          recordingEnabled: true,
          waitingRoomEnabled: true
        };
        
        try {
          const videoMeeting = await videoConferencingService.createMeeting(videoConfig);
          meetingUrl = videoMeeting.joinUrl;
        } catch (error) {
          console.error('Failed to create video meeting:', error);
          // Show notification and set platform to manual
          notification = {
            show: true,
            message: `Unable to create ${newMeeting.videoPlatform} meeting automatically. Please enter the meeting URL manually.`,
            type: 'warning'
          };
          newMeeting.videoPlatform = 'manual';
          // Hide notification after 5 seconds
          setTimeout(() => {
            notification.show = false;
          }, 5000);
        }
      }

      const meeting = {
        id: 'meeting-' + Date.now(),
        title: newMeeting.title,
        description: newMeeting.description,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: newMeeting.duration,
        location: newMeeting.isVirtual ? `Virtual Meeting (${newMeeting.videoPlatform})` : newMeeting.location,
        isVirtual: newMeeting.isVirtual,
        meetingUrl: meetingUrl,
        videoPlatform: newMeeting.isVirtual ? newMeeting.videoPlatform : null,
        agenda: newMeeting.agenda.filter(item => item.trim()),
        createdBy: currentUser?.displayName || 'Unknown',
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      // Save to Firebase first
      const savedMeeting = await saveMeetingToFirebase(meeting);
      if (savedMeeting && savedMeeting.meetingId) {
        meeting.id = savedMeeting.meetingId;
        
        // Log activity and audit
        if (currentUser?.uid) {
          const { logActivity } = await import('$lib/services/activityLogger');
          const { audit } = await import('$lib/services/auditService');
          await logActivity(
            currentUser.uid,
            currentUser.displayName || currentUser.email || 'Unknown',
            'meeting_created',
            { meetingId: meeting.id, title: meeting.title, date: meeting.date, isVirtual: meeting.isVirtual }
          );
          await audit(
            currentUser.uid,
            currentUser.displayName || currentUser.email || 'Unknown',
            'create',
            'meeting',
            meeting.id,
            null,
            meeting
          );
        }
      }

      // Add to meetings list
      meetings = [meeting, ...meetings];

      // Reset form but keep modal open
      resetMeetingForm();
      
      // Show success notification
      notification = {
        show: true,
        message: 'Meeting created successfully!',
        type: 'success'
      };
      setTimeout(() => {
        notification.show = false;
      }, 3000);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      notification = {
        show: true,
        message: 'Failed to create meeting. Please try again.',
        type: 'error'
      };
      setTimeout(() => {
        notification.show = false;
      }, 5000);
    } finally {
      creatingMeeting = false;
    }
  }

  async function saveMeetingToFirebase(meeting) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        return null;
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meeting)
      });

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        console.error('Failed to save meeting:', error);
        return null;
      }
    } catch (error) {
      console.error('Failed to save meeting:', error);
      return null;
    }
  }

  function resetMeetingForm() {
    newMeeting = {
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 60,
      location: '',
      isVirtual: false,
      meetingUrl: '',
      agenda: ['']
    };
    // Don't close the modal - keep it open for creating more meetings
  }

  function closeMeetingModal() {
    showCreateMeeting = false;
    resetMeetingForm();
  }

  function getMeetingStatus(meeting) {
    const now = new Date();
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    
    if (meeting.status === 'completed') return 'completed';
    if (meetingDate > now) return 'scheduled';
    return 'in_progress';
  }

  function getStatusColor(status) {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(timeString) {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  $: filteredMeetings = meetings.filter(meeting => {
    const status = getMeetingStatus(meeting);
    
    if (viewMode === 'upcoming') {
      return status === 'scheduled';
    } else if (viewMode === 'past') {
      return status === 'completed';
    }
    
    return true; // all
  });
</script>

<svelte:head>
  <title>Meetings - Board Governance AI</title>
</svelte:head>

<div class="meetings-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Board Meetings</h1>
        <p>Schedule meetings, manage agendas, and maintain meeting minutes</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-primary" on:click={() => showCreateMeeting = true}>
          <Plus size={16} />
          Create Meeting
        </button>
      </div>
    </div>
  </div>

  <!-- View Tabs -->
  <div class="view-tabs">
    <button 
      class="tab" 
      class:active={viewMode === 'upcoming'}
      on:click={() => viewMode = 'upcoming'}
    >
      Upcoming
    </button>
    <button 
      class="tab" 
      class:active={viewMode === 'past'}
      on:click={() => viewMode = 'past'}
    >
      Past Meetings
    </button>
    <button 
      class="tab" 
      class:active={viewMode === 'all'}
      on:click={() => viewMode = 'all'}
    >
      All Meetings
    </button>
  </div>

  <!-- Meetings List -->
  <div class="meetings-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading meetings...</p>
      </div>
    {:else if filteredMeetings.length === 0}
      <div class="empty-state">
        <Calendar size={48} />
        <h3>No meetings found</h3>
        <p>No meetings scheduled for this view.</p>
        {#if canManageMeetings()}
          <button class="btn btn-primary" on:click={() => showCreateMeeting = true}>
            <Plus size={16} />
            Schedule First Meeting
          </button>
        {/if}
      </div>
    {:else}
      <div class="meetings-grid">
        {#each filteredMeetings as meeting (meeting.id)}
          {@const status = getMeetingStatus(meeting)}
          
          <div class="meeting-card" on:click={() => selectedMeeting = meeting}>
            <!-- Meeting Header -->
            <div class="meeting-header">
              <div class="meeting-status">
                <div class="status-indicator" style="background-color: {getStatusColor(status)}"></div>
                <span class="status-text" style="color: {getStatusColor(status)}">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              
              {#if meeting.isVirtual}
                <span class="virtual-badge">
                  <Video size={12} />
                  Virtual
                </span>
              {/if}
            </div>

            <!-- Meeting Content -->
            <div class="meeting-content">
              <h3 class="meeting-title">{meeting.title}</h3>
              <p class="meeting-description">{meeting.description}</p>
            </div>

            <!-- Meeting Details -->
            <div class="meeting-details">
              <div class="detail-item">
                <Calendar size={14} />
                <span>{formatDate(meeting.date)} at {formatTime(meeting.time)}</span>
              </div>
              
              <div class="detail-item">
                <Clock size={14} />
                <span>{meeting.duration} minutes</span>
              </div>
              
              <div class="detail-item">
                {#if meeting.isVirtual}
                  <Video size={14} />
                {:else}
                  <MapPin size={14} />
                {/if}
                <span>{meeting.location}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Create Meeting Modal -->
{#if showCreateMeeting}
  <div class="modal-overlay" on:click={closeMeetingModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Schedule New Meeting</h2>
        <button class="modal-close" on:click={closeMeetingModal}>×</button>
      </div>

      <div class="modal-body">
        <form on:submit|preventDefault={createMeeting}>
          <div class="form-grid">
            <div class="form-group">
              <label for="title">Meeting Title *</label>
              <input
                id="title"
                type="text"
                bind:value={newMeeting.title}
                placeholder="Enter meeting title..."
                required
              />
            </div>

            <div class="form-group">
              <label for="date">Date *</label>
              <input
                id="date"
                type="date"
                bind:value={newMeeting.date}
                required
              />
            </div>

            <div class="form-group">
              <label for="time">Time *</label>
              <input
                id="time"
                type="time"
                bind:value={newMeeting.time}
                required
              />
            </div>

            <div class="form-group">
              <label for="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                bind:value={newMeeting.duration}
                min="15"
                max="480"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              bind:value={newMeeting.description}
              rows="3"
              placeholder="Brief description of the meeting purpose..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={newMeeting.isVirtual} />
              <span>Virtual Meeting</span>
            </label>
          </div>

          {#if newMeeting.isVirtual}
            <div class="form-group">
              <label for="videoPlatform">Video Platform</label>
              <select id="videoPlatform" bind:value={newMeeting.videoPlatform}>
                <option value="teams">Microsoft Teams (Auto-create)</option>
                <option value="zoom">Zoom (Auto-create)</option>
                <option value="google_meet">Google Meet (Auto-create)</option>
                <option value="manual">Manual URL Entry</option>
              </select>
            </div>
            
            {#if newMeeting.videoPlatform === 'manual'}
              <div class="form-group">
                <label for="meetingUrl">Meeting URL</label>
                <input
                  id="meetingUrl"
                  type="url"
                  bind:value={newMeeting.meetingUrl}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>
            {/if}
          {:else}
            <div class="form-group">
              <label for="location">Location</label>
              <input
                id="location"
                type="text"
                bind:value={newMeeting.location}
                placeholder="Meeting room or address..."
              />
            </div>
          {/if}

          <div class="form-group">
            <label>Agenda Items</label>
            <div class="agenda-container">
              {#each newMeeting.agenda as item, index}
                <div class="agenda-item">
                  <input
                    type="text"
                    bind:value={item}
                    placeholder="Agenda item {index + 1}..."
                  />
                  {#if newMeeting.agenda.length > 1}
                    <button type="button" class="remove-item" on:click={() => removeAgendaItem(index)}>
                      ×
                    </button>
                  {/if}
                </div>
              {/each}
              <button type="button" class="add-item" on:click={addAgendaItem}>
                <Plus size={14} />
                Add Agenda Item
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">
              Create Meeting
            </button>
            <button type="button" class="btn btn-outline" on:click={resetMeetingForm}>
              Clear Form
            </button>
            <button type="button" class="btn btn-outline" on:click={closeMeetingModal}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Notification Toast -->
{#if notification.show}
  <div class="notification {notification.type}">
    <div class="notification-content">
      <span class="notification-message">{notification.message}</span>
      <button class="notification-close" on:click={() => notification.show = false}>
        ×
      </button>
    </div>
  </div>
{/if}

<style>
  .meetings-page {
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

  .view-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .tab {
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab.active {
    background: #00a859;
    color: white;
    border-color: #00a859;
  }

  .meetings-container {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

  .meetings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .meeting-card {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.2s;
    cursor: pointer;
  }

  .meeting-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border-color: #00a859;
  }

  .meeting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .meeting-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-text {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .virtual-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .meeting-content {
    margin-bottom: 1rem;
  }

  .meeting-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .meeting-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .meeting-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 1rem;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
  }

  .agenda-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .agenda-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .agenda-item input {
    flex: 1;
  }

  .remove-item {
    padding: 0.5rem;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    color: #6b7280;
    border: 1px dashed #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-item:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #9ca3af;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
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
    .meetings-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .meetings-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Notification Styles */
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  }

  .notification.success {
    background: #10b981;
    color: white;
  }

  .notification.warning {
    background: #f59e0b;
    color: white;
  }

  .notification.error {
    background: #ef4444;
    color: white;
  }

  .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .notification-message {
    flex: 1;
  }

  .notification-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style> 