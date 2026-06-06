import { PHI_AI_GUARD_CLASSIFIER_RULES } from './ai-phi-guard.fixtures.js';

/** Dashboard classifier rules for privacy/compliance settings (ai-cmd-compliance-1..6). */
export const BUSINESS_COMPLIANCE_CLASSIFIER_RULES = `- configure_privacy_retention: MUTATE — set business.settings.privacy retention periods (bookingHistoryDays, customerPiiDays, aiCommandLogsDays, auditLogsDays) and cookie banner on the public booking page. Triggers: keep/set + customer data + N years/days; enable/disable + cookie banner/cookie consent + booking page. NOT configure_granular_consent (AI/integration consent toggles), NOT explain_compliance_status (read-only), and NOT privacy_delete (customer self-service forget).
- configure_granular_consent: MUTATE — set business.settings.privacy.granularConsent requireAiProcessing and requireThirdPartyIntegrations at checkout. Triggers: require/ask for/enable/disable + AI processing consent; require/ask for + third-party integration consent. NOT configure_privacy_retention (retention/cookie banner), NOT explain_compliance_status (read-only), and NOT privacy_export (customer data export).
- enable_hipaa_mode: MUTATE — enable/disable HIPAA safeguards and session timeout for clinic businesses only (business.settings.hipaa). Triggers: enable/disable + HIPAA/safeguards; set N-minute session timeout for HIPAA. Requires BAA acceptance before enabling. NOT explain_compliance_status (read-only) and NOT configure_privacy_retention (GDPR retention).
- explain_compliance_status: READ — general compliance overview, retention periods, HIPAA/BAA status. Triggers: what is our compliance status; HIPAA/BAA status; retention periods. NOT list_sub_processors (processor list), NOT explain_gdpr_checklist (GDPR checklist), NOT configure_privacy_retention, and NOT enable_hipaa_mode (mutate).
- list_sub_processors: READ — owner lists Article 28 data sub-processors (platform SUB_PROCESSORS registry). Triggers: who are our data sub-processors; show Article 28 processor list. NOT explain_compliance_status (general overview) and NOT explain_gdpr_checklist.
- explain_gdpr_checklist: READ — owner reviews GDPR privacy checklist and missing items. Triggers: are we GDPR compliant; what privacy items are still missing; show GDPR checklist. NOT explain_compliance_status (general overview) and NOT list_sub_processors.
- admin_delete_customer_data: MUTATE — GDPR right-to-erasure for a named customer: anonymize PII on customer profile (owner/admin). Triggers: forget this customer, anonymize PII from customer profile, GDPR erasure for customer X. NOT privacy_delete (customer self-service my data) and NOT delete_customer_data (generic CRM delete wording).
- report_data_breach: MUTATE — owner logs a data breach or security incident (creates DataBreachIncident with GDPR 72-hour deadline and draft notification). Triggers: report/log/record + data breach or security incident; optional affected customer count. NOT explain_compliance_status (read-only) and NOT list_breach_incidents (read incident list).
- list_breach_incidents: READ — owner lists logged data breach incidents and GDPR 72-hour notification deadlines. Triggers: show/list breach incidents; what is our GDPR 72-hour deadline. NOT report_data_breach (mutate) and NOT explain_compliance_status (general checklist).
- send_breach_notification: MUTATE — owner emails affected customers using the saved draft breach notice for a logged incident. Triggers: email/send + affected customers + breach/incident ref (BR-42, incident X, UUID prefix). NOT report_data_breach (create incident) and NOT list_breach_incidents (read list).
- open_compliance_dashboard: READ — owner deep-links into Settings → Compliance panels (compliance-1.16 dedicated page deferred). Triggers: open/go to/take me to + compliance settings; breach log; HIPAA settings; PHI audit; sub-processors list. NOT explain_compliance_status (text overview) and NOT list_breach_incidents (AI lists incidents).
- view_phi_access_audit: READ — owner views HIPAA PHI access audit log (who read/wrote patient notes, referral notes, symptoms). Triggers: who accessed patient notes; show HIPAA PHI audit log for last week. NOT explain_compliance_status and NOT explain_phi_encryption_status (encryption status).
- explain_phi_encryption_status: READ — clinic only: explain whether HIPAA PHI fields are encrypted at rest (per-business AES keys, phi:v1: prefix). Triggers: is HIPAA encryption on; are referral notes encrypted at rest. NOT explain_compliance_status (general HIPAA summary) and NOT enable_hipaa_mode (mutate).
- explain_minimum_necessary_phi_access: READ — explain HIPAA minimum-necessary PHI access (owners/admins/managers vs staff on assigned bookings). Triggers: who can see patient notes; what PHI can staff access. NOT view_phi_access_audit (audit log of past access) and NOT explain_compliance_status.
- explain_hipaa_session_timeout: READ — clinic only: explain configured HIPAA session timeout and when auto-logout applies after inactivity. Triggers: when will I be logged out; what is our HIPAA session timeout. NOT explain_compliance_status (general HIPAA summary) and NOT configure_hipaa_session_timeout (mutate).
- configure_hipaa_session_timeout: MUTATE — clinic only: set HIPAA session timeout minutes (business.settings.hipaa.sessionTimeoutMinutes) without enabling/disabling HIPAA mode. Triggers: set HIPAA timeout to N minutes; require N-minute auto logout. NOT enable_hipaa_mode (enable/disable safeguards or "for HIPAA" timeout wording) and NOT explain_hipaa_session_timeout (read-only).
- accept_hipaa_baa: MUTATE — clinic owner accepts/signs the HIPAA Business Associate Agreement (business.settings.hipaa.baaAcceptedAt). Triggers: accept/sign BAA; sign BAA to enable HIPAA mode. NOT explain_compliance_status (BAA status read-only) and NOT enable_hipaa_mode (enable safeguards without explicit BAA acceptance wording).
- Examples:
  - "Keep customer data for 3 years" → configure_privacy_retention, customerPiiDays=1095
  - "Set customer PII retention to 730 days" → configure_privacy_retention, customerPiiDays=730
  - "Enable cookie banner on our booking page" → configure_privacy_retention, cookieBannerEnabled=true
  - "Disable cookie consent banner" → configure_privacy_retention, cookieBannerEnabled=false
  - "Require AI processing consent at checkout" → configure_granular_consent, requireAiProcessing=true
  - "Ask for third-party integration consent" → configure_granular_consent, requireThirdPartyIntegrations=true
  - "Stop requiring AI consent at checkout" → configure_granular_consent, requireAiProcessing=false
  - "Enable HIPAA safeguards" → enable_hipaa_mode, enabled=true
  - "Set 15-minute session timeout for HIPAA" → enable_hipaa_mode, sessionTimeoutMinutes=15
  - "What is our HIPAA BAA status?" → explain_compliance_status, aspect=hipaa
  - "Who are our data sub-processors?" → list_sub_processors
  - "Show Article 28 processor list" → list_sub_processors, article28=true
  - "Are we GDPR compliant?" → explain_gdpr_checklist, aspect=compliance
  - "What privacy items are still missing?" → explain_gdpr_checklist, aspect=missing
  - "Show our GDPR compliance checklist" → explain_gdpr_checklist, aspect=checklist
  - "Forget this customer Anna" → admin_delete_customer_data, customerName=Anna
  - "Anonymize PII from Anna's customer profile" → admin_delete_customer_data, customerName=Anna
  - "GDPR right to erasure for customer Bob" → admin_delete_customer_data, customerName=Bob
  - "Report a data breach" → report_data_breach
  - "Log security incident affecting customer emails" → report_data_breach
  - "Report a data breach: unauthorized API access exposed 128 customer emails" → report_data_breach, affectedCustomerCount=128
  - "Show breach incidents" → list_breach_incidents
  - "What is our GDPR 72-hour deadline?" → list_breach_incidents, aspect=deadlines
  - "Email affected customers about breach BR-42" → send_breach_notification, incidentRef=BR-42
  - "Send draft breach notice for incident X" → send_breach_notification, incidentRef=X
  - "Open compliance settings" → open_compliance_dashboard, panel=overview
  - "Take me to breach log" → open_compliance_dashboard, panel=breach
  - "Who accessed patient notes?" → view_phi_access_audit
  - "Show HIPAA PHI audit log for last week" → view_phi_access_audit, daysBack=7
  - "Is HIPAA encryption on?" → explain_phi_encryption_status
  - "Are referral notes encrypted at rest?" → explain_phi_encryption_status, fieldName=referralNotes
  - "Who can see patient notes?" → explain_minimum_necessary_phi_access, aspect=roles
  - "What PHI can staff access?" → explain_minimum_necessary_phi_access, aspect=fields
  - "When will I be logged out?" → explain_hipaa_session_timeout
  - "Set HIPAA timeout to 10 minutes" → configure_hipaa_session_timeout, sessionTimeoutMinutes=10
  - "Accept the HIPAA business associate agreement" → accept_hipaa_baa
  - "Sign BAA to enable HIPAA mode" → accept_hipaa_baa, enableHipaa=true`;

