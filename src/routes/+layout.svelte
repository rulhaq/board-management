<script>
  import '../app.css';
  import { authStore } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';

  $: user = $authStore.user;
  $: isAuthPage = $page.route?.id === '/landing' || $page.route?.id === '/login';
  
  let showAIChat = false;
  
  function toggleAIChat() {
    showAIChat = !showAIChat;
  }
  
  onMount(() => {
    // Listen for AI chat toggle events from Navigation
    const handleAIChatToggle = () => {
      showAIChat = true;
    };
    
    window.addEventListener('toggle-ai-chat', handleAIChatToggle);
    
    return () => {
      window.removeEventListener('toggle-ai-chat', handleAIChatToggle);
    };
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="app">
  {#if user && !isAuthPage}
    <Navigation />
  {/if}
  
  <main class="main-content" class:full-height={isAuthPage}>
    <slot />
  </main>
  
  {#if user && !isAuthPage}
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-content">
          <!-- Brand Section -->
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="logo-icon">BG</div>
              <div class="logo-text">
                <div class="brand-name">Board Governance AI</div>
                <div class="brand-tagline">Board Governance Portal</div>
              </div>
            </div>
            <p class="footer-description">
              Secure, transparent, and efficient governance platform powered by AI for modern board management.
            </p>
          </div>

          <!-- Quick Links -->
          <div class="footer-section">
            <h4 class="footer-title">Quick Access</h4>
            <nav class="footer-nav">
              <a href="/dashboard" class="footer-link">Dashboard</a>
              <a href="/documents" class="footer-link">Documents</a>
              <a href="/meetings" class="footer-link">Meetings</a>
              <a href="/voting" class="footer-link">Voting</a>
              <a href="/reports" class="footer-link">Reports</a>
            </nav>
          </div>

          <!-- Resources -->
          <div class="footer-section">
            <h4 class="footer-title">Resources</h4>
            <nav class="footer-nav">
              <a href="/help" class="footer-link">Help Center</a>
              <a href="/policies" class="footer-link">Policies</a>
              <a href="/guidelines" class="footer-link">Guidelines</a>
              <a href="/training" class="footer-link">Training</a>
              <a href="/support" class="footer-link">Support</a>
            </nav>
          </div>

          <!-- Contact -->
          <div class="footer-section">
            <h4 class="footer-title">Contact</h4>
            <div class="contact-info">
              <div class="contact-item">
                <span class="contact-label">Board Secretary:</span>
                <a href="mailto:secretary@boardgovernance.ai" class="contact-link">secretary@boardgovernance.ai</a>
              </div>
              <div class="contact-item">
                <span class="contact-label">IT Support:</span>
                <a href="mailto:support@boardgovernance.ai" class="contact-link">support@boardgovernance.ai</a>
              </div>
              <div class="contact-item">
                <span class="contact-label">Emergency:</span>
                <a href="tel:+97444000000" class="contact-link">+974 4400 0000</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p class="copyright">
              © 2024 Board Governance AI. All rights reserved. | 
              <a href="/privacy" class="legal-link">Privacy Policy</a> | 
              <a href="/terms" class="legal-link">Terms of Service</a> | 
              <a href="/security" class="legal-link">Security</a>
            </p>
            <div class="footer-badges">
              <div class="badge">
                <span class="badge-text">SOC 2 Compliant</span>
              </div>
              <div class="badge">
                <span class="badge-text">ISO 27001</span>
              </div>
              <div class="badge">
                <span class="badge-text">HIPAA Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    
    <!-- AI Chat Sidebar -->
    <ChatAssistant 
      isVisible={showAIChat} 
      onClose={() => showAIChat = false}
    />
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
  }

  .main-content {
    flex: 1;
    padding-top: 0;
  }

  .main-content.full-height {
    min-height: 100vh;
    padding-top: 0;
  }

  .app-footer {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: #f9fafb;
    margin-top: auto;
  }

  .footer-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 2rem 0;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
    margin-bottom: 2rem;
  }

  .footer-brand {
    max-width: 400px;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 10px 25px -5px rgba(0, 168, 89, 0.3);
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f9fafb;
    line-height: 1.2;
  }

  .brand-tagline {
    font-size: 1rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .footer-description {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #d1d5db;
    margin: 0;
  }

  .footer-section {
    display: flex;
    flex-direction: column;
  }

  .footer-title {
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    margin-bottom: 1rem;
  }

  .footer-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-link {
    font-size: 0.875rem;
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
    padding: 0.25rem 0;
  }

  .footer-link:hover {
    color: #34d399;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contact-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .contact-label {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .contact-link {
    font-size: 0.875rem;
    color: #d1d5db;
    text-decoration: none;
    transition: color 0.2s;
  }

  .contact-link:hover {
    color: #34d399;
  }

  .footer-bottom {
    border-top: 1px solid #374151;
    padding: 1.5rem 0;
  }

  .footer-bottom-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .copyright {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }

  .legal-link {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
  }

  .legal-link:hover {
    color: #34d399;
  }

  .footer-badges {
    display: flex;
    gap: 1rem;
  }

  .badge {
    padding: 0.375rem 0.75rem;
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.2);
    border-radius: 0.5rem;
  }

  .badge-text {
    font-size: 0.75rem;
    font-weight: 500;
    color: #34d399;
  }

  @media (max-width: 1024px) {
    .footer-content {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
  }

  @media (max-width: 768px) {
    .footer-container {
      padding: 2rem 1rem 0;
    }

    .footer-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .footer-bottom-content {
      flex-direction: column;
      align-items: flex-start;
      text-align: center;
    }

    .footer-badges {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    .brand-name {
      font-size: 1.25rem;
    }

    .brand-tagline {
      font-size: 0.875rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .footer-badges {
      gap: 0.5rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
    }

    .badge-text {
      font-size: 0.625rem;
    }
  }
</style>
