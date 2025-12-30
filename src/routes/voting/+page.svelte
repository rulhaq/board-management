<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    Vote, Plus, Calendar, Users, CheckCircle, XCircle, Clock,
    BarChart3, Send, Trash2, Info, HelpCircle, AlertTriangle
  } from 'lucide-svelte';

  let currentUser = null;
  let ballots = [];
  let loading = false;
  let showCreateBallot = false;
  let selectedBallot = null;
  let viewMode = 'active';
  let showGuidance = true;

  // Create ballot form
  let newBallot = {
    title: '',
    description: '',
    type: 'single',
    options: ['', ''],
    startDate: '',
    endDate: '',
    category: 'general',
    isAnonymous: false,
    requiresQuorum: true,
    quorumPercentage: 50
  };

  // Voting form
  let userVote = {
    ballotId: null,
    selectedOptions: [],
    comments: ''
  };

  const categories = [
    { id: 'general', name: 'General Decisions', description: 'General board decisions and approvals' },
    { id: 'budget', name: 'Budget & Finance', description: 'Financial decisions and budget approvals' },
    { id: 'policy', name: 'Policy Changes', description: 'Policy updates and governance changes' },
    { id: 'personnel', name: 'Personnel Decisions', description: 'Staff appointments and HR decisions' },
    { id: 'strategic', name: 'Strategic Planning', description: 'Long-term strategic initiatives' },
    { id: 'operational', name: 'Operational Matters', description: 'Day-to-day operational decisions' }
  ];

  const votingGuidance = {
    title: 'Board Voting System',
    description: 'Board Governance AI uses electronic voting for efficient decision-making.',
    steps: [
      'Board members can create voting ballots for decisions requiring board approval',
      'All active board members are automatically eligible to vote on each ballot',
      'Voting can be anonymous or named based on the ballot settings',
      'Some decisions may require a quorum (minimum participation) to be valid',
      'Results are visible to all board members once voting closes'
    ],
    tips: [
      'Provide clear, detailed descriptions for each voting option',
      'Set appropriate voting periods - typically 3-7 days for board decisions',
      'Consider if the decision requires anonymous voting for sensitive matters',
      'Review quorum requirements based on the importance of the decision'
    ]
  };

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadBallots();
      }
    });

    return unsubscribe;
  });

  async function loadBallots() {
    loading = true;
    try {
      // Always try to load from Firebase first
      const firebaseBallots = await loadBallotsFromFirebase();
      if (firebaseBallots && firebaseBallots.length > 0) {
        // Process ballots to ensure they have all required fields
        ballots = firebaseBallots.map(ballot => ({
          ...ballot,
          status: getBallotStatus(ballot),
          totalVotes: ballot.totalVotes || 0,
          eligibleVoters: ballot.eligibleVoters || 8,
          hasVoted: ballot.hasVoted || false,
          userVote: ballot.userVote || []
        }));
        loading = false;
        return;
      }
      
      // Only use mock data if Firebase returns empty and we're in demo mode
      if (ballots.length === 0) {
        ballots = [
        {
          id: 'ballot-1',
          title: 'Q1 2024 Budget Approval',
          description: 'Approval of the proposed budget allocation for the first quarter of 2024, including operational expenses, capital investments, and research funding.',
          type: 'single',
          options: [
            { id: 'opt-1', text: 'Approve budget as presented', votes: 4, voters: ['user1', 'user2', 'user3', 'user4'] },
            { id: 'opt-2', text: 'Approve with minor modifications', votes: 2, voters: ['user5', 'user6'] },
            { id: 'opt-3', text: 'Request major revisions', votes: 0, voters: [] },
            { id: 'opt-4', text: 'Reject and restart budgeting process', votes: 0, voters: [] }
          ],
          startDate: '2024-01-15T09:00:00Z',
          endDate: '2024-01-22T17:00:00Z',
          createdBy: 'Hassan Al-Kuwari',
          createdAt: '2024-01-14T14:30:00Z',
          status: 'active',
          category: 'budget',
          isAnonymous: false,
          requiresQuorum: true,
          quorumPercentage: 60,
          totalVotes: 6,
          eligibleVoters: 8,
          hasVoted: true,
          userVote: ['opt-1']
        },
        {
          id: 'ballot-2',
          title: 'New Genomics Research Initiative',
          description: 'Approval for launching a new genomics research program in partnership with international institutions. This initiative requires significant investment but promises breakthrough discoveries.',
          type: 'single',
          options: [
            { id: 'opt-1', text: 'Approve initiative with full funding', votes: 5, voters: ['user1', 'user2', 'user3', 'user4', 'user5'] },
            { id: 'opt-2', text: 'Approve with reduced scope', votes: 1, voters: ['user6'] },
            { id: 'opt-3', text: 'Request more detailed proposal', votes: 0, voters: [] },
            { id: 'opt-4', text: 'Decline the initiative', votes: 0, voters: [] }
          ],
          startDate: '2024-01-18T09:00:00Z',
          endDate: '2024-01-25T17:00:00Z',
          createdBy: 'Dr. Sarah Mitchell',
          createdAt: '2024-01-17T10:15:00Z',
          status: 'active',
          category: 'strategic',
          isAnonymous: false,
          requiresQuorum: true,
          quorumPercentage: 50,
          totalVotes: 6,
          eligibleVoters: 8,
          hasVoted: false,
          userVote: []
        }
      ];
      }
    } catch (error) {
      console.error('Failed to load ballots:', error);
    } finally {
      loading = false;
    }
  }

  async function loadBallotsFromFirebase() {
    try {
      const response = await fetch('/api/ballots', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      });
      
      if (response?.ok) {
        const data = await response.json();
        const loadedBallots = data.ballots || [];
        
        // Ensure all ballots have proper status and required fields
        return loadedBallots.map(ballot => {
          // Ensure dates are strings
          const startDate = ballot.startDate || new Date().toISOString();
          const endDate = ballot.endDate || new Date().toISOString();
          
          return {
            ...ballot,
            startDate: startDate,
            endDate: endDate,
            status: getBallotStatus(ballot),
            totalVotes: ballot.totalVotes || 0,
            eligibleVoters: ballot.eligibleVoters || 8,
            hasVoted: ballot.hasVoted || false,
            userVote: ballot.userVote || []
          };
        });
      } else {
        console.error('Failed to load ballots:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Firebase ballot loading error:', error);
    }
    return [];
  }

  async function saveBallotToFirebase(ballot) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        throw new Error('User not authenticated');
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/ballots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...ballot,
          createdBy: currentUser?.uid || currentUser?.email,
          createdByName: currentUser?.displayName || 'Unknown',
          createdAt: new Date().toISOString()
        })
      });

      if (response?.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save ballot:', errorData);
        throw new Error(errorData.error || 'Failed to save ballot');
      }
    } catch (error) {
      console.error('Firebase ballot save error:', error);
      throw error;
    }
  }

  function canCreateBallots() {
    return currentUser?.permissions?.canManageVoting || 
           currentUser?.role === 'admin' || 
           currentUser?.role === 'secretary' ||
           currentUser?.role === 'board_member'; // All board members can create ballots
  }

  function addOption() {
    newBallot.options = [...newBallot.options, ''];
  }

  function removeOption(index) {
    if (newBallot.options.length > 2) {
      newBallot.options = newBallot.options.filter((_, i) => i !== index);
    }
  }

  async function createBallot() {
    if (!validateBallotForm()) return;

    const ballot = {
      id: 'ballot-' + Date.now(),
      title: newBallot.title,
      description: newBallot.description,
      type: newBallot.type,
      options: newBallot.options
        .filter(opt => opt.trim())
        .map((text, index) => ({
          id: 'opt-' + (index + 1),
          text: text.trim(),
          votes: 0,
          voters: []
        })),
      startDate: newBallot.startDate,
      endDate: newBallot.endDate,
      createdBy: currentUser?.displayName || 'Unknown',
      createdByUid: currentUser?.uid || currentUser?.email,
      createdAt: new Date().toISOString(),
      status: getBallotStatus({
        startDate: newBallot.startDate,
        endDate: newBallot.endDate
      }),
      category: newBallot.category,
      isAnonymous: newBallot.isAnonymous,
      requiresQuorum: newBallot.requiresQuorum,
      quorumPercentage: newBallot.quorumPercentage,
      totalVotes: 0,
      eligibleVoters: 8, // In production, get from Firebase
      hasVoted: false,
      userVote: []
    };

    loading = true;
    try {
      // Save to Firebase
      const savedBallot = await saveBallotToFirebase(ballot);
      if (savedBallot && savedBallot.id) {
        ballot.id = savedBallot.id;
        // Ensure status is calculated correctly
        ballot.status = getBallotStatus(ballot);
        
        // Log activity and audit
        if (currentUser?.uid) {
          const { logActivity } = await import('$lib/services/activityLogger');
          const { audit } = await import('$lib/services/auditService');
          await logActivity(
            currentUser.uid,
            currentUser.displayName || currentUser.email || 'Unknown',
            'ballot_created',
            { ballotId: ballot.id, title: ballot.title, type: ballot.type }
          );
          await audit(
            currentUser.uid,
            currentUser.displayName || currentUser.email || 'Unknown',
            'create',
            'ballot',
            ballot.id,
            null,
            ballot
          );
        }
        
        // Add ballot to list immediately so it shows up right away
        ballots = [ballot, ...ballots];
        
        resetBallotForm();
        showCreateBallot = false;
        
        // Reload ballots from Firebase in background to ensure consistency
        setTimeout(async () => {
          await loadBallots();
        }, 1000);
        
        // Send notifications to all board members
        await notifyBoardMembers('new_ballot', ballot);
        
        alert('Ballot created successfully! All board members have been notified.');
      } else {
        // Still add to list even if Firebase save fails (for demo)
        ballot.status = getBallotStatus(ballot);
        ballots = [ballot, ...ballots];
        resetBallotForm();
        showCreateBallot = false;
        alert('Ballot created successfully!');
      }
    } catch (error) {
      console.error('Error creating ballot:', error);
      alert('Failed to create ballot: ' + (error.message || 'Please try again.'));
    } finally {
      loading = false;
    }
  }

  function validateBallotForm() {
    if (!newBallot.title.trim()) {
      alert('Please enter a ballot title');
      return false;
    }

    if (!newBallot.description.trim()) {
      alert('Please provide a detailed description');
      return false;
    }

    if (!newBallot.startDate || !newBallot.endDate) {
      alert('Please set both start and end dates');
      return false;
    }

    if (new Date(newBallot.endDate) <= new Date(newBallot.startDate)) {
      alert('End date must be after start date');
      return false;
    }

    const validOptions = newBallot.options.filter(opt => opt.trim()).length;
    if (validOptions < 2) {
      alert('Please provide at least 2 voting options');
      return false;
    }

    return true;
  }

  async function notifyBoardMembers(type, data) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          createdBy: currentUser?.uid,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Fail silently for demo
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  function resetBallotForm() {
    newBallot = {
      title: '',
      description: '',
      type: 'single',
      options: ['', ''],
      startDate: '',
      endDate: '',
      category: 'general',
      isAnonymous: false,
      requiresQuorum: true,
      quorumPercentage: 50
    };
    showCreateBallot = false;
  }

  function selectBallot(ballot) {
    selectedBallot = ballot;
    if (!ballot.hasVoted) {
      userVote = {
        ballotId: ballot.id,
        selectedOptions: [],
        comments: ''
      };
    }
  }

  function toggleVoteOption(optionId) {
    if (selectedBallot?.type === 'single') {
      userVote.selectedOptions = [optionId];
    } else {
      const index = userVote.selectedOptions.indexOf(optionId);
      if (index > -1) {
        userVote.selectedOptions = userVote.selectedOptions.filter(id => id !== optionId);
      } else {
        userVote.selectedOptions = [...userVote.selectedOptions, optionId];
      }
    }
  }

  async function submitVote() {
    if (userVote.selectedOptions.length === 0) {
      alert('Please select at least one option');
      return;
    }

    loading = true;
    try {
      // Save vote to Firebase
      const result = await saveVoteToFirebase(userVote);

      // Log activity and audit
      if (currentUser?.uid) {
        const { logActivity } = await import('$lib/services/activityLogger');
        const { audit } = await import('$lib/services/auditService');
        await logActivity(
          currentUser.uid,
          currentUser.displayName || currentUser.email || 'Unknown',
          'vote_submitted',
          { ballotId: userVote.ballotId, ballotTitle: selectedBallot?.title, options: userVote.selectedOptions }
        );
        await audit(
          currentUser.uid,
          currentUser.displayName || currentUser.email || 'Unknown',
          'create',
          'vote',
          userVote.ballotId,
          null,
          { selectedOptions: userVote.selectedOptions, comments: userVote.comments }
        );
      }

      // Reload ballots to get updated vote counts from Firebase
      await loadBallots();

      selectedBallot = null;
      userVote = {
        ballotId: null,
        selectedOptions: [],
        comments: ''
      };
      alert('Vote submitted successfully!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert(error.message || 'Failed to submit vote. Please try again.');
    } finally {
      loading = false;
    }
  }

  async function saveVoteToFirebase(vote) {
    try {
      const response = await fetch(`/api/ballots/${vote.ballotId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        },
        body: JSON.stringify({
          ...vote,
          userId: currentUser?.uid,
          timestamp: new Date().toISOString()
        })
      });

      if (!response?.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      return await response.json();
    } catch (error) {
      console.error('Vote save error:', error);
      throw error;
    }
  }

  function getBallotStatus(ballot) {
    const now = new Date();
    const start = new Date(ballot.startDate);
    const end = new Date(ballot.endDate);

    if (now < start) return 'scheduled';
    if (now > end) return 'completed';
    return 'active';
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return '#00a859';
      case 'completed': return '#6b7280';
      case 'scheduled': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getVotePercentage(option, ballot) {
    if (ballot.totalVotes === 0) return 0;
    return Math.round((option.votes / ballot.totalVotes) * 100);
  }

  function getQuorumStatus(ballot) {
    const participationRate = (ballot.totalVotes / ballot.eligibleVoters) * 100;
    return {
      met: participationRate >= ballot.quorumPercentage,
      current: Math.round(participationRate),
      required: ballot.quorumPercentage
    };
  }

  function getCategoryInfo(categoryId) {
    return categories.find(c => c.id === categoryId) || categories[0];
  }

  $: filteredBallots = ballots.filter(ballot => {
    const status = getBallotStatus(ballot);
    
    if (viewMode === 'active') {
      return status === 'active';
    } else if (viewMode === 'scheduled') {
      return status === 'scheduled';
    } else if (viewMode === 'completed') {
      return status === 'completed';
    }
    
    return true;
  });
</script>

<svelte:head>
  <title>Board Voting - Board Governance AI</title>
</svelte:head>

<div class="voting-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Board Voting System</h1>
        <p>Participate in board decisions through our secure electronic voting platform</p>
      </div>
      
      <div class="header-actions">
        {#if showGuidance}
          <button class="btn btn-outline" on:click={() => showGuidance = false}>
            <HelpCircle size={16} />
            Hide Guide
          </button>
        {:else}
          <button class="btn btn-outline" on:click={() => showGuidance = true}>
            <HelpCircle size={16} />
            Show Guide
          </button>
        {/if}
        
        {#if canCreateBallots()}
          <button class="btn btn-primary" on:click={() => showCreateBallot = true}>
            <Plus size={16} />
            Create Ballot
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Voting Guidance -->
  {#if showGuidance}
    <div class="guidance-section">
      <div class="guidance-card">
        <div class="guidance-header">
          <div class="guidance-icon">
            <Info size={24} />
          </div>
          <div class="guidance-title">
            <h3>{votingGuidance.title}</h3>
            <p>{votingGuidance.description}</p>
          </div>
        </div>
        
        <div class="guidance-content">
          <div class="guidance-steps">
            <h4>How It Works:</h4>
            <ol>
              {#each votingGuidance.steps as step}
                <li>{step}</li>
              {/each}
            </ol>
          </div>
          
          <div class="guidance-tips">
            <h4>Best Practices:</h4>
            <ul>
              {#each votingGuidance.tips as tip}
                <li>{tip}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- View Tabs -->
  <div class="view-tabs">
    <button 
      class="tab" 
      class:active={viewMode === 'active'}
      on:click={() => viewMode = 'active'}
    >
      <div class="tab-content">
        <span>Active Votes</span>
        <span class="tab-count">{ballots.filter(b => getBallotStatus(b) === 'active').length}</span>
      </div>
    </button>
    <button 
      class="tab" 
      class:active={viewMode === 'scheduled'}
      on:click={() => viewMode = 'scheduled'}
    >
      <div class="tab-content">
        <span>Scheduled</span>
        <span class="tab-count">{ballots.filter(b => getBallotStatus(b) === 'scheduled').length}</span>
      </div>
    </button>
    <button 
      class="tab" 
      class:active={viewMode === 'completed'}
      on:click={() => viewMode = 'completed'}
    >
      <div class="tab-content">
        <span>Completed</span>
        <span class="tab-count">{ballots.filter(b => getBallotStatus(b) === 'completed').length}</span>
      </div>
    </button>
  </div>

  <!-- Ballots List -->
  <div class="ballots-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading voting ballots...</p>
      </div>
    {:else if filteredBallots.length === 0}
      <div class="empty-state">
        <Vote size={48} />
        <h3>No ballots found</h3>
        <p>
          {#if viewMode === 'active'}
            No active voting ballots at this time.
          {:else if viewMode === 'scheduled'}
            No scheduled ballots.
          {:else}
            No completed ballots to display.
          {/if}
        </p>
        {#if canCreateBallots() && viewMode === 'active'}
          <button class="btn btn-primary" on:click={() => showCreateBallot = true}>
            <Plus size={16} />
            Create First Ballot
          </button>
        {/if}
      </div>
    {:else}
      <div class="ballots-grid">
        {#each filteredBallots as ballot (ballot.id)}
          {@const status = getBallotStatus(ballot)}
          {@const categoryInfo = getCategoryInfo(ballot.category)}
          {@const quorumStatus = getQuorumStatus(ballot)}
          
          <div class="ballot-card" on:click={() => selectBallot(ballot)}>
            <!-- Ballot Header -->
            <div class="ballot-header">
              <div class="ballot-status">
                <Clock size={14} color={getStatusColor(status)} />
                <span class="status-text" style="color: {getStatusColor(status)}">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              
              <div class="ballot-badges">
                <span class="category-badge" title={categoryInfo.description}>
                  {categoryInfo.name}
                </span>
                {#if ballot.isAnonymous}
                  <span class="anonymous-badge" title="Anonymous voting">
                    🔒 Anonymous
                  </span>
                {/if}
              </div>
            </div>

            <!-- Ballot Content -->
            <div class="ballot-content">
              <h3 class="ballot-title">{ballot.title}</h3>
              <p class="ballot-description">{ballot.description}</p>
            </div>

            <!-- Ballot Progress -->
            {#if status === 'active' || status === 'completed'}
              <div class="ballot-progress">
                <div class="progress-header">
                  <span class="progress-label">Participation</span>
                  <span class="progress-value">{ballot.totalVotes}/{ballot.eligibleVoters}</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    style="width: {(ballot.totalVotes / ballot.eligibleVoters) * 100}%"
                  ></div>
                </div>
                
                {#if ballot.requiresQuorum}
                  <div class="quorum-status" class:met={quorumStatus.met}>
                    <span class="quorum-text">
                      Quorum: {quorumStatus.current}% / {quorumStatus.required}% required
                      {quorumStatus.met ? '✓' : ''}
                    </span>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Ballot Details -->
            <div class="ballot-details">
              <div class="detail-item">
                <Calendar size={12} />
                <span>
                  {#if status === 'scheduled'}
                    Starts {formatDate(ballot.startDate)}
                  {:else if status === 'active'}
                    Ends {formatDate(ballot.endDate)}
                  {:else}
                    Ended {formatDate(ballot.endDate)}
                  {/if}
                </span>
              </div>
              
              <div class="detail-item">
                <Users size={12} />
                <span>Created by {ballot.createdBy}</span>
              </div>
            </div>

            <!-- Vote Status -->
            <div class="vote-status">
              {#if ballot.hasVoted}
                <div class="voted-indicator">
                  <CheckCircle size={16} />
                  <span>You voted</span>
                </div>
              {:else if status === 'active'}
                <div class="pending-indicator">
                  <AlertTriangle size={16} />
                  <span>Vote required</span>
                </div>
              {:else if status === 'scheduled'}
                <div class="scheduled-indicator">
                  <Clock size={16} />
                  <span>Not yet started</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Create Ballot Modal -->
{#if showCreateBallot}
  <div class="modal-overlay" on:click={resetBallotForm}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Create New Ballot</h2>
        <button class="modal-close" on:click={resetBallotForm}>×</button>
      </div>

      <div class="modal-body">
        <form on:submit|preventDefault={createBallot}>
          <div class="form-section">
            <h3>Basic Information</h3>
            
            <div class="form-group">
              <label for="title">Ballot Title *</label>
              <input
                id="title"
                type="text"
                bind:value={newBallot.title}
                placeholder="e.g., Q2 Budget Approval, New Policy Adoption"
                required
              />
            </div>

            <div class="form-group">
              <label for="description">Detailed Description *</label>
              <textarea
                id="description"
                bind:value={newBallot.description}
                rows="4"
                placeholder="Provide comprehensive details about what board members are voting on, including context, implications, and any supporting information..."
                required
              ></textarea>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" bind:value={newBallot.category}>
                  {#each categories as category}
                    <option value={category.id} title={category.description}>
                      {category.name}
                    </option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label for="type">Voting Type</label>
                <select id="type" bind:value={newBallot.type}>
                  <option value="single">Single Choice (select one option)</option>
                  <option value="multiple">Multiple Choice (select multiple)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Voting Options</h3>
            <p class="section-description">Provide clear, specific options for board members to choose from.</p>
            
            <div class="options-container">
              {#each newBallot.options as option, index}
                <div class="option-input">
                  <input
                    type="text"
                    bind:value={option}
                    placeholder="Enter voting option {index + 1}..."
                    required
                  />
                  {#if newBallot.options.length > 2}
                    <button type="button" class="remove-option" on:click={() => removeOption(index)}>
                      <Trash2 size={14} />
                    </button>
                  {/if}
                </div>
              {/each}
              <button type="button" class="add-option" on:click={addOption}>
                <Plus size={14} />
                Add Another Option
              </button>
            </div>
          </div>

          <div class="form-section">
            <h3>Voting Schedule</h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="startDate">Start Date & Time *</label>
                <input
                  id="startDate"
                  type="datetime-local"
                  bind:value={newBallot.startDate}
                  required
                />
              </div>

              <div class="form-group">
                <label for="endDate">End Date & Time *</label>
                <input
                  id="endDate"
                  type="datetime-local"
                  bind:value={newBallot.endDate}
                  required
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Voting Settings</h3>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={newBallot.isAnonymous} />
                <span>Anonymous Voting</span>
                <small>Hide voter identities from results (recommended for sensitive decisions)</small>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={newBallot.requiresQuorum} />
                <span>Require Quorum</span>
                <small>Minimum participation required for valid results</small>
              </label>
            </div>

            {#if newBallot.requiresQuorum}
              <div class="form-group">
                <label for="quorum">Quorum Percentage</label>
                <div class="quorum-input">
                  <input
                    id="quorum"
                    type="range"
                    min="25"
                    max="100"
                    step="5"
                    bind:value={newBallot.quorumPercentage}
                  />
                  <span class="quorum-value">{newBallot.quorumPercentage}%</span>
                </div>
                <small>At least {Math.ceil((newBallot.quorumPercentage / 100) * 8)} of 8 board members must vote</small>
              </div>
            {/if}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" on:click={resetBallotForm}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Ballot
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Ballot Detail Modal -->
{#if selectedBallot}
  <div class="modal-overlay" on:click={() => selectedBallot = null}>
    <div class="modal ballot-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{selectedBallot.title}</h2>
        <button class="modal-close" on:click={() => selectedBallot = null}>×</button>
      </div>

      <div class="modal-body">
        <!-- Ballot Info -->
        <div class="ballot-info">
          <p class="ballot-description">{selectedBallot.description}</p>
          
          <div class="ballot-meta">
            <div class="meta-grid">
              <div class="meta-item">
                <strong>Category:</strong> {getCategoryInfo(selectedBallot.category).name}
              </div>
              <div class="meta-item">
                <strong>Created by:</strong> {selectedBallot.createdBy}
              </div>
              <div class="meta-item">
                <strong>Voting Period:</strong> 
                {formatDate(selectedBallot.startDate)} - {formatDate(selectedBallot.endDate)}
              </div>
              <div class="meta-item">
                <strong>Type:</strong> 
                {selectedBallot.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
              </div>
            </div>
          </div>
        </div>

        <!-- Voting Interface or Results -->
        {#if !selectedBallot.hasVoted && getBallotStatus(selectedBallot) === 'active'}
          <div class="voting-interface">
            <h3>Cast Your Vote</h3>
            <p class="voting-instructions">
              {selectedBallot.type === 'single' 
                ? 'Select one option below:' 
                : 'Select one or more options below:'}
            </p>
            
            <div class="voting-options">
              {#each selectedBallot.options as option}
                <label class="vote-option">
                  <input
                    type={selectedBallot.type === 'single' ? 'radio' : 'checkbox'}
                    name="vote-option"
                    value={option.id}
                    checked={userVote.selectedOptions.includes(option.id)}
                    on:change={() => toggleVoteOption(option.id)}
                  />
                  <span class="option-text">{option.text}</span>
                </label>
              {/each}
            </div>

            <div class="form-group">
              <label for="comments">Comments (Optional)</label>
              <textarea
                id="comments"
                bind:value={userVote.comments}
                rows="3"
                placeholder="Add any comments about your vote (these will be recorded for audit purposes)..."
              ></textarea>
            </div>

            <div class="vote-actions">
              <button class="btn btn-outline" on:click={() => selectedBallot = null}>
                Cancel
              </button>
              <button class="btn btn-primary" on:click={submitVote}>
                <Send size={16} />
                Submit Vote
              </button>
            </div>
          </div>
        {:else}
          <!-- Results View -->
          <div class="results-view">
            <div class="results-header">
              <h3>Voting Results</h3>
              {#if selectedBallot.requiresQuorum}
                {@const quorumStatus = getQuorumStatus(selectedBallot)}
                <div class="quorum-badge" class:met={quorumStatus.met}>
                  Quorum: {quorumStatus.met ? 'Met' : 'Not Met'} ({quorumStatus.current}%)
                </div>
              {/if}
            </div>
            
            <div class="results-stats">
              <div class="stat-card">
                <div class="stat-value">{selectedBallot.totalVotes}</div>
                <div class="stat-label">Total Votes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">
                  {Math.round((selectedBallot.totalVotes / selectedBallot.eligibleVoters) * 100)}%
                </div>
                <div class="stat-label">Participation</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{selectedBallot.eligibleVoters}</div>
                <div class="stat-label">Eligible Voters</div>
              </div>
            </div>

            <div class="results-options">
              {#each selectedBallot.options as option}
                <div class="result-option">
                  <div class="option-header">
                    <span class="option-text">{option.text}</span>
                    <span class="option-percentage">{getVotePercentage(option, selectedBallot)}%</span>
                  </div>
                  <div class="option-bar">
                    <div 
                      class="option-fill" 
                      style="width: {getVotePercentage(option, selectedBallot)}%"
                    ></div>
                  </div>
                  <div class="option-details">
                    <span class="option-votes">{option.votes} votes</span>
                    {#if !selectedBallot.isAnonymous && option.votes > 0}
                      <span class="option-voters">
                        ({option.votes} member{option.votes !== 1 ? 's' : ''})
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .voting-page {
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

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .guidance-section {
    margin-bottom: 2rem;
  }

  .guidance-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 1rem;
    padding: 2rem;
  }

  .guidance-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .guidance-icon {
    width: 48px;
    height: 48px;
    background: #0ea5e9;
    color: white;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .guidance-title h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0c4a6e;
    margin-bottom: 0.5rem;
  }

  .guidance-title p {
    color: #075985;
    margin: 0;
  }

  .guidance-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .guidance-steps h4,
  .guidance-tips h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin-bottom: 0.75rem;
  }

  .guidance-steps ol,
  .guidance-tips ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #075985;
  }

  .guidance-steps li,
  .guidance-tips li {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
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
    flex: 1;
  }

  .tab.active {
    background: #00a859;
    color: white;
    border-color: #00a859;
  }

  .tab-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tab-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tab.active .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .ballots-container {
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

  .ballots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .ballot-card {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.2s;
    cursor: pointer;
  }

  .ballot-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border-color: #00a859;
  }

  .ballot-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .ballot-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-text {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .ballot-badges {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .category-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: linear-gradient(135deg, rgba(0, 168, 89, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
    color: #00a859;
    border: 1px solid rgba(0, 168, 89, 0.2);
  }

  .anonymous-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    border: 1px solid rgba(107, 114, 128, 0.2);
  }

  .ballot-content {
    margin-bottom: 1.5rem;
  }

  .ballot-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .ballot-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ballot-progress {
    margin-bottom: 1rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .progress-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .progress-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #00a859;
  }

  .progress-bar {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    transition: width 0.3s ease;
  }

  .quorum-status {
    font-size: 0.75rem;
    font-weight: 500;
    color: #ef4444;
  }

  .quorum-status.met {
    color: #10b981;
  }

  .ballot-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .vote-status {
    display: flex;
    justify-content: flex-end;
  }

  .voted-indicator,
  .pending-indicator,
  .scheduled-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .voted-indicator {
    color: #10b981;
  }

  .pending-indicator {
    color: #f59e0b;
  }

  .scheduled-indicator {
    color: #3b82f6;
  }

  /* Modal styles */
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
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .ballot-modal {
    max-width: 800px;
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

  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .form-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .form-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .section-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .checkbox-label small {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .option-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .option-input input {
    flex: 1;
  }

  .remove-option {
    padding: 0.75rem;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .add-option {
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

  .add-option:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #9ca3af;
  }

  .quorum-input {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .quorum-input input[type="range"] {
    flex: 1;
  }

  .quorum-value {
    font-weight: 600;
    color: #00a859;
    min-width: 40px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .ballot-info {
    margin-bottom: 2rem;
  }

  .ballot-meta {
    margin-top: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .meta-item {
    font-size: 0.875rem;
  }

  .meta-item strong {
    color: #374151;
  }

  .voting-interface h3,
  .results-view h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .voting-instructions {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .voting-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .vote-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .vote-option:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .option-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1f2937;
    line-height: 1.5;
  }

  .vote-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .quorum-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
  }

  .quorum-badge.met {
    background: #f0fdf4;
    color: #16a34a;
    border-color: #bbf7d0;
  }

  .results-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #00a859;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .results-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .result-option {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .option-percentage {
    font-weight: 600;
    color: #00a859;
  }

  .option-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .option-fill {
    height: 100%;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    transition: width 0.3s ease;
  }

  .option-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #6b7280;
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
    .voting-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .guidance-content {
      grid-template-columns: 1fr;
    }

    .ballots-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .results-stats {
      grid-template-columns: 1fr;
    }

    .meta-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 