export const ACCEPT_HIPAA_BAA_PROMPTS = [
  {
    id: 'accept-hipaa-baa',
    prompt: 'Accept the HIPAA business associate agreement',
  },
  {
    id: 'sign-baa-enable-hipaa',
    prompt: 'Sign BAA to enable HIPAA mode',
    enableHipaa: true,
  },
  {
    id: 'agree-to-baa',
    prompt: 'Agree to the business associate agreement for HIPAA',
  },
  {
    id: 'sign-hipaa-baa',
    prompt: 'Sign the HIPAA BAA',
  },
] as const;

export const EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS = [
  {
    id: 'is-hipaa-encryption-on',
    prompt: 'Is HIPAA encryption on?',
  },
  {
    id: 'referral-notes-encrypted-at-rest',
    prompt: 'Are referral notes encrypted at rest?',
    fieldName: 'referralNotes',
  },
  {
    id: 'phi-encryption-status',
    prompt: 'What is our PHI encryption status?',
  },
  {
    id: 'patient-notes-encrypted',
    prompt: 'Are patient notes encrypted at rest?',
    fieldName: 'notes',
  },
] as const;

export const EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS = [
  {
    id: 'who-can-see-patient-notes',
    prompt: 'Who can see patient notes?',
    aspect: 'roles' as const,
  },
  {
    id: 'what-phi-can-staff-access',
    prompt: 'What PHI can staff access?',
    aspect: 'fields' as const,
  },
  {
    id: 'minimum-necessary-policy',
    prompt: 'Explain minimum necessary PHI access',
    aspect: 'all' as const,
  },
  {
    id: 'staff-access-to-symptoms',
    prompt: 'What can staff see on patient symptoms?',
    aspect: 'fields' as const,
  },
] as const;

