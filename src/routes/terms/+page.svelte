<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { FileText, Scale, AlertCircle, CheckCircle } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Terms of Service - Board Governance AI</title>
</svelte:head>

<div class="terms-page">
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <FileText size={48} />
      </div>
      <h1>Terms of Service</h1>
      <p class="subtitle">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <section class="terms-section">
        <h2>
          <Scale size={24} />
          Acceptance of Terms
        </h2>
        <p>
          By accessing and using Board Governance AI ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
        </p>
      </section>

      <section class="terms-section">
        <h2>Description of Service</h2>
        <p>
          Board Governance AI is a secure platform designed for board governance, document management, meeting coordination, voting, and related administrative functions. The Platform provides tools and features to facilitate effective board operations.
        </p>
      </section>

      <section class="terms-section">
        <h2>User Accounts</h2>
        <h3>Account Creation</h3>
        <ul>
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          <li>You must notify us immediately of any unauthorized access</li>
          <li>One account per user is permitted</li>
        </ul>

        <h3>Account Responsibilities</h3>
        <ul>
          <li>You are responsible for all activities under your account</li>
          <li>You must comply with all applicable laws and regulations</li>
          <li>You must not share your account credentials with others</li>
          <li>You must use the Platform in accordance with your organization's policies</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>
          <AlertCircle size={24} />
          Acceptable Use
        </h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any illegal or unauthorized purpose</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon intellectual property rights</li>
          <li>Transmit malicious code, viruses, or harmful data</li>
          <li>Attempt to gain unauthorized access to the Platform or other accounts</li>
          <li>Interfere with or disrupt the Platform's operation</li>
          <li>Use automated systems to access the Platform without authorization</li>
          <li>Share confidential information inappropriately</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>Intellectual Property</h2>
        <p>
          The Platform and its content, features, and functionality are owned by Board Governance AI and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
        </p>
      </section>

      <section class="terms-section">
        <h2>User Content</h2>
        <p>
          You retain ownership of content you upload to the Platform. By uploading content, you grant us a license to store, process, and display that content as necessary to provide the Platform's services. You are responsible for ensuring you have the right to upload and share any content.
        </p>
      </section>

      <section class="terms-section">
        <h2>Privacy</h2>
        <p>
          Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your information.
        </p>
      </section>

      <section class="terms-section">
        <h2>Service Availability</h2>
        <p>
          We strive to maintain high availability but do not guarantee uninterrupted access. The Platform may be unavailable due to maintenance, updates, or unforeseen circumstances. We are not liable for any losses resulting from Platform unavailability.
        </p>
      </section>

      <section class="terms-section">
        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Board Governance AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
        </p>
      </section>

      <section class="terms-section">
        <h2>Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Board Governance AI, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform or violation of these Terms.
        </p>
      </section>

      <section class="terms-section">
        <h2>Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason we deem necessary. You may terminate your account at any time by contacting support.
        </p>
      </section>

      <section class="terms-section">
        <h2>Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
        </p>
      </section>

      <section class="terms-section">
        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
        </p>
      </section>

      <section class="terms-section">
        <h2>
          <CheckCircle size={24} />
          Contact Information
        </h2>
        <p>
          If you have questions about these Terms of Service, please contact us:
        </p>
        <div class="contact-info">
          <p><strong>Email:</strong> <a href="mailto:legal@boardgovernance.ai">legal@boardgovernance.ai</a></p>
          <p><strong>Support:</strong> <a href="mailto:support@boardgovernance.ai">support@boardgovernance.ai</a></p>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .terms-page {
    min-height: 100vh;
    background: #f8fafc;
    padding: 2rem 0;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00a859 0%, #34d399 100%);
    border-radius: 50%;
    margin-bottom: 1.5rem;
    color: white;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .content {
    background: white;
    border-radius: 0.75rem;
    padding: 2.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .terms-section {
    margin-bottom: 2.5rem;
  }

  .terms-section:last-child {
    margin-bottom: 0;
  }

  .terms-section h2 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .terms-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 1.5rem 0 0.75rem 0;
  }

  .terms-section p {
    color: #4b5563;
    line-height: 1.7;
    margin: 0 0 1rem 0;
  }

  .terms-section ul {
    color: #4b5563;
    line-height: 1.8;
    margin: 0.5rem 0 1rem 0;
    padding-left: 1.5rem;
  }

  .terms-section li {
    margin-bottom: 0.5rem;
  }

  .contact-info {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .contact-info p {
    margin: 0.5rem 0;
  }

  .contact-info a {
    color: #00a859;
    text-decoration: none;
    font-weight: 500;
  }

  .contact-info a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 1rem;
    }

    .content {
      padding: 1.5rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .terms-section h2 {
      font-size: 1.25rem;
    }
  }
</style>

