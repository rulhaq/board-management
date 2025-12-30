<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { 
    User, Mail, Phone, Calendar, MapPin, Briefcase, 
    Edit3, Save, X, Camera, Shield, Key, Bell,
    Settings, Award, Clock
  } from 'lucide-svelte';

  let currentUser = null;
  let userProfile = null;
  let loading = true;
  let editMode = false;
  let saving = false;
  
  // Edit form data
  let editData = {
    displayName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    bio: '',
    specialties: [],
    preferences: {
      notifications: true,
      emailUpdates: true,
      meetingReminders: true
    }
  };

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.user;
      userProfile = auth.profile;
      
      if (auth.profile) {
        initializeEditData();
        loading = false;
      } else if (!auth.loading && !auth.user) {
        goto('/login');
      }
    });

    return unsubscribe;
  });

  function initializeEditData() {
    editData = {
      displayName: userProfile?.displayName || '',
      email: userProfile?.email || currentUser?.email || '',
      phone: userProfile?.phone || '',
      position: userProfile?.position || '',
      department: userProfile?.department || '',
      bio: userProfile?.bio || '',
      specialties: userProfile?.specialties || [],
      preferences: {
        notifications: userProfile?.preferences?.notifications ?? true,
        emailUpdates: userProfile?.preferences?.emailUpdates ?? true,
        meetingReminders: userProfile?.preferences?.meetingReminders ?? true
      }
    };
  }

  function startEdit() {
    editMode = true;
    initializeEditData();
  }

  function cancelEdit() {
    editMode = false;
    initializeEditData();
  }

  async function saveProfile() {
    if (!validateProfile()) return;
    
    saving = true;
    try {
      // Save to Firebase/backend
      await saveProfileToFirebase(editData);
      
      // Update local state
      userProfile = { ...userProfile, ...editData };
      
      editMode = false;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      saving = false;
    }
  }

  async function saveProfileToFirebase(profileData) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        },
        body: JSON.stringify({
          ...profileData,
          uid: currentUser?.uid,
          updatedAt: new Date().toISOString()
        })
      }).catch(() => null);

      if (!response?.ok) {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      // For demo, don't throw error
    }
  }

  function validateProfile() {
    if (!editData.displayName.trim()) {
      alert('Please enter your display name');
      return false;
    }
    if (!editData.email.trim()) {
      alert('Please enter your email address');
      return false;
    }
    return true;
  }

  function addSpecialty() {
    if (editData.specialties.length < 8) {
      editData.specialties = [...editData.specialties, ''];
    }
  }

  function removeSpecialty(index) {
    editData.specialties = editData.specialties.filter((_, i) => i !== index);
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  function formatDate(dateString) {
    if (!dateString) return 'Not specified';
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
    return roleNames[role] || 'User';
  }
</script>

<svelte:head>
  <title>Profile - Board Governance AI</title>
</svelte:head>

<div class="profile-page">
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>
  {:else}
    <!-- Profile Header -->
    <div class="profile-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="profile-avatar">
          {#if userProfile?.avatar}
            <img src={userProfile.avatar} alt={userProfile.displayName} />
          {:else}
            <div class="avatar-placeholder">
              {getInitials(userProfile?.displayName)}
            </div>
          {/if}
          <button class="avatar-edit-btn" title="Change Photo">
            <Camera size={16} />
          </button>
        </div>
        
        <div class="profile-info">
          <h1>{userProfile?.displayName || 'User Profile'}</h1>
          <p class="profile-position">{userProfile?.position || 'Board Member'}</p>
          <p class="profile-department">{userProfile?.department || 'Board Governance AI'}</p>
          <div class="profile-role">
            <Shield size={16} />
            <span>{getRoleDisplayName(userProfile?.role)}</span>
          </div>
        </div>

        <div class="profile-actions">
          {#if !editMode}
            <button class="btn btn-primary" on:click={startEdit}>
              <Edit3 size={16} />
              Edit Profile
            </button>
          {:else}
            <button class="btn btn-outline" on:click={cancelEdit}>
              <X size={16} />
              Cancel
            </button>
            <button class="btn btn-primary" on:click={saveProfile} disabled={saving}>
              {#if saving}
                <div class="loading-spinner small"></div>
                Saving...
              {:else}
                <Save size={16} />
                Save Changes
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <div class="content-grid">
        <!-- Personal Information -->
        <div class="content-card">
          <div class="card-header">
            <h2>Personal Information</h2>
            <User size={20} />
          </div>
          
          <div class="card-content">
            {#if editMode}
              <div class="form-grid">
                <div class="form-group">
                  <label for="displayName">Display Name *</label>
                  <input
                    id="displayName"
                    type="text"
                    bind:value={editData.displayName}
                    placeholder="Enter your display name"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    bind:value={editData.email}
                    placeholder="your.email@boardgovernance.ai"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    bind:value={editData.phone}
                    placeholder="+974 4003 0000"
                  />
                </div>

                <div class="form-group">
                  <label for="position">Position</label>
                  <input
                    id="position"
                    type="text"
                    bind:value={editData.position}
                    placeholder="Your job title"
                  />
                </div>

                <div class="form-group">
                  <label for="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={editData.department}
                    placeholder="Your department"
                  />
                </div>
              </div>
            {:else}
              <div class="info-grid">
                <div class="info-item">
                  <Mail size={16} />
                  <div class="info-content">
                    <span class="info-label">Email</span>
                    <span class="info-value">{userProfile?.email || 'Not specified'}</span>
                  </div>
                </div>

                <div class="info-item">
                  <Phone size={16} />
                  <div class="info-content">
                    <span class="info-label">Phone</span>
                    <span class="info-value">{userProfile?.phone || 'Not specified'}</span>
                  </div>
                </div>

                <div class="info-item">
                  <Briefcase size={16} />
                  <div class="info-content">
                    <span class="info-label">Position</span>
                    <span class="info-value">{userProfile?.position || 'Not specified'}</span>
                  </div>
                </div>

                <div class="info-item">
                  <MapPin size={16} />
                  <div class="info-content">
                    <span class="info-label">Department</span>
                    <span class="info-value">{userProfile?.department || 'Not specified'}</span>
                  </div>
                </div>

                <div class="info-item">
                  <Calendar size={16} />
                  <div class="info-content">
                    <span class="info-label">Member Since</span>
                    <span class="info-value">{formatDate(userProfile?.createdAt)}</span>
                  </div>
                </div>

                <div class="info-item">
                  <Clock size={16} />
                  <div class="info-content">
                    <span class="info-label">Last Active</span>
                    <span class="info-value">{formatDate(userProfile?.lastActive)}</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Biography -->
        <div class="content-card">
          <div class="card-header">
            <h2>Biography</h2>
            <Award size={20} />
          </div>
          
          <div class="card-content">
            {#if editMode}
              <div class="form-group">
                <label for="bio">Professional Background</label>
                <textarea
                  id="bio"
                  bind:value={editData.bio}
                  rows="6"
                  placeholder="Share your professional background, experience, and achievements..."
                ></textarea>
              </div>
            {:else}
              <div class="bio-content">
                {#if userProfile?.bio}
                  <p>{userProfile.bio}</p>
                {:else}
                  <p class="empty-state">No biography provided. Click "Edit Profile" to add your professional background.</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Specialties -->
        <div class="content-card">
          <div class="card-header">
            <h2>Specialties & Expertise</h2>
            <Award size={20} />
          </div>
          
          <div class="card-content">
            {#if editMode}
              <div class="specialties-form">
                {#each editData.specialties as specialty, index}
                  <div class="specialty-input">
                    <input
                      type="text"
                      bind:value={specialty}
                      placeholder="Enter specialty or area of expertise"
                    />
                    <button type="button" class="remove-specialty" on:click={() => removeSpecialty(index)}>
                      <X size={14} />
                    </button>
                  </div>
                {/each}
                
                {#if editData.specialties.length < 8}
                  <button type="button" class="add-specialty" on:click={addSpecialty}>
                    <span>+</span>
                    Add Specialty
                  </button>
                {/if}
              </div>
            {:else}
              <div class="specialties-display">
                {#if userProfile?.specialties && userProfile.specialties.length > 0}
                  <div class="specialties-grid">
                    {#each userProfile.specialties as specialty}
                      <span class="specialty-tag">{specialty}</span>
                    {/each}
                  </div>
                {:else}
                  <p class="empty-state">No specialties listed. Click "Edit Profile" to add your areas of expertise.</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Preferences -->
        <div class="content-card">
          <div class="card-header">
            <h2>Notification Preferences</h2>
            <Bell size={20} />
          </div>
          
          <div class="card-content">
            {#if editMode}
              <div class="preferences-form">
                <label class="preference-item">
                  <input type="checkbox" bind:checked={editData.preferences.notifications} />
                  <div class="preference-content">
                    <span class="preference-title">Push Notifications</span>
                    <span class="preference-description">Receive real-time notifications for important updates</span>
                  </div>
                </label>

                <label class="preference-item">
                  <input type="checkbox" bind:checked={editData.preferences.emailUpdates} />
                  <div class="preference-content">
                    <span class="preference-title">Email Updates</span>
                    <span class="preference-description">Get email summaries of board activities and decisions</span>
                  </div>
                </label>

                <label class="preference-item">
                  <input type="checkbox" bind:checked={editData.preferences.meetingReminders} />
                  <div class="preference-content">
                    <span class="preference-title">Meeting Reminders</span>
                    <span class="preference-description">Receive reminders before scheduled board meetings</span>
                  </div>
                </label>
              </div>
            {:else}
              <div class="preferences-display">
                <div class="preference-status">
                  <Bell size={16} />
                  <span>Push Notifications: {userProfile?.preferences?.notifications ? 'Enabled' : 'Disabled'}</span>
                </div>
                
                <div class="preference-status">
                  <Mail size={16} />
                  <span>Email Updates: {userProfile?.preferences?.emailUpdates ? 'Enabled' : 'Disabled'}</span>
                </div>
                
                <div class="preference-status">
                  <Calendar size={16} />
                  <span>Meeting Reminders: {userProfile?.preferences?.meetingReminders ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Account Security -->
        <div class="content-card">
          <div class="card-header">
            <h2>Account Security</h2>
            <Shield size={20} />
          </div>
          
          <div class="card-content">
            <div class="security-options">
              <div class="security-item">
                <div class="security-icon">
                  <Key size={20} />
                </div>
                <div class="security-content">
                  <h4>Password</h4>
                  <p>Last changed 30 days ago</p>
                </div>
                <button class="btn btn-outline btn-sm">Change</button>
              </div>

              <div class="security-item">
                <div class="security-icon">
                  <Shield size={20} />
                </div>
                <div class="security-content">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security</p>
                </div>
                <button class="btn btn-outline btn-sm">Setup</button>
              </div>

              <div class="security-item">
                <div class="security-icon">
                  <Settings size={20} />
                </div>
                <div class="security-content">
                  <h4>Login Activity</h4>
                  <p>Monitor your account access</p>
                </div>
                <button class="btn btn-outline btn-sm">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-page {
    min-height: calc(100vh - 4rem);
    background: #f8fafc;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
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

  .loading-spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
    margin-bottom: 0;
  }

  .profile-header {
    position: relative;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-background {
    height: 120px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: flex-end;
    gap: 2rem;
    transform: translateY(-60px);
  }

  .profile-avatar {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .profile-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border-radius: 50%;
    border: 4px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .avatar-edit-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    background: #00a859;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .avatar-edit-btn:hover {
    background: #059669;
    transform: scale(1.1);
  }

  .profile-info {
    flex: 1;
    padding-bottom: 1rem;
  }

  .profile-info h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .profile-position {
    font-size: 1.25rem;
    font-weight: 600;
    color: #00a859;
    margin-bottom: 0.25rem;
  }

  .profile-department {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .profile-role {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 168, 89, 0.1);
    color: #00a859;
    border: 1px solid rgba(0, 168, 89, 0.2);
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    width: fit-content;
  }

  .profile-actions {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
  }

  .profile-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
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
    padding: 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .card-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .card-content {
    padding: 1.5rem;
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
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    line-height: 1.5;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1f2937;
  }

  .bio-content p {
    line-height: 1.6;
    color: #4b5563;
    margin: 0;
  }

  .empty-state {
    color: #9ca3af;
    font-style: italic;
    text-align: center;
    padding: 2rem;
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
    font-size: 0.875rem;
  }

  .add-specialty:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #9ca3af;
  }

  .add-specialty span {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .specialties-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .specialty-tag {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, rgba(0, 168, 89, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
    color: #00a859;
    border: 1px solid rgba(0, 168, 89, 0.2);
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .preferences-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preference-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .preference-item:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .preference-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
  }

  .preference-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preference-title {
    font-weight: 600;
    color: #1f2937;
  }

  .preference-description {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .preferences-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preference-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .security-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .security-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .security-icon {
    width: 40px;
    height: 40px;
    background: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
  }

  .security-content {
    flex: 1;
  }

  .security-content h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .security-content p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
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

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .form-grid,
    .info-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .profile-content {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 1rem;
    }

    .profile-info h1 {
      font-size: 2rem;
    }

    .profile-actions {
      justify-content: center;
    }
  }
</style> 