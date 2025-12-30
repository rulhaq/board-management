<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { 
    MessageSquare, Send, Plus, Search, Phone, Video, 
    MoreHorizontal, Paperclip, Smile, Users, User,
    Hash, Settings, Star, Archive, Trash2
  } from 'lucide-svelte';

  let currentUser: any = null;
  let selectedChat: any = null;
  let chatList: any[] = [];
  let messages: any[] = [];
  let newMessage = '';
  let loading = true;
  let sendingMessage = false;
  let searchQuery = '';
  let showNewChatModal = false;
  let boardMembers: any[] = [];
  let chatType = 'team'; // 'team' or 'direct'

  // Chat categories
  let teamChats: any[] = [];
  let directChats: any[] = [];

  onMount(async () => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
      
      // Check if user is authenticated, if not redirect to login
      if (!auth.loading && !auth.user) {
        goto('/landing');
        return;
      }
      
      if (auth.profile) {
        loadChats();
        loadBoardMembers();
      }
    });

    return unsubscribe;
  });

  async function loadChats() {
    try {
      // Load from Firebase
      await loadChatsFromFirebase();
      
      // Mock team chats
      teamChats = [
        {
          id: 'team-general',
          name: 'General Discussion',
          type: 'team',
          description: 'General board discussions and announcements',
          members: 8,
          lastMessage: {
            text: 'The Q1 financial report has been uploaded for review',
            sender: 'Hassan Al-Kuwari',
            timestamp: '2024-01-20T14:30:00Z'
          },
          unreadCount: 2,
          isActive: true
        },
        {
          id: 'team-strategy',
          name: 'Strategic Planning',
          type: 'team',
          description: 'Strategic initiatives and long-term planning',
          members: 6,
          lastMessage: {
            text: 'Let\'s schedule a follow-up meeting for next week',
            sender: 'Dr. Sarah Mitchell',
            timestamp: '2024-01-19T16:45:00Z'
          },
          unreadCount: 0,
          isActive: true
        },
        {
          id: 'team-finance',
          name: 'Finance Committee',
          type: 'team',
          description: 'Budget discussions and financial oversight',
          members: 4,
          lastMessage: {
            text: 'Budget approval process is now complete',
            sender: 'Ms. Fatima Al-Mansouri',
            timestamp: '2024-01-18T11:20:00Z'
          },
          unreadCount: 1,
          isActive: true
        }
      ];

      // Mock direct chats
      directChats = [
        {
          id: 'direct-hassan',
          name: 'Hassan Al-Kuwari',
          type: 'direct',
          position: 'Chairman of the Board',
          avatar: null,
          lastMessage: {
            text: 'Thanks for the update on the research initiative',
            sender: 'Hassan Al-Kuwari',
            timestamp: '2024-01-20T10:15:00Z'
          },
          unreadCount: 0,
          isOnline: true
        },
        {
          id: 'direct-sarah',
          name: 'Dr. Sarah Mitchell',
          type: 'direct',
          position: 'Chief Medical Officer',
          avatar: null,
          lastMessage: {
            text: 'I\'ll review the clinical trial proposal this afternoon',
            sender: 'Dr. Sarah Mitchell',
            timestamp: '2024-01-19T14:30:00Z'
          },
          unreadCount: 3,
          isOnline: true
        },
        {
          id: 'direct-ahmed',
          name: 'Dr. Ahmed Al-Thani',
          type: 'direct',
          position: 'Research Director',
          avatar: null,
          lastMessage: {
            text: 'The genomics project timeline looks good',
            sender: 'Dr. Ahmed Al-Thani',
            timestamp: '2024-01-18T09:45:00Z'
          },
          unreadCount: 0,
          isOnline: false
        }
      ];

      chatList = [...teamChats, ...directChats];
      
      // Select first chat by default
      if (chatList.length > 0) {
        selectChat(chatList[0]);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      loading = false;
    }
  }

  async function loadChatsFromFirebase() {
    try {
      const response = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);
      
      if (response?.ok) {
        const data = await response.json();
        return data.chats || [];
      }
    } catch (error) {
      console.error('Firebase chats loading error:', error);
    }
    return [];
  }

  async function loadBoardMembers() {
    // Mock board members for creating new chats
    boardMembers = [
      { id: 'member-1', name: 'Hassan Al-Kuwari', position: 'Chairman', isOnline: true },
      { id: 'member-2', name: 'Dr. Sarah Mitchell', position: 'CMO', isOnline: true },
      { id: 'member-3', name: 'Dr. Ahmed Al-Thani', position: 'Research Director', isOnline: false },
      { id: 'member-4', name: 'Ms. Fatima Al-Mansouri', position: 'CFO', isOnline: true },
      { id: 'member-5', name: 'Board Secretary', position: 'Secretary', isOnline: true }
    ];
  }

  async function selectChat(chat: any) {
    selectedChat = chat;
    await loadMessages(chat.id);
    
    // Mark as read
    if (chat.unreadCount > 0) {
      chat.unreadCount = 0;
      await markChatAsRead(chat.id);
    }
  }

  async function loadMessages(chatId) {
    try {
      // Load from Firebase
      await loadMessagesFromFirebase(chatId);
      
      // Mock messages
      if (chatId === 'team-general') {
        messages = [
          {
            id: 'msg-1',
            text: 'Good morning everyone! I hope you all had a great weekend.',
            sender: 'Hassan Al-Kuwari',
            senderId: 'member-1',
            timestamp: '2024-01-20T09:00:00Z',
            type: 'text'
          },
          {
            id: 'msg-2',
            text: 'Good morning Hassan! Ready for another productive week.',
            sender: 'Dr. Sarah Mitchell',
            senderId: 'member-2',
            timestamp: '2024-01-20T09:15:00Z',
            type: 'text'
          },
          {
            id: 'msg-3',
            text: 'I\'ve uploaded the Q1 financial report to the documents section. Please review it before our meeting on Thursday.',
            sender: 'Ms. Fatima Al-Mansouri',
            senderId: 'member-4',
            timestamp: '2024-01-20T10:30:00Z',
            type: 'text'
          },
          {
            id: 'msg-4',
            text: 'Thanks Fatima. I\'ll review it today and provide feedback.',
            sender: 'Dr. Ahmed Al-Thani',
            senderId: 'member-3',
            timestamp: '2024-01-20T11:45:00Z',
            type: 'text'
          },
          {
            id: 'msg-5',
            text: 'The Q1 financial report has been uploaded for review',
            sender: 'Hassan Al-Kuwari',
            senderId: 'member-1',
            timestamp: '2024-01-20T14:30:00Z',
            type: 'text'
          }
        ];
      } else if (chatId === 'direct-sarah') {
        messages = [
          {
            id: 'msg-1',
            text: 'Hi Sarah, do you have a moment to discuss the clinical trial proposal?',
            sender: currentUser?.displayName || 'You',
            senderId: currentUser?.uid || 'current-user',
            timestamp: '2024-01-19T13:00:00Z',
            type: 'text'
          },
          {
            id: 'msg-2',
            text: 'Of course! I\'ve been reviewing the preliminary data. It looks very promising.',
            sender: 'Dr. Sarah Mitchell',
            senderId: 'member-2',
            timestamp: '2024-01-19T13:15:00Z',
            type: 'text'
          },
          {
            id: 'msg-3',
            text: 'I\'ll review the clinical trial proposal this afternoon and get back to you with detailed feedback.',
            sender: 'Dr. Sarah Mitchell',
            senderId: 'member-2',
            timestamp: '2024-01-19T14:30:00Z',
            type: 'text'
          }
        ];
      } else {
        messages = [];
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async function loadMessagesFromFirebase(chatId) {
    // Skip if no current user
    if (!currentUser) {
      console.log('No current user, skipping Firebase message load');
      return [];
    }
    
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => null);
      
      if (response?.ok) {
        const data = await response.json();
        return data.messages || [];
      } else if (response?.status === 401) {
        console.log('Authentication error in chat, redirecting to login');
        goto('/landing');
        return [];
      }
    } catch (error) {
      console.error('Firebase messages loading error:', error);
    }
    return [];
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: 'msg-' + Date.now(),
      text: newMessage.trim(),
      sender: currentUser?.displayName || 'You',
      senderId: currentUser?.uid || 'current-user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    sendingMessage = true;
    
    try {
      // Save to Firebase for audit logging
      await saveMessageToFirebase(selectedChat.id, message);
      
      // Add to local messages
      messages = [...messages, message];
      
      // Update chat's last message
      selectedChat.lastMessage = {
        text: message.text,
        sender: message.sender,
        timestamp: message.timestamp
      };
      
      // Clear input
      newMessage = '';
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      sendingMessage = false;
    }
  }

  async function saveMessageToFirebase(chatId, message) {
    try {
      const { auth } = await import('$lib/firebase');
      if (!auth?.currentUser) {
        return;
      }

      const token = await auth.currentUser.getIdToken();
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...message,
          chatId,
          createdAt: new Date().toISOString(),
          // Store username and prompt for team chats
          username: currentUser?.displayName || currentUser?.email || 'Unknown',
          prompt: message.text, // Store the user's message/prompt
          // Audit fields
          auditLog: {
            action: 'message_sent',
            userId: currentUser?.uid,
            timestamp: new Date().toISOString(),
            metadata: {
              chatType: selectedChat.type,
              messageLength: message.text.length
            }
          }
        })
      });
    } catch (error) {
      console.error('Message save error:', error);
    }
  }

  async function markChatAsRead(chatId) {
    try {
      await fetch(`/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        }
      }).catch(() => {
        // Fail silently for demo
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  function scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  function createNewChat(member) {
    // Check if direct chat already exists
    const existingChat = directChats.find(chat => 
      chat.name === member.name
    );

    if (existingChat) {
      selectChat(existingChat);
    } else {
      // Create new direct chat
      const newChat = {
        id: 'direct-' + member.id,
        name: member.name,
        type: 'direct',
        position: member.position,
        avatar: null,
        lastMessage: null,
        unreadCount: 0,
        isOnline: member.isOnline
      };

      directChats = [...directChats, newChat];
      chatList = [...teamChats, ...directChats];
      selectChat(newChat);
    }

    showNewChatModal = false;
  }

  $: filteredChats = chatList.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<svelte:head>
  <title>Team Chat - Board Governance AI</title>
</svelte:head>

<div class="chat-page">
  <!-- Chat Sidebar -->
  <div class="chat-sidebar">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <h2>Team Chat</h2>
      <button class="new-chat-btn" on:click={() => showNewChatModal = true}>
        <Plus size={16} />
      </button>
    </div>

    <!-- Search -->
    <div class="chat-search">
      <Search size={16} />
      <input
        type="text"
        placeholder="Search conversations..."
        bind:value={searchQuery}
      />
    </div>

    <!-- Chat Categories -->
    <div class="chat-categories">
      <div class="category-section">
        <h3>
          <Hash size={16} />
          Team Channels
        </h3>
        {#each teamChats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase())) as chat}
          <button
            class="chat-item"
            class:active={selectedChat?.id === chat.id}
            on:click={() => selectChat(chat)}
          >
            <div class="chat-icon team">
              <Hash size={16} />
            </div>
            <div class="chat-info">
              <div class="chat-header">
                <span class="chat-name">{chat.name}</span>
                {#if chat.unreadCount > 0}
                  <span class="unread-badge">{chat.unreadCount}</span>
                {/if}
              </div>
              {#if chat.lastMessage}
                <div class="chat-preview">
                  <span class="last-sender">{chat.lastMessage.sender}:</span>
                  <span class="last-message">{chat.lastMessage.text}</span>
                </div>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      <div class="category-section">
        <h3>
          <User size={16} />
          Direct Messages
        </h3>
        {#each directChats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase())) as chat}
          <button
            class="chat-item"
            class:active={selectedChat?.id === chat.id}
            on:click={() => selectChat(chat)}
          >
            <div class="chat-avatar">
              {#if chat.avatar}
                <img src={chat.avatar} alt={chat.name} />
              {:else}
                <div class="avatar-placeholder">
                  {getInitials(chat.name)}
                </div>
              {/if}
              <div class="online-status" class:online={chat.isOnline}></div>
            </div>
            <div class="chat-info">
              <div class="chat-header">
                <span class="chat-name">{chat.name}</span>
                {#if chat.unreadCount > 0}
                  <span class="unread-badge">{chat.unreadCount}</span>
                {/if}
              </div>
              {#if chat.lastMessage}
                <div class="chat-preview">
                  <span class="last-message">{chat.lastMessage.text}</span>
                </div>
              {:else}
                <div class="chat-preview">
                  <span class="no-messages">Start a conversation</span>
                </div>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="chat-main">
    {#if selectedChat}
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-title-section">
          {#if selectedChat.type === 'team'}
            <div class="chat-icon team">
              <Hash size={20} />
            </div>
          {:else}
            <div class="chat-avatar">
              {#if selectedChat.avatar}
                <img src={selectedChat.avatar} alt={selectedChat.name} />
              {:else}
                <div class="avatar-placeholder">
                  {getInitials(selectedChat.name)}
                </div>
              {/if}
              <div class="online-status" class:online={selectedChat.isOnline}></div>
            </div>
          {/if}
          
          <div class="chat-details">
            <h3>{selectedChat.name}</h3>
            {#if selectedChat.type === 'team'}
              <p>{selectedChat.members} members • {selectedChat.description}</p>
            {:else}
              <p>{selectedChat.position} • {selectedChat.isOnline ? 'Online' : 'Offline'}</p>
            {/if}
          </div>
        </div>

        <div class="chat-actions">
          {#if selectedChat.type === 'direct'}
            <button class="action-btn" title="Voice Call">
              <Phone size={18} />
            </button>
            <button class="action-btn" title="Video Call">
              <Video size={18} />
            </button>
          {/if}
          <button class="action-btn" title="More Options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-container">
        {#if messages.length === 0}
          <div class="empty-messages">
            <MessageSquare size={48} />
            <h3>Start the conversation</h3>
            <p>Send a message to begin chatting with {selectedChat.name}</p>
          </div>
        {:else}
          <div class="messages-list">
            {#each messages as message (message.id)}
              <div 
                class="message"
                class:own={message.senderId === currentUser?.uid || message.sender === currentUser?.displayName}
              >
                <div class="message-avatar">
                  <div class="avatar-placeholder">
                    {getInitials(message.sender)}
                  </div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">{message.sender}</span>
                    <span class="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div class="message-text">{message.text}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Message Input -->
      <div class="message-input-container">
        <div class="message-input">
          <button class="attachment-btn" title="Attach File">
            <Paperclip size={18} />
          </button>
          
          <textarea
            bind:value={newMessage}
            placeholder="Type your message here..."
            rows="1"
            on:keydown={handleKeyPress}
            disabled={sendingMessage}
          ></textarea>
          
          <button class="emoji-btn" title="Add Emoji">
            <Smile size={18} />
          </button>
          
          <button 
            class="send-btn" 
            on:click={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            title="Send Message"
          >
            {#if sendingMessage}
              <div class="loading-spinner"></div>
            {:else}
              <Send size={18} />
            {/if}
          </button>
        </div>
      </div>
    {:else}
      <!-- No Chat Selected -->
      <div class="no-chat-selected">
        <MessageSquare size={64} />
        <h2>Welcome to Team Chat</h2>
        <p>Select a conversation from the sidebar to start chatting</p>
        <button class="btn btn-primary" on:click={() => showNewChatModal = true}>
          <Plus size={16} />
          Start New Chat
        </button>
      </div>
    {/if}
  </div>
</div>

<!-- New Chat Modal -->
{#if showNewChatModal}
  <div class="modal-overlay" on:click={() => showNewChatModal = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Start New Chat</h2>
        <button class="modal-close" on:click={() => showNewChatModal = false}>×</button>
      </div>

      <div class="modal-body">
        <h3>Board Members</h3>
        <div class="members-list">
          {#each boardMembers as member}
            <button class="member-item" on:click={() => createNewChat(member)}>
              <div class="member-avatar">
                <div class="avatar-placeholder">
                  {getInitials(member.name)}
                </div>
                <div class="online-status" class:online={member.isOnline}></div>
              </div>
              <div class="member-info">
                <span class="member-name">{member.name}</span>
                <span class="member-position">{member.position}</span>
              </div>
              <span class="member-status">
                {member.isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .chat-page {
    display: flex;
    height: calc(100vh - 4rem);
    background: white;
  }

  /* Sidebar */
  .chat-sidebar {
    width: 320px;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    background: #f9fafb;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
  }

  .sidebar-header h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .new-chat-btn {
    width: 32px;
    height: 32px;
    background: #00a859;
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .new-chat-btn:hover {
    background: #059669;
    transform: scale(1.1);
  }

  .chat-search {
    position: relative;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .chat-search input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .chat-search svg {
    position: absolute;
    left: 1.75rem;
    top: 1.75rem;
    color: #9ca3af;
  }

  .chat-categories {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }

  .category-section {
    margin-bottom: 1.5rem;
  }

  .category-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 0.75rem 0;
    padding: 0 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chat-item {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .chat-item:hover {
    background: rgba(0, 168, 89, 0.05);
  }

  .chat-item.active {
    background: rgba(0, 168, 89, 0.1);
    border-left-color: #00a859;
  }

  .chat-icon {
    width: 32px;
    height: 32px;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .chat-icon.team {
    background: #e5e7eb;
    color: #6b7280;
  }

  .chat-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .chat-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
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
    font-size: 0.75rem;
    font-weight: 600;
  }

  .online-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    background: #9ca3af;
  }

  .online-status.online {
    background: #10b981;
  }

  .chat-info {
    flex: 1;
    min-width: 0;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .chat-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .unread-badge {
    background: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.75rem;
    min-width: 18px;
    text-align: center;
  }

  .chat-preview {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .last-sender {
    font-weight: 500;
  }

  .no-messages {
    font-style: italic;
  }

  /* Main Chat */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: white;
  }

  .chat-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chat-header .chat-icon {
    width: 40px;
    height: 40px;
  }

  .chat-header .chat-avatar {
    width: 40px;
    height: 40px;
  }

  .chat-details h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .chat-details p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .chat-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 40px;
    height: 40px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
  }

  .action-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    background: #f9fafb;
  }

  .empty-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
    padding: 2rem;
  }

  .empty-messages h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 1rem 0 0.5rem;
  }

  .messages-list {
    padding: 1rem;
  }

  .message {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .message.own {
    flex-direction: row-reverse;
  }

  .message.own .message-content {
    background: #00a859;
    color: white;
  }

  .message.own .message-header {
    flex-direction: row-reverse;
  }

  .message-avatar .avatar-placeholder {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .message-content {
    max-width: 70%;
    background: white;
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .message-sender {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .message-time {
    font-size: 0.625rem;
    opacity: 0.6;
  }

  .message-text {
    font-size: 0.875rem;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .message-input-container {
    padding: 1rem 1.5rem;
    background: white;
    border-top: 1px solid #e5e7eb;
  }

  .message-input {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
  }

  .attachment-btn,
  .emoji-btn {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .attachment-btn:hover,
  .emoji-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .message-input textarea {
    flex: 1;
    background: none;
    border: none;
    resize: none;
    font-size: 0.875rem;
    line-height: 1.5;
    max-height: 120px;
    padding: 0.25rem 0;
  }

  .message-input textarea:focus {
    outline: none;
  }

  .send-btn {
    width: 32px;
    height: 32px;
    background: #00a859;
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    background: #059669;
    transform: scale(1.1);
  }

  .send-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .no-chat-selected {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
    padding: 2rem;
  }

  .no-chat-selected h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 1rem 0 0.5rem;
  }

  /* Modal */
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
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
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
    font-size: 1.25rem;
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

  .modal-body h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .member-item:hover {
    border-color: #00a859;
    background: rgba(0, 168, 89, 0.05);
  }

  .member-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    display: block;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .member-position {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .member-status {
    font-size: 0.75rem;
    font-weight: 500;
    color: #10b981;
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .chat-page {
      height: calc(100vh - 3rem);
    }

    .chat-sidebar {
      width: 280px;
    }

    .message-content {
      max-width: 85%;
    }
  }

  @media (max-width: 640px) {
    .chat-sidebar {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      z-index: 10;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .chat-sidebar.open {
      transform: translateX(0);
    }
  }
</style> 