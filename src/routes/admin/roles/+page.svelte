<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase';
  import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

  let loading = true;
  let saving = false;
  let roles = [];
  let permissions = [];
  let selectedRole = null;
  let showCreateModal = false;
  let showDeleteModal = false;
  let roleToDelete = null;
  let newRole = {
    name: '',
    description: '',
    permissions: {}
  };

  // Default permissions structure
  const defaultPermissions = [
    { key: 'canManageUsers', label: 'Manage Users', category: 'User Management' },
    { key: 'canManageRoles', label: 'Manage Roles', category: 'User Management' },
    { key: 'canManageSettings', label: 'Manage Settings', category: 'System' },
    { key: 'canViewAllDocuments', label: 'View All Documents', category: 'Documents' },
    { key: 'canManageDocuments', label: 'Manage Documents', category: 'Documents' },
    { key: 'canScheduleMeetings', label: 'Schedule Meetings', category: 'Meetings' },
    { key: 'canManageVoting', label: 'Manage Voting', category: 'Voting' },
    { key: 'canAccessReports', label: 'Access Reports', category: 'Reports' },
    { key: 'canManageAI', label: 'Manage AI', category: 'AI & Automation' },
    { key: 'canManageIntegrations', label: 'Manage Integrations', category: 'System' }
  ];

  $: user = $authStore.user;
  $: userProfile = $authStore.userProfile;

  $: groupedPermissions = defaultPermissions.reduce((groups, permission) => {
    if (!groups[permission.category]) {
      groups[permission.category] = [];
    }
    groups[permission.category].push(permission);
    return groups;
  }, {});

  onMount(async () => {
    // Handle authentication redirect
    const unsubscribe = authStore.subscribe((auth) => {
      if (browser && !auth.loading) {
        if (!auth.user) {
          goto('/landing');
        } else if (auth.userProfile && auth.userProfile.role !== 'admin') {
          goto('/dashboard');
        }
      }
    });

    if (!user || !db) return;
    await loadRolesAndPermissions();
  });

  async function loadRolesAndPermissions() {
    loading = true;
    try {
      // Load roles
      const rolesSnapshot = await getDocs(collection(db, 'roles'));
      roles = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no roles exist, create default ones
      if (roles.length === 0) {
        await createDefaultRoles();
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      loading = false;
    }
  }

  async function createDefaultRoles() {
    const defaultRoles = [
      {
        name: 'admin',
        description: 'Full system administrator with all permissions',
        permissions: defaultPermissions.reduce((perms, p) => ({ ...perms, [p.key]: true }), {})
      },
      {
        name: 'board_member',
        description: 'Board member with standard access',
        permissions: {
          canViewAllDocuments: true,
          canScheduleMeetings: true,
          canManageVoting: true,
          canAccessReports: true,
          canManageAI: true
        }
      },
      {
        name: 'secretary',
        description: 'Board secretary with meeting and document management',
        permissions: {
          canViewAllDocuments: true,
          canManageDocuments: true,
          canScheduleMeetings: true,
          canAccessReports: true
        }
      }
    ];

    for (const role of defaultRoles) {
      await addDoc(collection(db, 'roles'), role);
    }
    await loadRolesAndPermissions();
  }

  async function saveRole(role) {
    if (!db) return;
    
    saving = true;
    try {
      await updateDoc(doc(db, 'roles', role.id), {
        name: role.name,
        description: role.description,
        permissions: role.permissions
      });
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role. Please try again.');
    } finally {
      saving = false;
    }
  }

  async function createRole() {
    if (!db || !newRole.name.trim()) return;
    
    saving = true;
    try {
      // Initialize permissions object
      const permissions = defaultPermissions.reduce((perms, p) => ({ 
        ...perms, 
        [p.key]: newRole.permissions[p.key] || false 
      }), {});

      await addDoc(collection(db, 'roles'), {
        name: newRole.name.toLowerCase().replace(/\s+/g, '_'),
        description: newRole.description,
        permissions
      });
      
      // Reset form
      newRole = { name: '', description: '', permissions: {} };
      showCreateModal = false;
      await loadRolesAndPermissions();
      alert('Role created successfully!');
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Error creating role. Please try again.');
    } finally {
      saving = false;
    }
  }

  async function deleteRole(role) {
    if (!db) return;
    
    saving = true;
    try {
      await deleteDoc(doc(db, 'roles', role.id));
      showDeleteModal = false;
      roleToDelete = null;
      await loadRolesAndPermissions();
      alert('Role deleted successfully!');
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role. Please try again.');
    } finally {
      saving = false;
    }
  }

  function togglePermission(role, permissionKey) {
    role.permissions[permissionKey] = !role.permissions[permissionKey];
    roles = [...roles]; // Trigger reactivity
  }

  function toggleNewRolePermission(permissionKey) {
    newRole.permissions[permissionKey] = !newRole.permissions[permissionKey];
    newRole = { ...newRole }; // Trigger reactivity
  }
</script>

<svelte:head>
  <title>Roles & Permissions - Board Governance AI</title>
</svelte:head>

<div class="roles-page">
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">Roles & Permissions</h1>
      <p class="page-description">Manage user roles and their associated permissions</p>
    </div>
    <button class="btn btn-primary" on:click={() => showCreateModal = true}>
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
      Create Role
    </button>
  </div>

  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading roles and permissions...</p>
    </div>
  {:else}
    <div class="roles-container">
      {#each roles as role}
        <div class="role-card">
          <div class="role-header">
            <div class="role-info">
              <h3 class="role-name">{role.name}</h3>
              <p class="role-description">{role.description}</p>
            </div>
            <div class="role-actions">
              <button 
                class="btn btn-secondary btn-sm"
                on:click={() => selectedRole = selectedRole === role ? null : role}
              >
                {selectedRole === role ? 'Hide' : 'Edit'} Permissions
              </button>
              {#if role.name !== 'admin'}
                <button 
                  class="btn btn-danger btn-sm"
                  on:click={() => { roleToDelete = role; showDeleteModal = true; }}
                >
                  Delete
                </button>
              {/if}
            </div>
          </div>

          {#if selectedRole === role}
            <div class="permissions-editor">
              {#each Object.entries(groupedPermissions) as [category, categoryPermissions]}
                <div class="permission-category">
                  <h4 class="category-title">{category}</h4>
                  <div class="permissions-grid">
                    {#each categoryPermissions as permission}
                      <label class="permission-item">
                        <input 
                          type="checkbox" 
                          checked={role.permissions[permission.key] || false}
                          on:change={() => togglePermission(role, permission.key)}
                          class="permission-checkbox"
                        />
                        <span class="permission-label">{permission.label}</span>
                      </label>
                    {/each}
                  </div>
                </div>
              {/each}
              
              <div class="permission-actions">
                <button 
                  class="btn btn-primary"
                  on:click={() => saveRole(role)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Role Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={() => showCreateModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">Create New Role</h2>
        <button class="modal-close" on:click={() => showCreateModal = false}>×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="roleName" class="form-label">Role Name</label>
          <input 
            id="roleName"
            type="text" 
            bind:value={newRole.name}
            class="form-input"
            placeholder="Enter role name"
          />
        </div>
        
        <div class="form-group">
          <label for="roleDescription" class="form-label">Description</label>
          <textarea 
            id="roleDescription"
            bind:value={newRole.description}
            class="form-input"
            rows="3"
            placeholder="Describe the role's purpose"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Permissions</label>
          {#each Object.entries(groupedPermissions) as [category, categoryPermissions]}
            <div class="permission-category">
              <h4 class="category-title">{category}</h4>
              <div class="permissions-grid">
                {#each categoryPermissions as permission}
                  <label class="permission-item">
                    <input 
                      type="checkbox" 
                      checked={newRole.permissions[permission.key] || false}
                      on:change={() => toggleNewRolePermission(permission.key)}
                      class="permission-checkbox"
                    />
                    <span class="permission-label">{permission.label}</span>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={() => showCreateModal = false}>
          Cancel
        </button>
        <button 
          class="btn btn-primary"
          on:click={createRole}
          disabled={saving || !newRole.name.trim()}
        >
          {saving ? 'Creating...' : 'Create Role'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && roleToDelete}
  <div class="modal-overlay" on:click={() => showDeleteModal = false}>
    <div class="modal modal-sm" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">Delete Role</h2>
        <button class="modal-close" on:click={() => showDeleteModal = false}>×</button>
      </div>
      
      <div class="modal-body">
        <p>Are you sure you want to delete the role <strong>{roleToDelete.name}</strong>?</p>
        <p class="text-warning">This action cannot be undone.</p>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={() => showDeleteModal = false}>
          Cancel
        </button>
        <button 
          class="btn btn-danger"
          on:click={() => deleteRole(roleToDelete)}
          disabled={saving}
        >
          {saving ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .roles-page {
    padding: var(--board-spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--board-spacing-xl);
    gap: var(--board-spacing-lg);
  }

  .header-content {
    flex: 1;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-sm);
  }

  .page-description {
    color: var(--board-text-secondary);
    font-size: 1.1rem;
  }

  .roles-container {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-lg);
  }

  .role-card {
    background: var(--board-white);
    border-radius: var(--board-radius-lg);
    border: 1px solid var(--board-gray-200);
    box-shadow: var(--board-shadow-sm);
    overflow: hidden;
  }

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--board-spacing-xl);
    border-bottom: 1px solid var(--board-gray-100);
  }

  .role-info {
    flex: 1;
  }

  .role-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-xs);
    text-transform: capitalize;
  }

  .role-description {
    color: var(--board-text-secondary);
    margin: 0;
  }

  .role-actions {
    display: flex;
    gap: var(--board-spacing-sm);
  }

  .permissions-editor {
    padding: var(--board-spacing-xl);
    background: var(--board-gray-50);
  }

  .permission-category {
    margin-bottom: var(--board-spacing-lg);
  }

  .category-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-md);
    padding-bottom: var(--board-spacing-xs);
    border-bottom: 1px solid var(--board-gray-200);
  }

  .permissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--board-spacing-sm);
  }

  .permission-item {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-sm);
    cursor: pointer;
    padding: var(--board-spacing-sm);
    border-radius: var(--board-radius-md);
    transition: background-color 0.2s ease;
  }

  .permission-item:hover {
    background: var(--board-white);
  }

  .permission-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--board-primary-500);
  }

  .permission-label {
    font-size: 0.9rem;
    color: var(--board-text-primary);
  }

  .permission-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--board-spacing-lg);
    padding-top: var(--board-spacing-lg);
    border-top: 1px solid var(--board-gray-200);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--board-spacing-xxl);
    gap: var(--board-spacing-lg);
  }

  .loading-container p {
    color: var(--board-text-secondary);
    font-weight: 500;
  }

  .text-warning {
    color: var(--board-warning-600);
    font-size: 0.9rem;
    margin-top: var(--board-spacing-sm);
  }

  @media (max-width: 768px) {
    .roles-page {
      padding: var(--board-spacing-lg);
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .role-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--board-spacing-md);
    }

    .role-actions {
      justify-content: flex-end;
    }

    .permissions-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 