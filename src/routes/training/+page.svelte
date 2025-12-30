<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { PlayCircle, BookOpen, Video, FileText, CheckCircle } from 'lucide-svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;

  const trainingModules = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: PlayCircle,
      duration: '15 min',
      description: 'Introduction to Board Governance AI platform',
      completed: false,
      content: `
        <h2>Getting Started with Board Governance AI</h2>
        <p>Welcome to the Board Governance AI platform. This training module will help you get started.</p>
        
        <h3>1. Platform Overview</h3>
        <p>Board Governance AI is a comprehensive platform designed to streamline board operations, document management, and decision-making processes.</p>

        <h3>2. Key Features</h3>
        <ul>
          <li><strong>Dashboard:</strong> Overview of your board activities</li>
          <li><strong>Meetings:</strong> Schedule and manage board meetings</li>
          <li><strong>Documents:</strong> Secure document storage and management</li>
          <li><strong>Voting:</strong> Conduct secure board votes</li>
          <li><strong>Chat:</strong> Real-time communication with board members</li>
          <li><strong>AI Assistant:</strong> Get help with board governance questions</li>
        </ul>

        <h3>3. Navigation</h3>
        <p>Use the top navigation bar to access different sections of the platform. The menu adapts based on your role and permissions.</p>

        <h3>4. Next Steps</h3>
        <p>Complete the following modules to become proficient with the platform:</p>
        <ol>
          <li>Document Management</li>
          <li>Meeting Participation</li>
          <li>Voting Procedures</li>
          <li>Security Best Practices</li>
        </ol>
      `
    },
    {
      id: 'documents',
      title: 'Document Management',
      icon: FileText,
      duration: '20 min',
      description: 'Learn how to upload, organize, and manage board documents',
      completed: false,
      content: `
        <h2>Document Management Training</h2>
        
        <h3>1. Uploading Documents</h3>
        <ul>
          <li>Click the "Upload" button in the Documents section</li>
          <li>Select files from your device</li>
          <li>Add metadata: title, description, category, confidentiality level</li>
          <li>Set access permissions</li>
        </ul>

        <h3>2. Document Organization</h3>
        <ul>
          <li>Use categories to organize documents</li>
          <li>Apply tags for easy searching</li>
          <li>Follow naming conventions</li>
          <li>Maintain version control</li>
        </ul>

        <h3>3. Access Control</h3>
        <p>Documents are classified by confidentiality level:</p>
        <ul>
          <li><strong>Public:</strong> All board members</li>
          <li><strong>Restricted:</strong> Specific roles or committees</li>
          <li><strong>Confidential:</strong> Executive leadership</li>
          <li><strong>Top Secret:</strong> Super admin only</li>
        </ul>

        <h3>4. Best Practices</h3>
        <ul>
          <li>Review documents before uploading</li>
          <li>Use descriptive file names</li>
          <li>Include version numbers</li>
          <li>Set appropriate confidentiality levels</li>
        </ul>
      `
    },
    {
      id: 'meetings',
      title: 'Meeting Participation',
      icon: Video,
      duration: '25 min',
      description: 'Master meeting scheduling, participation, and documentation',
      completed: false,
      content: `
        <h2>Meeting Participation Training</h2>
        
        <h3>1. Scheduling Meetings</h3>
        <ul>
          <li>Access the Meetings section</li>
          <li>Click "Schedule New Meeting"</li>
          <li>Set date, time, and duration</li>
          <li>Add agenda items and attach documents</li>
          <li>Invite required attendees</li>
        </ul>

        <h3>2. Joining Meetings</h3>
        <ul>
          <li>Join 5 minutes early to test audio/video</li>
          <li>Use the meeting link from your calendar</li>
          <li>Enable video for better engagement</li>
          <li>Mute microphone when not speaking</li>
        </ul>

        <h3>3. During Meetings</h3>
        <ul>
          <li>Use "Raise Hand" feature for questions</li>
          <li>Participate in polls and voting</li>
          <li>Access shared documents</li>
          <li>Take notes in the meeting notes section</li>
        </ul>

        <h3>4. Post-Meeting</h3>
        <ul>
          <li>Review meeting minutes</li>
          <li>Complete assigned action items</li>
          <li>Access meeting recordings if available</li>
          <li>Download meeting documents</li>
        </ul>
      `
    },
    {
      id: 'voting',
      title: 'Voting Procedures',
      icon: CheckCircle,
      duration: '15 min',
      description: 'Understand how to participate in board voting',
      completed: false,
      content: `
        <h2>Voting Procedures Training</h2>
        
        <h3>1. Voting Types</h3>
        <ul>
          <li><strong>Simple Majority:</strong> More than 50% approval</li>
          <li><strong>Super Majority:</strong> 2/3 or 3/4 approval required</li>
          <li><strong>Unanimous:</strong> All members must approve</li>
          <li><strong>Weighted:</strong> Votes weighted by role or shares</li>
        </ul>

        <h3>2. Casting Your Vote</h3>
        <ul>
          <li>Review all relevant documents before voting</li>
          <li>Read the proposal carefully</li>
          <li>Select your vote: Approve, Reject, or Abstain</li>
          <li>Add comments if required or desired</li>
          <li>Submit your vote before the deadline</li>
        </ul>

        <h3>3. Voting Deadlines</h3>
        <p>Votes have specific deadlines. Late votes may not be counted. Check your notifications for voting deadlines.</p>

        <h3>4. Viewing Results</h3>
        <p>After the voting period ends, results are displayed showing:</p>
        <ul>
          <li>Total votes cast</li>
          <li>Vote breakdown</li>
          <li>Final outcome</li>
          <li>Individual votes (if visible based on permissions)</li>
        </ul>
      `
    },
    {
      id: 'security',
      title: 'Security Best Practices',
      icon: BookOpen,
      duration: '20 min',
      description: 'Learn how to keep your account and data secure',
      completed: false,
      content: `
        <h2>Security Best Practices Training</h2>
        
        <h3>1. Account Security</h3>
        <ul>
          <li>Use strong, unique passwords</li>
          <li>Enable multi-factor authentication (MFA)</li>
          <li>Never share your credentials</li>
          <li>Log out when finished, especially on shared devices</li>
        </ul>

        <h3>2. Data Protection</h3>
        <ul>
          <li>Only access documents you're authorized to view</li>
          <li>Don't download confidential documents to unsecured devices</li>
          <li>Use secure networks when accessing the platform</li>
          <li>Report suspicious activity immediately</li>
        </ul>

        <h3>3. Phishing Awareness</h3>
        <ul>
          <li>Be cautious of unexpected emails</li>
          <li>Verify sender identity</li>
          <li>Don't click suspicious links</li>
          <li>Report phishing attempts</li>
        </ul>

        <h3>4. Device Security</h3>
        <ul>
          <li>Keep devices updated</li>
          <li>Use screen locks</li>
          <li>Install security software</li>
          <li>Avoid public Wi-Fi for sensitive operations</li>
        </ul>
      `
    }
  ];

  let selectedModule = trainingModules[0];
  let searchTerm = '';