export const OPEN_COMPLIANCE_DASHBOARD_PROMPTS = [
  {
    id: 'open-compliance-settings',
    prompt: 'Open compliance settings',
    panel: 'overview' as const,
  },
  {
    id: 'take-me-to-breach-log',
    prompt: 'Take me to breach log',
    panel: 'breach' as const,
  },
  {
    id: 'open-hipaa-settings',
    prompt: 'Go to HIPAA compliance settings',
    panel: 'hipaa' as const,
  },
  {
    id: 'open-phi-audit',
    prompt: 'Open PHI access audit',
    panel: 'phi_audit' as const,
  },
  {
    id: 'open-sub-processors',
    prompt: 'Take me to sub-processors list',
    panel: 'sub_processors' as const,
  },
] as const;

export const SEND_BREACH_NOTIFICATION_PROMPTS = [
  {
    id: 'email-affected-customers-br42',
    prompt: 'Email affected customers about breach BR-42',
    incidentRef: 'BR-42',
  },
  {
    id: 'send-draft-breach-notice-incident-x',
    prompt: 'Send draft breach notice for incident X',
    incidentRef: 'X',
  },
  {
    id: 'send-breach-notification-email',
    prompt: 'Send breach notification email for incident a1b2c3d4',
    incidentRef: 'a1b2c3d4',
  },
  {
    id: 'notify-customers-breach',
    prompt: 'Notify affected customers about data breach BR-99',
    incidentRef: 'BR-99',
  },
] as const;

