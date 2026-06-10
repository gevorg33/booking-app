/** prov-exp-5.3 — provider mobile retail, messaging, block time, time-off AI. */

export const PROVIDER_EXP_3_CLASSIFIER_RULES = `- add_retail_to_booking: MUTATE — add retail product to own active booking (bookingId or customerName + session). Triggers: add shampoo to this booking, sell product on my appointment. NOT add_retail_sale_to_booking (dashboard admin).
- send_client_message: READ — open SMS/WhatsApp with canned template for booking client. Requires bookingId and/or customerName; optional templateId/template label, channel=sms|whatsapp. Triggers: text client running late, send confirming tomorrow message. NOT add_client_note (internal staff note).
- block_my_time: MUTATE — block lunch/break on own calendar (instant, not approval). Requires date + start/end times. Triggers: block my lunch 12-1, block my break. NOT block_schedule (manager/team), NOT request_time_off (needs approval).
- request_time_off: MUTATE — submit unavailable date range for manager approval. Triggers: request Friday off, PTO next week. NOT block_my_time (instant block).`;

export const PROVIDER_EXP_3_PROMPT_SCENARIOS = [
  {
    id: 'add-retail-product-en',
    prompt: 'Add shampoo to this booking',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'add-retail-my-appointment-en',
    prompt: 'Add retail product to my appointment for Jane',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'add-retail-named-en',
    prompt: 'Sell conditioner on my booking',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'send-message-running-late-en',
    prompt: 'Text Jane that I am running late',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-template-en',
    prompt: 'Send confirming tomorrow message to my client',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-whatsapp-en',
    prompt: 'WhatsApp the client running late template',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-sms-en',
    prompt: 'SMS customer Sam the running late snippet',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'block-my-lunch-en',
    prompt: 'Block my lunch 12:00 to 13:00 today',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'block-my-break-en',
    prompt: 'Block my break tomorrow 3-3:15pm',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'block-my-time-en',
    prompt: 'Block my time 14:00-14:30 on Friday',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'request-time-off-friday-en',
    prompt: 'Request next Friday off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'request-pto-en',
    prompt: 'I need next week off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
] as const;
