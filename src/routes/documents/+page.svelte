<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { documents as documentsStore, firebaseActions } from '$lib/stores/firebaseStore';
  import { 
    Upload, FileText, Download, Eye, Trash2, Search, 
    Plus, FolderPlus, Folder, File, Calendar, User,
    Star
  } from 'lucide-svelte';

  let currentUser = null;
  let documents = [];
  let loading = false;
  let searchQuery = '';
  let selectedCategory = 'all';
  let showUploadModal = false;
  let uploadFiles = [];
  let uploadDescription = '';

  // Categories
  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'board-minutes', name: 'Board Minutes' },
    { id: 'financial', name: 'Financial Reports' },
    { id: 'policies', name: 'Policies & Procedures' },
    { id: 'presentations', name: 'Presentations' },
    { id: 'contracts', name: 'Contracts' },
    { id: 'research', name: 'Research Documents' },
    { id: 'general', name: 'General' }
  ];

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      if (auth.profile) {
        loadDocuments();
      }
    });

    return unsubscribe;
  });

  function loadDocuments() {
    // Sample documents
    documents = [
      {
        id: 'doc-1',
        name: 'Q1 2024 Financial Report.pdf',
        type: 'pdf',
        size: '2.4 MB',
        category: 'financial',
        uploadedBy: 'Hassan Al-Kuwari',
        uploadedAt: '2024-01-15T10:30:00Z',
        description: 'Quarterly financial performance and budget analysis',
        isStarred: false,
        downloadCount: 12
      },
      {
        id: 'doc-2',
        name: 'Board Meeting Minutes - January 2024.docx',
        type: 'docx',
        size: '856 KB',
        category: 'board-minutes',
        uploadedBy: 'Board Secretary',
        uploadedAt: '2024-01-20T14:15:00Z',
        description: 'Minutes from the January board meeting',
        isStarred: true,
        downloadCount: 8
      },
      {
        id: 'doc-3',
        name: 'Research Initiative Proposal.pptx',
        type: 'pptx',
        size: '4.2 MB',
        category: 'research',
        uploadedBy: 'Dr. Sarah Mitchell',
        uploadedAt: '2024-01-18T09:45:00Z',
        description: 'Proposal for new genomics research initiative',
        isStarred: false,
        downloadCount: 15
      }
    ];
  }

  function canManageDocuments() {
    // All board members, secretaries, and admins can add documents
    return currentUser?.permissions?.canManageDocuments || 
           currentUser?.role === 'admin' || 
           currentUser?.role === 'secretary' ||
           currentUser?.role === 'board_member';
  }

  function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    uploadFiles = files;
    if (files.length > 0) {
      showUploadModal = true;
    }
  }

  function uploadDocument() {
    if (uploadFiles.length === 0) return;

    const file = uploadFiles[0];
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: file.name,
      type: file.name.split('.').pop().toLowerCase(),
      size: formatFileSize(file.size),
      category: 'general',
      uploadedBy: currentUser?.displayName || 'Unknown',
      uploadedAt: new Date().toISOString(),
      description: uploadDescription,
      isStarred: false,
      downloadCount: 0
    };

    documents = [newDoc, ...documents];
    resetUploadForm();
  }

  function resetUploadForm() {
    uploadFiles = [];
    uploadDescription = '';
    showUploadModal = false;
  }

  function downloadDocument(doc) {
    console.log('Downloading:', doc.name);
    // Mock download
    alert(`Downloading ${doc.name}`);
  }

  function deleteDocument(doc) {
    if (confirm(`Delete "${doc.name}"?`)) {
      documents = documents.filter(d => d.id !== doc.id);
    }
  }

  function toggleStar(doc) {
    documents = documents.map(d => 
      d.id === doc.id ? { ...d, isStarred: !d.isStarred } : d
    );
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  function getFileIcon(type) {
    switch (type) {
      case 'pdf': return '📄';
      case 'docx':
      case 'doc': return '📝';
      case 'pptx':
      case 'ppt': return '📊';
      case 'xlsx':
      case 'xls': return '📈';
      default: return '📄';
    }
  }

  $: filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
</script>

<svelte:head>
  <title>Documents - Board Governance AI</title>
</svelte:head>

<div class="documents-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1>Documents</h1>
        <p>Manage and access board documents and important files</p>
      </div>
      
      <div class="header-actions">
        <label class="btn btn-primary">
          <Upload size={16} />
          Upload Document
          <input 
            type="file" 
            multiple 
            style="display: none;" 
            on:change={handleFileUpload}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
        </label>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-section">
    <div class="search-container">
      <div class="search-input">
        <Search size={16} />
        <input 
          type="text" 
          placeholder="Search documents..."
          bind:value={searchQuery}
        />
      </div>
    </div>

    <div class="filter-controls">
      <select bind:value={selectedCategory}>
        {#each categories as category}
          <option value={category.id}>{category.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Documents Grid -->
  <div class="documents-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading documents...</p>
      </div>
    {:else if filteredDocuments.length === 0}
      <div class="empty-state">
        <FileText size={48} />
        <h3>No documents found</h3>
        <p>Upload your first document to get started.</p>
      </div>
    {:else}
      <div class="documents-grid">
        {#each filteredDocuments as doc (doc.id)}
          <div class="document-card">
            <div class="document-preview">
              <div class="file-icon">
                {getFileIcon(doc.type)}
              </div>
              {#if doc.isStarred}
                <div class="star-badge">
                  <Star size={12} />
                </div>
              {/if}
            </div>

            <div class="document-info">
              <h4 class="document-name">{doc.name}</h4>
              <p class="document-description">{doc.description}</p>
              
              <div class="document-meta">
                <div class="meta-row">
                  <User size={12} />
                  <span>{doc.uploadedBy}</span>
                </div>
                <div class="meta-row">
                  <Calendar size={12} />
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>
                <div class="meta-row">
                  <File size={12} />
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>

            <div class="document-actions">
              <button class="action-btn" on:click={() => downloadDocument(doc)} title="Download">
                <Download size={16} />
              </button>
              
              <button 
                class="action-btn" 
                class:active={doc.isStarred}
                on:click={() => toggleStar(doc)}
                title={doc.isStarred ? 'Unstar' : 'Star'}
              >
                <Star size={16} />
              </button>

              {#if canManageDocuments()}
                <button class="action-btn danger" on:click={() => deleteDocument(doc)} title="Delete">
                  <Trash2 size={16} />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Upload Modal -->
{#if showUploadModal}
  <div class="modal-overlay" on:click={resetUploadForm}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Upload Document</h2>
        <button class="modal-close" on:click={resetUploadForm}>×</button>
      </div>

      <div class="modal-body">
        <form on:submit|preventDefault={uploadDocument}>
          <div class="form-group">
            <label>Selected Files</label>
            <div class="file-list">
              {#each uploadFiles as file}
                <div class="file-item">
                  <span class="file-icon">{getFileIcon(file.name.split('.').pop())}</span>
                  <span class="file-name">{file.name}</span>
                  <span class="file-size">({formatFileSize(file.size)})</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              bind:value={uploadDescription}
              rows="3"
              placeholder="Brief description of the document..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" on:click={resetUploadForm}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .documents-page {
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

  .filters-section {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .search-container {
    flex: 1;
    max-width: 400px;
  }

  .search-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #f9fafb;
  }

  .search-input svg {
    position: absolute;
    left: 0.75rem;
    color: #9ca3af;
    z-index: 1;
  }

  .filter-controls select {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
  }

  .documents-container {
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

  .documents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .document-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: all 0.2s;
    position: relative;
  }

  .document-card:hover {
    border-color: #00a859;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  }

  .document-preview {
    position: relative;
    text-align: center;
    margin-bottom: 1rem;
  }

  .file-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .star-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #fbbf24;
    color: white;
    padding: 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .document-info {
    margin-bottom: 1rem;
  }

  .document-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .document-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
    margin-bottom: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .document-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .document-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    color: #374151;
    border-color: #9ca3af;
    background: #f9fafb;
  }

  .action-btn.active {
    color: #fbbf24;
    border-color: #fbbf24;
  }

  .action-btn.danger:hover {
    color: #ef4444;
    border-color: #ef4444;
    background: #fef2f2;
  }

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
    max-width: 600px;
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

  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    resize: vertical;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .file-name {
    flex: 1;
    font-weight: 500;
  }

  .file-size {
    color: #6b7280;
    font-size: 0.875rem;
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

  @media (max-width: 768px) {
    .documents-page {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .filters-section {
      flex-direction: column;
    }

    .documents-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 