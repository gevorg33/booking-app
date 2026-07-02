export type WaitlistDashboardPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: 'list_waitlist_entries' | 'offer_waitlist_slot';
  expectedParams?: Record<string, unknown>;
};

export const LIST_WAITLIST_ENTRIES_PROMPTS = [
  {
    id: 'waitlist-list-entries-en',
    prompt: 'Show waitlist entries',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-list-customers-en',
    prompt: 'List waitlist customers',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-who-on-en',
    prompt: 'Who is on the waitlist',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-display-clients-en',
    prompt: 'Display waitlist clients',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-list-everyone-en',
    prompt: 'List everyone on the waitlist',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-show-people-en',
    prompt: 'Show waitlist people in CRM',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-list-today-en',
    prompt: 'List waitlist entries for today',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-who-customers-en',
    prompt: 'Who are our waitlist customers',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-show-all-en',
    prompt: 'Show all waitlist clients',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-tag-customers-en',
    prompt: 'List customers on the waitlist tag',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'waitlist-display-crm-en',
    prompt: 'Display waitlist entries in CRM',
    expectedAction: 'list_waitlist_entries' as const,
  },
] as const;

export const OFFER_WAITLIST_SLOT_PROMPTS = [
  {
    id: 'waitlist-offer-friday-en',
    prompt: 'Offer Friday 2pm gap to waitlist',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'friday', timeSlot: '14:00' },
  },
  {
    id: 'waitlist-notify-cancelled-en',
    prompt: "Notify waitlist about Maria's cancelled slot on Friday at 2pm",
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: {
      employeeName: 'Maria',
      date: 'friday',
      timeSlot: '14:00',
    },
  },
  {
    id: 'waitlist-message-open-en',
    prompt: 'Message waitlist customers about open slot Friday 3pm',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'friday', timeSlot: '15:00' },
  },
  {
    id: 'waitlist-contact-friday-en',
    prompt: 'Contact waitlist about Friday 3pm opening',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'friday', timeSlot: '15:00' },
  },
  {
    id: 'waitlist-offer-tomorrow-en',
    prompt: 'Offer waitlist the 10am slot tomorrow',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'tomorrow', timeSlot: '10:00' },
  },
  {
    id: 'waitlist-reach-gevorg-en',
    prompt: "Reach out to waitlist for Gevorg's 2pm gap Friday",
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: {
      employeeName: 'Gevorg',
      date: 'friday',
      timeSlot: '14:00',
    },
  },
  {
    id: 'waitlist-notify-appointment-en',
    prompt: 'Notify waitlist about open appointment Friday at 2pm',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'friday', timeSlot: '14:00' },
  },
  {
    id: 'waitlist-offer-cancelled-en',
    prompt: 'Offer cancelled slot to waitlist customers',
    expectedAction: 'offer_waitlist_slot' as const,
  },
  {
    id: 'waitlist-message-tuesday-en',
    prompt: 'Message the waitlist about Tuesday 14:00 gap',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'tuesday', timeSlot: '14:00' },
  },
  {
    id: 'waitlist-contact-anna-en',
    prompt: 'Contact waitlist for available slot with Anna at 11am Friday',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { employeeName: 'Anna', date: 'friday', timeSlot: '11:00' },
  },
  {
    id: 'waitlist-offer-2pm-en',
    prompt: 'Offer open slot Friday at 2pm to waitlist',
    expectedAction: 'offer_waitlist_slot' as const,
    expectedParams: { date: 'friday', timeSlot: '14:00' },
  },
] as const;

export const WAITLIST_DASHBOARD_RESCUE_SCENARIOS = [
  {
    id: 'misclass-list-as-summarize',
    prompt: 'List waitlist customers',
    misclassifiedAction: 'summarize_waitlist',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'misclass-offer-as-fill',
    prompt: 'Offer Friday 2pm gap to waitlist',
    misclassifiedAction: 'fill_slot_from_waitlist',
    expectedAction: 'offer_waitlist_slot' as const,
  },
  {
    id: 'unknown-list',
    prompt: 'Who is on the waitlist',
    misclassifiedAction: 'unknown',
    expectedAction: 'list_waitlist_entries' as const,
  },
  {
    id: 'unknown-offer',
    prompt: 'Notify waitlist about open slot Friday 2pm',
    misclassifiedAction: 'unknown',
    expectedAction: 'offer_waitlist_slot' as const,
  },
] as const;

export const WAITLIST_DASHBOARD_EN_SCENARIO_IDS = [
  ...LIST_WAITLIST_ENTRIES_PROMPTS.map((row) => row.id),
  ...OFFER_WAITLIST_SLOT_PROMPTS.map((row) => row.id),
] as const;

export const WAITLIST_DASHBOARD_PROMPT_FIXTURES: WaitlistDashboardPromptFixture[] =
  [...LIST_WAITLIST_ENTRIES_PROMPTS, ...OFFER_WAITLIST_SLOT_PROMPTS];
