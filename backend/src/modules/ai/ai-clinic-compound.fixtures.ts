import type { CommandSurface } from './ai-command-registry.types.js';

export type ClinicCompoundSurface = Extract<
  CommandSurface,
  'dashboard' | 'customer' | 'public'
>;

export interface ClinicCompoundScenario {
  id: string;
  surface: ClinicCompoundSurface;
  prompt: string;
  orderedActions: [string, string];
  paramsPartial?: Record<string, unknown>;
  misclassifiedAction?: string;
}

/** Classifier hints for clinic lab-order + result-notification compounds (ai-cmd-clinic-v2-7). */
export const CLINIC_COMPOUND_CLASSIFIER_RULES = `- Clinic lab compounds (multi-step):
  - dashboard: "Order lipid panel for Maria and notify her when results are ready" → compound: create_test_order then notify_patient_result_ready (share customerName/testNames)
  - dashboard: "List abnormal results for Maria and explain her lab results" → compound: list_abnormal_results then explain_patient_results (share customerName) OR clinic_lab_review golden recipe
  - customer: "Book lipid panel and notify me when results are ready" → compound: book_nearest_slot then explain_result_status (patient FAQ — NOT notify_patient_result_ready)
  - public: "Book a CBC and tell me when results are ready on this page" → compound: book_appointment then explain_result_status
  - NOT single create_test_order when prompt also asks to notify/send/tell about results ready; NOT single explain_result_status when prompt also asks to book/order/schedule a lab panel first; NOT single list_abnormal_results when prompt also asks to explain/summarize flagged results.`;

export const DASHBOARD_CLINIC_COMPOUND_PROMPTS: ClinicCompoundScenario[] = [
  {
    id: 'order-lipid-notify-maria',
    prompt:
      "Order lipid panel for Maria's visit and notify her when results are ready",
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Maria', testNames: ['lipid panel'] },
    misclassifiedAction: 'notify_patient_result_ready',
  },
  {
    id: 'place-cbc-then-notify-john',
    prompt:
      'Place CBC for John on Friday and send result-ready email when available',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'John', testNames: ['CBC'] },
    misclassifiedAction: 'create_test_order',
  },
  {
    id: 'book-lipid-notify-patient',
    prompt:
      'Book lipid panel for Anna and notify patient when lab results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Anna', testNames: ['lipid panel'] },
  },
  {
    id: 'request-bmp-notify',
    prompt:
      'Request BMP and CBC for James visit tomorrow; then notify him when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'James' },
  },
  {
    id: 'create-order-notify-whatsapp',
    prompt:
      'Create lab order CBC for Sofia and send WhatsApp when test results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Sofia', testNames: ['CBC'] },
  },
  {
    id: 'order-panel-alert-ready',
    prompt:
      'Order metabolic panel for Alex and alert the patient their results are available',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Alex', testNames: ['metabolic panel'] },
  },
  {
    id: 'blood-work-notify',
    prompt: 'Place blood work CBC for Maria and notify when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Maria', testNames: ['CBC'] },
  },
  {
    id: 'lipid-then-result-ready',
    prompt:
      'Add lipid panel for patient Elena and then notify her when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Elena', testNames: ['lipid panel'] },
  },
  {
    id: 'cbc-notify-after-order',
    prompt:
      "Order CBC for Maria's appointment and also notify her when lab results are ready",
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Maria', testNames: ['CBC'] },
  },
  {
    id: 'panel-order-message-ready',
    prompt:
      'Order lipid panel for John and message patient when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'John', testNames: ['lipid panel'] },
  },
  {
    id: 'semicolon-order-notify',
    prompt: 'Order CBC for Anna tomorrow; notify her when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Anna', testNames: ['CBC'] },
  },
  {
    id: 'book-panel-staff-notify',
    prompt:
      'Book lipid panel for Maria visit and notify her when results are ready',
    surface: 'dashboard',
    orderedActions: ['create_test_order', 'notify_patient_result_ready'],
    paramsPartial: { customerName: 'Maria', testNames: ['lipid panel'] },
  },
];

