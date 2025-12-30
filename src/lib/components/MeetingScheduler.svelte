<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { user, userProfile } from '$lib/stores/auth';
  import { createMeeting } from '$lib/stores/meetings';
  import { X, Calendar, Clock, MapPin, Users, Video, Plus, Trash2 } from 'lucide-svelte';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  let title = '';
  let description = '';
  let date = '';
  let startTime = '';
  let endTime = '';
  let location = '';
  let isVirtual = false;
  let meetingLink = '';
  let attendees: string[] = [];
  let agenda: any[] = [];
  let creating = false;
  
  // Sample board members - in production, this would be loaded from the database
  const boardMembers = [
    { id: '1', name: 'John Smith', email: 'john@boardgovernance.ai', role: 'Chairman' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@boardgovernance.ai', role: 'Director' },
    { id: '3', name: 'Michael Brown', email: 'michael@boardgovernance.ai', role: 'Director' },
    { id: '4', name: 'Emily Davis', email: 'emily@boardgovernance.ai', role: 'Secretary' },
    { id: '5', name: 'David Wilson', email: 'david@boardgovernance.ai', role: 'Treasurer' }
  ];
  
  const addAgendaItem = () => {
    agenda = [...agenda, {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: 15,
      presenter: '',
      requiresVote: false
    }];
  };
  
  const removeAgendaItem = (index: number) => {
    agenda = agenda.filter((_, i) => i !== index);
  };
  
  const handleSubmit = async () => {
    if (!$user || !$userProfile) return;
    
    creating = true;
    try {
      const meetingData = {
        title,
        description,
        date: new Date(date),
        startTime,
        endTime,
        location: isVirtual ? 'Virtual Meeting' : location,
        isVirtual,
        meetingLink: isVirtual ? meetingLink : undefined,
        attendees,
        agenda: agenda.map((item, index) => ({ ...item, order: index + 1 }))
      };
      
      await createMeeting(meetingData, $user.uid, $userProfile.displayName);
      
      // Reset form
      title = '';
      description = '';
      date = '';
      startTime = '';
      endTime = '';
      location = '';
      isVirtual = false;
      meetingLink = '';
      attendees = [];
      agenda = [];
      
      show = false;
      dispatch('scheduled');
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting. Please try again.');
    } finally {
      creating = false;
    }
  };
</script>

{#if show}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => show = false}></div>
      
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Schedule Board Meeting</h3>
            <button on:click={() => show = false} class="text-gray-400 hover:text-gray-600">
              <X class="h-6 w-6" />
            </button>
          </div>
          
          <div class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Meeting Title</label>
                <input
                  type="text"
                  bind:value={title}
                  class="input mt-1"
                  placeholder="Board Meeting - December 2024"
                  required
                />
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  bind:value={description}
                  rows="3"
                  class="input mt-1"
                  placeholder="Brief description of the meeting purpose"
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  <Calendar class="inline h-4 w-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  bind:value={date}
                  class="input mt-1"
                  required
                />
              </div>
              
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    bind:value={startTime}
                    class="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    bind:value={endTime}
                    class="input mt-1"
                    required
                  />
                </div>
              </div>
            </div>
            
            <!-- Location -->
            <div>
              <div class="flex items-center space-x-4 mb-3">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:checked={isVirtual}
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700">
                    <Video class="inline h-4 w-4 mr-1" />
                    Virtual Meeting
                  </span>
                </label>
              </div>
              
              {#if isVirtual}
                <div>
                  <label class="block text-sm font-medium text-gray-700">Meeting Link</label>
                  <input
                    type="url"
                    bind:value={meetingLink}
                    class="input mt-1"
                    placeholder="https://zoom.us/j/123456789"
                  />
                </div>
              {:else}
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    <MapPin class="inline h-4 w-4 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    bind:value={location}
                    class="input mt-1"
                    placeholder="Conference Room A, Main Office"
                    required
                  />
                </div>
              {/if}
            </div>
            
            <!-- Attendees -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                <Users class="inline h-4 w-4 mr-1" />
                Attendees
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                {#each boardMembers as member}
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      bind:group={attendees}
                      value={member.id}
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">
                      {member.name} ({member.role})
                    </span>
                  </label>
                {/each}
              </div>
            </div>
            
            <!-- Agenda -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-gray-700">Agenda Items</label>
                <button
                  type="button"
                  on:click={addAgendaItem}
                  class="btn-secondary text-xs"
                >
                  <Plus class="h-3 w-3 mr-1" />
                  Add Item
                </button>
              </div>
              
              <div class="space-y-3">
                {#each agenda as item, index}
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                      <button
                        type="button"
                        on:click={() => removeAgendaItem(index)}
                        class="text-red-400 hover:text-red-600"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div class="md:col-span-2">
                        <input
                          type="text"
                          bind:value={item.title}
                          class="input"
                          placeholder="Agenda item title"
                        />
                      </div>
                      
                      <div class="md:col-span-2">
                        <textarea
                          bind:value={item.description}
                          rows="2"
                          class="input"
                          placeholder="Description"
                        ></textarea>
                      </div>
                      
                      <div>
                        <input
                          type="number"
                          bind:value={item.duration}
                          class="input"
                          placeholder="Duration (minutes)"
                          min="5"
                          max="180"
                        />
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          bind:value={item.presenter}
                          class="input"
                          placeholder="Presenter"
                        />
                      </div>
                      
                      <div class="md:col-span-2">
                        <label class="flex items-center">
                          <input
                            type="checkbox"
                            bind:checked={item.requiresVote}
                            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span class="ml-2 text-sm text-gray-700">Requires voting</span>
                        </label>
                      </div>
                    </div>
                  </div>
                {/each}
                
                {#if agenda.length === 0}
                  <div class="text-center py-8 text-gray-500">
                    <p class="text-sm">No agenda items yet. Click "Add Item" to get started.</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            on:click={handleSubmit}
            disabled={!title || !date || !startTime || !endTime || creating}
            class="btn-primary w-full sm:w-auto sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if creating}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            {:else}
              Schedule Meeting
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