/** Customer/public classifier rules for GDPR data-rights explanations (ai-cmd-compliance-7). */
export const DATA_RIGHTS_CLASSIFIER_RULES = `- explain_data_rights: READ — explain how visitors or logged-in customers exercise GDPR data rights: export personal data, delete/anonymize account data, and cookie consent on this booking page. Triggers: how/what/can I + export/delete/download data; why cookie banner/consent; what are my data rights. NOT privacy_export (self-service mutate — "Export my personal data"), NOT privacy_delete (self-service mutate — "Delete my account data"), NOT configure_privacy_retention (dashboard owner enables cookie banner), and NOT explain_compliance_status (dashboard admin checklist).
- Examples:
  - "How can I export my personal data?" → explain_data_rights, aspect=export
  - "Can I delete my account data?" → explain_data_rights, aspect=delete
  - "What are my data rights?" → explain_data_rights, aspect=all
  - "Why do I see a cookie banner on this page?" → explain_data_rights, aspect=cookie_banner
  - "What does the cookie consent notice mean?" → explain_data_rights, aspect=cookie_banner
  - "How do I download my information?" → explain_data_rights, aspect=export`;

export const EXPLAIN_DATA_RIGHTS_PROMPTS = [
  {
    id: 'how-export-personal-data',
    prompt: 'How can I export my personal data?',
    aspect: 'export' as const,
  },
  {
    id: 'can-delete-account-data',
    prompt: 'Can I delete my account data?',
    aspect: 'delete' as const,
  },
  {
    id: 'what-are-data-rights',
    prompt: 'What are my data rights?',
    aspect: 'all' as const,
  },
  {
    id: 'why-cookie-banner',
    prompt: 'Why do I see a cookie banner on this page?',
    aspect: 'cookie_banner' as const,
  },
  {
    id: 'cookie-consent-meaning',
    prompt: 'What does the cookie consent notice mean?',
    aspect: 'cookie_banner' as const,
  },
  {
    id: 'how-download-information',
    prompt: 'How do I download my information?',
    aspect: 'export' as const,
  },
] as const;
