<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  onMount(() => {
    // Only perform navigation on the client side
    const unsubscribe = authStore.subscribe((auth) => {
      if (browser && !auth.loading) {
        if (!auth.user) {
          goto('/landing');
        } else {
          goto('/dashboard');
        }
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Board Governance AI</title>
</svelte:head>

<div class="loading-container">
  <div class="loading-spinner"></div>
  <p>Loading Board Governance AI...</p>
</div>

<style>
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--board-spacing-lg);
    background: linear-gradient(135deg, var(--board-white) 0%, var(--board-gray-50) 100%);
  }

  .loading-container p {
    color: var(--board-text-secondary);
    font-weight: 500;
  }
</style>
