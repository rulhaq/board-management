<script>
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { emailService } from '$lib/services/emailService';
  import MFASetup from '$lib/components/MFASetup.svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.userProfile;

  // Redirect if not admin
  $: if (userProfile && userProfile.role !== 'admin') {
    goto('/dashboard');
  }

  let users = [];
  let roles = [];
  let loading = true;
  let showCreateModal = false;
  let showEditModal = false;
  let selectedUser = null;
  let searchTerm = '';
  let statusFilter = 'all';
  let roleFilter = 'all';

  // New user form
  let newUser = {
    email: '',
    displayName: '',
    role: 'board_member',
    position: '',
    department: '',
    phone: '',
    bio: '',
    specialties: [],
    preferences: {
      aiProvider: 'groq',
      aiModel: 'mixtral-8x7b-32768',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        chat: true,
        meetings: true
      },
      videoConferencing: {
        preferred: 'teams',
        autoJoin: false
      }
    }
  };

  let errors = {};

  onMount(async () => {
    await loadUsers();
    await loadRoles();
    loading = false;
  });

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        users = await response.json();
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadRoles() {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const rolesData = await response.json();
        roles = Object.entries(rolesData).map(([key, value]) => ({
          id: key,
          ...value
        }));
      } else {
        console.error('Failed to load roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }

  async function createUser() {
    errors = {};

    // Validation
    if (!newUser.email) errors.email = 'Email is required';
    if (!newUser.displayName) errors.displayName = 'Display name is required';
    if (!newUser.position) errors.position = 'Position is required';
    if (!newUser.department) errors.department = 'Department is required';

    if (Object.keys(errors).length > 0) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        await loadUsers();
        resetNewUserForm();
        showCreateModal = false;
      } else {
        const error = await response.json();
        errors.general = error.message || 'Failed to create user';
      }
    } catch (error) {
      console.error('Error creating user:', error);
      errors.general = 'Failed to create user';
    }
  }

  async function updateUser() {
    errors = {};

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(selectedUser)
      });

      if (response.ok) {
        await loadUsers();
        showEditModal = false;
        selectedUser = null;
      } else {
        const error = await response.json();
        errors.general = error.message || 'Failed to update user';
      }
    } catch (error) {
      console.error('Error updating user:', error);
      errors.general = 'Failed to update user';
    }
  }

  async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await loadUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  }

  function openCreateModal() {
    resetNewUserForm();
    showCreateModal = true;
  }

  function openEditModal(user) {
    selectedUser = { ...user };
    showEditModal = true;
  }

  function resetNewUserForm() {
    newUser = {
      email: '',
      displayName: '',
      role: 'board_member',
      position: '',
      department: '',
      phone: '',
      bio: '',
      specialties: [],
      preferences: {
        aiProvider: 'groq',
        aiModel: 'mixtral-8x7b-32768',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          chat: true,
          meetings: true
        },
        videoConferencing: {
          preferred: 'teams',
          autoJoin: false
        }
      }
    };
    errors = {};
  }

  // Filtered users based on search and filters
  $: filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  function getRoleBadgeClass(role) {
    switch (role) {
      case 'admin': return 'badge-error';
      case 'secretary': return 'badge-warning';
      case 'board_member': return 'badge-primary';
      default: return 'badge-secondary';
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-secondary';
      case 'suspended': return 'badge-error';
      default: return 'badge-secondary';
    }
  }

  function addSpecialty() {
    if (newUser.specialties.length < 5) {
      newUser.specialties = [...newUser.specialties, ''];
    }
  }

  function removeSpecialty(index) {
    newUser.specialties = newUser.specialties.filter((_, i) => i !== index);
  }
</script>

<svelte:head>
  <title>User Management - Board Governance AI</title>
</svelte:head>

