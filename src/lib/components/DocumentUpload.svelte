<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { user, userProfile } from '$lib/stores/auth';
  import { uploadDocument } from '$lib/stores/documents';
  import { Upload, X, File, Lock } from 'lucide-svelte';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  let dragOver = false;
  let uploading = false;
  let selectedFile: File | null = null;
  let title = '';
  let description = '';
  let category = 'other';
  let confidentialityLevel = 'confidential';
  let tags = '';
  let accessList: string[] = [];
  
  const categories = [
    { value: 'agenda', label: 'Agenda' },
    { value: 'minutes', label: 'Minutes' },
    { value: 'financial', label: 'Financial' },
    { value: 'policy', label: 'Policy' },
    { value: 'other', label: 'Other' }
  ];
  
  const confidentialityLevels = [
    { value: 'public', label: 'Public' },
    { value: 'confidential', label: 'Confidential' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'top-secret', label: 'Top Secret' }
  ];
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragOver = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      selectedFile = files[0];
      if (!title) {
        title = selectedFile.name.replace(/\.[^/.]+$/, "");
      }
    }
  };
  
  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      selectedFile = target.files[0];
      if (!title) {
        title = selectedFile.name.replace(/\.[^/.]+$/, "");
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedFile || !$user || !$userProfile) return;
    
    uploading = true;
    try {
      const metadata = {
        title,
        description,
        category,
        confidentialityLevel,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        accessList: accessList.length > 0 ? accessList : [$user.uid]
      };
      
      await uploadDocument(selectedFile, metadata, $user.uid, $userProfile.displayName);
      
      // Reset form
      selectedFile = null;
      title = '';
      description = '';
      category = 'other';
      confidentialityLevel = 'confidential';
      tags = '';
      accessList = [];
      
      show = false;
      dispatch('uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      uploading = false;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
</script>

{#if show}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => show = false}></div>
      
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Upload Document</h3>
            <button on:click={() => show = false} class="text-gray-400 hover:text-gray-600">
              <X class="h-6 w-6" />
            </button>
          </div>
          
          <!-- File Drop Zone -->
          <div 
            class={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
            on:dragover|preventDefault={() => dragOver = true}
            on:dragleave|preventDefault={() => dragOver = false}
            on:drop|preventDefault={handleDrop}
          >
            {#if selectedFile}
              <div class="flex items-center justify-center space-x-2">
                <File class="h-8 w-8 text-primary-600" />
                <div class="text-left">
                  <p class="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p class="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            {:else}
              <Upload class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-2 text-sm text-gray-600">
                Drop your file here, or 
                <label class="text-primary-600 hover:text-primary-500 cursor-pointer">
                  browse
                  <input type="file" class="hidden" on:change={handleFileSelect} />
                </label>
              </p>
              <p class="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, XLS, XLSX up to 50MB
              </p>
            {/if}
          </div>
          
          <!-- Metadata Form -->
          <div class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                bind:value={title}
                class="input mt-1"
                placeholder="Document title"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                bind:value={description}
                rows="3"
                class="input mt-1"
                placeholder="Brief description of the document"
              ></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <select bind:value={category} class="input mt-1">
                  {#each categories as cat}
                    <option value={cat.value}>{cat.label}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  <Lock class="inline h-4 w-4 mr-1" />
                  Confidentiality
                </label>
                <select bind:value={confidentialityLevel} class="input mt-1">
                  {#each confidentialityLevels as level}
                    <option value={level.value}>{level.label}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input
                type="text"
                bind:value={tags}
                class="input mt-1"
                placeholder="quarterly, financial, budget"
              />
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            on:click={handleSubmit}
            disabled={!selectedFile || !title || uploading}
            class="btn-primary w-full sm:w-auto sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if uploading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            {:else}
              Upload Document
            {/if}
          </button>
          <button
            type="button"
            on:click={() => show = false}
            class="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 