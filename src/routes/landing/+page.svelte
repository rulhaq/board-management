<script>
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  $: loading = $authStore.loading;

  $: if ($authStore.user && !$authStore.loading) {
    goto('/dashboard');
  }

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }

    try {
      error = '';
      await $authStore.login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      error = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
    }
  }

  // Board members data
  const boardMembers = [
    {
      name: 'Dr. Khalil Al-Mansouri',
      position: 'Chief Medical Officer',
      department: 'Clinical Affairs',
      avatar: '/avatars/khalil.jpg',
      bio: 'Renowned pediatric surgeon and healthcare innovator with 25+ years of clinical excellence.',
      specialties: ['Pediatric Surgery', 'Medical Innovation', 'Clinical Governance'],
      email: 'dr.khalil@boardgovernance.ai'
    },
    {
      name: 'Dr. Sarah Johnson',
      position: 'Director of Research',
      department: 'Research & Development',
      avatar: '/avatars/sarah.jpg',
      bio: 'Leading researcher in pediatric medicine with focus on genetic disorders and precision medicine.',
      specialties: ['Genetics', 'Pediatric Research', 'Precision Medicine'],
      email: 'dr.sarah@boardgovernance.ai'
    },
    {
      name: 'Prof. Omar Al-Dosari',
      position: 'Head of Cardiology',
      department: 'Cardiovascular Medicine',
      avatar: '/avatars/omar.jpg',
      bio: 'Distinguished cardiologist and medical educator with expertise in congenital heart disease.',
      specialties: ['Pediatric Cardiology', 'Congenital Heart Disease', 'Medical Education'],
      email: 'prof.omar@boardgovernance.ai'
    },
    {
      name: 'Dr. Maryam Al-Naimi',
      position: 'Chief Nursing Officer',
      department: 'Nursing Excellence',
      avatar: '/avatars/maryam.jpg',
      bio: 'Nursing leader dedicated to advancing patient care standards and nursing education.',
      specialties: ['Nursing Leadership', 'Patient Safety', 'Quality Improvement'],
      email: 'dr.maryam@boardgovernance.ai'
    },
    {
      name: 'Mr. Hassan Al-Kaabi',
      position: 'Chief Financial Officer',
      department: 'Finance & Operations',
      avatar: '/avatars/hassan.jpg',
      bio: 'Financial strategist with extensive experience in healthcare economics and strategic planning.',
      specialties: ['Healthcare Finance', 'Strategic Planning', 'Risk Management'],
      email: 'hassan@boardgovernance.ai'
    },
    {
      name: 'Dr. Layla Al-Thani',
      position: 'Director of Quality',
      department: 'Quality & Patient Safety',
      avatar: '/avatars/layla.jpg',
      bio: 'Quality improvement expert focused on patient safety and healthcare excellence standards.',
      specialties: ['Quality Management', 'Patient Safety', 'Healthcare Standards'],
      email: 'dr.layla@boardgovernance.ai'
    }
  ];
</script>

