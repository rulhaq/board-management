<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { BookOpen, CheckCircle, AlertTriangle, Info } from 'lucide-svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;

  const guidelines = [
    {
      id: 'best-practices',
      title: 'Best Practices Guide',
      icon: CheckCircle,
      category: 'General',
      content: `
        <h2>Best Practices for Board Governance</h2>
        
        <h3>1. Meeting Preparation</h3>
        <ul>
          <li>Review all agenda items and supporting documents at least 48 hours before meetings</li>
          <li>Prepare questions and discussion points in advance</li>
          <li>Ensure technical setup is tested before virtual meetings</li>
        </ul>

        <h3>2. Document Management</h3>
        <ul>
          <li>Use clear, descriptive file names</li>
          <li>Include version numbers and dates in document titles</li>
          <li>Store documents in appropriate categories</li>
          <li>Mark confidential documents with proper classification</li>
        </ul>

        <h3>3. Communication</h3>
        <ul>
          <li>Use the platform's chat feature for official board communications</li>
          <li>Respond to meeting invitations within 24 hours</li>
          <li>Keep discussions professional and focused</li>
        </ul>

        <h3>4. Voting</h3>
        <ul>
          <li>Review all relevant documents before casting votes</li>
          <li>Vote within the specified timeframe</li>
          <li>Provide comments when abstaining or voting against</li>
        </ul>
      `
    },
    {
      id: 'security',
      title: 'Security Guidelines',
      icon: AlertTriangle,
      category: 'Security',
      content: `
        <h2>Security Guidelines</h2>
        
        <h3>1. Password Security</h3>
        <ul>
          <li>Use strong, unique passwords (minimum 12 characters)</li>
          <li>Never share your password with anyone</li>
          <li>Change passwords immediately if compromised</li>
          <li>Use a password manager for secure storage</li>
        </ul>

        <h3>2. Multi-Factor Authentication</h3>
        <ul>
          <li>Enable MFA on your account</li>
          <li>Use authenticator apps instead of SMS when possible</li>
          <li>Keep backup codes in a secure location</li>
        </ul>

        <h3>3. Device Security</h3>
        <ul>
          <li>Keep your devices updated with latest security patches</li>
          <li>Use screen locks on mobile devices</li>
          <li>Never access the platform on public or unsecured Wi-Fi</li>
          <li>Log out when finished, especially on shared devices</li>
        </ul>

        <h3>4. Phishing Awareness</h3>
        <ul>
          <li>Be cautious of unexpected emails or messages</li>
          <li>Verify sender identity before clicking links</li>
          <li>Report suspicious activity immediately</li>
        </ul>
      `
    },
    {
      id: 'document-creation',
      title: 'Document Creation Guidelines',
      icon: BookOpen,
      category: 'Operations',
      content: `
        <h2>Document Creation Guidelines</h2>
        
        <h3>1. Document Structure</h3>
        <ul>
          <li>Use clear headings and subheadings</li>
          <li>Include an executive summary for longer documents</li>
          <li>Number pages and include document version</li>
          <li>Add table of contents for documents over 10 pages</li>
        </ul>

        <h3>2. Naming Conventions</h3>
        <ul>
          <li>Format: [Category]_[Title]_[Date]_v[Version]</li>
          <li>Example: Financial_Budget_2024_Q1_2024-01-15_v1.0</li>
          <li>Use underscores instead of spaces</li>
          <li>Keep names concise but descriptive</li>
        </ul>

        <h3>3. Confidentiality Classification</h3>
        <ul>
          <li><strong>Public:</strong> General board information</li>
          <li><strong>Restricted:</strong> Committee-specific documents</li>
          <li><strong>Confidential:</strong> Executive-level information</li>
          <li><strong>Top Secret:</strong> Highly sensitive strategic information</li>
        </ul>

        <h3>4. Review Process</h3>
        <ul>
          <li>Submit documents for review at least 5 days before meetings</li>
          <li>Address reviewer comments promptly</li>
          <li>Obtain necessary approvals before finalizing</li>
        </ul>
      `
    },
    {
      id: 'meeting-etiquette',
      title: 'Meeting Etiquette',
      icon: Info,
      category: 'Operations',
      content: `
        <h2>Meeting Etiquette Guidelines</h2>
        
        <h3>1. Punctuality</h3>
        <ul>
          <li>Join meetings 5 minutes early</li>
          <li>Test audio/video before the meeting starts</li>
          <li>Notify the secretary if you'll be late</li>
        </ul>

        <h3>2. Participation</h3>
        <ul>
          <li>Mute microphone when not speaking</li>
          <li>Use the "raise hand" feature for questions</li>
          <li>Stay focused and avoid multitasking</li>
          <li>Respect speaking time limits</li>
        </ul>

        <h3>3. Professionalism</h3>
        <ul>
          <li>Dress appropriately for video meetings</li>
          <li>Use professional backgrounds or blur</li>
          <li>Maintain eye contact with the camera</li>
          <li>Avoid side conversations in chat</li>
        </ul>

        <h3>4. Follow-up</h3>
        <ul>
          <li>Review meeting minutes within 48 hours</li>
          <li>Complete action items by assigned deadlines</li>
          <li>Provide updates on assigned tasks</li>
        </ul>
      `
    }
  ];

  let selectedGuideline = guidelines[0];
  let searchTerm = '';
</script>

<svelte:head>
  <title>Guidelines - Board Governance AI</title>
</svelte:head>


<div class="guidelines-container">
  <div class="header">
    <div class="header-content">
      <h1>Board Guidelines</h1>
      <p class="subtitle">Best practices and operational guidelines</p>
    </div>
  </div>

  <div class="guidelines-layout">
    <aside class="guidelines-sidebar">
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Search guidelines..." 
          bind:value={searchTerm}
          class="search-input"
        />
      </div>

      <div class="guideline-list">
        {#each guidelines.filter(g => 
          g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.category.toLowerCase().includes(searchTerm.toLowerCase())
        ) as guideline}
          <button
            class="guideline-item"
            class:active={selectedGuideline.id === guideline.id}
            on:click={() => selectedGuideline = guideline}
          >
            <svelte:component this={guideline.icon} size={20} />
            <div class="guideline-item-content">
              <h3>{guideline.title}</h3>
              <span class="guideline-category">{guideline.category}</span>
            </div>
          </button>
        {/each}
      </div>
    </aside>

    <main class="guideline-content">
      <div class="guideline-header">
        <svelte:component this={selectedGuideline.icon} size={32} class="guideline-icon" />
        <h2>{selectedGuideline.title}</h2>
      </div>

      <div class="guideline-body">
        {@html selectedGuideline.content}
      </div>
    </main>
  </div>
</div>

<style>
  .guidelines-container {
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

  .guidelines-layout {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
  }

  .guidelines-sidebar {
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

  .guideline-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .guideline-item {
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
  }

  .guideline-item:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .guideline-item.active {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.1);
  }

  .guideline-item-content h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .guideline-category {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .guideline-content {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .guideline-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .guideline-icon {
    color: #00a859;
  }

  .guideline-header h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .guideline-body {
    color: #374151;
    line-height: 1.8;
  }

  .guideline-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 2rem 0 1rem 0;
  }

  .guideline-body h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 1.5rem 0 0.75rem 0;
  }

  .guideline-body ul {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .guideline-body li {
    margin: 0.5rem 0;
  }

  .guideline-body strong {
    color: #1f2937;
    font-weight: 600;
  }

  @media (max-width: 1024px) {
    .guidelines-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .guidelines-layout {
      padding: 1rem;
    }

    .guideline-content {
      padding: 1.5rem;
    }
  }
</style>

