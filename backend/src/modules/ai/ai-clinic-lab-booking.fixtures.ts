/** Dashboard classifier rules — staff push / staff book collection (ai-cmd-clinic-v2-8). */
export const DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES = `- push_lab_booking_to_patient: MUTATE — clinic only: push a lab collection booking request to the patient (email/SMS/push) for an existing lab order. Triggers: push/send/notify + patient + lab collection|blood draw|book collection + optional customerName/orderId. Requires orderId or customerName; optional collectionServiceName. NOT create_booking (schedule visit), NOT create_test_order (place new catalog order), NOT list_test_orders (read queue).
- staff_book_lab_collection: MUTATE — clinic only: staff books a lab_test collection slot and links it to an existing lab order. Triggers: book/schedule + lab collection|blood draw + for patient + optional date/time. Requires orderId or customerName and startTime (or date+time). NOT push_lab_booking_to_patient (patient self-book), NOT create_booking (generic appointment without lab order link).
- create_catalog_test_order: alias of create_test_order — place catalog lab tests/panels on a visit; same params as create_test_order.
- list_test_orders: also use awaitingPatientBooking=true when prompt asks for orders awaiting patient booking|waiting for patient to book collection.
- Examples:
  - "Push lab collection booking to Maria for her CBC order" → push_lab_booking_to_patient, customerName=Maria
  - "Send Maria a link to book her blood draw" → push_lab_booking_to_patient, customerName=Maria
  - "Book lab collection for Maria tomorrow at 9am for order ord-1" → staff_book_lab_collection, customerName=Maria, orderId=ord-1, startTime=...
  - "Show orders awaiting patient booking" → list_test_orders, awaitingPatientBooking=true`;

/** Customer mobile classifier rules. */
export const CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES = `- list_my_lab_booking_requests: READ — clinic only, signed-in: list pending lab collection appointments staff asked you to book (Lab to book). Triggers: lab to book|lab appointments to book|pending lab collection|book my lab tests. NOT list_my_test_results (released results), NOT my_appointments (schedule), NOT book_lab_collection_nearest (book with earliest slot).
- book_lab_collection: READ/MUTATE — clinic only, signed-in: open or complete booking for a pushed lab collection request; returns book link or next step. Triggers: book my lab collection|book blood draw|schedule my lab draw|lab collection appointment. NOT book_appointment (generic service), NOT list_my_lab_booking_requests (list only), NOT book_lab_collection_nearest (earliest/nearest slot compound), NOT book_lab_from_order (specific lab order / Lab to book tab).
- book_lab_from_order: MUTATE — clinic only, signed-in customer: book collection for a clinic lab order from Lab to book (LabToBookPage / myLabToBook*). Triggers: book collection for my lab order|schedule draw from Lab to book tab. NOT list_my_lab_booking_requests (list only), NOT book_lab_collection (generic without order/tab context).
- book_lab_collection_nearest (compound): list_my_lab_booking_requests → book_lab_collection with bookingFirstAvailable=true when user wants earliest/nearest/soonest lab draw slot. Example: "Book lab draw earliest slot".
- Examples:
  - "What lab appointments do I need to book?" → list_my_lab_booking_requests
  - "Book my lab collection" → book_lab_collection
  - "Book collection for my lab order" → book_lab_from_order
  - "Book lab draw earliest slot" → book_lab_collection_nearest`;

/** Public booking web appendix (logged-in account phrasing). */
export const PUBLIC_CLINIC_LAB_BOOKING_CLASSIFIER_APPENDIX = `- list_my_lab_booking_requests: "Lab appointments to book on my account", "Pending lab collection requests"
- book_lab_collection: "Book my lab blood draw from the clinic request", "Schedule collection for my lab order"
- book_lab_collection_nearest: "Book lab draw earliest slot", "Schedule my blood draw soonest opening"`;

/** Provider mobile classifier rules. */
export const PROVIDER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES = `- list_patient_pending_lab_requests: READ — clinic only: list patients on your schedule with lab orders awaiting patient self-booking (pushed, no collection booked). Triggers: patients waiting to book lab|pending lab booking requests|who still needs to book collection. NOT list_my_collection_queue (specimen draw queue), NOT list_test_orders (dashboard-wide).
- notify_patient_book_lab: MUTATE — clinic only: send/remind a patient (SMS/email/push) to self-book their lab collection for an existing lab order. Requires customerName or orderId. Triggers: remind patient to book collection, nudge pending lab self-book. NOT list_patient_pending_lab_requests (read-only list).`;

/** Declared so the array is one type, not a union of literal shapes. */
export type PushLabBookingToPatientPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
  orderId?: string;
};

