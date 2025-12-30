<script lang="ts">
  import { user, userProfile } from '$lib/stores/auth';
  import { castVote, recordAttendance } from '$lib/stores/meetings';
  import { generateMeetingMinutes } from '$lib/ai/openai';
  import { 
    X, 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    Video,
    Vote,
    FileText,
    Download,
    Play,
    CheckCircle
  } from 'lucide-svelte';
  
  export let show = false;
  export let meeting: any;
  
  let activeTab = 'details';
  let attendanceMarked = false;
  let votingResults: any = {};
  let generatingMinutes = false;
  
  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'voting', label: 'Voting', icon: Vote },
    { id: 'minutes', label: 'Minutes', icon: Download }
  ];
  
  const markAttendance = async (status: 'present' | 'absent' | 'excused') => {
    if (!$user || !$userProfile) return;
    
    try {
      await recordAttendance(meeting.id, $user.uid, $userProfile.displayName, status);
      attendanceMarked = true;
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };
  
  const handleVote = async (voteId: string, optionId: string) => {
    if (!$user || !$userProfile) return;
    
    try {
      await castVote(meeting.id, voteId, optionId, $user.uid, $userProfile.displayName);
      votingResults[voteId] = optionId;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert('Failed to cast vote. Please try again.');
    }
  };
  
  const generateMinutes = async () => {
    generatingMinutes = true;
    try {
      // Simulate transcript - in real implementation, this would come from audio recording
      const transcript = "Meeting called to order. Discussion of quarterly financial results...";
      const minutes = await generateMeetingMinutes(transcript, meeting.agenda);
      
      // Update meeting with generated minutes
      meeting.minutes = minutes;
      alert('Minutes generated successfully!');
    } catch (error) {
      console.error('Failed to generate minutes:', error);
      alert('Failed to generate minutes. Please try again.');
    } finally {
      generatingMinutes = false;
    }
  };
  
  const getVoteResults = (vote: any) => {
    const results: any = {};
    vote.options.forEach((option: any) => {
      results[option.id] = vote.results.filter((r: any) => r.optionId === option.id).length;
    });
    return results;
  };
  
  const hasUserVoted = (vote: any) => {
    return vote.results.some((r: any) => r.userId === $user?.uid);
  };
</script>

{#if show && meeting}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => show = false}></div>
      
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900">{meeting.title}</h3>
              <p class="text-sm text-gray-500 mt-1">{meeting.description}</p>
            </div>
            <button on:click={() => show = false} class="text-gray-400 hover:text-gray-600">
              <X class="h-6 w-6" />
            </button>
          </div>
          
          <!-- Meeting Status & Quick Actions -->
          <div class="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="flex items-center text-sm text-gray-600">
                <Calendar class="h-4 w-4 mr-1" />
                {new Date(meeting.date).toLocaleDateString()}
              </div>
              <div class="flex items-center text-sm text-gray-600">
                <Clock class="h-4 w-4 mr-1" />
                {meeting.startTime} - {meeting.endTime}
              </div>
              <div class="flex items-center text-sm text-gray-600">
                {#if meeting.isVirtual}
                  <Video class="h-4 w-4 mr-1" />
                  Virtual
                {:else}
                  <MapPin class="h-4 w-4 mr-1" />
                  {meeting.location}
                {/if}
              </div>
            </div>
            
            {#if !attendanceMarked && meeting.status === 'in-progress'}
              <div class="flex space-x-2">
                <button on:click={() => markAttendance('present')} class="btn-primary text-xs">
                  <CheckCircle class="h-3 w-3 mr-1" />
                  Mark Present
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex space-x-8">
              {#each tabs as tab}
                <button
                  on:click={() => activeTab = tab.id}
                  class={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svelte:component this={tab.icon} class="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              {/each}
            </nav>
          </div>
          
          <!-- Tab Content -->
          <div class="min-h-96">
            {#if activeTab === 'details'}
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Meeting Information</h4>
                    <div class="space-y-2 text-sm">
                      <div><strong>Organizer:</strong> {meeting.organizer}</div>
                      <div><strong>Status:</strong> <span class="capitalize">{meeting.status}</span></div>
                      <div><strong>Attendees:</strong> {meeting.attendees.length} members</div>
                      {#if meeting.isVirtual && meeting.meetingLink}
                        <div>
                          <strong>Meeting Link:</strong> 
                          <a href={meeting.meetingLink} target="_blank" class="text-primary-600 hover:text-primary-500 ml-1">
                            Join Meeting
                          </a>
                        </div>
                      {/if}
                    </div>
                  </div>
                  
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Attendees</h4>
                    <div class="space-y-1 text-sm max-h-32 overflow-y-auto">
                      {#each meeting.attendees as attendeeId}
                        <div class="flex items-center">
                          <div class="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                          Attendee {attendeeId}
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            
            {:else if activeTab === 'agenda'}
              <div class="space-y-4">
                {#if meeting.agenda && meeting.agenda.length > 0}
                  {#each meeting.agenda as item, index}
                    <div class="border border-gray-200 rounded-lg p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="text-lg font-medium text-gray-900">
                            {index + 1}. {item.title}
                          </h4>
                          <p class="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Duration: {item.duration} minutes</span>
                            <span>Presenter: {item.presenter}</span>
                            {#if item.requiresVote}
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Vote class="h-3 w-3 mr-1" />
                                Requires Vote
                              </span>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-8 text-gray-500">
                    <Calendar class="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No agenda items have been added yet.</p>
                  </div>
                {/if}
              </div>
            
            {:else if activeTab === 'voting'}
              <div class="space-y-6">
                {#if meeting.votes && meeting.votes.length > 0}
                  {#each meeting.votes as vote}
                    <div class="border border-gray-200 rounded-lg p-6">
                      <div class="mb-4">
                        <h4 class="text-lg font-medium text-gray-900">{vote.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">{vote.description}</p>
                        <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Status: <span class="capitalize">{vote.status}</span></span>
                          <span>Ends: {new Date(vote.endDate).toLocaleDateString()}</span>
                          {#if vote.isAnonymous}
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Anonymous
                            </span>
                          {/if}
                        </div>
                      </div>
                      
                      {#if vote.status === 'active' && !hasUserVoted(vote)}
                        <div class="space-y-2 mb-4">
                          <h5 class="text-sm font-medium text-gray-900">Cast Your Vote:</h5>
                          {#each vote.options as option}
                            <button
                              on:click={() => handleVote(vote.id, option.id)}
                              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div class="font-medium text-gray-900">{option.text}</div>
                              {#if option.description}
                                <div class="text-sm text-gray-600 mt-1">{option.description}</div>
                              {/if}
                            </button>
                          {/each}
                        </div>
                      {:else}
                        <div class="space-y-2">
                          <h5 class="text-sm font-medium text-gray-900">Results:</h5>
                          {#each vote.options as option}
                            {@const results = getVoteResults(vote)}
                            {@const count = results[option.id] || 0}
                            {@const total = vote.results.length}
                            {@const percentage = total > 0 ? Math.round((count / total) * 100) : 0}
                            
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div class="flex-1">
                                <div class="font-medium text-gray-900">{option.text}</div>
                                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div 
                                    class="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                                    style="width: {percentage}%"
                                  ></div>
                                </div>
                              </div>
                              <div class="ml-4 text-right">
                                <div class="text-sm font-medium text-gray-900">{count} votes</div>
                                <div class="text-xs text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-8 text-gray-500">
                    <Vote class="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No voting items for this meeting.</p>
                  </div>
                {/if}
              </div>
            
            {:else if activeTab === 'minutes'}
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-medium text-gray-900">Meeting Minutes</h4>
                  {#if meeting.status === 'completed' && !meeting.minutes}
                    <button
                      on:click={generateMinutes}
                      disabled={generatingMinutes}
                      class="btn-primary"
                    >
                      {#if generatingMinutes}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      {:else}
                        <Play class="h-4 w-4 mr-2" />
                        Generate Minutes
                      {/if}
                    </button>
                  {/if}
                </div>
                
                {#if meeting.minutes}
                  <div class="prose max-w-none">
                    <div class="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                      {meeting.minutes}
                    </div>
                  </div>
                {:else}
                  <div class="text-center py-8 text-gray-500">
                    <FileText class="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>
                      {meeting.status === 'completed' 
                        ? 'Minutes not yet generated. Click "Generate Minutes" to create them.'
                        : 'Minutes will be available after the meeting is completed.'}
                    </p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          {#if meeting.isVirtual && meeting.meetingLink && meeting.status !== 'completed'}
            <a
              href={meeting.meetingLink}
              target="_blank"
              class="btn-primary w-full sm:w-auto sm:ml-3"
            >
              <Video class="h-4 w-4 mr-2" />
              Join Meeting
            </a>
          {/if}
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