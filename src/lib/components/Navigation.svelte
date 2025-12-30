<script>
  import { page } from '$app/stores';
  import { authStore, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;
  $: currentUser = userProfile;
  $: isAdminRole = userProfile && userProfile.role === 'admin';
  
  function isAdmin() {
    return userProfile && userProfile.role === 'admin';
  }

  let showUserMenu = false;
  let showAdminSubmenu = false;
  let unreadNotifications = 0;

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
    showAdminSubmenu = false;
  }

  function toggleAdminSubmenu(e) {
    e.preventDefault();
    e.stopPropagation();
    showAdminSubmenu = !showAdminSubmenu;
  }

  function closeAllMenus() {
    showUserMenu = false;
    showAdminSubmenu = false;
  }

  async function handleLogout() {
    try {
      await logout();
      goto('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function toggleAIChat() {
    window.dispatchEvent(new CustomEvent('toggle-ai-chat'));
  }

  // Close menus when clicking outside
  onMount(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.user-menu-container')) {
        closeAllMenus();
      }
    }

    document.addEventListener('click', handleClickOutside);
    
    // Load notifications count
    loadNotificationsCount();
    
    // Set up periodic refresh of notifications
    const interval = setInterval(loadNotificationsCount, 30000); // Every 30 seconds
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearInterval(interval);
    };
  });

  async function loadNotificationsCount() {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/notifications/count', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        unreadNotifications = data.unread || 0;
      } else {
        // Fallback for demo
        unreadNotifications = 3;
      }
    } catch (error) {
      console.error('Failed to load notifications count:', error);
      // Fallback for demo
      unreadNotifications = 3;
    }
  }

  function isAdminOrSecretary() {
    return userProfile?.role === 'admin' || userProfile?.role === 'secretary';
  }

  function isSuperAdmin() {
    return userProfile?.email === 'cto@scalovate.com';
  }
</script>

