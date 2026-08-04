import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: October 26, 2025</p>

      <section className="prose prose-slate max-w-none">
        <p>
          InsightFlow EDU is committed to protecting your privacy. This policy explains what information we collect, why we collect it,
          and how we use, store, and protect it. It also describes your choices and rights.
        </p>

        <h2>Information We Collect</h2>
        <ul>
          <li>Student records: GPA/CGPA, attendance, enrollments, and course performance</li>
          <li>Risk and intervention data: risk flags, notes, status updates</li>
          <li>Feedback content and derived sentiment scores</li>
          <li>Account details for faculty, IT, and academic heads (name, email, role)</li>
          <li>Limited technical data (timestamps, basic usage metadata) for audit and troubleshooting</li>
        </ul>

        <h2>How We Use Information</h2>
        <ul>
          <li>To deliver analytics dashboards and reports to authorized roles</li>
          <li>To identify and support at-risk students through interventions</li>
          <li>To improve academic outcomes and operational efficiency</li>
          <li>To ensure platform security, reliability, and compliance</li>
        </ul>

        <h2>Legal Basis and Consent</h2>
        <p>
          Processing is based on legitimate educational interests and institutional policy. Where required, we rely on consent for
          optional features (e.g., contact form submissions). You may withdraw consent at any time.
        </p>

        <h2>Data Sharing</h2>
        <p>
          We do not sell personal information. Data access is limited to authorized personnel within your institution. Aggregated
          or anonymized insights may be shared for institutional planning and research, without identifying individuals.
        </p>

        <h2>Security</h2>
        <p>
          We implement role-based access controls, least-privilege principles, and transport encryption (HTTPS in production). Passwords
          must be securely hashed in production systems. Audit logs help detect and investigate misuse.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain records only as long as necessary for academic purposes and legal compliance. Retention schedules are governed by
          institutional policy. Upon request and subject to policy, we will delete or anonymize data.
        </p>

        <h2>Your Rights</h2>
        <ul>
          <li>Access, rectification, and deletion of your data (subject to policy and law)</li>
          <li>Restriction or objection to processing in certain circumstances</li>
          <li>Portability of data where technically feasible</li>
          <li>Complaint to your data protection authority if applicable</li>
        </ul>

        <h2>Children’s Privacy</h2>
        <p>
          InsightFlow EDU is used by educational institutions. Parental or guardian rights are respected in accordance with applicable
          laws and institutional policies.
        </p>

        <h2>International Transfers</h2>
        <p>
          If data is processed outside your jurisdiction, we apply appropriate safeguards consistent with applicable regulations.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy to reflect changes in technology, law, or our services. Material changes will be communicated through
          the platform.
        </p>

        <h2>Contact Us</h2>
        <p>
          Questions or requests about privacy can be sent via the Contact page or directly to your institution’s IT office.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPage;