export const PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS: readonly PushLabBookingToPatientPromptFixture[] = [
  {
    id: 'push-maria-cbc',
    prompt: 'Push lab collection booking to Maria for her CBC order',
    customerName: 'Maria',
  },
  {
    id: 'send-blood-draw-link',
    prompt: 'Send Maria a link to book her blood draw',
    customerName: 'Maria',
  },
  {
    id: 'notify-patient-collection',
    prompt: 'Notify patient Alex to book lab collection',
    customerName: 'Alex',
  },
  {
    id: 'push-collection-request',
    prompt: 'Push collection booking request to Jane',
    customerName: 'Jane',
  },
  {
    id: 'ask-patient-book-lab',
    prompt: 'Ask Maria to book her lab appointment',
    customerName: 'Maria',
  },
  {
    id: 'push-order-id',
    prompt: 'Push lab booking request for order ord-123',
    orderId: 'ord-123',
  },
  {
    id: 'send-lipid-draw',
    prompt: 'Send patient John the lipid panel collection booking link',
    customerName: 'John',
  },
  {
    id: 'push-blood-work',
    prompt: 'Push blood work collection to patient Sofia',
    customerName: 'Sofia',
  },
  {
    id: 'patient-self-book',
    prompt: 'Have Maria self-book her lab collection',
    customerName: 'Maria',
  },
  {
    id: 'push-lab-draw',
    prompt: 'Push lab draw booking to Maria',
    customerName: 'Maria',
  },
  {
    id: 'question-push',
    prompt: 'Can you push a lab collection booking to Alex?',
    customerName: 'Alex',
  },
] as const;

/** Declared so the array is one type, not a union of literal shapes. */
export type StaffBookLabCollectionPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
  orderId?: string;
};

export const STAFF_BOOK_LAB_COLLECTION_PROMPTS: readonly StaffBookLabCollectionPromptFixture[] = [
  {
    id: 'book-maria-tomorrow',
    prompt: 'Book lab collection for Maria tomorrow at 9am',
    customerName: 'Maria',
  },
  {
    id: 'schedule-alex-draw',
    prompt: 'Schedule blood draw for Alex on Friday at 10:00',
    customerName: 'Alex',
  },
  {
    id: 'staff-book-order',
    prompt: 'Book collection appointment for order ord-55 tomorrow morning',
    orderId: 'ord-55',
  },
  {
    id: 'book-jane-lab',
    prompt: 'Book Jane lab collection for next Tuesday 2pm',
    customerName: 'Jane',
  },
  {
    id: 'reserve-draw-slot',
    prompt: 'Reserve a lab draw slot for patient Maria',
    customerName: 'Maria',
  },
  {
    id: 'staff-schedule-collection',
    prompt: 'Staff book lab collection for John',
    customerName: 'John',
  },
  {
    id: 'book-blood-draw-visit',
    prompt: 'Book blood draw visit for Sofia tomorrow',
    customerName: 'Sofia',
  },
  {
    id: 'collection-for-order',
    prompt: 'Schedule collection for lab order ord-88 at 9:30 tomorrow',
    orderId: 'ord-88',
  },
  {
    id: 'book-lab-slot',
    prompt: 'Book a lab collection slot for Maria',
    customerName: 'Maria',
  },
  {
    id: 'question-staff-book',
    prompt: 'Can you book lab collection for Alex tomorrow?',
    customerName: 'Alex',
  },
] as const;

export const LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS = [
  { id: 'lab-to-book', prompt: 'What lab appointments do I need to book?' },
  {
    id: 'pending-lab-collection',
    prompt: 'Show my pending lab collection requests',
  },
  { id: 'lab-appointments-to-book', prompt: 'Lab appointments to book' },
  {
    id: 'clinic-asked-book',
    prompt: 'What lab tests did the clinic ask me to book?',
  },
  { id: 'my-lab-to-book', prompt: 'My lab to book list' },
  {
    id: 'pending-draw',
    prompt: 'Any lab blood draws I still need to schedule?',
  },
  { id: 'open-lab-requests', prompt: 'Open my lab booking requests' },
  {
    id: 'collection-to-schedule',
    prompt: 'Lab collections I need to schedule',
  },
  { id: 'account-lab-book', prompt: 'Lab to book on my account' },
  {
    id: 'waiting-lab-booking',
    prompt: 'Am I waiting to book any lab appointments?',
  },
  { id: 'list-lab-book', prompt: 'List lab appointments I need to book' },
  {
    id: 'clinic-lab-request',
    prompt: 'Pending lab booking requests from my clinic',
  },
] as const;

