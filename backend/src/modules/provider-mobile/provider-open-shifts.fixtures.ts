/** prov-exp-7.3 — open shifts / schedule gap scenarios. */

export const PROVIDER_OPEN_SHIFTS_SETTINGS_SCENARIOS = [
  {
    id: 'disabled-by-default',
    raw: {},
    expectedEnabled: false,
  },
  {
    id: 'enabled-flag',
    raw: { providerOpenShifts: { enabled: true } },
    expectedEnabled: true,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_GAP_DURATION_SCENARIOS = [
  {
    id: 'ninety-minutes',
    startTime: '10:00',
    endTime: '11:30',
    expectedMinutes: 90,
  },
  {
    id: 'thirty-one-minutes',
    startTime: '14:00',
    endTime: '14:31',
    expectedMinutes: 31,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS = [
  {
    id: 'fill-this-gap',
    prompt:
      'Fill this gap on 2026-06-09 from 14:00 to 15:30 — suggest waitlist customers',
    expectedMatch: true,
  },
  {
    id: 'generic-availability',
    prompt: 'Am I free at 14:00 tomorrow?',
    expectedMatch: false,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_CLASSIFIER_RULES = `- suggest_waitlist_for_gap: READ — own calendar gap with waitlist customer suggestions (requires open-shifts admin toggle). Triggers: fill this gap|suggest waitlist for gap|who on waitlist for this slot. Params: date + timeFrom/timeTo for the gap window. NOT fill_unused_slots (creates schedule blocks) and NOT coordinate_waitlist_offer (manager cancels then offers).
- draft_waitlist_offer_message: READ — draft (copy-only, no send) SMS text offering the gap to the top waitlist candidate. Triggers: draft SMS for waitlist when gap opens|message top waitlist client|write a waitlist offer message. NOT suggest_waitlist_for_gap (lists candidates, no message text) and NOT send_client_message (booking-specific canned template).
- list_waitlist_for_my_services: READ — provider mobile only: waitlist customers relevant to this provider's own services (own employeeId or unassigned requests, optionally filtered by service name). Triggers: show my waitlist|who's waiting for color|my waitlist. NOT suggest_waitlist_for_gap (tied to a specific open gap window), NOT list_waitlist_entries (dashboard-wide, all providers).
- list_rebooking_candidates: READ — for a specific cancelled/cancelling appointment (bookingId from session): matching waitlist entries plus "regulars" (2+ completed visits for that service+provider). Triggers: who should I call after this cancel|rebooking candidates|regulars and waitlist for this slot. NOT suggest_waitlist_for_gap (open gap window, not a specific booking).
- book_walk_in_gap: MUTATE — create a new booking for a walk-in (no customer record) on own calendar. Requires serviceName; optional customerName and time (defaults to right now). Triggers: quick book Trim now|book walk-in Haircut now|book a walk-in in the 2pm gap. NOT create_booking (dashboard flow, requires selecting a customer).`;

export const SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS = [
  {
    id: 'fill-gap-waitlist',
    prompt:
      'Fill this gap on 09/06/2026 from 14:00 to 15:30 — suggest waitlist customers',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'waitlist-for-open-slot',
    prompt: 'Suggest waitlist customers for my 10:00–11:00 gap today',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'who-on-waitlist-for-gap',
    prompt: 'Who on waitlist for this gap',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'suggest-waitlist-open-gap',
    prompt: 'Suggest waitlist for this open gap',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'draft-waitlist-message-gap',
    prompt: 'Draft SMS for waitlist when gap opens',
    surface: 'provider' as const,
    expectedAction: 'draft_waitlist_offer_message',
  },
  {
    id: 'draft-waitlist-message-top-client',
    prompt: 'Message top waitlist client',
    surface: 'provider' as const,
    expectedAction: 'draft_waitlist_offer_message',
  },
  {
    id: 'draft-waitlist-message-write',
    prompt: 'Write a waitlist offer message for this gap',
    surface: 'provider' as const,
    expectedAction: 'draft_waitlist_offer_message',
  },
  {
    id: 'draft-waitlist-message-text',
    prompt: 'Text the waitlist about this open gap',
    surface: 'provider' as const,
    expectedAction: 'draft_waitlist_offer_message',
  },
  {
    id: 'list-waitlist-show-my-en',
    prompt: 'Show my waitlist',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-whos-waiting-color-en',
    prompt: "Who's waiting for color?",
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-my-en',
    prompt: 'My waitlist',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-view-en',
    prompt: 'View my waitlist customers',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-check-en',
    prompt: 'Check my waitlist',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-waiting-for-facial-en',
    prompt: 'Waiting for facial?',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-see-en',
    prompt: 'See my waitlist for today',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-list-en',
    prompt: 'List my waitlist',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-whos-waiting-massage-en',
    prompt: "Who's waiting for massage?",
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'list-waitlist-waiting-for-blowdry-en',
    prompt: 'Waiting for blowdry today?',
    surface: 'provider' as const,
    expectedAction: 'list_waitlist_for_my_services',
  },
  {
    id: 'rebooking-who-should-call-en',
    prompt: 'Who should I call after this cancel?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-candidates-en',
    prompt: 'Rebooking candidates for this slot',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-regulars-waitlist-en',
    prompt: 'Regulars and waitlist for this cancellation',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-who-can-i-call-en',
    prompt: 'Who can I call to fill this slot?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-who-else-call-en',
    prompt: 'Who else should I call after cancelling?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-candidates-cancel-en',
    prompt: 'Show rebooking candidates for the cancellation',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-regulars-only-en',
    prompt: 'Any regulars for this service and time?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-who-should-text-en',
    prompt: 'Who should I text after this cancellation?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-who-should-contact-en',
    prompt: 'Who should I contact to fill this open spot?',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'rebooking-candidates-generic-en',
    prompt: 'Rebooking candidates',
    surface: 'provider' as const,
    expectedAction: 'list_rebooking_candidates',
  },
  {
    id: 'walk-in-quick-book-trim-en',
    prompt: 'Quick book Trim now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-book-haircut-en',
    prompt: 'Book walk-in Haircut now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-book-gap-en',
    prompt: 'Book walk-in in the 2pm gap',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-quick-book-massage-en',
    prompt: 'Quick book Massage now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-book-blowdry-en',
    prompt: 'Book walk-in Blowdry now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-quick-book-facial-en',
    prompt: 'Quick book Facial today',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-book-manicure-en',
    prompt: 'Book walk-in Manicure now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-quick-book-color-en',
    prompt: 'Quick book Color now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-book-pedicure-en',
    prompt: 'Book walk-in Pedicure now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
  {
    id: 'walk-in-quick-book-wax-en',
    prompt: 'Quick book Wax now',
    surface: 'provider' as const,
    expectedAction: 'book_walk_in_gap',
  },
] as const;