<svelte:head>
  <title>Board Governance AI - Secure Board Governance Platform</title>
  <meta name="description" content="Secure board governance platform powered by AI. Advanced AI-powered collaboration for board excellence and governance." />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="landing-container">
  <main class="hero-section">
    <!-- Left Content -->
    <div class="hero-content">
      <div class="hero-brand">
        <div class="brand-logo">
          <img src="/src/lib/assets/logo.svg" alt="Board Governance AI" class="logo-image" />
          
        </div>
      </div>

      <div class="hero-text">
        
        <h2 class="hero-title">
          Board Governance AI
          <span class="gradient-text">Platform</span>
        </h2>
        <p class="hero-description">
          Secure, AI-powered board collaboration designed for governance excellence. 
          Streamline governance, enhance decision-making, and drive innovation in board management.
        </p>
        
        <div class="hero-features">
          <div class="feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
            </svg>
            <span>Enterprise Security</span>
          </div>
          <div class="feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3Z"/>
            </svg>
            <span>AI-Powered Insights</span>
          </div>
          <div class="feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z"/>
            </svg>
            <span>Integrated Collaboration</span>
          </div>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn btn-outline" on:click={() => {}}>
            Learn More About Board Governance AI
          </button>
        </div>
      </div>
    </div>

    <!-- Right Login Panel -->
    <aside class="login-panel">
      <div class="login-container">
        <div class="login-header">
          <h3 class="login-title">Secure Access</h3>
          <p class="login-subtitle">Sign in to your governance portal</p>
        </div>

        <form on:submit|preventDefault={handleLogin} class="login-form">
          {#if error}
            <div class="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              {error}
            </div>
          {/if}

          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input 
              id="email"
              type="email" 
              bind:value={email}
              class="form-input"
              placeholder="your.email@boardgovernance.ai"
              required
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              id="password"
              type="password" 
              bind:value={password}
              class="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Access Portal'}
          </button>
        </form>

        <div class="login-demo">
          <p class="demo-title">Demo Credentials:</p>
          <div class="demo-accounts">
            <div class="demo-account">
              <strong>Admin:</strong> admin@boardgovernance.ai / Admin2024!
            </div>
            <div class="demo-account">
              <strong>Board Member:</strong> board.member1@boardgovernance.ai / Board2024!
            </div>
            <div class="demo-account">
              <strong>Secretary:</strong> secretary@boardgovernance.ai / Secretary2024!
            </div>
          </div>
        </div>
      </div>
    </aside>
  </main>
</div>

<style>
  .landing-container {
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }

  .hero-section {
    height: 100vh;
    background: linear-gradient(135deg, var(--board-white) 0%, var(--board-gray-50) 100%);
    display: grid;
    grid-template-columns: 1fr 400px;
    position: relative;
  }

  .hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(0, 168, 89, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
    pointer-events: none;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--board-spacing-8);
    position: relative;
    z-index: 1;
  }

  .hero-brand {
    margin-bottom: var(--board-spacing-8);
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-4);
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    background: var(--board-gradient-primary);
    border-radius: var(--board-border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--board-white);
    font-family: var(--board-font-heading);
    font-size: 1.5rem;
    font-weight: 800;
    box-shadow: var(--board-shadow-lg);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    font-family: var(--board-font-heading);
    line-height: 1.2;
    margin: 0;
  }

  .brand-subtitle {
    font-size: 0.875rem;
    color: var(--board-text-secondary);
    font-weight: 500;
    margin: 0;
  }

  .hero-text {
    max-width: 600px;
  }

  .hero-logo {
    margin-bottom: 2rem;
    text-align: center;
  }

  .logo-image {
    height: 60px;
    width: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 168, 89, 0.2));
  }

  .hero-title {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-4);
  }

  .gradient-text {
    background: var(--board-gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-description {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--board-text-secondary);
    margin-bottom: var(--board-spacing-6);
  }

  .hero-features {
    display: flex;
    flex-wrap: wrap;
    gap: var(--board-spacing-6);
    margin-bottom: var(--board-spacing-8);
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-2);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--board-text-secondary);
  }

  .feature-item svg {
    color: var(--board-primary);
  }

  .hero-actions {
    display: flex;
    gap: var(--board-spacing-4);
  }

  /* Login Panel */
  .login-panel {
    background: var(--board-white);
    border-left: 1px solid var(--board-gray-200);
    display: flex;
    align-items: center;
    box-shadow: var(--board-shadow-xl);
    position: relative;
    z-index: 2;
  }

  .login-container {
    padding: var(--board-spacing-8);
    width: 100%;
  }

  .login-header {
    text-align: center;
    margin-bottom: var(--board-spacing-6);
  }

  .login-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-2);
  }

  .login-subtitle {
    font-size: 0.875rem;
    color: var(--board-text-secondary);
    margin: 0;
  }

  .login-form {
    margin-bottom: var(--board-spacing-6);
  }

  .form-group {
    margin-bottom: var(--board-spacing-4);
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--board-text-primary);
    margin-bottom: var(--board-spacing-2);
  }

  .form-input {
    width: 100%;
    padding: var(--board-spacing-3);
    border: 1px solid var(--board-gray-300);
    border-radius: var(--board-border-radius);
    font-size: 0.875rem;
    transition: var(--board-transition);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--board-primary);
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .btn-full {
    width: 100%;
    justify-content: center;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--board-spacing-2);
    padding: var(--board-spacing-3);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--board-border-radius);
    color: var(--board-error);
    font-size: 0.875rem;
    margin-bottom: var(--board-spacing-4);
  }

  .login-demo {
    border-top: 1px solid var(--board-gray-200);
    padding-top: var(--board-spacing-4);
  }

  .demo-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--board-text-secondary);
    margin-bottom: var(--board-spacing-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .demo-accounts {
    display: flex;
    flex-direction: column;
    gap: var(--board-spacing-2);
  }

  .demo-account {
    font-size: 0.75rem;
    color: var(--board-text-secondary);
    padding: var(--board-spacing-2);
    background: var(--board-gray-50);
    border-radius: var(--board-border-radius);
  }

  .demo-account strong {
    color: var(--board-text-primary);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .hero-section {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
    }

    .login-panel {
      border-left: none;
      border-top: 1px solid var(--board-gray-200);
    }

    .hero-content {
      padding: var(--board-spacing-6);
    }

    .login-container {
      padding: var(--board-spacing-6);
    }
  }

  @media (max-width: 768px) {
    .hero-title {
      font-size: 1.875rem;
    }

    .hero-description {
      font-size: 1rem;
    }

    .hero-features {
      flex-direction: column;
      gap: var(--board-spacing-3);
    }
  }
</style> 