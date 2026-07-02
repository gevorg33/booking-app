export type BookLabFromOrderFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'book_lab_from_order';
  rescueReason: 'book_lab_from_order';
  orderId?: string;
  testName?: string;
};

export const CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES = `- book_lab_from_order: MUTATE — customer clinic only, signed-in: book lab collection for a specific clinic lab order from the Lab to book tab (LabToBookPage / myLabToBook*). Triggers: book collection for my lab order, schedule draw from Lab to book tab, book my CBC order collection, open lab to book and schedule. Optional orderId or testName when named. Navigates to /lab-to-book. NOT list_my_lab_booking_requests (list/show only), NOT book_lab_collection (generic book my lab collection without order/tab context), NOT book_lab_collection_nearest (earliest slot compound), NOT complete_intake_and_book (intake then book), NOT book_appointment (generic service). Customer only — NOT public.`;

export const BOOK_LAB_FROM_ORDER_PROMPTS: readonly BookLabFromOrderFixture[] = [
  {
    id: 'book-collection-lab-order',
    prompt: 'Book collection for my lab order',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'schedule-draw-lab-to-book-tab',
    prompt: 'Schedule draw from Lab to book tab',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'book-cbc-order',
    prompt: 'Book my CBC lab order collection',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
    testName: 'CBC',
  },
  {
    id: 'schedule-lab-to-book-page',
    prompt: 'Schedule collection on the lab to book page',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'book-pending-order',
    prompt: 'Book the pending lab order from Lab to book',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'reserve-draw-my-order',
    prompt: 'Reserve blood draw for my lab order',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'book-order-ord-42',
    prompt: 'Book collection for lab order ord-42',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
    orderId: 'ord-42',
  },
  {
    id: 'open-lab-to-book-schedule',
    prompt: 'Open lab to book and schedule my draw',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'book-lipid-order',
    prompt: 'Book collection for my lipid panel order',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
    testName: 'lipid panel',
  },
  {
    id: 'schedule-from-my-lab-requests',
    prompt: 'Schedule lab collection from my lab requests list',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'book-clinic-sent-order',
    prompt: 'Book collection for the lab order my clinic sent',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
  {
    id: 'lab-to-book-tab-book',
    prompt: 'From the Lab to book tab, book my collection',
    surface: 'customer',
    expectedAction: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  },
];

export const BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-list',
    prompt: 'Book collection for my lab order',
    misclassifiedAction: 'list_my_lab_booking_requests',
    expectedAction: 'book_lab_from_order' as const,
  },
  {
    id: 'misclassified-generic-book',
    prompt: 'Schedule draw from Lab to book tab',
    misclassifiedAction: 'book_lab_collection',
    expectedAction: 'book_lab_from_order' as const,
  },
  {
    id: 'misclassified-appointment',
    prompt: 'Book my CBC lab order collection',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'book_lab_from_order' as const,
  },
] as const;

export const BOOK_LAB_FROM_ORDER_BOUNDARY_PROMPTS = [
  {
    id: 'list-lab-to-book',
    prompt: 'What lab appointments do I need to book?',
    surface: 'customer' as const,
  },
  {
    id: 'generic-book-collection',
    prompt: 'Book my lab collection',
    surface: 'customer' as const,
  },
  {
    id: 'nearest-slot',
    prompt: 'Book lab draw earliest slot',
    surface: 'customer' as const,
  },
] as const;
