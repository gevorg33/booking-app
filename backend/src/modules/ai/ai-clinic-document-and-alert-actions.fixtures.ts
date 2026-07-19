export const CLINIC_DOCUMENT_AND_ALERT_ACTIONS_INTENTS = [
  'open_clinic_document',
  'dismiss_patient_alert',
] as const;

export type ClinicDocumentAndAlertActionsIntent =
  (typeof CLINIC_DOCUMENT_AND_ALERT_ACTIONS_INTENTS)[number];

export const CLINIC_DOCUMENT_AND_ALERT_ACTIONS_CLASSIFIER_RULES = `- open_clinic_document: READ — open/view one specific released clinic document (referral letter, imaging report, lab report PDF) the signed-in customer already has in My Results. Triggers: "Open my referral letter", "Show me that imaging report", "View document GC-123". Requires documentId (from a prior list_my_documents result). NOT list_my_documents (browses/lists all released documents, no single document).
- dismiss_patient_alert: MUTATE — permanently dismiss a clinic patient alert banner on the account (test result released, intake incomplete, lab booking pending) so it stops showing. Triggers: "Dismiss this alert", "Clear the results-ready banner", "I've seen this, hide it". Requires alertType and sourceId (from the alerts banner context). NOT explain_patient_alert (explains what the banner means / hides it client-side only, does not call the dismiss API).`;

export type ClinicDocumentAndAlertActionsPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: ClinicDocumentAndAlertActionsIntent;
  documentId?: string;
  alertType?: string;
  sourceId?: string;
};

export const CLINIC_DOCUMENT_AND_ALERT_ACTIONS_PROMPTS: readonly ClinicDocumentAndAlertActionsPromptFixture[] =
  [
    {
      id: 'open-referral-letter',
      prompt: 'Open my referral letter',
      expectedAction: 'open_clinic_document',
    },
    {
      id: 'open-imaging-report',
      prompt: 'Show me that imaging report',
      expectedAction: 'open_clinic_document',
    },
    {
      id: 'dismiss-results-alert',
      prompt: 'Dismiss this alert, I already saw it',
      expectedAction: 'dismiss_patient_alert',
    },
    {
      id: 'clear-banner',
      prompt: 'Clear the results-ready banner',
      expectedAction: 'dismiss_patient_alert',
    },
  ];
