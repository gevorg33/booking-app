/** Customer/public classifier rules for tour checkout capacity diagnosis (ai-cmd-tour-9). */
export const TOUR_CAPACITY_CLASSIFIER_RULES = `- diagnose_tour_capacity: READ — explain why tour checkout rejected a pax count or departure date: max group clamp (requested pax above cap is clamped via clampTourPaxCount), date fully booked (remainingSpots=0), or insufficient remaining spots (Only N spots remaining). Optional serviceName, date, requestedPax. Triggers on checkout/booking rejection, error messages, or why N people won't book. NOT explain_tour_booking (catalog max group / per-person price overview without a rejection), NOT explain_tour_day_slots (how one departure per day / remainingSpots display works), and NOT check_availability (who is free).
- Examples:
  - "Why did checkout reject 4 people for the mountain trek on 15/08/2026?" → diagnose_tour_capacity, serviceName=mountain trek, date=15/08/2026, requestedPax=4
  - "Checkout won't accept 10 pax for City Tour — why?" → diagnose_tour_capacity, serviceName=City Tour, requestedPax=10
  - "Why does booking fail with only 2 spots remaining?" → diagnose_tour_capacity
  - "This tour date is fully booked — why can't I checkout?" → diagnose_tour_capacity
  - "Почему checkout отклонил 5 человек на Mountain Trek?" → diagnose_tour_capacity, serviceName=Mountain Trek, requestedPax=5
  - "Ինչու checkout-ը մերժեց 4 հոգի City Tour-ի համար" → diagnose_tour_capacity, serviceName=City Tour, requestedPax=4`;

export const DIAGNOSE_TOUR_CAPACITY_PROMPTS = [
  {
    id: 'reject-4-mountain-date',
    prompt:
      'Why did checkout reject 4 people for the mountain trek on 15/08/2026?',
    serviceName: 'mountain trek',
    date: '2026-08-15',
    requestedPax: 4,
    aspect: 'insufficientSpots' as const,
  },
  {
    id: 'wont-accept-10-city',
    prompt: "Checkout won't accept 10 pax for City Tour — why?",
    serviceName: 'City Tour',
    requestedPax: 10,
    aspect: 'clampedPax' as const,
  },
  {
    id: 'only-2-spots-error',
    prompt: 'Why does booking fail with "only 2 spots remaining" for Mountain Trek?',
    serviceName: 'Mountain Trek',
    aspect: 'insufficientSpots' as const,
  },
  {
    id: 'fully-booked-checkout',
    prompt: "This tour date is fully booked — why can't I checkout?",
    aspect: 'fullyBooked' as const,
  },
  {
    id: 'pax-reduced-clamp',
    prompt: 'Why was my pax count reduced at checkout for the 3-Day Mountain Trek?',
    serviceName: '3-Day Mountain Trek',
    aspect: 'clampedPax' as const,
  },
  {
    id: 'diagnose-reject-pax-date',
    prompt: 'Diagnose why checkout rejected my pax and date for City Tour',
    serviceName: 'City Tour',
    aspect: 'all' as const,
  },
  {
    id: 'six-people-max-or-full',
    prompt: "Can't book 6 people — max group or fully booked?",
    requestedPax: 6,
    aspect: 'all' as const,
  },
  {
    id: 'ru-reject-5-mountain',
    prompt: 'Почему checkout отклонил 5 человек на Mountain Trek 15/08/2026?',
    serviceName: 'Mountain Trek',
    date: '2026-08-15',
    requestedPax: 5,
    aspect: 'all' as const,
  },
  {
    id: 'hy-reject-4-city',
    prompt: 'Ինչու checkout-ը մերժեց 4 հոգի City Tour-ի համար',
    serviceName: 'City Tour',
    requestedPax: 4,
    aspect: 'all' as const,
  },
  {
    id: 'clamped-to-8',
    prompt: 'Why did it clamp my pax to 8 at checkout?',
    aspect: 'clampedPax' as const,
  },
  {
    id: 'group-15-rejected',
    prompt: 'Booking page rejected my group size of 15 — explain capacity',
    requestedPax: 15,
    aspect: 'maxGroup' as const,
  },
  {
    id: 'one-spot-three-pax',
    prompt: "Only 1 spot remaining error — why can't I book 3 pax?",
    requestedPax: 3,
    aspect: 'insufficientSpots' as const,
  },
] as const;