<nav class="main-navigation">
  <div class="nav-container">
    <!-- Brand -->
    <div class="nav-brand">
      <a href="/dashboard" class="brand-link">
        <div class="brand-logo">
          <div class="logo-icon">BG</div>
        </div>
      </a>
    </div>

    <!-- Navigation Links -->
    <div class="nav-links">
      <a href="/dashboard" class="nav-link" class:active={$page.route?.id === '/dashboard'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/>
        </svg>
        <span>Dashboard</span>
      </a>
      
      <a href="/meetings" class="nav-link" class:active={$page.route?.id === '/meetings'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
        </svg>
        <span>Meetings</span>
      </a>
      
      <a href="/documents" class="nav-link" class:active={$page.route?.id === '/documents'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <span>Documents</span>
      </a>
      
      <a href="/voting" class="nav-link" class:active={$page.route?.id === '/voting'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18,13H13V18H11V13H6V11H11V6H13V11H18V13Z"/>
        </svg>
        <span>Voting</span>
      </a>
      
      <a href="/members" class="nav-link" class:active={$page.route?.id === '/members'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,4C16.88,4 17.67,4.38 18.18,5L20,7.07L18.83,8.24C18.32,7.63 17.69,7.24 17,7.24C16.31,7.24 15.68,7.63 15.17,8.24L14,7.07L15.82,5C16.33,4.38 17.12,4 16,4M12,4C12.88,4 13.67,4.38 14.18,5L16,7.07L14.83,8.24C14.32,7.63 13.69,7.24 13,7.24C12.31,7.24 11.68,7.63 11.17,8.24L10,7.07L11.82,5C12.33,4.38 12.12,4 12,4M8,4C8.88,4 9.67,4.38 10.18,5L12,7.07L10.83,8.24C10.32,7.63 9.69,7.24 9,7.24C8.31,7.24 7.68,7.63 7.17,8.24L6,7.07L7.82,5C8.33,4.38 8.12,4 8,4M4,8V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L18,10V20H6V10L4,8Z"/>
        </svg>
        <span>Members</span>
      </a>
      
      <a href="/reports" class="nav-link" class:active={$page.route?.id === '/reports'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M5,8V12H11V8H5M13,8V12H19V8H13M5,14V18H11V14H5M13,14V18H19V14H13Z"/>
        </svg>
        <span>Reports</span>
      </a>
      
      <a href="/chat" class="nav-link" class:active={$page.route?.id === '/chat'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11S17.5,3 12,3Z"/>
        </svg>
        <span>Chat</span>
      </a>
      
      {#if isAdminRole}
      <a href="/admin/console" class="nav-link" class:active={$page.route?.id === '/admin/console'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.22,15.05 2.27,14.78 2.46,14.63L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11.03L2.46,9.37C2.27,9.22 2.22,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.78,8.95 21.73,9.22 21.54,9.37L19.43,11.03C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.63C21.73,14.78 21.78,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.03 19.05,18.95L16.56,17.94C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
        </svg>
        <span>Admin Console</span>
      </a>
      {/if}
    </div>

    <!-- Right Side Controls -->
    <div class="nav-controls">
      <!-- Notifications Bell -->
      <div class="notification-container">
        <button 
          class="control-btn notification-btn"
          on:click={() => goto('/notifications')}
          title="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"/>
          </svg>
          {#if unreadNotifications > 0}
            <span class="notification-badge">{unreadNotifications}</span>
          {/if}
        </button>
      </div>


      <!-- User Menu -->
      {#if user && userProfile}
        <div class="user-menu-container">
          <button 
            class="control-btn user-btn"
            class:active={showUserMenu}
            on:click={toggleUserMenu}
            title="User Menu"
          >
            <div class="user-avatar">
              <div class="avatar-placeholder">
                {userProfile.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div class="user-status active"></div>
            </div>
            <div class="user-info">
              <span class="user-name">{userProfile.displayName || 'User'}</span>
              <span class="user-role">{userProfile.position || userProfile.role}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
              <path d="M7,10L12,15L17,10H7Z"/>
            </svg>
          </button>

          {#if showUserMenu}
            <div class="user-menu">
              <div class="user-menu-header">
                <div class="user-avatar-large">
                  <div class="avatar-placeholder">
                    {userProfile.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div class="user-status active"></div>
                </div>
                <div class="user-details">
                  <h4 class="user-name">{userProfile.displayName || 'User'}</h4>
                  <p class="user-email">{userProfile.email}</p>
                  <p class="user-position">{userProfile.position || userProfile.role}</p>
                </div>
              </div>

              <div class="menu-divider"></div>

              <div class="menu-items">
                <a href="/profile" class="menu-item" on:click={closeAllMenus}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                  </svg>
                  <span>Profile Settings</span>
                </a>

                <a href="/settings" class="menu-item" on:click={closeAllMenus}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                  </svg>
                  <span>Preferences</span>
                </a>

                {#if isAdminRole}
                <a href="/admin/console" class="menu-item" on:click={closeAllMenus}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.22,15.05 2.27,14.78 2.46,14.63L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11.03L2.46,9.37C2.27,9.22 2.22,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.78,8.95 21.73,9.22 21.54,9.37L19.43,11.03C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.63C21.73,14.78 21.78,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.03 19.05,18.95L16.56,17.94C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
                  </svg>
                  <span>Admin Console</span>
                </a>
                {/if}

                <a href="/notifications" class="menu-item" on:click={closeAllMenus}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"/>
                  </svg>
                  <span>Notifications</span>
                </a>

                <a href="/help" class="menu-item" on:click={closeAllMenus}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z"/>
                  </svg>
                  <span>Help & Support</span>
                </a>

                {#if isSuperAdmin()}
                  <div class="menu-divider"></div>
                  
                  <a href="/admin/console" class="menu-item" on:click={closeAllMenus}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.22,15.05 2.27,14.78 2.46,14.63L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11.03L2.46,9.37C2.27,9.22 2.22,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.78,8.95 21.73,9.22 21.54,9.37L19.43,11.03C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.63C21.73,14.78 21.78,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.03 19.05,18.95L16.56,17.94C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
                    </svg>
                    <span>Admin Console</span>
                  </a>
                  <a href="/admin/super-admin" class="menu-item super-admin-item" on:click={closeAllMenus}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9A2,2 0 0,1 6,7H9V9H6V21H18V9H15V7H18A2,2 0 0,1 20,9V21A2,2 0 0,1 18,23Z"/>
                    </svg>
                    <span>Super Admin</span>
                    <span class="super-admin-badge">CTO</span>
                  </a>
                {/if}

                {#if isAdminOrSecretary()}
                  <div class="menu-divider"></div>
                  
                  <div class="menu-item submenu-item" class:active={showAdminSubmenu}>
                    <button class="submenu-trigger" on:click={toggleAdminSubmenu}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z"/>
                      </svg>
                      <span>Administration</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="submenu-arrow" class:rotated={showAdminSubmenu}>
                        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                      </svg>
                    </button>
                    
                    {#if showAdminSubmenu}
                      <div class="submenu">
                        <a href="/admin/console" class="submenu-item-link" on:click={closeAllMenus}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.22,15.05 2.27,14.78 2.46,14.63L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11.03L2.46,9.37C2.27,9.22 2.22,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.78,8.95 21.73,9.22 21.54,9.37L19.43,11.03C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.63C21.73,14.78 21.78,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.03 19.05,18.95L16.56,17.94C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
                          </svg>
                          Admin Console
                        </a>
                        <a href="/admin/users" class="submenu-item-link" on:click={closeAllMenus}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16,4C16.88,4 17.67,4.38 18.18,5L20,7.07L18.83,8.24C18.32,7.63 17.69,7.24 17,7.24C16.31,7.24 15.68,7.63 15.17,8.24L14,7.07L15.82,5C16.33,4.38 17.12,4 16,4M12,4C12.88,4 13.67,4.38 14.18,5L16,7.07L14.83,8.24C14.32,7.63 13.69,7.24 13,7.24C12.31,7.24 11.68,7.63 11.17,8.24L10,7.07L11.82,5C12.33,4.38 12.12,4 12,4M8,4C8.88,4 9.67,4.38 10.18,5L12,7.07L10.83,8.24C10.32,7.63 9.69,7.24 9,7.24C8.31,7.24 7.68,7.63 7.17,8.24L6,7.07L7.82,5C8.33,4.38 8.12,4 8,4M4,8V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L18,10V20H6V10L4,8Z"/>
                          </svg>
                          User Management
                        </a>
                        <a href="/admin/settings" class="submenu-item-link" on:click={closeAllMenus}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.22,15.05 2.27,14.78 2.46,14.63L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11.03L2.46,9.37C2.27,9.22 2.22,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.78,8.95 21.73,9.22 21.54,9.37L19.43,11.03C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.63C21.73,14.78 21.78,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.03 19.05,18.95L16.56,17.94C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
                          </svg>
                          System Settings
                        </a>
                        <a href="/admin/audit" class="submenu-item-link" on:click={closeAllMenus}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,5A4,4 0 0,1 13,9A4,4 0 0,1 9,13A4,4 0 0,1 5,9A4,4 0 0,1 9,5M9,15C11.67,15 17,16.34 17,19V21H1V19C1,16.34 6.33,15 9,15M16.76,5.36C18.78,7.56 18.78,10.61 16.76,12.63L15.08,10.94C15.92,9.76 15.92,8.23 15.08,7.05L16.76,5.36M20.07,2C24,6.05 23.97,12.11 20.07,16.07L18.44,14.37C21.21,11.19 21.21,6.65 18.44,3.63L20.07,2Z"/>
                          </svg>
                          Audit Logs
                        </a>
                        <a href="/admin/backup" class="submenu-item-link" on:click={closeAllMenus}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,14.36C9.31,14.36 8.77,12.61 8.77,10.81C8.77,8.5 10.19,7.5 12,7.5C13.81,7.5 15.23,8.5 15.23,10.81C15.23,12.61 14.69,14.36 12.78,14.36L13.66,16C17.31,16 18,13.31 18,10C18,7.79 15.21,4 12,4Z"/>
                          </svg>
                          Backup & Recovery
                        </a>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="menu-divider"></div>

              <button class="menu-item logout-item" on:click={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  .main-navigation {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .nav-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    height: 4rem;
  }

  /* Brand */
  .nav-brand {
    flex-shrink: 0;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .brand-link:hover {
    transform: scale(1.02);
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 12px -2px rgba(0, 168, 89, 0.3);
    flex-shrink: 0;
  }


  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .brand-subtitle {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Navigation Links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    font-size: 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    white-space: nowrap;
    position: relative;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
  }

  .nav-link:hover {
    color: #00a859;
    border-color: #00a859;
    background: transparent !important;
  }

  .nav-link.active {
    color: #ffffff !important;
    background: #00a859 !important;
    border-color: #00a859;
    font-weight: 600;
  }

  .nav-link.active svg {
    color: #ffffff !important;
  }

  .nav-link.active svg path {
    fill: currentColor !important;
  }

  .nav-link svg {
    flex-shrink: 0;
  }

  /* Controls */
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .control-btn:hover {
    color: #00a859;
    border-color: #00a859;
  }

  .control-btn.active {
    color: #00a859;
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.1);
  }

  .ai-btn {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
  }

  .ai-btn:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }

  /* User Menu */
  .user-menu-container {
    position: relative;
  }

  .user-btn {
    padding: 0.5rem 1rem;
    gap: 0.75rem;
  }

  .user-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
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
    font-size: 0.875rem;
    font-weight: 600;
  }

  .user-status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid white;
    background: #9ca3af;
  }

  .user-status.active {
    background: #10b981;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .user-role {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .dropdown-arrow {
    transition: transform 0.2s;
  }

  .user-btn.active .dropdown-arrow {
    transform: rotate(180deg);
  }

  .user-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 320px;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
    z-index: 1000;
    overflow: hidden;
  }

  .user-menu-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .user-avatar-large {
    position: relative;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }

  .user-avatar-large .avatar-placeholder {
    font-size: 1.125rem;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-details .user-name {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    max-width: none;
  }

  .user-email {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.125rem;
  }

  .user-position {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
  }

  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
  }

  .menu-items {
    padding: 0.5rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    text-decoration: none;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .menu-item:hover {
    border-color: #00a859;
    color: #00a859;
    background: transparent;
  }

  .submenu-item {
    position: relative;
  }

  .submenu-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .submenu-arrow {
    transition: transform 0.2s;
  }

  .submenu-arrow.rotated {
    transform: rotate(90deg);
  }

  .submenu {
    position: absolute;
    left: 100%;
    top: 0;
    min-width: 200px;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    z-index: 1001;
  }

  .submenu-item-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    text-decoration: none;
    color: #374151;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .submenu-item-link:hover {
    border-color: #00a859;
    color: #00a859;
    background: transparent;
  }

  .logout-item {
    color: #ef4444;
  }

  .logout-item:hover {
    border-color: #ef4444;
    color: #dc2626;
    background: transparent;
  }

  .super-admin-item {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-radius: 0.5rem;
    margin: 0.25rem 0;
    border: 1px solid transparent;
  }

  .super-admin-item:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .super-admin-badge {
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
  }

  @media (max-width: 1024px) {
    .nav-container {
      padding: 0 1rem;
    }

    .nav-links {
      gap: 0.25rem;
    }

    .nav-link span {
      display: none;
    }

    .nav-link {
      padding: 0.75rem;
    }

    .brand-text {
      display: none;
    }

    .user-info {
      display: none;
    }

    .user-menu {
      min-width: 280px;
    }
  }

  @media (max-width: 768px) {
    .nav-container {
      height: 3.5rem;
    }

    .nav-links {
      display: none;
    }

    .control-btn span {
      display: none;
    }

    .control-btn {
      padding: 0.5rem;
    }
  }
</style> 