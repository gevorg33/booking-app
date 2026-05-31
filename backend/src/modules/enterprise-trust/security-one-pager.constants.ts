import type { SecurityOnePager } from './enterprise-trust.types.js';

export const SECURITY_ONE_PAGER: SecurityOnePager = {
  title: 'OptiSchedule Security & Compliance Overview',
  lastUpdated: '2026-06-01',
  summary:
    'OptiSchedule is a multi-tenant SaaS platform for appointment-based businesses. This one-pager summarizes controls commonly requested in security questionnaires and SOC 2 readiness reviews.',
  contactEmail: 'security@optischedule.com',
  sections: [
    {
      id: 'encryption',
      title: 'Encryption',
      bullets: [
        'TLS 1.2+ for all data in transit (API, dashboard, public booking pages)',
        'Database and object storage encrypted at rest using AES-256 (cloud provider managed keys)',
        'Secrets and API keys stored in environment configuration, not in source code',
        'Stripe Connect handles payment card data; OptiSchedule does not store PAN or CVV',
      ],
    },
    {
      id: 'access_control',
      title: 'Access control',
      bullets: [
        'Role-based access: owner, admin, and provider roles with least-privilege defaults',
        'JWT authentication for dashboard and provider mobile apps',
        'Business-scoped data isolation on every API request',
        'Administrative actions and AI operations logged for audit review',
        'Production database access restricted to authorized engineering staff',
      ],
    },
    {
      id: 'backups',
      title: 'Backups & availability',
      bullets: [
        'Automated daily database backups with point-in-time recovery (cloud provider)',
        'Backup retention: minimum 30 days for production databases',
        'Infrastructure deployed across redundant availability zones',
        'Disaster recovery runbooks tested on a scheduled basis',
      ],
    },
    {
      id: 'application_security',
      title: 'Application security',
      bullets: [
        'Input validation on all API endpoints (class-validator DTOs)',
        'Webhook HMAC-SHA256 signature verification for outbound integrations',
        'Rate limiting on authentication and public booking endpoints',
        'Dependency vulnerability scanning in CI pipeline',
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & GDPR tooling',
      bullets: [
        'Customer marketing consent and privacy acceptance tracked per contact',
        'Data export and deletion request workflows for EU/UK customers',
        'Configurable DPA and privacy policy templates for Controller businesses',
        'Sub-processor list available on request',
      ],
    },
    {
      id: 'incident_response',
      title: 'Incident response',
      bullets: [
        'Documented incident response procedure with severity classification',
        'Customer notification for confirmed breaches affecting their tenant data',
        'Post-incident review and remediation tracking',
      ],
    },
  ],
};
