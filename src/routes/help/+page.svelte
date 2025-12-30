<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    Search, HelpCircle, Book, MessageSquare, Phone, Mail,
    ExternalLink, ChevronRight, FileText, Video, Download
  } from 'lucide-svelte';

  let currentUser = null;
  let searchQuery = '';
  let selectedCategory = 'all';

  const helpCategories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: Book },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'meetings', name: 'Meetings', icon: Video },
    { id: 'voting', name: 'Voting', icon: MessageSquare },
    { id: 'technical', name: 'Technical Support', icon: Phone }
  ];

  const helpArticles = [
    {
      id: 1,
      title: 'Getting Started with Board Governance AI',
      category: 'getting-started',
      description: 'Learn the basics of navigating and using the board portal',
      readTime: '5 min read',
      popular: true
    },
    {
      id: 2,
      title: 'How to Upload and Manage Documents',
      category: 'documents',
      description: 'Step-by-step guide to document management and sharing',
      readTime: '3 min read',
      popular: true
    },
    {
      id: 3,
      title: 'Scheduling and Managing Board Meetings',
      category: 'meetings',
      description: 'Complete guide to meeting scheduling and management',
      readTime: '7 min read',
      popular: false
    },
    {
      id: 4,
      title: 'Participating in Board Voting',
      category: 'voting',
      description: 'How to participate in voting and view results',
      readTime: '4 min read',
      popular: true
    },
    {
      id: 5,
      title: 'Setting Up Multi-Factor Authentication',
      category: 'technical',
      description: 'Secure your account with MFA setup',
      readTime: '3 min read',
      popular: false
    },
    {
      id: 6,
      title: 'Chat and Communication Features',
      category: 'getting-started',
      description: 'Using the built-in chat and collaboration tools',
      readTime: '5 min read',
      popular: false
    }
  ];

  const quickLinks = [
    {
      title: 'User Guide PDF',
      description: 'Download the complete user guide',
      icon: Download,
      action: () => downloadUserGuide()
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: Video,
      action: () => openVideoTutorials()
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: Phone,
      action: () => contactSupport()
    },
    {
      title: 'Report an Issue',
      description: 'Report bugs or technical issues',
      icon: MessageSquare,
      action: () => reportIssue()
    }
  ];

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
    });

    return unsubscribe;
  });

  function downloadUserGuide() {
    // Mock download functionality
    alert('User guide download will be available in production');
  }

  function openVideoTutorials() {
    // Mock video tutorials
    window.open('https://support.boardgovernance.ai/tutorials', '_blank');
  }

  function contactSupport() {
    window.location.href = 'mailto:support@boardgovernance.ai';
  }

  function reportIssue() {
    window.location.href = 'mailto:support@boardgovernance.ai?subject=Issue Report';
  }

  $: filteredArticles = helpArticles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
</script>

<svelte:head>
  <title>Help Center - Board Governance AI</title>
</svelte:head>