export const CUSTOMER_CLINIC_COMPOUND_PROMPTS: ClinicCompoundScenario[] = [
  {
    id: 'book-lipid-notify-me',
    prompt: 'Book lipid panel and notify me when results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    paramsPartial: { serviceName: 'lipid panel', testName: 'lipid panel' },
    misclassifiedAction: 'explain_result_status',
  },
  {
    id: 'schedule-cbc-explain-ready',
    prompt: 'Schedule a CBC and explain when my results will be ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    paramsPartial: { serviceName: 'CBC', testName: 'CBC' },
  },
  {
    id: 'reserve-panel-tell-me',
    prompt: 'Reserve lipid panel and tell me when lab results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    paramsPartial: { serviceName: 'lipid panel' },
  },
  {
    id: 'book-blood-work-alert',
    prompt: 'Book blood work CBC and alert me when results are available',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    paramsPartial: { serviceName: 'CBC' },
  },
  {
    id: 'book-panel-then-when-ready',
    prompt: 'Book lipid panel then notify me when results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
    misclassifiedAction: 'list_my_test_results',
  },
  {
    id: 'book-cbc-and-when-ready',
    prompt: 'Book a CBC and when will my results be ready?',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'schedule-panel-explain-status',
    prompt:
      'Schedule lipid panel and explain result status when they are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'book-metabolic-notify-me',
    prompt: 'Book metabolic panel and notify me when test results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'reserve-lipid-results-ready',
    prompt: 'Reserve lipid panel; notify me when results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'book-cbc-also-explain',
    prompt: 'Book CBC and also explain when results will appear in My Results',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'book-panel-my-results',
    prompt: 'Book lipid panel and tell me when my lab results are ready',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
  {
    id: 'schedule-bmp-ready-faq',
    prompt: 'Schedule BMP and when are my results ready?',
    surface: 'customer',
    orderedActions: ['book_nearest_slot', 'explain_result_status'],
  },
];

export const PUBLIC_CLINIC_COMPOUND_PROMPTS: ClinicCompoundScenario[] = [
  {
    id: 'book-lipid-tell-me-ready',
    prompt: 'Book lipid panel and tell me when results are ready on this page',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
    paramsPartial: { serviceName: 'lipid panel' },
  },
  {
    id: 'schedule-cbc-explain-ready-public',
    prompt: 'Schedule a CBC and explain when results will be ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-panel-notify-me-public',
    prompt: 'Book lipid panel and notify me when lab results are ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
    misclassifiedAction: 'explain_result_status',
  },
  {
    id: 'reserve-cbc-when-ready',
    prompt: 'Reserve CBC and when will my results be ready?',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-blood-work-ready-faq',
    prompt: 'Book blood work and explain when test results are ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-lipid-then-ready',
    prompt: 'Book lipid panel then tell me when results are ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'schedule-panel-results-page',
    prompt:
      'Schedule lipid panel and explain result status when they appear on this page',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-cbc-alert-ready',
    prompt: 'Book a CBC and alert me when results are available',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-metabolic-notify-public',
    prompt: 'Book metabolic panel and notify me when results are ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'semicolon-book-explain',
    prompt: 'Book lipid panel; explain when results will be ready',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'book-panel-my-lab-results',
    prompt: 'Book lipid panel and when are my lab results ready?',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
  {
    id: 'schedule-cbc-ready-public',
    prompt: 'Schedule CBC and tell me when results are ready after my visit',
    surface: 'public',
    orderedActions: ['book_appointment', 'explain_result_status'],
  },
];

export const CLINIC_COMPOUND_SCENARIOS: ClinicCompoundScenario[] = [
  ...DASHBOARD_CLINIC_COMPOUND_PROMPTS,
  ...CUSTOMER_CLINIC_COMPOUND_PROMPTS,
  ...PUBLIC_CLINIC_COMPOUND_PROMPTS,
];

export const CLINIC_COMPOUND_RESCUE_SCENARIOS =
  CLINIC_COMPOUND_SCENARIOS.filter((scenario) => scenario.misclassifiedAction);
