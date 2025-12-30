<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Privacy Policy - Board Governance AI</title>
</svelte:head>

<div class="privacy-page">
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <Shield size={48} />
      </div>
      <h1>Privacy Policy</h1>
      <p class="subtitle">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <section class="policy-section">
        <h2>
          <Lock size={24} />
          Introduction
        </h2>
        <p>
          Board Governance AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </p>
      </section>

      <section class="policy-section">
        <h2>
          <Eye size={24} />
          Information We Collect
        </h2>
        <h3>Personal Information</h3>
        <ul>
          <li>Name, email address, and contact information</li>
          <li>Professional information (position, department, role)</li>
          <li>Authentication credentials</li>
          <li>Profile information and preferences</li>
        </ul>

        <h3>Usage Data</h3>
        <ul>
          <li>Log files and access times</li>
          <li>Device information and IP addresses</li>
          <li>Interaction data with platform features</li>
          <li>Document access and modification history</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>
          <FileText size={24} />
          How We Use Your Information
        </h2>
        <ul>
          <li>To provide and maintain our services</li>
          <li>To authenticate and authorize user access</li>
          <li>To send notifications and updates</li>
          <li>To improve platform functionality and user experience</li>
          <li>To ensure security and prevent fraud</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>
          <Shield size={24} />
          Data Security
        </h2>
        <p>
          We implement industry-standard security measures to protect your information:
        </p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security audits and assessments</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Secure data storage and backup procedures</li>
          <li>Compliance with SOC 2 and ISO 27001 standards</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
        <ul>
          <li>With your explicit consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights and prevent fraud</li>
          <li>With service providers who assist in platform operations</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to processing of your data</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>Cookies and Tracking</h2>
        <p>
          We use cookies and similar technologies to enhance your experience, analyze usage, and assist in security measures. You can control cookie preferences through your browser settings.
        </p>
      </section>

      <section class="policy-section">
        <h2>Data Retention</h2>
        <p>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
        </p>
      </section>

      <section class="policy-section">
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
        </p>
      </section>

      <section class="policy-section">
        <h2>
          <CheckCircle size={24} />
          Contact Us
        </h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
        </p>
        <div class="contact-info">
          <p><strong>Email:</strong> <a href="mailto:privacy@boardgovernance.ai">privacy@boardgovernance.ai</a></p>
          <p><strong>Support:</strong> <a href="mailto:support@boardgovernance.ai">support@boardgovernance.ai</a></p>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .privacy-page {
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

  .policy-section {
    margin-bottom: 2.5rem;
  }

  .policy-section:last-child {
    margin-bottom: 0;
  }

  .policy-section h2 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .policy-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 1.5rem 0 0.75rem 0;
  }

  .policy-section p {
    color: #4b5563;
    line-height: 1.7;
    margin: 0 0 1rem 0;
  }

  .policy-section ul {
    color: #4b5563;
    line-height: 1.8;
    margin: 0.5rem 0 1rem 0;
    padding-left: 1.5rem;
  }

  .policy-section li {
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

    .policy-section h2 {
      font-size: 1.25rem;
    }
  }
</style>

