<script lang="ts">
  import { user, userProfile } from '$lib/stores/auth';
  import { downloadDocument } from '$lib/stores/documents';
  import { 
    X, 
    Download, 
    Calendar, 
    User, 
    Lock, 
    Tag, 
    History,
    Shield 
  } from 'lucide-svelte';
  
  export let show = false;
  export let document: any;
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getConfidentialityColor = (level: string): string => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'confidential': return 'bg-yellow-100 text-yellow-800';
      case 'restricted': return 'bg-orange-100 text-orange-800';
      case 'top-secret': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleDownload = async () => {
    if (!$user || !$userProfile) return;
    
    try {
      const downloadUrl = await downloadDocument(
        document.id, 
        $user.uid, 
        $userProfile.displayName
      );
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.fileName;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };
</script>

{#if show && document}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => show = false}></div>
      
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900">{document.title}</h3>
              <p class="text-sm text-gray-500 mt-1">{document.fileName}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                on:click={handleDownload}
                class="btn-primary"
              >
                <Download class="h-4 w-4 mr-2" />
                Download
              </button>
              <button on:click={() => show = false} class="text-gray-400 hover:text-gray-600">
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <!-- Document Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">Document Information</h4>
                <div class="space-y-2">
                  <div class="flex items-center text-sm">
                    <Calendar class="h-4 w-4 text-gray-400 mr-2" />
                    <span class="text-gray-600">Uploaded:</span>
                    <span class="ml-2">{new Date(document.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div class="flex items-center text-sm">
                    <User class="h-4 w-4 text-gray-400 mr-2" />
                    <span class="text-gray-600">Uploaded by:</span>
                    <span class="ml-2">{document.uploadedBy}</span>
                  </div>
                  
                  <div class="flex items-center text-sm">
                    <Shield class="h-4 w-4 text-gray-400 mr-2" />
                    <span class="text-gray-600">Size:</span>
                    <span class="ml-2">{formatFileSize(document.fileSize)}</span>
                  </div>
                  
                  <div class="flex items-center text-sm">
                    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidentialityColor(document.confidentialityLevel)}`}>
                      <Lock class="h-3 w-3 mr-1" />
                      {document.confidentialityLevel}
                    </span>
                    <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {document.category}
                    </span>
                  </div>
                </div>
              </div>
              
              {#if document.description}
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p class="text-sm text-gray-600">{document.description}</p>
                </div>
              {/if}
              
              {#if document.tags && document.tags.length > 0}
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div class="flex flex-wrap gap-2">
                    {#each document.tags as tag}
                      <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        <Tag class="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Audit Log -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-2">
                <History class="inline h-4 w-4 mr-1" />
                Audit Trail
              </h4>
              <div class="max-h-64 overflow-y-auto">
                <div class="space-y-2">
                  {#each document.auditLog || [] as entry}
                    <div class="flex items-start space-x-2 text-xs">
                      <div class="flex-shrink-0 mt-1">
                        <div class={`h-2 w-2 rounded-full ${
                          entry.action === 'upload' ? 'bg-green-400' :
                          entry.action === 'download' ? 'bg-blue-400' :
                          entry.action === 'view' ? 'bg-gray-400' :
                          entry.action === 'edit' ? 'bg-yellow-400' :
                          entry.action === 'delete' ? 'bg-red-400' :
                          'bg-purple-400'
                        }`}></div>
                      </div>
                      <div class="flex-1">
                        <p class="text-gray-900 font-medium capitalize">{entry.action}</p>
                        <p class="text-gray-600">{entry.details}</p>
                        <p class="text-gray-500">
                          {entry.userName} • {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Document Preview Area -->
          <div class="mt-6">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div class="border-2 border-gray-200 rounded-lg p-8 text-center bg-gray-50">
              <div class="text-gray-400">
                <Shield class="mx-auto h-12 w-12 mb-2" />
                <p class="text-sm">Document preview not available</p>
                <p class="text-xs mt-1">Download the document to view its contents</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            on:click={handleDownload}
            class="btn-primary w-full sm:w-auto sm:ml-3"
          >
            <Download class="h-4 w-4 mr-2" />
            Download
          </button>
          <button
            type="button"
            on:click={() => show = false}
            class="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 