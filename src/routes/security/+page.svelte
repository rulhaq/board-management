<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { Shield, Lock, Key, Eye, CheckCircle, AlertTriangle } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Security - Board Governance AI</title>
</svelte:head>

<div class="security-page">
  <div class="container">
    <div class="header">
      <div class="header-icon">
        <Shield size={48} />
      </div>
      <h1>Security</h1>
      <p class="subtitle">Comprehensive security measures to protect your data</p>
    </div>

    <div class="content">
      <section class="security-section">
        <h2>
          <Lock size={24} />
          Data Encryption
        </h2>
        <p>
          All data transmitted to and from Board Governance AI is encrypted using industry-standard TLS 1.3 encryption. Data at rest is encrypted using AES-256 encryption.
        </p>
        <ul>
          <li>End-to-end encryption for sensitive communications</li>
          <li>Encrypted database storage</li>
          <li>Secure key management</li>
          <li>Regular encryption key rotation</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>
          <Key size={24} />
          Authentication & Access Control
        </h2>
        <h3>Multi-Factor Authentication (MFA)</h3>
        <ul>
          <li>Two-factor authentication (2FA) support</li>
          <li>Time-based one-time passwords (TOTP)</li>
          <li>Biometric authentication options</li>
          <li>Session management and timeout controls</li>
        </ul>

        <h3>Access Controls</h3>
        <ul>
          <li>Role-based access control (RBAC)</li>
          <li>Granular permission management</li>
          <li>IP whitelisting capabilities</li>
          <li>Device management and tracking</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>
          <Eye size={24} />
          Monitoring & Auditing
        </h2>
        <p>
          We maintain comprehensive security monitoring and audit logs to detect and respond to security incidents:
        </p>
        <ul>
          <li>Real-time security event monitoring</li>
          <li>Comprehensive audit logs</li>
          <li>Anomaly detection systems</li>
          <li>Automated threat response</li>
          <li>Regular security assessments</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>
          <Shield size={24} />
          Compliance & Certifications
        </h2>
        <div class="compliance-badges">
          <div class="badge">
            <CheckCircle size={20} />
            <span>SOC 2 Type II Compliant</span>
          </div>
          <div class="badge">
            <CheckCircle size={20} />
            <span>ISO 27001 Certified</span>
          </div>
          <div class="badge">
            <CheckCircle size={20} />
            <span>HIPAA Ready</span>
          </div>
          <div class="badge">
            <CheckCircle size={20} />
            <span>GDPR Compliant</span>
          </div>
        </div>
        <p>
          Board Governance AI adheres to industry-leading security standards and compliance requirements to ensure the highest level of data protection.
        </p>
      </section>

      <section class="security-section">
        <h2>Infrastructure Security</h2>
        <ul>
          <li>Secure cloud infrastructure with redundant systems</li>
          <li>Regular security patches and updates</li>
          <li>DDoS protection and mitigation</li>
          <li>Network segmentation and firewalls</li>
          <li>Intrusion detection and prevention systems</li>
          <li>Regular penetration testing</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>Data Backup & Recovery</h2>
        <ul>
          <li>Automated daily backups</li>
          <li>Geographically distributed backup storage</li>
          <li>Point-in-time recovery capabilities</li>
          <li>Regular backup testing and validation</li>
          <li>Disaster recovery planning</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>
          <AlertTriangle size={24} />
          Incident Response
        </h2>
        <p>
          We maintain a comprehensive incident response plan to quickly address and mitigate security incidents:
        </p>
        <ul>
          <li>24/7 security monitoring</li>
          <li>Rapid incident detection and response</li>
          <li>User notification procedures</li>
          <li>Post-incident analysis and improvement</li>
        </ul>
      </section>

      <section class="security-section">
        <h2>Security Best Practices for Users</h2>
        <div class="best-practices">
          <div class="practice-item">
            <CheckCircle size={20} />
            <div>
              <strong>Use Strong Passwords</strong>
              <p>Create unique, complex passwords and change them regularly</p>
            </div>
          </div>
          <div class="practice-item">
            <CheckCircle size={20} />
            <div>
              <strong>Enable Multi-Factor Authentication</strong>
              <p>Add an extra layer of security to your account</p>
            </div>
          </div>
          <div class="practice-item">
            <CheckCircle size={20} />
            <div>
              <strong>Keep Software Updated</strong>
              <p>Ensure your browser and devices are up to date</p>
            </div>
          </div>
          <div class="practice-item">
            <CheckCircle size={20} />
            <div>
              <strong>Be Cautious with Links</strong>
              <p>Verify the authenticity of links before clicking</p>
            </div>
          </div>
          <div class="practice-item">
            <CheckCircle size={20} />
            <div>
              <strong>Report Suspicious Activity</strong>
              <p>Immediately report any suspicious activity to security@boardgovernance.ai</p>
            </div>
          </div>
        </div>
      </section>

      <section class="security-section">
        <h2>Security Contact</h2>
        <p>
          If you discover a security vulnerability or have security concerns, please contact us immediately:
        </p>
        <div class="contact-info">
          <p><strong>Security Team:</strong> <a href="mailto:security@boardgovernance.ai">security@boardgovernance.ai</a></p>
          <p><strong>Support:</strong> <a href="mailto:support@boardgovernance.ai">support@boardgovernance.ai</a></p>
          <p><strong>Emergency:</strong> Available 24/7 through the platform support portal</p>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .security-page {
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

  .security-section {
    margin-bottom: 2.5rem;
  }

  .security-section:last-child {
    margin-bottom: 0;
  }

  .security-section h2 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .security-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 1.5rem 0 0.75rem 0;
  }

  .security-section p {
    color: #4b5563;
    line-height: 1.7;
    margin: 0 0 1rem 0;
  }

  .security-section ul {
    color: #4b5563;
    line-height: 1.8;
    margin: 0.5rem 0 1rem 0;
    padding-left: 1.5rem;
  }

  .security-section li {
    margin-bottom: 0.5rem;
  }

  .compliance-badges {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 0.5rem;
    color: #166534;
    font-weight: 500;
  }

  .best-practices {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .practice-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border-left: 3px solid #00a859;
  }

  .practice-item svg {
    color: #00a859;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  .practice-item strong {
    display: block;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .practice-item p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
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

    .security-section h2 {
      font-size: 1.25rem;
    }

    .compliance-badges {
      grid-template-columns: 1fr;
    }
  }
</style>