<div class="admin-container">
  <header class="admin-header">
    <div class="header-content">
      <div class="header-text">
        <h1 class="page-title">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,4C18.2,4 20,5.8 20,8C20,10.2 18.2,12 16,12C13.8,12 12,10.2 12,8C12,5.8 13.8,4 16,4M16,14C20.4,14 24,15.8 24,18V20H8V18C8,15.8 11.6,14 16,14M8.5,4C10.7,4 12.5,5.8 12.5,8C12.5,10.2 10.7,12 8.5,12C6.3,12 4.5,10.2 4.5,8C4.5,5.8 6.3,4 8.5,4M8.5,14C12.9,14 16.5,15.8 16.5,18V20H0V18C0,15.8 3.6,14 8.5,14Z"/>
          </svg>
          User Management
        </h1>
        <p class="page-subtitle">Manage board members, roles, and permissions</p>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-primary" on:click={openCreateModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Add User
        </button>
      </div>
    </div>
  </header>

  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
  {:else}
    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="search-icon">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3Z"/>
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          bind:value={searchTerm}
          class="search-input"
        />
      </div>

      <div class="filter-controls">
        <select bind:value={statusFilter} class="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <select bind:value={roleFilter} class="filter-select">
          <option value="all">All Roles</option>
          {#each roles as role}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredUsers as user}
            <tr>
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar">
                    {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div class="user-details">
                    <div class="user-name">{user.displayName}</div>
                    <div class="user-email">{user.email}</div>
                    <div class="user-position">{user.position}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge {getRoleBadgeClass(user.role)}">
                  {roles.find(r => r.id === user.role)?.name || user.role}
                </span>
              </td>
              <td class="department-cell">
                <div class="department-name">{user.department}</div>
                {#if user.specialties && user.specialties.length > 0}
                  <div class="specialties">
                    {#each user.specialties.slice(0, 2) as specialty}
                      <span class="specialty-tag">{specialty}</span>
                    {/each}
                    {#if user.specialties.length > 2}
                      <span class="specialty-more">+{user.specialties.length - 2}</span>
                    {/if}
                  </div>
                {/if}
              </td>
              <td>
                <span class="badge {getStatusBadgeClass(user.status)}">
                  {user.status}
                </span>
              </td>
              <td class="date-cell">
                {new Date(user.lastActive).toLocaleDateString()}
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    class="btn-icon btn-primary"
                    on:click={() => openEditModal(user)}
                    title="Edit User"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                  </button>
                  
                  <button
                    class="btn-icon {user.status === 'active' ? 'btn-warning' : 'btn-success'}"
                    on:click={() => toggleUserStatus(user.uid, user.status)}
                    title="{user.status === 'active' ? 'Suspend User' : 'Activate User'}"
                  >
                    {#if user.status === 'active'}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z"/>
                      </svg>
                    {:else}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                      </svg>
                    {/if}
                  </button>

                  <button
                    class="btn-icon btn-error"
                    on:click={() => deleteUser(user.uid)}
                    title="Delete User"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredUsers.length === 0}
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,4C18.2,4 20,5.8 20,8C20,10.2 18.2,12 16,12C13.8,12 12,10.2 12,8C12,5.8 13.8,4 16,4M16,14C20.4,14 24,15.8 24,18V20H8V18C8,15.8 11.6,14 16,14M8.5,4C10.7,4 12.5,5.8 12.5,8C12.5,10.2 10.7,12 8.5,12C6.3,12 4.5,10.2 4.5,8C4.5,5.8 6.3,4 8.5,4M8.5,14C12.9,14 16.5,15.8 16.5,18V20H0V18C0,15.8 3.6,14 8.5,14Z"/>
          </svg>
          <h3>No users found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Create User Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={() => showCreateModal = false}>
    <div class="modal" on:click|stopPropagation>
      <header class="modal-header">
        <h2>Add New User</h2>
        <button class="modal-close" on:click={() => showCreateModal = false}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </header>

      <form on:submit|preventDefault={createUser} class="modal-form">
        {#if errors.general}
          <div class="error-message">{errors.general}</div>
        {/if}

        <div class="form-grid">
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input
              type="email"
              id="email"
              bind:value={newUser.email}
              class="form-control"
              class:error={errors.email}
              required
            />
            {#if errors.email}
              <span class="field-error">{errors.email}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="displayName">Display Name *</label>
            <input
              type="text"
              id="displayName"
              bind:value={newUser.displayName}
              class="form-control"
              class:error={errors.displayName}
              required
            />
            {#if errors.displayName}
              <span class="field-error">{errors.displayName}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="role">Role *</label>
            <select id="role" bind:value={newUser.role} class="form-control">
              {#each roles as role}
                <option value={role.id}>{role.name}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="position">Position *</label>
            <input
              type="text"
              id="position"
              bind:value={newUser.position}
              class="form-control"
              class:error={errors.position}
              required
            />
            {#if errors.position}
              <span class="field-error">{errors.position}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="department">Department *</label>
            <input
              type="text"
              id="department"
              bind:value={newUser.department}
              class="form-control"
              class:error={errors.department}
              required
            />
            {#if errors.department}
              <span class="field-error">{errors.department}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              bind:value={newUser.phone}
              class="form-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            id="bio"
            bind:value={newUser.bio}
            class="form-control"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Specialties</label>
          <div class="specialties-container">
            {#each newUser.specialties as specialty, index}
              <div class="specialty-input">
                <input
                  type="text"
                  bind:value={newUser.specialties[index]}
                  class="form-control"
                  placeholder="Enter specialty"
                />
                <button
                  type="button"
                  class="btn-icon btn-error"
                  on:click={() => removeSpecialty(index)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
            {/each}
            {#if newUser.specialties.length < 5}
              <button type="button" class="btn btn-outline" on:click={addSpecialty}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                Add Specialty
              </button>
            {/if}
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => showCreateModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Create User
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit User Modal -->
{#if showEditModal && selectedUser}
  <div class="modal-overlay" on:click={() => showEditModal = false}>
    <div class="modal" on:click|stopPropagation>
      <header class="modal-header">
        <h2>Edit User</h2>
        <button class="modal-close" on:click={() => showEditModal = false}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </header>

      <form on:submit|preventDefault={updateUser} class="modal-form">
        {#if errors.general}
          <div class="error-message">{errors.general}</div>
        {/if}

        <div class="form-grid">
          <div class="form-group">
            <label for="edit-email">Email Address</label>
            <input
              type="email"
              id="edit-email"
              bind:value={selectedUser.email}
              class="form-control"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="edit-displayName">Display Name</label>
            <input
              type="text"
              id="edit-displayName"
              bind:value={selectedUser.displayName}
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-role">Role</label>
            <select id="edit-role" bind:value={selectedUser.role} class="form-control">
              {#each roles as role}
                <option value={role.id}>{role.name}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="edit-position">Position</label>
            <input
              type="text"
              id="edit-position"
              bind:value={selectedUser.position}
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-department">Department</label>
            <input
              type="text"
              id="edit-department"
              bind:value={selectedUser.department}
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-phone">Phone</label>
            <input
              type="tel"
              id="edit-phone"
              bind:value={selectedUser.phone}
              class="form-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="edit-bio">Bio</label>
          <textarea
            id="edit-bio"
            bind:value={selectedUser.bio}
            class="form-control"
            rows="3"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={() => showEditModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Update User
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--board-spacing-8);
  }

  .admin-header {
    margin-bottom: var(--board-spacing-8);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--board-spacing-6);
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-3);
    font-size: 2rem;
    font-weight: 800;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-2);
  }

  .page-title svg {
    color: var(--board-primary);
  }

  .page-subtitle {
    color: var(--board-text-secondary);
    font-size: 1.125rem;
    margin: 0;
  }

  .filters-section {
    display: flex;
    gap: var(--board-spacing-4);
    margin-bottom: var(--board-spacing-6);
    align-items: center;
  }

  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: var(--board-spacing-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--board-text-secondary);
  }

  .search-input {
    width: 100%;
    padding: var(--board-spacing-3) var(--board-spacing-3) var(--board-spacing-3) 40px;
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-border-radius);
    font-size: 0.875rem;
  }

  .filter-controls {
    display: flex;
    gap: var(--board-spacing-3);
  }

  .filter-select {
    padding: var(--board-spacing-3);
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-border-radius);
    font-size: 0.875rem;
    background: var(--board-white);
  }

  .table-container {
    background: var(--board-white);
    border-radius: var(--board-border-radius-lg);
    box-shadow: var(--board-shadow-lg);
    overflow: hidden;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table th {
    background: var(--board-gray-50);
    padding: var(--board-spacing-4);
    text-align: left;
    font-weight: 600;
    color: var(--board-text-primary);
    border-bottom: 1px solid var(--board-gray-200);
  }

  .users-table td {
    padding: var(--board-spacing-4);
    border-bottom: 1px solid var(--board-gray-100);
  }

  .users-table tbody tr:hover {
    background: var(--board-gray-50);
  }

  .user-cell {
    min-width: 280px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-3);
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--board-gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--board-white);
    font-weight: 600;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .user-name {
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: 2px;
  }

  .user-email {
    font-size: 0.875rem;
    color: var(--board-text-secondary);
    margin-bottom: 2px;
  }

  .user-position {
    font-size: 0.75rem;
    color: var(--board-primary);
    font-weight: 500;
  }

  .department-cell {
    min-width: 200px;
  }

  .department-name {
    font-weight: 500;
    margin-bottom: var(--board-spacing-1);
  }

  .specialties {
    display: flex;
    flex-wrap: wrap;
    gap: var(--board-spacing-1);
  }

  .specialty-tag {
    font-size: 0.625rem;
    padding: 2px 6px;
    background: rgba(0, 168, 89, 0.1);
    color: var(--board-primary-dark);
    border-radius: var(--board-border-radius-full);
    border: 1px solid rgba(0, 168, 89, 0.2);
  }

  .specialty-more {
    font-size: 0.625rem;
    color: var(--board-text-secondary);
    font-weight: 500;
  }

  .date-cell {
    font-size: 0.875rem;
    color: var(--board-text-secondary);
    min-width: 120px;
  }

  .actions-cell {
    min-width: 140px;
  }

  .action-buttons {
    display: flex;
    gap: var(--board-spacing-2);
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--board-border-radius);
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--board-transition);
  }

  .btn-icon.btn-primary {
    background: rgba(0, 168, 89, 0.1);
    color: var(--board-primary);
    border-color: rgba(0, 168, 89, 0.2);
  }

  .btn-icon.btn-primary:hover {
    background: var(--board-primary);
    color: var(--board-white);
  }

  .btn-icon.btn-warning {
    background: rgba(255, 193, 7, 0.1);
    color: var(--board-warning);
    border-color: rgba(255, 193, 7, 0.2);
  }

  .btn-icon.btn-warning:hover {
    background: var(--board-warning);
    color: var(--board-white);
  }

  .btn-icon.btn-success {
    background: rgba(34, 197, 94, 0.1);
    color: var(--board-success);
    border-color: rgba(34, 197, 94, 0.2);
  }

  .btn-icon.btn-success:hover {
    background: var(--board-success);
    color: var(--board-white);
  }

  .btn-icon.btn-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--board-error);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .btn-icon.btn-error:hover {
    background: var(--board-error);
    color: var(--board-white);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: var(--board-border-radius-full);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .badge-primary {
    background: rgba(0, 168, 89, 0.1);
    color: var(--board-primary-dark);
    border: 1px solid rgba(0, 168, 89, 0.2);
  }

  .badge-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--board-error);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .badge-warning {
    background: rgba(255, 193, 7, 0.1);
    color: var(--board-warning-dark);
    border: 1px solid rgba(255, 193, 7, 0.2);
  }

  .badge-success {
    background: rgba(34, 197, 94, 0.1);
    color: var(--board-success-dark);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .badge-secondary {
    background: var(--board-gray-100);
    color: var(--board-text-secondary);
    border: 1px solid var(--board-gray-200);
  }

  .empty-state {
    text-align: center;
    padding: var(--board-spacing-12);
    color: var(--board-text-secondary);
  }

  .empty-state svg {
    margin-bottom: var(--board-spacing-4);
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--board-spacing-2);
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
    padding: var(--board-spacing-4);
  }

  .modal {
    background: var(--board-white);
    border-radius: var(--board-border-radius-lg);
    box-shadow: var(--board-shadow-xl);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--board-spacing-6);
    border-bottom: 1px solid var(--board-gray-200);
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--board-text-secondary);
    cursor: pointer;
    padding: var(--board-spacing-1);
    border-radius: var(--board-border-radius);
    transition: var(--board-transition);
  }

  .modal-close:hover {
    color: var(--board-text-primary);
    background: var(--board-gray-100);
  }

  .modal-form {
    padding: var(--board-spacing-6);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--board-spacing-4);
    margin-bottom: var(--board-spacing-4);
  }

  .form-group {
    margin-bottom: var(--board-spacing-4);
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-2);
  }

  .form-control {
    width: 100%;
    padding: var(--board-spacing-3);
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-border-radius);
    font-size: 0.875rem;
    transition: var(--board-transition);
  }

  .form-control:focus {
    outline: none;
    border-color: var(--board-primary);
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .form-control.error {
    border-color: var(--board-error);
  }

  .field-error {
    display: block;
    color: var(--board-error);
    font-size: 0.75rem;
    margin-top: var(--board-spacing-1);
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: var(--board-error);
    padding: var(--board-spacing-3);
    border-radius: var(--board-border-radius);
    margin-bottom: var(--board-spacing-4);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .specialties-container {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-2);
  }

  .specialty-input {
    display: flex;
    gap: var(--board-spacing-2);
    align-items: center;
  }

  .specialty-input .form-control {
    flex: 1;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--board-spacing-3);
    margin-top: var(--board-spacing-6);
    padding-top: var(--board-spacing-4);
    border-top: 1px solid var(--board-gray-200);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--board-spacing-12);
    color: var(--board-text-secondary);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .admin-container {
      padding: var(--board-spacing-4);
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .filters-section {
      flex-direction: column;
    }

    .filter-controls {
      justify-content: stretch;
    }

    .filter-select {
      flex: 1;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      min-width: 800px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .modal {
      margin: var(--board-spacing-4);
      max-height: calc(100vh - 2 * var(--board-spacing-4));
    }
  }
</style> 