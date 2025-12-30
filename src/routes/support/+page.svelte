<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { Mail, Phone, MessageSquare, HelpCircle, Send } from 'lucide-svelte';

  $: user = $authStore.user;
  $: userProfile = $authStore.profile;

  let supportForm = {
    name: '',
    email: '',
    subject: '',
    category: 'technical',
    message: '',
    priority: 'medium'
  };

  let submitting = false;
  let submitted = false;

  $: formEmail = userProfile?.email || supportForm.email;
  $: formName = userProfile?.displayName || supportForm.name;

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email.'
    },
    {
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to your Profile Settings, click on Security, and follow the setup instructions for Multi-Factor Authentication.'
    },
    {
      question: 'How do I upload a document?',
      answer: 'Navigate to the Documents section, click "Upload", select your file, fill in the required metadata, and click "Save".'
    },
    {
      question: 'How do I schedule a meeting?',
      answer: 'Go to the Meetings section, click "Schedule New Meeting", fill in the details, add agenda items, and invite attendees.'
    },
    {
      question: 'How do I vote on a proposal?',
      answer: 'Navigate to the Voting section, review the proposal and attached documents, select your vote, add comments if needed, and submit.'
    },
    {
      question: 'Who can I contact for urgent issues?',
      answer: 'For urgent technical issues, contact IT Support at support@boardgovernance.ai or call the emergency line.'
    }
  ];

  async function handleSubmit() {
    if (!supportForm.subject || !supportForm.message) {
      return;
    }

    submitting = true;
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      submitted = true;
      supportForm = {
        name: '',
        email: '',
        subject: '',
        category: 'technical',
        message: '',
        priority: 'medium'
      };
    } catch (error) {
      console.error('Error submitting support request:', error);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Support - Board Governance AI</title>
</svelte:head>


<div class="support-container">
  <div class="header">
    <div class="header-content">
      <h1>Support & Help</h1>
      <p class="subtitle">Get help with Board Governance AI</p>
    </div>
  </div>

  <div class="support-content">
    <!-- Contact Methods -->
    <section class="contact-methods">
      <h2>Contact Us</h2>
      <div class="contact-grid">
        <div class="contact-card">
          <Mail size={24} />
          <h3>Email Support</h3>
          <p>support@boardgovernance.ai</p>
          <p class="contact-note">Response within 24 hours</p>
        </div>
        <div class="contact-card">
          <Phone size={24} />
          <h3>Phone Support</h3>
          <p>+974 4400 0000</p>
          <p class="contact-note">Mon-Fri, 9 AM - 5 PM</p>
        </div>
        <div class="contact-card">
          <MessageSquare size={24} />
          <h3>Live Chat</h3>
          <p>Available in-app</p>
          <p class="contact-note">Click the AI Assistant button</p>
        </div>
      </div>
    </section>

    <!-- Support Form -->
    <section class="support-form-section">
      <h2>Submit a Support Request</h2>
      {#if submitted}
        <div class="success-message">
          <CheckCircle size={24} />
          <div>
            <h3>Request Submitted</h3>
            <p>Your support request has been received. We'll get back to you soon.</p>
          </div>
        </div>
      {:else}
        <form on:submit|preventDefault={handleSubmit} class="support-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name</label>
              <input
                type="text"
                id="name"
                bind:value={supportForm.name}
                placeholder="Your name"
                required
              />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                  id="email"
                  bind:value={supportForm.email}
                  placeholder="your.email@boardgovernance.ai"
                  required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" bind:value={supportForm.category}>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Issue</option>
                <option value="feature">Feature Request</option>
                <option value="billing">Billing Question</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="priority">Priority</label>
              <select id="priority" bind:value={supportForm.priority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="subject">Subject</label>
            <input
              type="text"
              id="subject"
              bind:value={supportForm.subject}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div class="form-group">
            <label for="message">Message</label>
            <textarea
              id="message"
              bind:value={supportForm.message}
              rows="6"
              placeholder="Please provide details about your issue or question..."
              required
            ></textarea>
          </div>

          <button type="submit" class="btn-submit" disabled={submitting}>
            {#if submitting}
              Submitting...
            {:else}
              <Send size={18} />
              Submit Request
            {/if}
          </button>
        </form>
      {/if}
    </section>

    <!-- FAQs -->
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
        {#each faqs as faq}
          <div class="faq-item">
            <div class="faq-question">
              <HelpCircle size={20} />
              <h3>{faq.question}</h3>
            </div>
            <div class="faq-answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .support-container {
    min-height: 100vh;
    background: #f9fafb;
  }

  .header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 2rem 0;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .support-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  section {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  section h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .contact-card {
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: center;
    transition: all 0.2s;
  }

  .contact-card:hover {
    border-color: #00a859;
    box-shadow: 0 2px 4px rgba(0, 168, 89, 0.1);
  }

  .contact-card svg {
    color: #00a859;
    margin-bottom: 1rem;
  }

  .contact-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .contact-card p {
    margin: 0.25rem 0;
    color: #374151;
  }

  .contact-note {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .support-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #00a859;
  }

  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }

  .btn-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #00a859;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-start;
  }

  .btn-submit:hover:not(:disabled) {
    background: #008a47;
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .success-message {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 0.5rem;
  }

  .success-message svg {
    color: #22c55e;
    flex-shrink: 0;
  }

  .success-message h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #166534;
    margin: 0 0 0.5rem 0;
  }

  .success-message p {
    margin: 0;
    color: #166534;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .faq-question {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f9fafb;
  }

  .faq-question svg {
    color: #00a859;
    flex-shrink: 0;
  }

  .faq-question h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .faq-answer {
    padding: 1rem;
  }

  .faq-answer p {
    margin: 0;
    color: #374151;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .support-content {
      padding: 1rem;
    }

    section {
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .contact-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