<div class="help-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Help Center</h1>
        <p>Find answers, guides, and support for Board Governance AI</p>
      </div>
    </div>
  </div>

  <!-- Search Section -->
  <div class="search-section">
    <div class="search-container">
      <div class="search-input">
        <Search size={20} />
        <input 
          type="text" 
          placeholder="Search help articles..."
          bind:value={searchQuery}
        />
      </div>
    </div>
  </div>

  <!-- Quick Links -->
  <div class="quick-links-section">
    <h2>Quick Actions</h2>
    <div class="quick-links-grid">
      {#each quickLinks as link}
        <button class="quick-link-card" on:click={link.action}>
          <div class="link-icon">
            <svelte:component this={link.icon} size={24} />
          </div>
          <div class="link-content">
            <h3>{link.title}</h3>
            <p>{link.description}</p>
          </div>
          <ChevronRight size={16} />
        </button>
      {/each}
    </div>
  </div>

  <!-- Categories -->
  <div class="categories-section">
    <div class="categories-tabs">
      {#each helpCategories as category}
        <button 
          class="category-tab"
          class:active={selectedCategory === category.id}
          on:click={() => selectedCategory = category.id}
        >
          <svelte:component this={category.icon} size={16} />
          {category.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- Help Articles -->
  <div class="articles-section">
    <div class="articles-header">
      <h2>Help Articles</h2>
      <span class="articles-count">{filteredArticles.length} articles</span>
    </div>

    {#if filteredArticles.length === 0}
      <div class="empty-state">
        <HelpCircle size={48} />
        <h3>No articles found</h3>
        <p>Try adjusting your search or browse different categories</p>
      </div>
    {:else}
      <div class="articles-grid">
        {#each filteredArticles as article}
          <div class="article-card">
            <div class="article-header">
              <h3 class="article-title">{article.title}</h3>
              {#if article.popular}
                <span class="popular-badge">Popular</span>
              {/if}
            </div>
            
            <p class="article-description">{article.description}</p>
            
            <div class="article-meta">
              <span class="read-time">{article.readTime}</span>
              <button class="read-more">
                Read More
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Contact Section -->
  <div class="contact-section">
    <div class="contact-card">
      <div class="contact-header">
        <h2>Still Need Help?</h2>
        <p>Our support team is here to assist you</p>
      </div>
      
      <div class="contact-options">
        <div class="contact-option">
          <div class="contact-icon">
            <Mail size={20} />
          </div>
          <div class="contact-info">
            <h4>Email Support</h4>
            <p>support@boardgovernance.ai</p>
            <span>Response within 24 hours</span>
          </div>
        </div>
        
        <div class="contact-option">
          <div class="contact-icon">
            <Phone size={20} />
          </div>
          <div class="contact-info">
            <h4>Phone Support</h4>
            <p>+974 4003 3333</p>
            <span>Available 24/7</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .help-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 3rem;
  }

  .header-content {
    text-align: center;
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

  .search-section {
    margin-bottom: 3rem;
  }

  .search-container {
    display: flex;
    justify-content: center;
  }

  .search-input {
    position: relative;
    max-width: 500px;
    width: 100%;
  }

  .search-input svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }

  .search-input input:focus {
    outline: none;
    border-color: #00a859;
    box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.1);
  }

  .quick-links-section {
    margin-bottom: 3rem;
  }

  .quick-links-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }

  .quick-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .quick-link-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-link-card:hover {
    border-color: #00a859;
    box-shadow: 0 4px 12px rgba(0, 168, 89, 0.1);
    transform: translateY(-2px);
  }

  .link-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .link-content {
    flex: 1;
  }

  .link-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .link-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .categories-section {
    margin-bottom: 2rem;
  }

  .categories-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-tab:hover {
    color: #00a859;
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .category-tab.active {
    background: #00a859;
    color: white;
    border-color: #00a859;
  }

  .articles-section {
    margin-bottom: 3rem;
  }

  .articles-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .articles-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .articles-count {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .article-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .article-card:hover {
    border-color: #00a859;
    box-shadow: 0 4px 12px rgba(0, 168, 89, 0.1);
  }

  .article-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .article-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
    margin: 0;
    flex: 1;
  }

  .popular-badge {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  .article-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .read-time {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .read-more {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #00a859;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .read-more:hover {
    color: #059669;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 1rem 0 0.5rem;
  }

  .contact-section {
    background: linear-gradient(135deg, #f9fafb 0%, #e5f3f0 100%);
    border-radius: 1rem;
    padding: 2rem;
  }

  .contact-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .contact-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .contact-header p {
    color: #6b7280;
  }

  .contact-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .contact-option {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .contact-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .contact-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .contact-info p {
    font-size: 0.875rem;
    color: #00a859;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .contact-info span {
    font-size: 0.75rem;
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .help-page {
      padding: 1rem;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .quick-links-grid {
      grid-template-columns: 1fr;
    }

    .categories-tabs {
      flex-direction: column;
    }

    .articles-grid {
      grid-template-columns: 1fr;
    }

    .contact-options {
      grid-template-columns: 1fr;
    }
  }
</style> 