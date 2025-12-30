<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { 
    MessageSquare, Send, X, Bot, FileText, 
    Minimize2, Maximize2, Trash2, Copy, 
    Download, Sparkles, Brain
  } from 'lucide-svelte';

  export let isOpen = false;
  export let documents = [];

  let currentUser = null;
  let messages = [];
  let newMessage = '';
  let loading = false;
  let isMinimized = false;
  let selectedDocument = null;

  // AI Assistant state
  let aiTyping = false;
  let conversationHistory = [];

  onMount(() => {
    const unsubscribe = authStore.subscribe(auth => {
      currentUser = auth.profile;
    });

    // Initialize with welcome message
    if (messages.length === 0) {
      addWelcomeMessage();
    }

    return unsubscribe;
  });

  function addWelcomeMessage() {
    messages = [{
      id: 'welcome-' + Date.now(),
      text: `Hello ${currentUser?.displayName || 'there'}! I'm your AI assistant for Board Governance AI. I can help you with:

• Analyzing uploaded documents and reports
• Answering questions about board meetings and decisions  
• Providing insights on financial data and strategic plans
• Summarizing meeting minutes and action items
• Explaining medical research findings and clinical data

How can I assist you today?`,
      sender: 'AI Assistant',
      timestamp: new Date().toISOString(),
      isAI: true,
      type: 'welcome'
    }];
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      text: newMessage.trim(),
      sender: currentUser?.displayName || 'You',
      timestamp: new Date().toISOString(),
      isAI: false,
      type: 'text'
    };

    // Add user message
    messages = [...messages, userMessage];
    const currentQuery = newMessage.trim();
    newMessage = '';

    // Show AI typing
    aiTyping = true;
    
    try {
      // Get AI response
      const aiResponse = await getAIResponse(currentQuery, selectedDocument);
      
      // Add AI response
      const aiMessage = {
        id: 'ai-' + Date.now(),
        text: aiResponse,
        sender: 'AI Assistant',
        timestamp: new Date().toISOString(),
        isAI: true,
        type: selectedDocument ? 'document_analysis' : 'text',
        relatedDocument: selectedDocument?.title
      };

      messages = [...messages, aiMessage];

      // Log conversation for audit
      await logConversation(userMessage, aiMessage);

    } catch (error) {
      console.error('AI response error:', error);
      
      const errorMessage = {
        id: 'error-' + Date.now(),
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        sender: 'AI Assistant',
        timestamp: new Date().toISOString(),
        isAI: true,
        type: 'error'
      };

      messages = [...messages, errorMessage];
    } finally {
      aiTyping = false;
      scrollToBottom();
    }
  }

  async function getAIResponse(query, document = null) {
    try {
      // Call Groq API for document analysis
      if (document) {
        return await analyzeDocumentWithGroq(query, document);
      } else {
        return await getChatResponseWithGroq(query);
      }
    } catch (error) {
      console.error('Groq API error:', error);
      return getFallbackResponse(query, document);
    }
  }

  async function analyzeDocumentWithGroq(query, document) {
    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        },
        body: JSON.stringify({
          query,
          document: {
            title: document.title,
            category: document.category,
            content: document.content || `Document: ${document.title}`,
            metadata: document.metadata
          },
          conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.error('Document analysis error:', error);
    }

    // Fallback response
    return `I've analyzed the document "${document.title}". Based on your question about "${query}", here are some key insights:

• This appears to be a ${document.category} document that contains important information for board review
• The document likely includes data relevant to strategic decision-making
• I recommend reviewing the executive summary and key findings sections
• Consider discussing the implications with other board members during the next meeting

Would you like me to focus on any specific aspect of this document?`;
  }

  async function getChatResponseWithGroq(query) {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        },
        body: JSON.stringify({
          query,
          context: 'board_governance_ai',
          userRole: currentUser?.role,
          conversationHistory: conversationHistory.slice(-10)
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.error('Chat API error:', error);
    }

    // Fallback response
    return getFallbackResponse(query);
  }

  function getFallbackResponse(query, document = null) {
    const lowerQuery = query.toLowerCase();
    
    if (document) {
      return `I've reviewed the document "${document.title}". While I'm currently unable to perform deep analysis, I can see this is a ${document.category} document. For detailed analysis, I recommend:

• Reviewing the document's executive summary
• Identifying key metrics and findings
• Discussing implications with relevant stakeholders
• Considering how this impacts board decisions

What specific aspect would you like me to help clarify?`;
    }

    if (lowerQuery.includes('meeting') || lowerQuery.includes('agenda')) {
      return `Regarding board meetings, I can help you with:

• Preparing meeting agendas and materials
• Reviewing previous meeting minutes
• Tracking action items and follow-ups
• Scheduling and coordination

What specific meeting-related task can I assist you with?`;
    }

    if (lowerQuery.includes('budget') || lowerQuery.includes('financial') || lowerQuery.includes('finance')) {
      return `For financial and budget matters, I can assist with:

• Analyzing financial reports and trends
• Budget planning and allocation insights
• Performance metrics interpretation
• Risk assessment and mitigation strategies

What financial aspect would you like to explore?`;
    }

    if (lowerQuery.includes('vote') || lowerQuery.includes('voting') || lowerQuery.includes('decision')) {
      return `Regarding voting and decision-making, I can help with:

• Reviewing voting history and outcomes
• Analyzing decision impacts and implications
• Preparing voting materials and briefings
• Tracking governance compliance

What decision or vote would you like to discuss?`;
    }

    return `I understand you're asking about "${query}". As your board portal AI assistant, I can help with:

• Document analysis and insights
• Meeting preparation and follow-up
• Financial data interpretation
• Strategic planning support
• Governance and compliance guidance

Could you provide more specific details about what you'd like to know?`;
  }

  async function logConversation(userMessage, aiResponse) {
    try {
      await fetch('/api/ai/log-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
        },
        body: JSON.stringify({
          userId: currentUser?.uid,
          userMessage: userMessage.text,
          aiResponse: aiResponse.text,
          timestamp: new Date().toISOString(),
          context: {
            documentAnalyzed: selectedDocument?.title,
            userRole: currentUser?.role,
            sessionId: 'session-' + Date.now()
          }
        })
      }).catch(() => {
        // Fail silently for demo
      });

      // Update conversation history
      conversationHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage.text },
        { role: 'assistant', content: aiResponse.text }
      ].slice(-20); // Keep last 20 messages

    } catch (error) {
      console.error('Conversation logging error:', error);
    }
  }

  function selectDocument(doc) {
    selectedDocument = doc;
    
    const documentMessage = {
      id: 'doc-selected-' + Date.now(),
      text: `I've selected the document "${doc.title}" for analysis. You can now ask me questions about this ${doc.category} document, and I'll provide insights based on its content.

Some example questions you could ask:
• What are the key findings in this document?
• Can you summarize the main points?
• What are the implications for our board decisions?
• Are there any risks or concerns highlighted?

What would you like to know about this document?`,
      sender: 'AI Assistant',
      timestamp: new Date().toISOString(),
      isAI: true,
      type: 'document_selected',
      relatedDocument: doc.title
    };

    messages = [...messages, documentMessage];
    scrollToBottom();
  }

  function clearDocument() {
    selectedDocument = null;
    
    const clearMessage = {
      id: 'doc-cleared-' + Date.now(),
      text: 'Document analysis mode cleared. I\'m now ready to help with general board portal questions and tasks.',
      sender: 'AI Assistant',
      timestamp: new Date().toISOString(),
      isAI: true,
      type: 'document_cleared'
    };

    messages = [...messages, clearMessage];
    scrollToBottom();
  }

  function clearChat() {
    messages = [];
    conversationHistory = [];
    selectedDocument = null;
    addWelcomeMessage();
  }

  function copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  }

  function exportChat() {
    const chatData = {
      timestamp: new Date().toISOString(),
      user: currentUser?.displayName,
      messages: messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
        type: msg.type
      }))
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.ai-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  function closeChat() {
    isOpen = false;
  }

  // Load available documents for analysis
  onMount(async () => {
    if (documents.length === 0) {
      // Load documents from API or store
      try {
        const response = await fetch('/api/documents', {
          headers: {
            'Authorization': `Bearer ${currentUser?.token || 'demo-token'}`
          }
        }).catch(() => null);

        if (response?.ok) {
          const data = await response.json();
          documents = data.documents || [];
        } else {
          // Mock documents for demo
          documents = [
            {
              id: 'doc-1',
              title: 'Q1 2024 Financial Report',
              category: 'Financial',
              uploadedAt: '2024-01-15T10:00:00Z'
            },
            {
              id: 'doc-2',
              title: 'Strategic Plan 2025-2030',
              category: 'Strategic',
              uploadedAt: '2024-01-10T14:30:00Z'
            },
            {
              id: 'doc-3',
              title: 'Clinical Research Update',
              category: 'Research',
              uploadedAt: '2024-01-08T09:15:00Z'
            }
          ];
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    }
  });
</script>

<!-- AI Chat Assistant -->
<div class="ai-chat-assistant" class:open={isOpen} class:minimized={isMinimized}>
  <!-- Chat Header -->
  <div class="ai-chat-header">
    <div class="header-info">
      <div class="ai-avatar">
        <Brain size={20} />
      </div>
      <div class="ai-details">
        <h3>AI Assistant</h3>
        <span class="ai-status">
          <div class="status-dot"></div>
          Online • Powered by Groq
        </span>
      </div>
    </div>

    <div class="header-actions">
      <button class="header-btn" on:click={toggleMinimize} title={isMinimized ? 'Maximize' : 'Minimize'}>
        {#if isMinimized}
          <Maximize2 size={16} />
        {:else}
          <Minimize2 size={16} />
        {/if}
      </button>
      
      <button class="header-btn" on:click={exportChat} title="Export Chat">
        <Download size={16} />
      </button>
      
      <button class="header-btn" on:click={clearChat} title="Clear Chat">
        <Trash2 size={16} />
      </button>
      
      <button class="header-btn close-btn" on:click={closeChat} title="Close">
        <X size={16} />
      </button>
    </div>
  </div>

  {#if !isMinimized}
    <!-- Document Selection -->
    {#if documents.length > 0}
      <div class="document-selector">
        <div class="selector-header">
          <FileText size={16} />
          <span>Analyze Document</span>
        </div>
        
        <div class="document-options">
          {#if selectedDocument}
            <div class="selected-document">
              <span class="doc-title">{selectedDocument.title}</span>
              <button class="clear-doc-btn" on:click={clearDocument} title="Clear Selection">
                <X size={14} />
              </button>
            </div>
          {:else}
            <select on:change={(e) => {
              const docId = e.target.value;
              if (docId) {
                const doc = documents.find(d => d.id === docId);
                if (doc) selectDocument(doc);
              }
            }}>
              <option value="">Select a document to analyze...</option>
              {#each documents as doc}
                <option value={doc.id}>{doc.title} ({doc.category})</option>
              {/each}
            </select>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Messages -->
    <div class="ai-messages-container">
      {#each messages as message (message.id)}
        <div class="ai-message" class:ai={message.isAI} class:user={!message.isAI}>
          <div class="message-avatar">
            {#if message.isAI}
              <div class="ai-avatar">
                <Bot size={16} />
              </div>
            {:else}
              <div class="user-avatar">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </div>
            {/if}
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{message.sender}</span>
              <span class="message-time">{formatTime(message.timestamp)}</span>
              {#if message.relatedDocument}
                <span class="document-tag">
                  <FileText size={12} />
                  {message.relatedDocument}
                </span>
              {/if}
            </div>
            
            <div class="message-text" class:welcome={message.type === 'welcome'}>
              {message.text}
            </div>
            
            <div class="message-actions">
              <button class="message-action" on:click={() => copyMessage(message.text)} title="Copy">
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      {/each}

      {#if aiTyping}
        <div class="ai-message ai typing">
          <div class="message-avatar">
            <div class="ai-avatar">
              <Bot size={16} />
            </div>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
              <span>AI is thinking...</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Message Input -->
    <div class="ai-message-input">
      {#if selectedDocument}
        <div class="input-context">
          <FileText size={14} />
          <span>Analyzing: {selectedDocument.title}</span>
        </div>
      {/if}
      
      <div class="input-container">
        <textarea
          bind:value={newMessage}
          placeholder={selectedDocument ? 
            "Ask me about this document..." : 
            "Ask me anything about the board portal..."
          }
          rows="1"
          on:keydown={handleKeyPress}
          disabled={loading || aiTyping}
        ></textarea>
        
        <button 
          class="send-btn" 
          on:click={sendMessage}
          disabled={!newMessage.trim() || loading || aiTyping}
        >
          {#if loading}
            <div class="loading-spinner"></div>
          {:else}
            <Send size={16} />
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- AI Chat Toggle Button (when closed) -->
{#if !isOpen}
  <button class="ai-chat-toggle" on:click={() => isOpen = true}>
    <div class="toggle-icon">
      <Sparkles size={20} />
    </div>
    <div class="toggle-text">
      <span>AI Assistant</span>
      <small>Ask me anything</small>
    </div>
  </button>
{/if}

<style>
  .ai-chat-assistant {
    position: fixed;
    right: -400px;
    top: 4rem;
    width: 400px;
    height: calc(100vh - 5rem);
    background: white;
    border-left: 1px solid #e5e7eb;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    transition: right 0.3s ease;
  }

  .ai-chat-assistant.open {
    right: 0;
  }

  .ai-chat-assistant.minimized {
    height: auto;
  }

  .ai-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .ai-avatar {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .ai-details h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .ai-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
  }

  .header-actions {
    display: flex;
    gap: 0.25rem;
  }

  .header-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .header-btn.close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .document-selector {
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  .selector-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .document-options select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .selected-document {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    border: 1px solid #0891b2;
    border-radius: 0.375rem;
  }

  .doc-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0c4a6e;
  }

  .clear-doc-btn {
    width: 20px;
    height: 20px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ai-messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #fafafa;
  }

  .ai-message {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .ai-message.user {
    flex-direction: row-reverse;
  }

  .message-avatar .ai-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .message-content {
    max-width: 85%;
    background: white;
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .ai-message.user .message-content {
    background: #00a859;
    color: white;
  }

  .ai-message.ai .message-content {
    background: white;
    border: 1px solid #e5e7eb;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
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

  .document-tag {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-radius: 1rem;
    font-size: 0.625rem;
    font-weight: 500;
  }

  .message-text {
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .message-text.welcome {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .message-actions {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .message-content:hover .message-actions {
    opacity: 1;
  }

  .message-action {
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
  }

  .message-action:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }

  .typing {
    opacity: 0.8;
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .typing-dots {
    display: flex;
    gap: 0.25rem;
  }

  .dot {
    width: 6px;
    height: 6px;
    background: #6366f1;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  .ai-message-input {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e5e7eb;
  }

  .input-context {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #e0f2fe;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.75rem;
    color: #0c4a6e;
  }

  .input-container {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .input-container textarea {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    resize: none;
    max-height: 120px;
    line-height: 1.4;
  }

  .input-container textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .send-btn {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .send-btn:disabled {
    opacity: 0.5;
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

  .ai-chat-toggle {
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
    z-index: 999;
  }

  .ai-chat-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.4);
  }

  .toggle-icon {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .toggle-text span {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .toggle-text small {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    30% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .ai-chat-assistant {
      width: 100vw;
      right: -100vw;
      left: auto;
    }

    .ai-chat-assistant.open {
      right: 0;
    }

    .ai-chat-toggle {
      right: 1rem;
      bottom: 1rem;
    }

    .message-content {
      max-width: 90%;
    }
  }
</style> 