export const LIST_BREACH_INCIDENTS_PROMPTS = [
  {
    id: 'show-breach-incidents',
    prompt: 'Show breach incidents',
    aspect: 'all' as const,
  },
  {
    id: 'list-reported-breaches',
    prompt: 'List reported data breaches',
    aspect: 'all' as const,
  },
  {
    id: 'gdpr-72-hour-deadline',
    prompt: 'What is our GDPR 72-hour deadline?',
    aspect: 'deadlines' as const,
  },
] as const;

export const VIEW_PHI_ACCESS_AUDIT_PROMPTS = [
  {
    id: 'who-accessed-patient-notes',
    prompt: 'Who accessed patient notes?',
  },
  {
    id: 'hipaa-phi-audit-last-week',
    prompt: 'Show HIPAA PHI audit log for last week',
    daysBack: 7,
  },
  {
    id: 'phi-access-audit-log',
    prompt: 'Show PHI access audit log',
  },
  {
    id: 'who-viewed-referral-notes',
    prompt: 'Who viewed referral notes?',
    fieldName: 'referralNotes',
  },
] as const;

export const REPORT_DATA_BREACH_PROMPTS = [
  {
    id: 'report-data-breach',
    prompt: 'Report a data breach',
  },
  {
    id: 'log-security-incident-emails',
    prompt: 'Log security incident affecting customer emails',
  },
  {
    id: 'report-breach-with-count',
    prompt:
      'Report a data breach: unauthorized API access exposed 128 customer emails',
    affectedCustomerCount: 128,
  },
  {
    id: 'record-security-incident',
    prompt:
      'Record security incident: ransomware encrypted booking database backups',
  },
] as const;

export const ADMIN_DELETE_CUSTOMER_DATA_PROMPTS = [
  {
    id: 'forget-customer-anna',
    prompt: 'Forget this customer Anna',
    customerName: 'Anna',
  },
  {
    id: 'forget-customer-full-name',
    prompt: 'Forget customer Anna Smith',
    customerName: 'Anna Smith',
  },
  {
    id: 'anonymize-pii-profile',
    prompt: "Anonymize PII from Anna's customer profile",
    customerName: 'Anna',
  },
  {
    id: 'gdpr-erasure-bob',
    prompt: 'GDPR right to erasure for customer Bob',
    customerName: 'Bob',
  },
  {
    id: 'remove-personal-data-profile',
    prompt: 'Remove personal data from customer profile for Maria',
    customerName: 'Maria',
  },
  {
    id: 'forget-this-customer',
    prompt: 'Forget this customer',
  },
] as const;

export const EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS = [
  {
    id: 'when-will-i-be-logged-out',
    prompt: 'When will I be logged out?',
    personalLogout: true,
  },
  {
    id: 'what-is-hipaa-session-timeout',
    prompt: 'What is our HIPAA session timeout?',
    personalLogout: false,
  },
  {
    id: 'how-long-before-logout',
    prompt: 'How long before auto logout?',
    personalLogout: false,
  },
  {
    id: 'session-timeout-policy',
    prompt: 'What is our session timeout policy?',
    personalLogout: false,
  },
] as const;

export const CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS = [
  {
    id: 'set-hipaa-timeout-10-minutes',
    prompt: 'Set HIPAA timeout to 10 minutes',
    sessionTimeoutMinutes: 10,
  },
  {
    id: 'require-15-minute-auto-logout',
    prompt: 'Require 15-minute auto logout',
    sessionTimeoutMinutes: 15,
  },
  {
    id: 'set-hipaa-session-timeout-30',
    prompt: 'Set HIPAA session timeout to 30 minutes',
    sessionTimeoutMinutes: 30,
  },
  {
    id: 'configure-20-minute-timeout',
    prompt: 'Configure 20-minute session timeout',
    sessionTimeoutMinutes: 20,
  },
] as const;

export const ENABLE_HIPAA_MODE_PROMPTS = [
  {
    id: 'enable-hipaa-safeguards',
    prompt: 'Enable HIPAA safeguards',
    enabled: true,
  },
  {
    id: 'set-15-minute-hipaa-timeout',
    prompt: 'Set 15-minute session timeout for HIPAA',
    sessionTimeoutMinutes: 15,
  },
  {
    id: 'disable-hipaa-mode',
    prompt: 'Disable HIPAA mode',
    enabled: false,
  },
  {
    id: 'turn-on-hipaa-clinic',
    prompt: 'Turn on HIPAA safeguards for our clinic',
    enabled: true,
  },
  {
    id: 'activate-hipaa-safeguards',
    prompt: 'Activate HIPAA compliance safeguards',
    enabled: true,
  },
] as const;

