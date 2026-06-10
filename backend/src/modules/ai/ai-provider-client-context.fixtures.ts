/** prov-exp-1.6 — provider AI client snapshot / history / staff notes. */
export const PROVIDER_CLIENT_CONTEXT_CLASSIFIER_RULES = `- summarize_client: READ — provider mobile only: brief client snapshot before the visit — loyalty balance with last earn/redeem (read-only on mobile), completed visits, last visit, no-shows, marketing opt-in, referral, first-visit / win-back badges, recent visit highlights. Requires bookingId (session) and/or customerName. Triggers: summarize this client, what should I know about Jane, client overview, is this a first visit, loyalty balance for Jane. NOT show_client_history (visit list only), NOT show_appointments (today's schedule), NOT dashboard summarize_customers, NOT adjust_loyalty (dashboard/AI only).
- show_client_history: READ — provider mobile only: list recent completed visits for the client on this booking (service, provider, date). Requires bookingId and/or customerName. Triggers: show visit history, past appointments for John, when did they last visit. NOT summarize_client (narrative snapshot), NOT list_bookings (all bookings admin-style).
- add_client_note: MUTATE — provider mobile only: add an internal staff note on the customer linked to this booking (max 500 chars). Requires clientNote body plus bookingId and/or customerName. Triggers: add note, remember that, staff note. NOT update_bookings (appointment status), NOT dashboard add_customer_note.
- Examples:
  - "Summarize this client" → summarize_client (inherit bookingId from session)
  - "What should I know about Jane before her color appointment?" → summarize_client, customerName=Jane
  - "Show Jane's visit history" → show_client_history, customerName=Jane
  - "Add note: prefers window seat" → add_client_note, clientNote=prefers window seat`;

export const PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS = [
  {
    id: 'summarize-this-client-en',
    prompt: 'Summarize this client',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-name-en',
    prompt: 'What should I know about Jane Doe before this appointment?',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
    paramsPartial: { customerName: 'Jane Doe' },
  },
  {
    id: 'summarize-client-overview-en',
    prompt: 'Give me a client overview for John',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-preferences-en',
    prompt: 'Tell me about my next client — any loyalty or referral info?',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-visit-count-en',
    prompt: 'How many times has Sarah been here and when was her last visit?',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-no-shows-en',
    prompt: 'Client snapshot for Mike — visits and no-shows',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-before-color-en',
    prompt: 'Brief me on Emma before her color service',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-marketing-en',
    prompt: 'Does this customer opt in to marketing emails?',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-referral-en',
    prompt: 'Was this client referred by anyone?',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-hy',
    prompt: 'Ամփոփիր այս հաճախորդին',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-ru',
    prompt: 'Кратко расскажи об этом клиенте',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'summarize-client-compound-en',
    prompt: 'Summarize Jane; show her loyalty balance',
    surface: 'provider' as const,
    expectedAction: 'summarize_client',
  },
  {
    id: 'history-this-client-en',
    prompt: "Show this client's visit history",
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-past-visits-en',
    prompt: "What are Jane's past appointments here?",
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-last-visit-en',
    prompt: 'When did John last visit and for what service?',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-recent-visits-en',
    prompt: 'List recent completed visits for Sarah',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-previous-services-en',
    prompt: 'What services did Mike get on previous visits?',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-client-record-en',
    prompt: 'Show visit record for Emma',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-prior-bookings-en',
    prompt: 'Prior bookings for this customer',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-completed-en',
    prompt: 'Recent completed visits for my client today',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-who-saw-en',
    prompt: 'Who saw Jane last time she came in?',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-hy',
    prompt: 'Ցույց տուր հաճախորդի այցերի պատմությունը',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'history-ru',
    prompt: 'Покажи историю визитов клиента',
    surface: 'provider' as const,
    expectedAction: 'show_client_history',
  },
  {
    id: 'note-add-en',
    prompt: 'Add staff note: allergic to latex',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
    paramsPartial: { clientNote: 'allergic to latex' },
  },
  {
    id: 'note-remember-en',
    prompt: 'Remember that Jane prefers the quiet chair',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-client-en',
    prompt: 'Add a note for this client — wants extra toner',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-internal-en',
    prompt: 'Staff note: VIP — always offer tea',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-quick-en',
    prompt: 'Note for John: sensitive scalp',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-save-en',
    prompt: 'Save client note — running 10 minutes late habitually',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-write-en',
    prompt: 'Write a note on Sarah: patch test on file',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-log-en',
    prompt: 'Log staff note for Mike: prefers Anna',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-this-booking-en',
    prompt: 'Add note to this booking customer: bring own product',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-hy',
    prompt: 'Ավելացրու նշում՝ ալերգիկ է լատեքսին',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
  {
    id: 'note-ru',
    prompt: 'Добавь заметку: аллергия на латекс',
    surface: 'provider' as const,
    expectedAction: 'add_client_note',
  },
] as const;
