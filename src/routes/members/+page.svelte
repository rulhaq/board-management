<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { Mail, Phone, Calendar, Award, User, Edit3, Plus, MapPin, Briefcase, Users, MessageSquare } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { activityLogger } from '$lib/services/activityLogger';
  import { auditService } from '$lib/services/auditService';

  let members = [];
  let loading = true;
  let currentUser = null;
  let showAddMember = false;
  let editingMember = null;

  // New member form
  let newMember = {
    displayName: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [],
    joinDate: ''
  };

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadMembers();
      }
    });

    return unsubscribe;
  });

  async function loadMembers() {
    loading = true;
    try {
      // Always load from Firebase first
      const firebaseMembers = await loadMembersFromFirebase();
      if (firebaseMembers && firebaseMembers.length > 0) {
        // Process members to ensure they have all required fields
        members = firebaseMembers.map(member => ({
          ...member,
          position: member.position || 'Board Member',
          department: member.department || 'Board',
          role: member.role || 'board_member',
          isActive: member.status === 'active' || member.isActive !== false,
          joinDate: member.joinedDate || member.joinDate || new Date().toISOString(),
          lastActive: member.lastActive || new Date().toISOString(),
          specialties: member.specialties || [],
          bio: member.bio || '',
          phone: member.phone || '',
          avatar: member.avatar || null
        }));
        loading = false;
        return;
      }
      
      // Only use empty array if Firebase returns nothing (no fallback mock data)
      members = [];
    } catch (error) {
      console.error('Failed to load members:', error);
      members = [];
    } finally {
      loading = false;
    }
  }

  async function loadMembersFromFirebase() {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        return [];
      }
      
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/members', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response?.ok) {
        const data = await response.json();
        return data.members || [];
      }
    } catch (error) {
      console.error('Firebase members loading error:', error);
    }
    return [];
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  function canManageMembers() {
    return currentUser?.permissions?.canManageUsers || currentUser?.role === 'admin';
  }

  function handleAddMember() {
    showAddMember = true;
    resetMemberForm();
  }

  function handleEditMember(member) {
    editingMember = member;
    newMember = { ...member };
    showAddMember = true;
  }

  function resetMemberForm() {
    newMember = {
      displayName: '',
      position: '',
      department: '',
      email: '',
      phone: '',
      bio: '',
      specialties: [],
      joinDate: '',
      role: 'board_member' // Default role
    };
    editingMember = null;
    showAddMember = false;
  }

  async function saveMember() {
    if (!validateMemberForm()) return;

    const memberData = {
      ...newMember,
      id: editingMember ? editingMember.id : 'member-' + Date.now(),
      role: newMember.role || 'board_member', // Use selected role or default
      isActive: true,
      lastActive: new Date().toISOString()
    };

    // Save to Firebase
    await saveMemberToFirebase(memberData);

    // Log activity and audit
    if (editingMember) {
      await activityLogger.logActivity(
        currentUser,
        'member_updated',
        'user',
        memberData.id,
        { memberName: memberData.displayName, role: memberData.role }
      );
      await auditService.logAudit(
        currentUser,
        'update',
        'user',
        memberData.id,
        memberData.displayName,
        { before: editingMember, after: memberData }
      );
      // Update existing member
      members = members.map(m => m.id === editingMember.id ? memberData : m);
    } else {
      await activityLogger.logActivity(
        currentUser,
        'member_created',
        'user',
        memberData.id,
        { memberName: memberData.displayName, role: memberData.role }
      );
      await auditService.logAudit(
        currentUser,
        'create',
        'user',
        memberData.id,
        memberData.displayName,
        { after: memberData }
      );
      // Add new member
      members = [memberData, ...members];
      
      // Send notification
      await notifyMemberAdded(memberData);
    }

    resetMemberForm();
    alert(editingMember ? 'Member updated successfully!' : 'Member added successfully!');
  }

  function validateMemberForm() {
    if (!newMember.displayName.trim()) {
      alert('Please enter member name');
      return false;
    }
    if (!newMember.email.trim()) {
      alert('Please enter email address');
      return false;
    }
    if (!newMember.position.trim()) {
      alert('Please enter position');
      return false;
    }
    return true;
  }

  async function saveMemberToFirebase(member) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        console.error('User not authenticated');
        return;
      }
      
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/members', {
        method: editingMember ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(member)
      });
      
      if (response.ok) {
        // Reload members from Firebase after save
        await loadMembers();
      }
    } catch (error) {
      console.error('Member save error:', error);
    }
  }

  async function notifyMemberAdded(member) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'member_added',
          data: member,
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getRoleDisplayName(role) {
    const roleNames = {
      admin: 'Administrator',
      secretary: 'Board Secretary', 
      board_member: 'Board Member'
    };
    return roleNames[role] || 'Board Member';
  }

  function addSpecialty() {
    if (newMember.specialties.length < 6) {
      newMember.specialties = [...newMember.specialties, ''];
    }
  }

  function removeSpecialty(index) {
    newMember.specialties = newMember.specialties.filter((_, i) => i !== index);
  }

  function startChat(member) {
    // Navigate to chat with pre-selected member for direct message
    const chatUrl = `/chat?member=${encodeURIComponent(member.displayName)}&id=${member.id}`;
    window.location.href = chatUrl;
  }