export const LIST_SUB_PROCESSORS_PROMPTS = [
  {
    id: 'who-are-data-sub-processors',
    prompt: 'Who are our data sub-processors?',
  },
  {
    id: 'article-28-processor-list',
    prompt: 'Show Article 28 processor list',
    article28: true,
  },
  {
    id: 'list-sub-processors-we-use',
    prompt: 'List sub-processors we use',
  },
  {
    id: 'show-data-processors',
    prompt: 'Show our data processors',
  },
] as const;

export const EXPLAIN_GDPR_CHECKLIST_PROMPTS = [
  {
    id: 'are-we-gdpr-compliant',
    prompt: 'Are we GDPR compliant?',
    aspect: 'compliance' as const,
  },
  {
    id: 'privacy-items-missing',
    prompt: 'What privacy items are still missing?',
    aspect: 'missing' as const,
  },
  {
    id: 'show-gdpr-checklist',
    prompt: 'Show our GDPR compliance checklist',
    aspect: 'checklist' as const,
  },
  {
    id: 'gdpr-privacy-checklist',
    prompt: 'What is our GDPR privacy checklist status?',
    aspect: 'checklist' as const,
  },
] as const;

export const EXPLAIN_COMPLIANCE_STATUS_PROMPTS = [
  {
    id: 'hipaa-baa-status',
    prompt: 'What is our HIPAA BAA status?',
    aspect: 'hipaa' as const,
  },
  {
    id: 'explain-retention-periods',
    prompt: 'Explain our data retention periods',
    aspect: 'retention' as const,
  },
  {
    id: 'compliance-status-overview',
    prompt: 'What is our compliance status?',
    aspect: 'all' as const,
  },
  {
    id: 'show-hipaa-status-timeout',
    prompt: 'Show HIPAA status and session timeout',
    aspect: 'hipaa' as const,
  },
] as const;

export const CONFIGURE_PRIVACY_RETENTION_PROMPTS = [
  {
    id: 'keep-customer-data-3-years',
    prompt: 'Keep customer data for 3 years',
    customerPiiDays: 1095,
  },
  {
    id: 'customer-pii-730-days',
    prompt: 'Set customer PII retention to 730 days',
    customerPiiDays: 730,
  },
  {
    id: 'enable-cookie-banner-booking-page',
    prompt: 'Enable cookie banner on our booking page',
    cookieBannerEnabled: true,
  },
  {
    id: 'disable-cookie-consent',
    prompt: 'Disable cookie consent banner',
    cookieBannerEnabled: false,
  },
  {
    id: 'booking-history-5-years',
    prompt: 'Keep booking history for 5 years',
    bookingHistoryDays: 1825,
  },
  {
    id: 'audit-logs-7-years',
    prompt: 'Set audit log retention to 7 years',
    auditLogsDays: 2555,
  },
] as const;

export const CONFIGURE_GRANULAR_CONSENT_PROMPTS = [
  {
    id: 'require-ai-processing-checkout',
    prompt: 'Require AI processing consent at checkout',
    requireAiProcessing: true,
  },
  {
    id: 'ask-third-party-integration-consent',
    prompt: 'Ask for third-party integration consent',
    requireThirdPartyIntegrations: true,
  },
  {
    id: 'disable-ai-consent-checkout',
    prompt: 'Stop requiring AI consent at checkout',
    requireAiProcessing: false,
  },
  {
    id: 'disable-third-party-consent',
    prompt: 'Disable third-party integration consent requirement',
    requireThirdPartyIntegrations: false,
  },
  {
    id: 'enable-ai-and-integration-consent',
    prompt: 'Require AI processing and third-party integration consent at checkout',
    requireAiProcessing: true,
    requireThirdPartyIntegrations: true,
  },
  {
    id: 'granular-consent-ai-only',
    prompt: 'Enable granular consent for AI processing at checkout',
    requireAiProcessing: true,
  },
] as const;