</script>

<svelte:head>
  <title>Training - Board Governance AI</title>
</svelte:head>


<div class="training-container">
  <div class="header">
    <div class="header-content">
      <h1>Training & Resources</h1>
      <p class="subtitle">Learn how to use Board Governance AI effectively</p>
    </div>
  </div>

  <div class="training-layout">
    <aside class="training-sidebar">
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Search training..." 
          bind:value={searchTerm}
          class="search-input"
        />
      </div>

      <div class="module-list">
        {#each trainingModules.filter(m => 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) as module}
          <button
            class="module-item"
            class:active={selectedModule.id === module.id}
            class:completed={module.completed}
            on:click={() => selectedModule = module}
          >
            <svelte:component this={module.icon} size={20} />
            <div class="module-item-content">
              <h3>{module.title}</h3>
              <span class="module-duration">{module.duration}</span>
            </div>
            {#if module.completed}
              <CheckCircle size={16} class="completed-icon" />
            {/if}
          </button>
        {/each}
      </div>
    </aside>

    <main class="training-content">
      <div class="training-header">
        <div class="training-title-section">
          <svelte:component this={selectedModule.icon} size={32} class="training-icon" />
          <div>
            <h2>{selectedModule.title}</h2>
            <div class="training-meta">
              <span class="meta-item">Duration: {selectedModule.duration}</span>
              {#if selectedModule.completed}
                <span class="meta-item completed-badge">
                  <CheckCircle size={16} />
                  Completed
                </span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="training-description">
        <p>{selectedModule.description}</p>
      </div>

      <div class="training-body">
        {@html selectedModule.content}
      </div>

      <div class="training-actions">
        <button class="btn-primary">
          Mark as Completed
        </button>
        <button class="btn-secondary">
          Download PDF
        </button>
      </div>
    </main>
  </div>
</div>

<style>
  .training-container {
    min-height: 100vh;
    background: #f9fafb;
  }

  .header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 2rem 0;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .training-layout {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
  }

  .training-sidebar {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    height: fit-content;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .search-box {
    margin-bottom: 1.5rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #00a859;
  }

  .module-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .module-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: none;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .module-item:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .module-item.active {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.1);
  }

  .module-item.completed {
    background: rgba(34, 197, 94, 0.05);
  }

  .module-item-content {
    flex: 1;
  }

  .module-item-content h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .module-duration {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .completed-icon {
    color: #22c55e;
    flex-shrink: 0;
  }

  .training-content {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .training-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .training-title-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .training-icon {
    color: #00a859;
    flex-shrink: 0;
  }

  .training-title-section h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .training-meta {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .meta-item {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .completed-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #22c55e;
    font-weight: 600;
  }

  .training-description {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border-left: 4px solid #00a859;
  }

  .training-description p {
    margin: 0;
    color: #374151;
    font-size: 1rem;
    line-height: 1.6;
  }

  .training-body {
    color: #374151;
    line-height: 1.8;
    margin-bottom: 2rem;
  }

  .training-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 2rem 0 1rem 0;
  }

  .training-body h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 1.5rem 0 0.75rem 0;
  }

  .training-body p {
    margin: 0.75rem 0;
  }

  .training-body ul, .training-body ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .training-body li {
    margin: 0.5rem 0;
  }

  .training-body strong {
    color: #1f2937;
    font-weight: 600;
  }

  .training-actions {
    display: flex;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: #00a859;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: #008a47;
  }

  .btn-secondary {
    padding: 0.75rem 1.5rem;
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: #00a859;
    color: #00a859;
  }

  @media (max-width: 1024px) {
    .training-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .training-layout {
      padding: 1rem;
    }

    .training-content {
      padding: 1.5rem;
    }

    .training-actions {
      flex-direction: column;
    }
  }
</style>

