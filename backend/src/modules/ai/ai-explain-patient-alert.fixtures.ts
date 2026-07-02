import type { ClinicPatientAlertType } from '../../common/utils/clinic-patient-alert.types.js';

export type ExplainPatientAlertAspect =
  | 'what_is_banner'
  | 'results_ready'
  | 'intake_incomplete'
  | 'lab_booking_pending'
  | 'what_to_do'
  | 'dismiss_alert'
  | 'how_it_works';

export type ExplainPatientAlertFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_patient_alert';
  rescueReason: 'patient_alert';
  aspect?: ExplainPatientAlertAspect;
  alertType?: ClinicPatientAlertType;
};

export const CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES = `- explain_patient_alert: READ — customer app only: explain ConsumerPatientAlertsBanner clinic alerts (patientAlertsRegionLabel) — released lab results, incomplete pre-visit intake, or pending lab collection booking. Triggers: what is this red banner, results ready what do I do, clinic alert, dismiss patient alert, lab collection to book banner. Set aspect when clear (what_is_banner|results_ready|intake_incomplete|lab_booking_pending|what_to_do|dismiss_alert|how_it_works). NOT list_my_test_results (open results list), NOT explain_result_status (result status FAQ), NOT book_lab_collection (mutate booking), NOT explain_public_intake_form (checkout questionnaire fields), NOT explain_my_notifications (push settings).`;

export const EXPLAIN_PATIENT_ALERT_PROMPTS: readonly ExplainPatientAlertFixture[] =
  [
    {
      id: 'red-banner-customer',
      prompt: 'What is this red banner?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_is_banner',
    },
    {
      id: 'results-ready-customer',
      prompt: 'Results ready — what do I do?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'results_ready',
      alertType: 'TestResultReleased',
    },
    {
      id: 'clinic-alert-customer',
      prompt: 'What is the clinic alert banner?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_is_banner',
    },
    {
      id: 'yellow-alert-customer',
      prompt: 'Why do I see a yellow alert at the top?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_is_banner',
    },
    {
      id: 'new-lab-result-customer',
      prompt: 'What does the new lab result alert mean?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'results_ready',
      alertType: 'TestResultReleased',
    },
    {
      id: 'dismiss-alert-customer',
      prompt: 'How do I dismiss the patient alert?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'dismiss_alert',
    },
    {
      id: 'intake-alert-customer',
      prompt: 'What is the pre-visit intake alert?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'intake_incomplete',
      alertType: 'IntakeIncomplete',
    },
    {
      id: 'lab-book-banner-customer',
      prompt: 'Why does it say lab collection to book?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'lab_booking_pending',
      alertType: 'LabBookingRequestPending',
    },
    {
      id: 'what-to-do-customer',
      prompt: 'What should I do about the clinic alerts?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_to_do',
    },
    {
      id: 'view-button-customer',
      prompt: 'Where does View take me on the alert?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'what_to_do',
    },
    {
      id: 'home-alerts-customer',
      prompt: 'What are patient alerts on the home screen?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'how_it_works',
    },
    {
      id: 'how-alerts-work-customer',
      prompt: 'How do clinic patient alerts work?',
      surface: 'customer',
      expectedAction: 'explain_patient_alert',
      rescueReason: 'patient_alert',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown',
    prompt: 'What is this red banner?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_patient_alert' as const,
  },
  {
    id: 'misclassified-list-results',
    prompt: 'Results ready — what do I do?',
    misclassifiedAction: 'list_my_test_results',
    expectedAction: 'explain_patient_alert' as const,
  },
  {
    id: 'misclassified-result-status',
    prompt: 'What does the new lab result alert mean?',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'explain_patient_alert' as const,
  },
] as const;

export const EXPLAIN_PATIENT_ALERT_BOUNDARY_PROMPTS = [
  {
    id: 'list-results',
    prompt: 'Show my test results',
    surface: 'customer' as const,
  },
  {
    id: 'book-lab',
    prompt: 'Book my lab collection',
    surface: 'customer' as const,
  },
  {
    id: 'intake-checkout',
    prompt: 'Why these health questions?',
    surface: 'customer' as const,
  },
] as const;
