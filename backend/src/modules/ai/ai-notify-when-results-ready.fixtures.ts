export type NotifyWhenResultsReadyAspect =
  | 'subscribe_explain'
  | 'how_it_works'
  | 'push_channel'
  | 'sms_email_channel'
  | 'general';

export type NotifyWhenResultsReadyChannel =
  | 'push'
  | 'sms'
  | 'text'
  | 'email'
  | 'whatsapp';

export type NotifyWhenResultsReadyFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'notify_when_results_ready';
  rescueReason: 'notify_when_results_ready';
  aspect?: NotifyWhenResultsReadyAspect;
  channel?: NotifyWhenResultsReadyChannel;
  testName?: string;
};

export const CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES = `- notify_when_results_ready: READ — customer app only: explain how lab result-ready notifications work (push, email, SMS, in-app alerts) — read-only until a customer subscribe mutate exists. Triggers: text me when results are ready, notify me when my lab results are ready, alert me when CBC is ready, how do I get notified when results are released. Optional channel (push|sms|text|email|whatsapp) and testName. NOT notify_patient_result_ready (staff send to patient), NOT track_lab_order_status (check if ready now), NOT explain_result_status (pending/released pipeline FAQ), NOT manage_notification_preferences (toggle appointment reminders), NOT explain_my_notifications (booking reminders).`;

export const NOTIFY_WHEN_RESULTS_READY_PROMPTS: readonly NotifyWhenResultsReadyFixture[] =
  [
    {
      id: 'text-me-when-ready',
      prompt: 'Text me when results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
      channel: 'text',
    },
    {
      id: 'notify-me-lab-ready',
      prompt: 'Notify me when my lab results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
    {
      id: 'alert-cbc-ready',
      prompt: 'Alert me when my CBC is ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
      testName: 'CBC',
    },
    {
      id: 'sms-when-released',
      prompt: 'Send me an SMS when my test results are released',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'sms_email_channel',
      channel: 'sms',
    },
    {
      id: 'push-when-ready',
      prompt: 'Send me a push when my lab results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'push_channel',
      channel: 'push',
    },
    {
      id: 'how-get-notified',
      prompt: 'How do I get notified when results are ready?',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'how_it_works',
    },
    {
      id: 'email-when-ready',
      prompt: 'Email me when my lab results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'sms_email_channel',
      channel: 'email',
    },
    {
      id: 'remind-me-ready',
      prompt: 'Remind me when my results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
    {
      id: 'whatsapp-results-ready',
      prompt: 'Can you WhatsApp me when my results are ready?',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'sms_email_channel',
      channel: 'whatsapp',
    },
    {
      id: 'message-when-released',
      prompt: 'Message me when my test results are released',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
    {
      id: 'notify-lipid-panel',
      prompt: 'Notify me when my lipid panel results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
      testName: 'lipid panel',
    },
    {
      id: 'result-ready-alerts',
      prompt: 'How do result-ready alerts work in the app?',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'general',
    },
    {
      id: 'tell-me-when-ready',
      prompt: 'Tell me when my lab results are ready',
      surface: 'customer',
      expectedAction: 'notify_when_results_ready',
      rescueReason: 'notify_when_results_ready',
      aspect: 'subscribe_explain',
    },
  ];

/** Blocks track_lab_order_status when the user wants result-ready alerts. */
export const NOTIFY_WHEN_RESULTS_READY_BLOCK = new RegExp(
  String.raw`\b(?:notify|text|alert|remind|message|send|ping|tell|whatsapp|email|sms|push)\s+me\b.{0,40}\b(?:when|once|after)\b.{0,30}\b(?:results?|lab|test).*(?:ready|released|available)\b|\b(?:how\s+do\s+i\s+get\s+notified|result[- ]?ready\s+alerts?)\b|(?:տեղեկացրիր|գրիր|հաղորդիր|ծանուցիր|ասա)\s+ինձ.{0,30}(?:երբ|պատրաստ|թողարկ)|(?:уведомь|напиши|сообщи|скажи)\s+мне.{0,30}(?:когда|готов|результат)|(?:пришлите|отправьте).{0,20}(?:sms|push|email|whatsapp).{0,20}(?:готов|результат)`,
  'iu',
);

export const NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS = [
  {
    id: 'track-to-notify-text-me',
    prompt: 'Text me when results are ready',
    misclassifiedAction: 'track_lab_order_status',
    expectedAction: 'notify_when_results_ready' as const,
  },
  {
    id: 'staff-notify-to-customer-explain',
    prompt: 'Notify me when my lab results are ready',
    misclassifiedAction: 'notify_patient_result_ready',
    expectedAction: 'notify_when_results_ready' as const,
  },
  {
    id: 'explain-status-to-notify',
    prompt: 'Alert me when my CBC is ready',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'notify_when_results_ready' as const,
  },
  {
    id: 'unknown-to-notify-push',
    prompt: 'Send me a push when my lab results are ready',
    misclassifiedAction: 'unknown',
    expectedAction: 'notify_when_results_ready' as const,
  },
];
