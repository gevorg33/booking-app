/** Dashboard classifier rules for clinic lab test orders (ai-cmd-clinic-v2-1). */
export const CLINIC_TEST_ORDER_CLASSIFIER_RULES = `- create_test_order: MUTATE — clinic only: place lab test orders for a patient visit/booking using catalog test types or panels. Triggers: order/place/request/add + CBC|lipid|lab test|blood work|panel + for {customer}'s visit|appointment|booking + optional date (tomorrow, Friday). Requires customerName or bookingId and testNames (array) or testPanels. NOT create_booking (schedule appointment), NOT list_test_orders (read queue), NOT enter_test_result (result entry).
- list_test_orders: READ — clinic only: list lab test orders for a patient, visit date, or lab queue status. Triggers: show/list + lab orders|test orders|pending labs|collection queue + optional customerName, date, status. NOT list_bookings (all appointments), NOT list_specimens (specimen tracking view), NOT create_test_order (mutate).
- Examples:
  - "Order CBC and lipid panel for Maria's visit tomorrow" → create_test_order, customerName=Maria, date=tomorrow, testNames=["CBC","lipid panel"]
  - "Place a CBC order for John on Friday" → create_test_order, customerName=John, testNames=["CBC"]
  - "Show Maria's lab orders for tomorrow" → list_test_orders, customerName=Maria, date=tomorrow
  - "List pending lab orders for this week" → list_test_orders, dateFrom/dateTo=this week, status=NotCollected`;

/** Declared so the array is one type, not a union of eleven literal shapes. */
export type CreateTestOrderPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
  testNames: string[];
  dateHint?: string;
  bookingId?: string;
};

export const CREATE_TEST_ORDER_PROMPTS: readonly CreateTestOrderPromptFixture[] = [
  {
    id: 'cbc-lipid-maria-tomorrow',
    prompt: "Order CBC and lipid panel for Maria's visit tomorrow",
    customerName: 'Maria',
    testNames: ['CBC', 'lipid panel'],
    dateHint: 'tomorrow',
  },
  {
    id: 'cbc-john-friday',
    prompt: 'Place a CBC order for John on Friday',
    customerName: 'John',
    testNames: ['CBC'],
  },
  {
    id: 'bmp-and-cbc',
    prompt: 'Request BMP and CBC for Anna visit tomorrow',
    customerName: 'Anna',
    testNames: ['BMP', 'CBC'],
  },
  {
    id: 'lipid-panel-only',
    prompt: 'Order lipid panel for Maria tomorrow',
    customerName: 'Maria',
    testNames: ['lipid panel'],
  },
  {
    id: 'comma-separated-tests',
    prompt: 'Add CBC, BMP for James on his visit tomorrow',
    customerName: 'James',
    testNames: ['CBC', 'BMP'],
  },
  {
    id: 'panel-order',
    prompt: 'Order metabolic panel for Sofia visit next week',
    customerName: 'Sofia',
    testNames: ['metabolic panel'],
  },
  {
    id: 'question-form',
    prompt: 'Can you order a CBC for Maria tomorrow?',
    customerName: 'Maria',
    testNames: ['CBC'],
  },
  {
    id: 'blood-work',
    prompt: 'Place blood work CBC for patient Alex tomorrow',
    customerName: 'Alex',
    testNames: ['CBC'],
  },
  {
    id: 'semicolon-compound-style',
    prompt: 'Order CBC for Maria; visit is tomorrow',
    customerName: 'Maria',
    testNames: ['CBC'],
  },
  {
    id: 'possessive-visit',
    prompt: "Order lipid panel for Maria's appointment tomorrow",
    customerName: 'Maria',
    testNames: ['lipid panel'],
  },
  {
    id: 'booking-id',
    prompt: 'Create lab order CBC for booking abc123',
    bookingId: 'abc123',
    testNames: ['CBC'],
  },
];

export const LIST_TEST_ORDERS_PROMPTS = [
  {
    id: 'maria-tomorrow',
    prompt: "Show Maria's lab orders for tomorrow",
    customerName: 'Maria',
    dateHint: 'tomorrow',
  },
  {
    id: 'pending-queue',
    prompt: 'List pending lab orders for this week',
    status: 'NotCollected',
  },
  {
    id: 'patient-orders',
    prompt: 'What test orders does Maria have tomorrow?',
    customerName: 'Maria',
    dateHint: 'tomorrow',
  },
  {
    id: 'collection-queue',
    prompt: 'Show lab orders waiting for collection',
    status: 'NotCollected',
  },
  {
    id: 'john-friday',
    prompt: 'List John’s test orders for Friday',
    customerName: 'John',
  },
  {
    id: 'all-open',
    prompt: 'Show open lab test orders',
  },
  {
    id: 'visit-orders',
    prompt: 'List test orders for Maria visit tomorrow',
    customerName: 'Maria',
    dateHint: 'tomorrow',
  },
  {
    id: 'booking-orders',
    prompt: 'Show lab orders for booking abc123',
    bookingId: 'abc123',
  },
  {
    id: 'awaiting-results',
    prompt: 'List lab orders awaiting results',
    status: 'AwaitingResults',
  },
  {
    id: 'question-list',
    prompt: 'Which lab orders are pending for Maria tomorrow?',
    customerName: 'Maria',
    dateHint: 'tomorrow',
  },
  {
    id: 'recent-orders',
    prompt: 'Show recent lab test orders for Anna',
    customerName: 'Anna',
  },
] as const;

export const CLINIC_TEST_ORDER_RESCUE_SCENARIOS = [
  {
    id: 'list-bookings-to-create',
    prompt: "Order CBC and lipid panel for Maria's visit tomorrow",
    misclassifiedAction: 'list_bookings',
    expectedAction: 'create_test_order' as const,
  },
  {
    id: 'show-appointments-to-list-orders',
    prompt: "Show Maria's lab orders for tomorrow",
    misclassifiedAction: 'show_appointments',
    expectedAction: 'list_test_orders' as const,
  },
  {
    id: 'create-booking-to-create-order',
    prompt: 'Order CBC for Maria tomorrow',
    misclassifiedAction: 'create_booking',
    expectedAction: 'create_test_order' as const,
  },
] as const;