</script>

<svelte:head>
  <title>Board Members - Board Governance AI</title>
</svelte:head>

<div class="members-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Board Members</h1>
        <p>Meet the distinguished leaders guiding Board Governance AI</p>
      </div>
      
      {#if canManageMembers()}
        <div class="header-actions">
          <button class="btn btn-primary" on:click={handleAddMember}>
            <Plus size={16} />
            Add Member
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Members Grid -->
  <div class="members-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading board members...</p>
      </div>
    {:else if members.length === 0}
      <div class="empty-state">
        <Users size={48} />
        <h3>No members found</h3>
        <p>Board member profiles will appear here.</p>
        {#if canManageMembers()}
          <button class="btn btn-primary" on:click={handleAddMember}>
            <Plus size={16} />
            Add First Member
          </button>
        {/if}
      </div>
    {:else}
      <div class="members-grid">
        {#each members as member (member.id)}
          <div class="member-card">
            <!-- Member Header -->
            <div class="member-header">
              <div class="member-avatar">
                {#if member.avatar}
                  <img src={member.avatar} alt={member.displayName} />
                {:else}
                  <div class="avatar-placeholder">
                    {getInitials(member.displayName)}
                  </div>
                {/if}
                <div class="member-status" class:active={member.isActive}></div>
              </div>
              
              {#if canManageMembers()}
                <button class="edit-btn" on:click={() => handleEditMember(member)}>
                  <Edit3 size={16} />
                </button>
              {/if}
            </div>

            <!-- Member Info -->
            <div class="member-info">
              <h3 class="member-name">{member.displayName}</h3>
              <p class="member-position">{member.position}</p>
              <p class="member-department">{member.department}</p>
              <div class="member-role-badge">
                {getRoleDisplayName(member.role)}
              </div>
            </div>

            <!-- Member Bio -->
            <div class="member-bio">
              <p>{member.bio}</p>
            </div>

            <!-- Member Specialties -->
            {#if member.specialties && member.specialties.length > 0}
              <div class="member-specialties">
                <h4>Specialties</h4>
                <div class="specialties-list">
                  {#each member.specialties as specialty}
                    <span class="specialty-tag">{specialty}</span>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Member Contact -->
            <div class="member-contact">
              <div class="contact-item">
                <Mail size={14} />
                <a href="mailto:{member.email}">{member.email}</a>
              </div>
              
              {#if member.phone}
                <div class="contact-item">
                  <Phone size={14} />
                  <a href="tel:{member.phone}">{member.phone}</a>
                </div>
              {/if}
              
              <div class="contact-item">
                <Calendar size={14} />
                <span>Joined {formatDate(member.joinDate)}</span>
              </div>
            </div>

            <!-- Member Actions -->
            <div class="member-actions">
              <button class="chat-btn" on:click={() => startChat(member)} title="Start Chat">
                <MessageSquare size={16} />
                <span>Chat</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Add/Edit Member Modal -->
{#if showAddMember}
  <div class="modal-overlay" on:click={resetMemberForm}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
        <button class="modal-close" on:click={resetMemberForm}>×</button>
      </div>

      <div class="modal-body">
        <form on:submit|preventDefault={saveMember}>
          <div class="form-section">
            <h3>Basic Information</h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  bind:value={newMember.displayName}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div class="form-group">
                <label for="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  bind:value={newMember.email}
                  placeholder="email@boardgovernance.ai"
                  required
                />
              </div>

              <div class="form-group">
                <label for="position">Position *</label>
                <input
                  id="position"
                  type="text"
                  bind:value={newMember.position}
                  placeholder="e.g., Board Member, Administrator, Secretary"
                  required
                />
              </div>

              {#if canManageMembers()}
              <div class="form-group">
                <label for="role">Role *</label>
                <select
                  id="role"
                  bind:value={newMember.role}
                  required
                >
                  <option value="board_member">Board Member</option>
                  <option value="secretary">Secretary</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {/if}

              <div class="form-group">
                <label for="department">Department</label>
                <input
                  id="department"
                  type="text"
                  bind:value={newMember.department}
                  placeholder="e.g., Board, Administration, Governance"
                />
              </div>

              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  bind:value={newMember.phone}
                  placeholder="+974 4003 0000"
                />
              </div>

              <div class="form-group">
                <label for="joinDate">Join Date</label>
                <input
                  id="joinDate"
                  type="date"
                  bind:value={newMember.joinDate}
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Biography</h3>
            <div class="form-group">
              <label for="bio">Professional Background</label>
              <textarea
                id="bio"
                bind:value={newMember.bio}
                rows="4"
                placeholder="Provide a brief professional background and achievements..."
              ></textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Specialties & Expertise</h3>
            <div class="specialties-form">
              {#each newMember.specialties as specialty, index}
                <div class="specialty-input">
                  <input
                    type="text"
                    bind:value={specialty}
                    placeholder="Enter specialty or area of expertise"
                  />
                  <button type="button" class="remove-specialty" on:click={() => removeSpecialty(index)}>
                    ×
                  </button>
                </div>
              {/each}
              
              {#if newMember.specialties.length < 6}
                <button type="button" class="add-specialty" on:click={addSpecialty}>
                  <Plus size={14} />
                  Add Specialty
                </button>
              {/if}
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" on:click={resetMemberForm}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .members-page {
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

  .members-container {
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

  .members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 2rem;
  }

  .member-card {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 2rem;
    transition: all 0.2s;
    position: relative;
  }

  .member-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border-color: #00a859;
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .member-avatar {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .member-status {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    background: #9ca3af;
  }

  .member-status.active {
    background: #10b981;
  }

  .edit-btn {
    padding: 0.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    color: #00a859;
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.1);
  }

  .member-info {
    margin-bottom: 1.5rem;
  }

  .member-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .member-position {
    font-size: 1.125rem;
    font-weight: 600;
    color: #00a859;
    margin-bottom: 0.25rem;
  }

  .member-department {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .member-role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: linear-gradient(135deg, rgba(0, 168, 89, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
    color: #00a859;
    border: 1px solid rgba(0, 168, 89, 0.2);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .member-bio {
    margin-bottom: 1.5rem;
  }

  .member-bio p {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #4b5563;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .member-specialties {
    margin-bottom: 1.5rem;
  }

  .member-specialties h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
  }

  .specialties-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .specialty-tag {
    padding: 0.25rem 0.75rem;
    background: #f3f4f6;
    color: #374151;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .member-contact {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .contact-item a {
    color: #00a859;
    text-decoration: none;
    transition: color 0.2s;
  }

  .contact-item a:hover {
    color: #059669;
  }

  /* Modal Styles */
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
    max-width: 800px;
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
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .form-group textarea {
    resize: vertical;
  }

  .specialties-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .specialty-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .specialty-input input {
    flex: 1;
  }

  .remove-specialty {
    width: 32px;
    height: 32px;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .add-specialty {
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

  .add-specialty:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #9ca3af;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
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

  .member-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .chat-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
  }

  .chat-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 168, 89, 0.3);
  }

  @media (max-width: 768px) {
    .members-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .members-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  .member-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .chat-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
  }

  .chat-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 168, 89, 0.3);
  }
</style> 