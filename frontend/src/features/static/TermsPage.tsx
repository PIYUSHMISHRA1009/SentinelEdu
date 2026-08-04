import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Terms of Use</h1>
      <p className="text-gray-500 mb-8">Last updated: October 26, 2025</p>

      <section className="prose prose-slate max-w-none">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using InsightFlow EDU (the “Service”), you agree to be bound by these Terms. If you do not agree, do not
          use the Service. These Terms may be updated from time to time. Continued use constitutes acceptance of changes.
        </p>

        <h2>Authorized Use</h2>
        <ul>
          <li>Use is limited to legitimate academic purposes within your institution.</li>
          <li>You must protect your credentials and are responsible for actions taken under your account.</li>
          <li>Do not attempt to access data beyond your role’s permissions.</li>
        </ul>

        <h2>Roles and Permissions</h2>
        <p>
          Access is role-based (e.g., Faculty, Academic Head, IT, Student). Certain features (e.g., user administration, database
          analytics) are restricted to IT. Academic Heads may have read-only access to aggregated views but cannot add/delete users
          or reset passwords.
        </p>

        <h2>Prohibited Activities</h2>
        <ul>
          <li>Unauthorized disclosure or export of personal data</li>
          <li>Scraping, reverse engineering, or bypassing security controls</li>
          <li>Introducing malware, interference, or excessive load</li>
          <li>Using the Service for unlawful, unethical, or discriminatory purposes</li>
        </ul>

        <h2>Data and Privacy</h2>
        <p>
          Use of the Service is subject to the Privacy Policy. You acknowledge that the institution controls data retention and
          processing and that the platform may generate derived analytics.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          The Service and its content are protected by copyright and other intellectual property laws. You may not copy or reuse
          materials except as permitted by institutional policy.
        </p>

        <h2>Availability and Changes</h2>
        <p>
          We strive for high availability but do not guarantee uninterrupted service. Features may change or be discontinued with or
          without notice.
        </p>

        <h2>Disclaimers</h2>
        <p>
          Analytics and risk predictions are decision-support tools and may include heuristic or rule-based outputs. They should not
          be treated as definitive evaluations. Academic judgment and due process apply.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, the Service and providers are not liable for indirect, incidental, or consequential
          damages arising from your use of the Service.
        </p>

        <h2>Contact</h2>
        <p>
          Questions regarding these Terms should be directed to your institution’s IT office via the Contact page.
        </p>
      </section>
    </div>
  );
};

export default TermsPage;
