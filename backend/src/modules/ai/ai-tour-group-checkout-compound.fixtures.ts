import type { CommandSurface } from './ai-command-registry.types.js';

export const TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS = [
  'explain_tour_booking',
  'diagnose_tour_capacity',
  'book_nearest_slot',
] as const;

export const TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS = [
  'explain_tour_booking',
  'diagnose_tour_capacity',
  'book_appointment',
] as const;

export type TourGroupCheckoutSurface = Extract<
  CommandSurface,
  'customer' | 'public'
>;

export type TourGroupCheckoutCompoundFixture = {
  id: string;
  prompt: string;
  surface: TourGroupCheckoutSurface;
  orderedActions: readonly string[];
  serviceName?: string;
  paxCount?: number;
  misclassifiedAction?: string;
};

export const TOUR_GROUP_CHECKOUT_CLASSIFIER_RULES = `- tour_group_checkout (compound): customer/public multi-step group tour booking with capacity gate — decomposes to explain_tour_booking (groupSize + pax) → diagnose_tour_capacity (remaining spots for date) → book_nearest_slot|book_appointment when enough seats. Triggers: tour|trek|excursion + N people|guests|pax + date + book|reserve + if enough seats|when capacity allows|book if seats available. Example: "Wine tour for 6 next Saturday — book if enough seats", "Reserve city tour for 8 on 15/08/2026 only if spots remain". NOT diagnose_tour_capacity alone (checkout rejection why), NOT book_tour_nearest_departure (earliest/nearest/ASAP without capacity gate), NOT explain_tour_booking alone (read catalog), NOT book_nearest_slot without tour group + capacity check.`;

export const TOUR_GROUP_CHECKOUT_EN_PROMPTS = [
  {
    id: 'wine-tour-6-saturday-seats',
    prompt: 'Wine tour for 6 next Saturday — book if enough seats',
    serviceName: 'Wine tour',
    paxCount: 6,
  },
  {
    id: 'city-tour-8-date-capacity',
    prompt: 'City tour for 8 on 15/08/2026 — book only if enough spots',
    serviceName: 'City tour',
    paxCount: 8,
  },
  {
    id: 'mountain-trek-4-capacity-gate',
    prompt: 'Book mountain trek for 4 people next Friday if capacity allows',
    serviceName: 'mountain trek',
    paxCount: 4,
  },
  {
    id: 'sunset-hike-5-seats',
    prompt: 'Sunset hike for 5 guests — reserve when seats are available',
    serviceName: 'Sunset hike',
    paxCount: 5,
  },
  {
    id: 'wine-country-10-group',
    prompt: 'Wine country tour for 10 — book if there are enough seats',
    serviceName: 'Wine country tour',
    paxCount: 10,
  },
  {
    id: 'trek-3-date-book-if',
    prompt:
      'Book 3-day mountain trek for 6 on 20/08/2026 if enough spots remain',
    serviceName: '3-day mountain trek',
    paxCount: 6,
  },
  {
    id: 'excursion-7-capacity',
    prompt:
      'Reserve the city excursion for 7 people next Saturday when capacity allows',
    serviceName: 'city excursion',
    paxCount: 7,
  },
  {
    id: 'tour-4-pax-gate',
    prompt: 'Tour for 4 pax next week — book only if seats available',
    paxCount: 4,
  },
  {
    id: 'hike-2-seats-check',
    prompt: 'Book the coastal hike for 2 if enough seats on 12/09/2026',
    serviceName: 'coastal hike',
    paxCount: 2,
  },
  {
    id: 'trek-group-book-if',
    prompt: 'Mountain trek for 5 — book if enough seats next Saturday',
    serviceName: 'Mountain trek',
    paxCount: 5,
  },
] as const;

function buildTourGroupCheckoutPrompts(): TourGroupCheckoutCompoundFixture[] {
  const rows: TourGroupCheckoutCompoundFixture[] = [];
  for (const entry of TOUR_GROUP_CHECKOUT_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        orderedActions:
          surface === 'public'
            ? TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS
            : TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS,
        ...('serviceName' in entry && entry.serviceName
          ? { serviceName: entry.serviceName }
          : {}),
        paxCount: entry.paxCount,
      });
    }
  }
  return rows;
}

export const TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS: readonly TourGroupCheckoutCompoundFixture[] =
  buildTourGroupCheckoutPrompts();

export const TOUR_GROUP_CHECKOUT_RESCUE_SCENARIOS: readonly TourGroupCheckoutCompoundFixture[] =
  [
    {
      id: 'book-slot-to-tour-group-checkout',
      prompt: 'Wine tour for 6 next Saturday — book if enough seats',
      surface: 'customer',
      orderedActions: [...TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS],
      misclassifiedAction: 'book_nearest_slot',
    },
    {
      id: 'diagnose-to-tour-group-checkout',
      prompt: 'City tour for 8 on 15/08/2026 — book only if enough spots',
      surface: 'customer',
      orderedActions: [...TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS],
      misclassifiedAction: 'diagnose_tour_capacity',
    },
    {
      id: 'explain-to-tour-group-checkout',
      prompt: 'Book mountain trek for 4 people next Friday if capacity allows',
      surface: 'customer',
      orderedActions: [...TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS],
      misclassifiedAction: 'explain_tour_booking',
    },
    {
      id: 'appointment-to-tour-group-checkout-public',
      prompt: 'Sunset hike for 5 guests — reserve when seats are available',
      surface: 'public',
      orderedActions: [...TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS],
      misclassifiedAction: 'book_appointment',
    },
  ];

export const TOUR_GROUP_CHECKOUT_NEGATIVE_PROMPTS = [
  {
    id: 'nearest-no-capacity-gate',
    prompt: 'Book the wine tour earliest date for 2 people',
    surface: 'customer' as const,
  },
  {
    id: 'diagnose-rejection-only',
    prompt:
      'Why did checkout reject 4 people for the mountain trek on 15/08/2026?',
    surface: 'customer' as const,
  },
  {
    id: 'book-tour-no-pax-gate',
    prompt: 'Book wine tour next Saturday',
    surface: 'customer' as const,
  },
] as const;
