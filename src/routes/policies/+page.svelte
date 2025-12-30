<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { FileText, Shield, Lock, Users, AlertCircle, CheckCircle } from 'lucide-svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;

  const policies = [
    {
      id: 'data-protection',
      title: 'Data Protection Policy',
      category: 'Security',
      icon: Shield,
      lastUpdated: '2024-01-15',
      description: 'Comprehensive guidelines for protecting sensitive board information and member data.',
      content: `
        <h2>Data Protection Policy</h2>
        <p>This policy outlines how Board Governance AI protects and manages sensitive information.</p>
        
        <h3>1. Data Collection</h3>
        <p>We collect only necessary information required for board governance operations:</p>
        <ul>
          <li>Member identification and contact information</li>
          <li>Meeting records and minutes</li>
          <li>Document access logs</li>
          <li>Voting records</li>
        </ul>

        <h3>2. Data Storage</h3>
        <p>All data is encrypted at rest and in transit using industry-standard encryption protocols.</p>

        <h3>3. Access Controls</h3>
        <p>Access to sensitive data is restricted based on role-based permissions and requires multi-factor authentication.</p>

        <h3>4. Data Retention</h3>
        <p>Data is retained according to legal and regulatory requirements. Records are archived securely and can be deleted upon request.</p>

        <h3>5. Breach Notification</h3>
        <p>In the event of a data breach, affected parties will be notified within 72 hours as required by law.</p>
      `
    },
    {
      id: 'access-control',
      title: 'Access Control Policy',
      category: 'Security',
      icon: Lock,
      lastUpdated: '2024-01-10',
      description: 'Rules governing user access, permissions, and authentication requirements.',
      content: `
        <h2>Access Control Policy</h2>
        <p>This policy defines access control mechanisms and user permission management.</p>
        
        <h3>1. Authentication Requirements</h3>
        <ul>
          <li>Strong password requirements (minimum 12 characters)</li>
          <li>Multi-factor authentication (MFA) mandatory for all users</li>
          <li>Session timeout after 30 minutes of inactivity</li>
        </ul>

        <h3>2. Role-Based Access</h3>
        <p>Access is granted based on predefined roles:</p>
        <ul>
          <li><strong>Super Admin:</strong> Full system access (CTO only)</li>
          <li><strong>Admin:</strong> User management and system settings</li>
          <li><strong>Secretary:</strong> Meeting and document management</li>
          <li><strong>Board Member:</strong> View documents, participate in meetings and voting</li>
        </ul>

        <h3>3. Permission Management</h3>
        <p>Permissions are reviewed quarterly and can be modified by administrators based on role changes.</p>

        <h3>4. Audit Logging</h3>
        <p>All access attempts and actions are logged for security auditing purposes.</p>
      `
    },
    {
      id: 'document-management',
      title: 'Document Management Policy',
      category: 'Operations',
      icon: FileText,
      lastUpdated: '2024-01-20',
      description: 'Guidelines for document creation, storage, version control, and retention.',
      content: `
        <h2>Document Management Policy</h2>
        <p>This policy governs the lifecycle of board documents and records.</p>
        
        <h3>1. Document Classification</h3>
        <p>Documents are classified by confidentiality level:</p>
        <ul>
          <li><strong>Public:</strong> Available to all board members</li>
          <li><strong>Restricted:</strong> Limited to specific roles or committees</li>
          <li><strong>Confidential:</strong> Executive leadership only</li>
          <li><strong>Top Secret:</strong> Super admin access only</li>
        </ul>

        <h3>2. Version Control</h3>
        <p>All documents maintain version history. Changes are tracked with timestamps and user identification.</p>

        <h3>3. Retention Schedule</h3>
        <p>Documents are retained according to legal requirements:</p>
        <ul>
          <li>Meeting minutes: 7 years</li>
          <li>Financial records: 10 years</li>
          <li>Legal documents: Permanent</li>
        </ul>

        <h3>4. Document Approval</h3>
        <p>Documents require approval workflow before being marked as official records.</p>
      `
    },
    {
      id: 'meeting-conduct',
      title: 'Meeting Conduct Policy',
      category: 'Operations',
      icon: Users,
      lastUpdated: '2024-01-12',
      description: 'Standards for board meeting participation, recording, and documentation.',
      content: `
        <h2>Meeting Conduct Policy</h2>
        <p>This policy establishes standards for board meeting participation and documentation.</p>
        
        <h3>1. Meeting Attendance</h3>
        <ul>
          <li>Members are expected to attend all scheduled meetings</li>
          <li>Absences must be communicated in advance</li>
          <li>Quorum requirements must be met for official decisions</li>
        </ul>

        <h3>2. Meeting Recording</h3>
        <p>All meetings are recorded and transcribed. Recordings are stored securely and accessible only to authorized members.</p>

        <h3>3. Minutes Documentation</h3>
        <p>Minutes must be:</p>
        <ul>
          <li>Drafted within 48 hours of meeting</li>
          <li>Reviewed and approved by the Secretary</li>
          <li>Distributed to all members within 7 days</li>
        </ul>

        <h3>4. Confidentiality</h3>
        <p>Discussion content is confidential unless explicitly marked as public information.</p>
      `
    }
  ];

  let selectedPolicy = policies[0];
  let searchTerm = '';

  $: filteredPolicies = policies.filter(policy => 
    policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
</script>

<svelte:head>
  <title>Policies - Board Governance AI</title>
</svelte:head>


<div class="policies-container">
  <div class="header">
    <div class="header-content">
      <h1>Board Policies</h1>
      <p class="subtitle">Comprehensive governance policies and procedures</p>
    </div>
  </div>

  <div class="policies-layout">
    <!-- Sidebar -->
    <aside class="policies-sidebar">
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Search policies..." 
          bind:value={searchTerm}
          class="search-input"
        />
      </div>

      <div class="policy-list">
        {#each filteredPolicies as policy}
          <button
            class="policy-item"
            class:active={selectedPolicy.id === policy.id}
            on:click={() => selectedPolicy = policy}
          >
            <svelte:component this={policy.icon} size={20} />
            <div class="policy-item-content">
              <h3>{policy.title}</h3>
              <span class="policy-category">{policy.category}</span>
            </div>
          </button>
        {/each}
      </div>
    </aside>

    <!-- Main Content -->
    <main class="policy-content">
      <div class="policy-header">
        <div class="policy-title-section">
          <svelte:component this={selectedPolicy.icon} size={32} class="policy-icon" />
          <div>
            <h2>{selectedPolicy.title}</h2>
            <div class="policy-meta">
              <span class="meta-item">
                <CheckCircle size={16} />
                Last updated: {selectedPolicy.lastUpdated}
              </span>
              <span class="meta-item">
                <Shield size={16} />
                Category: {selectedPolicy.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="policy-description">
        <p>{selectedPolicy.description}</p>
      </div>

      <div class="policy-body">
        {@html selectedPolicy.content}
      </div>
    </main>
  </div>
</div>

<style>
  .policies-container {
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

  .policies-layout {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
  }

  .policies-sidebar {
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

  .policy-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .policy-item {
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

  .policy-item:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .policy-item.active {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.1);
  }

  .policy-item-content h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .policy-category {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .policy-content {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .policy-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .policy-title-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .policy-icon {
    color: #00a859;
    flex-shrink: 0;
  }

  .policy-title-section h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .policy-meta {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .policy-description {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border-left: 4px solid #00a859;
  }

  .policy-description p {
    margin: 0;
    color: #374151;
    font-size: 1rem;
    line-height: 1.6;
  }

  .policy-body {
    color: #374151;
    line-height: 1.8;
  }

  .policy-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 2rem 0 1rem 0;
  }

  .policy-body h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 1.5rem 0 0.75rem 0;
  }

  .policy-body p {
    margin: 0.75rem 0;
  }

  .policy-body ul {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .policy-body li {
    margin: 0.5rem 0;
  }

  .policy-body strong {
    color: #1f2937;
    font-weight: 600;
  }

  @media (max-width: 1024px) {
    .policies-layout {
      grid-template-columns: 1fr;
    }

    .policies-sidebar {
      order: 2;
    }

    .policy-content {
      order: 1;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .policies-layout {
      padding: 1rem;
    }

    .policy-content {
      padding: 1.5rem;
    }

    .policy-meta {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style>