export const BOOK_LAB_COLLECTION_PROMPTS = [
  { id: 'book-my-collection', prompt: 'Book my lab collection' },
  { id: 'schedule-blood-draw', prompt: 'Schedule my lab blood draw' },
  { id: 'book-lab-draw', prompt: 'Book my lab draw appointment' },
  { id: 'reserve-collection', prompt: 'Reserve my lab collection slot' },
  {
    id: 'book-pending-lab',
    prompt: 'Book the lab collection my clinic sent me',
  },
  {
    id: 'schedule-collection-appt',
    prompt: 'Schedule my collection appointment',
  },
  {
    id: 'book-clinic-lab',
    prompt: 'Book the lab test collection they ordered',
  },
  { id: 'need-book-draw', prompt: 'I need to book my blood draw' },
  { id: 'book-lab-visit', prompt: 'Book my lab visit for the ordered tests' },
  { id: 'complete-lab-booking', prompt: 'Complete my lab collection booking' },
  {
    id: 'book-from-request',
    prompt: 'Book lab collection from clinic request',
  },
  { id: 'question-book-lab', prompt: 'How do I book my lab collection?' },
] as const;

export const LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS = [
  {
    id: 'pending-patient-bookings',
    prompt: 'Which patients still need to book lab collection?',
  },
  { id: 'waiting-self-book', prompt: 'Patients waiting to self-book lab draw' },
  {
    id: 'pending-lab-requests',
    prompt: 'Pending lab booking requests for my patients',
  },
  { id: 'who-needs-lab-book', prompt: 'Who needs to book a lab appointment?' },
  { id: 'awaiting-patient-lab', prompt: 'Lab orders awaiting patient booking' },
  { id: 'patients-lab-to-book', prompt: 'My patients with lab to book' },
  { id: 'unbooked-lab-collection', prompt: 'Unbooked lab collection requests' },
  {
    id: 'patient-lab-pending',
    prompt: 'Patient lab collection still not booked',
  },
  {
    id: 'lab-push-pending',
    prompt: 'Pushed lab requests without collection booked',
  },
  { id: 'check-pending-lab', prompt: 'Check pending lab booking requests' },
  { id: 'list-awaiting-book', prompt: 'List patients awaiting lab booking' },
] as const;

/** Only one of the three prompts names a patient, hence the optional field. */
export type NotifyPatientBookLabPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
};

export const NOTIFY_PATIENT_BOOK_LAB_PROMPTS: readonly NotifyPatientBookLabPromptFixture[] = [
  {
    id: 'remind-patient-book-collection',
    prompt: 'Remind patient to book collection',
  },
  {
    id: 'nudge-pending-lab-self-book',
    prompt: 'Nudge pending lab self-book',
  },
  {
    id: 'remind-maria-book-collection',
    prompt: 'Remind Maria to book her lab collection',
    customerName: 'Maria',
  },
];

export const AWAITING_PATIENT_BOOKING_LIST_PROMPTS = [
  {
    id: 'awaiting-patient-booking',
    prompt: 'Show orders awaiting patient booking',
  },
  {
    id: 'waiting-patient-lab-queue',
    prompt: 'Lab queue awaiting patient booking',
  },
  {
    id: 'pushed-not-booked',
    prompt: 'List lab orders pushed but not booked by patient',
  },
  {
    id: 'patient-has-not-booked',
    prompt: 'Which lab orders are waiting for patient to book collection?',
  },
  { id: 'awaiting-self-book', prompt: 'Orders awaiting patient self-booking' },
] as const;

export const DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'create-booking-to-push',
    prompt: 'Push lab collection booking to Maria',
    misclassifiedAction: 'create_booking',
    expectedAction: 'push_lab_booking_to_patient' as const,
  },
  {
    id: 'list-orders-to-push',
    prompt: 'Send Maria a link to book her blood draw',
    misclassifiedAction: 'list_test_orders',
    expectedAction: 'push_lab_booking_to_patient' as const,
  },
  {
    id: 'create-order-to-staff-book',
    prompt: 'Book lab collection for Maria tomorrow at 9am',
    misclassifiedAction: 'create_test_order',
    expectedAction: 'staff_book_lab_collection' as const,
  },
] as const;

export const CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'results-to-lab-requests',
    prompt: 'What lab appointments do I need to book?',
    misclassifiedAction: 'list_my_test_results',
    expectedAction: 'list_my_lab_booking_requests' as const,
  },
  {
    id: 'appointments-to-book-lab',
    prompt: 'Book my lab collection',
    misclassifiedAction: 'my_appointments',
    expectedAction: 'book_lab_collection' as const,
  },
  {
    id: 'book-appointment-to-lab',
    prompt: 'Schedule my lab blood draw',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'book_lab_collection' as const,
  },
] as const;

export const PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'collection-queue-to-pending-lab',
    prompt: 'Which patients still need to book lab collection?',
    misclassifiedAction: 'list_my_collection_queue',
    expectedAction: 'list_patient_pending_lab_requests' as const,
  },
] as const;
