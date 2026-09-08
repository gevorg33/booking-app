/**
 * AI-ROADMAP Phase 1 - seventh domain slice: `clinic` (registry
 * `clinic-test-results`).
 *
 * 41 registry entries across **seven handlers**: lab booking, provider tasks,
 * results, orders, catalogue, consumer results and specimen collection. 20
 * reads, 21 mutations.
 *
 * The compensation reasoning here is medical rather than commercial, and splits
 * three ways:
 *
 * - **append-only records.** `enter_test_result` and `upload_patient_result`
 *   write to the medical record. A correction is a new entry; erasure is not
 *   available and would not be lawful.
 * - **chain of custody.** `mark_specimen_collected` and `transition_specimen`
 *   are audit trail. Reversing a step would falsify the trail, which is the
 *   opposite of what it is for.
 * - **released to the patient.** `release_test_result` has reached the person
 *   it concerns.
 *
 * `book_lab_collection` is registered READ despite the verb; the handler returns
 * a `bookUrl` and the pending requests, and the writes are
 * `staff_book_lab_collection` and `book_lab_from_order`. Checked, not assumed.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const CLINIC_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'clinic.book_lab_collection',
    aliases: ['book_lab_collection'],
    domain: 'clinic',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Show the patient their pending lab requests and how to book collection. Returns a booking URL; creates nothing.',
    // §213 (C2/T0) — the order, the test, and the patient from session.
    variables: {
      orderId: {
        type: 'string',
        description: 'Lab order being collected for.',
        required: false,
        resolver: 'none',
      },
      testName: {
        type: 'string',
        description: 'Test being collected.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Collection service booked.',
        required: false,
        resolver: 'service',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description: 'Take the first available slot.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      customerId: {
        type: 'string',
        description: 'Patient, by id.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'I need to book my blood test',
      'how do I book my lab collection',
    ],
    confirm: 'never',
    // Registered READ and correct: the handler returns `bookUrl` plus the
    // pending requests. `staff_book_lab_collection` and `book_lab_from_order`
    // are the writes.
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.explain_abnormal_result_flag',
    aliases: ['explain_abnormal_result_flag'],
    domain: 'clinic',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain why a result was flagged abnormal.',
    // §209 (C2/T0) — the flag being explained, plus the test it sits on.
    variables: {
      flag: {
        type: 'string',
        description: 'Abnormal flag being explained.',
        required: false,
        resolver: 'none',
      },
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      testName: {
        type: 'string',
        description: 'Test being asked about.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is my result flagged', 'what does abnormal mean here'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.explain_task',
    aliases: ['explain_clinic_task'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what a clinic task requires.',
    // §213 (C2/T0) — the task, or the client it belongs to.
    variables: {
      taskId: {
        type: 'string',
        description: 'Task being explained.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Client, used when no task id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['what is this task', 'explain this clinic task'],
    confirm: 'never',
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.explain_lab_result_history',
    aliases: ['explain_lab_result_history'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how a patient results have changed over time.',
    // §213 (C2/T0) — the result whose history is explained.
    variables: {
      resultId: {
        type: 'string',
        description: 'Result whose history is explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how has this patient trended', 'show the result history'],
    confirm: 'never',
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.explain_patient_results',
    aliases: ['explain_patient_results'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain a patient test results.',
    // §213 (C2/T0) — the patient and order.
    variables: {
      customerName: {
        type: 'string',
        description: 'Patient whose results are explained.',
        required: false,
        resolver: 'customer',
      },
      orderId: {
        type: 'string',
        description: 'Order the results belong to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['explain these results', 'what do the labs show'],
    confirm: 'never',
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.explain_result_status',
    aliases: ['explain_result_status'],
    domain: 'clinic',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Report where a test result has got to.',
    // §209 (C2/T0) — the result, its status, and the compound hand-off flag.
    variables: {
      resultId: {
        type: 'string',
        description: 'Result being asked about.',
        required: false,
        resolver: 'none',
      },
      status: {
        type: 'string',
        description: 'Status being explained.',
        required: false,
        resolver: 'none',
      },
      testName: {
        type: 'string',
        description: 'Test being asked about.',
        required: false,
        resolver: 'none',
      },
      resultsThenRebook: {
        type: 'boolean',
        description:
          'Set when this arrives as the first step of a results-then-rebook compound.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['are my results ready', 'what is the status of my test'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.explain_specimen_recollect',
    aliases: ['explain_specimen_recollect'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain why a specimen must be collected again.',
    // §214 (C2/T0) — the specimen, plus the provider window.
    variables: {
      specimenId: {
        type: 'string',
        description: 'Specimen being recollected.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient the specimen belongs to.',
        required: false,
        resolver: 'customer',
      },
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why do we need another sample', 'explain the recollect'],
    confirm: 'never',
    handler: 'AiProviderClinicCollectionService',
  },
  {
    id: 'clinic.list_abnormal_results',
    aliases: ['list_abnormal_results'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List results outside their reference range.',
    // §213 (C2/T0) — optionally scoped to one patient.
    variables: {
      customerName: {
        type: 'string',
        description: 'Patient to scope to.',
        required: false,
        resolver: 'customer',
      },
      limit: {
        type: 'number',
        description: 'How many results to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what results are abnormal', 'show flagged results'],
    confirm: 'never',
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.list_booking_lab_summaries',
    aliases: ['list_booking_lab_summaries'],
    domain: 'clinic',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Summarise the lab work attached to bookings.',
    // §213 (C2/T0) — scoped to one booking.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose lab summaries are listed.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: [
      'what labs are on today bookings',
      'lab summary for my appointments',
    ],
    confirm: 'never',
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.list_tasks',
    aliases: ['list_clinic_tasks'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List outstanding clinic tasks.',
    variables: {},
    examples: ['what tasks do I have', 'show my clinic tasks'],
    confirm: 'never',
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.list_lab_results_queue',
    aliases: ['list_lab_results_queue'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List results waiting to be reviewed.',
    variables: {},
    examples: ['what results need reviewing', 'show the results queue'],
    confirm: 'never',
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.list_my_collection_queue',
    aliases: ['list_my_collection_queue'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List specimens this provider needs to collect.',
    // §214 (C2/T0) — the signed-in provider's queue over a window.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what collections do I have', 'my specimen queue'],
    confirm: 'never',
    handler: 'AiProviderClinicCollectionService',
  },
  {
    id: 'clinic.list_my_documents',
    aliases: ['list_my_documents'],
    domain: 'clinic',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'List the clinical documents shared with the patient.',
    // §209 (C2/T0) — filtered listing.
    variables: {
      category: {
        type: 'string',
        description: 'Only documents in this category.',
        required: false,
        resolver: 'none',
      },
      title: {
        type: 'string',
        description: 'Document searched for by title.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what documents do I have', 'show my clinic documents'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.list_my_lab_booking_requests',
    aliases: ['list_my_lab_booking_requests'],
    domain: 'clinic',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the lab bookings the patient has been asked to make.',
    // §213 (C2/T0) — the patient's own requests.
    variables: {
      orderId: {
        type: 'string',
        description: 'Only requests for this order.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient, by id.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what tests do I need to book', 'my pending lab requests'],
    confirm: 'never',
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.list_my_test_results',
    aliases: ['list_my_test_results'],
    domain: 'clinic',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the patient own test results.',
    // §209 (C2/T0) — optionally narrowed to one test.
    variables: {
      testName: {
        type: 'string',
        description: 'Test being asked about.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show my test results', 'what were my results'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.list_patient_pending_lab_requests',
    aliases: ['list_patient_pending_lab_requests'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List lab requests a patient has not yet booked.',
    // §213 (C2/T0) — scoped to the signed-in provider.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what has this patient not booked',
      'pending lab requests for them',
    ],
    confirm: 'never',
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.list_test_orders',
    aliases: ['list_test_orders'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List test orders that have been raised.',
    // §214 (C2/T0) — the full order filter set.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      bookingId: {
        type: 'string',
        description: 'Booking the orders belong to.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description: 'Patient filter.',
        required: false,
        resolver: 'customer',
      },
      testName: {
        type: 'string',
        description: 'Test filter.',
        required: false,
        resolver: 'none',
      },
      testNames: {
        type: 'string[]',
        description: 'Several tests to filter by.',
        required: false,
        resolver: 'none',
      },
      status: {
        type: 'string',
        description: 'Order status filter.',
        required: false,
        resolver: 'none',
      },
      awaitingPatientBooking: {
        type: 'boolean',
        description: 'Only orders waiting on the patient to book.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what tests have been ordered', 'list test orders'],
    confirm: 'never',
    handler: 'AiClinicTestOrderService',
  },
  {
    id: 'clinic.notify_patient_book_lab',
    aliases: ['notify_patient_book_lab'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Prepare a prompt asking a patient to book their lab collection.',
    // §213 (C2/T0) — who to notify, and about which order.
    variables: {
      orderId: {
        type: 'string',
        description: 'Lab order the patient is asked to book.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient to notify.',
        required: false,
        resolver: 'customer',
      },
      collectionServiceName: {
        type: 'string',
        description: 'Collection service suggested.',
        required: false,
        resolver: 'service',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'remind this patient to book their test',
      'nudge them about the blood test',
    ],
    confirm: 'never',
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.notify_when_results_ready',
    aliases: ['notify_when_results_ready'],
    domain: 'clinic',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how the patient will be told when results arrive.',
    // §209 (C2/T0) — which test, and how to be told.
    variables: {
      testName: {
        type: 'string',
        description: 'Test being asked about.',
        required: false,
        resolver: 'none',
      },
      channel: {
        type: 'string',
        description: 'How to notify: push, email or sms.',
        required: false,
        resolver: 'none',
      },
      aspect: {
        type: 'string',
        description: 'Which part of the notification setup is wanted.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'tell me when my results are in',
      'how will I know results are ready',
    ],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.open_document',
    aliases: ['open_clinic_document'],
    domain: 'clinic',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Open a clinical document shared with the patient.',
    // §209 (C2/T0) — names the document to open.
    variables: {
      documentId: {
        type: 'string',
        description: 'Document to open.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['open my lab report', 'show me that document'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.track_lab_order_status',
    aliases: ['track_lab_order_status'],
    domain: 'clinic',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Track where a lab order has got to.',
    // §209 (C2/T0) — optionally narrowed to one test.
    variables: {
      testName: {
        type: 'string',
        description: 'Test being asked about.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Patient the results belong to.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Patient from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['where is my lab order', 'track my test'],
    confirm: 'never',
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.book_lab_from_order',
    aliases: ['book_lab_from_order'],
    domain: 'clinic',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Book a lab collection against an existing test order.',
    // §177 (C2/T1) — the handler body reads only `_prompt`; the structured fields
    // are read one level down by its `parse*FromPrompt` helper, which takes
    // `(prompt, params)` and prefers the param. This is the shape that caused five
    // wrong exemptions before the entry criterion was corrected. The patient comes from the
    // session (`missing: ['customerId']` is a sign-in prompt).
    variables: {
      orderId: {
        type: 'string',
        description: 'Test order the booking is made against.',
        required: false,
        resolver: 'none',
      },
      testName: {
        type: 'string',
        description: 'Test being booked, when no order id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book the collection for my order', 'schedule my blood draw'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The patient has been given an appointment and told about it; cancelling is a separate action.',
    },
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.staff_book_lab_collection',
    aliases: ['staff_book_lab_collection'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Book a lab collection on a patient behalf.',
    // §177 (C2/T1) — the handler body reads only `_prompt`; the structured fields
    // are read one level down by its `parse*FromPrompt` helper, which takes
    // `(prompt, params)` and prefers the param. This is the shape that caused five
    // wrong exemptions before the entry criterion was corrected.
    variables: {
      orderId: {
        type: 'string',
        description: 'Test order being collected against.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient the collection is for.',
        required: false,
        resolver: 'customer',
      },
      collectionServiceName: {
        type: 'string',
        description: 'Collection service being booked.',
        required: false,
        resolver: 'service',
      },
      employeeName: {
        type: 'string',
        description: 'Staff member performing the collection.',
        required: false,
        resolver: 'employee',
      },
      employeeId: {
        type: 'string',
        description: 'Staff member id, when known.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'book the collection for this patient',
      'schedule their blood draw',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The patient has been given an appointment and told about it; cancelling is a separate action.',
    },
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.push_lab_booking_to_patient',
    aliases: ['push_lab_booking_to_patient'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Send a patient a request to book their lab collection.',
    // §177 (C2/T1) — the handler body reads only `_prompt`; the structured fields
    // are read one level down by its `parse*FromPrompt` helper, which takes
    // `(prompt, params)` and prefers the param. This is the shape that caused five
    // wrong exemptions before the entry criterion was corrected. Unlike
    // `staff_book_lab_collection` it names no staff member \u2014 the booking is
    // handed to the patient rather than performed.
    variables: {
      orderId: {
        type: 'string',
        description: 'Test order being pushed to the patient.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient receiving the booking link.',
        required: false,
        resolver: 'customer',
      },
      collectionServiceName: {
        type: 'string',
        description: 'Collection service offered.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'ask this patient to book their test',
      'send the lab booking request',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The request has been sent to the patient and cannot be unsent.',
    },
    handler: 'AiClinicLabBookingService',
  },
  {
    id: 'clinic.claim_task',
    aliases: ['claim_clinic_task'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Take ownership of a clinic task.',
    // §177 (C2/T1) — reads nothing of its own; `resolveClinicTask` supplies both
    // fields and the chain ends there.
    variables: {
      taskId: {
        type: 'string',
        description: 'Clinic task to act on.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient the task belongs to, when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['I will take that task', 'claim this task'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'clinic.claim_task',
      captures: ['taskId', 'previousOwnerId'],
    },
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.complete_task',
    aliases: ['complete_clinic_task'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark a clinic task as done.',
    // §177 (C2/T1) — same identification as `claim_clinic_task`, plus the two
    // fields it records on completion.
    variables: {
      taskId: {
        type: 'string',
        description: 'Clinic task to act on.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient the task belongs to, when no id is given.',
        required: false,
        resolver: 'customer',
      },
      notes: {
        type: 'string',
        description: 'Notes recorded against the completed task.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Reason recorded against the completion.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['mark that task done', 'I have finished this task'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.complete_task',
      captures: ['taskId', 'previousStatus'],
    },
    handler: 'AiProviderClinicTasksAndResultsService',
  },
  {
    id: 'clinic.enter_test_result',
    aliases: ['enter_test_result'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Record a test result against a patient.',
    variables: {
      // `parseEnterTestResultFromPrompt`. Every field falls back to
      // `extractMeasurementReadingFromPrompt`, so a spoken reading works —
      // but a value written against the wrong order is a wrong result in a
      // patient's chart, which is why all three identifiers are declared.
      orderId: {
        type: 'string',
        description: 'Test order the result belongs to.',
        required: false,
        resolver: 'none',
      },
      resultId: {
        type: 'string',
        description:
          'Existing result row to write into, when amending rather than entering.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description:
          'Patient the result belongs to. Narrows the order search when no id is given.',
        required: false,
        resolver: 'customer',
      },
      measurementCode: {
        type: 'string',
        description: 'Which measurement on the panel is being recorded.',
        required: false,
        resolver: 'none',
      },
      value: {
        type: 'string',
        description:
          'The reading. Also accepted as `measurementValue`; a supplied `value` wins, and both fall back to a reading found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['enter the haemoglobin result', 'record these lab values'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A clinical record is append-only; once written it is part of the medical record.',
    },
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.upload_patient_result',
    aliases: ['upload_patient_result'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Upload a result document to a patient record.',
    variables: {
      // `handleUploadPatientResultLogic` -> `resolveClinicTestOrderForUpload`.
      // The only input: the command does not carry a file, it returns an
      // upload handoff for the resolved order. Without an id it fails rather
      // than guessing which order to attach a document to.
      //
      // The resolver falls back to a prefix match over the 100 most recent
      // orders — bounded *and* ordered, unlike the clinical patient lookup in
      // e2e-bug.443, so it is deterministic rather than arbitrary.
      orderId: {
        type: 'string',
        description:
          'Test order the document belongs to. A partial id is matched against recent orders.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['upload this lab report', 'attach the result PDF'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A clinical record is append-only; once written it is part of the medical record.',
    },
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.release_test_result',
    aliases: ['release_test_result'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Release a test result to the patient.',
    variables: {
      // `parseReleaseTestResultFromPrompt` + `resolveReleaseCandidates`. The
      // disclosure step for lab results — the second one in this backlog after
      // `release_patient_document`. Five ways to narrow what gets released,
      // and `resolveReleaseCandidates` uses whichever are present.
      resultId: {
        type: 'string',
        description: 'Exact result to release.',
        required: false,
        resolver: 'none',
      },
      orderId: {
        type: 'string',
        description: 'Release the results on one test order.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient whose results are being released.',
        required: false,
        resolver: 'customer',
      },
      bookingId: {
        type: 'string',
        description: 'Narrow to the results from one visit.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Narrow to results from a particular day.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'release these results to the patient',
      'share the labs with them',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The result has reached the patient and cannot be recalled.',
    },
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.transition_specimen',
    aliases: ['transition_specimen'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Move a specimen to the next stage of processing.',
    variables: {
      // `resolveSpecimenForTransition` picks the specimen, then `toStatus`
      // decides where it goes. The description says "next stage", but the
      // handler moves it to whatever `toStatus` names — declaring the field is
      // what makes that visible.
      specimenId: {
        type: 'string',
        description: 'Exact specimen to move.',
        required: false,
        resolver: 'none',
      },
      orderId: {
        type: 'string',
        description: 'Find the specimen by its test order.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Find the specimen by patient.',
        required: false,
        resolver: 'customer',
      },
      toStatus: {
        type: 'string',
        description:
          'Stage to move the specimen to. Not restricted to the next one — this is the target, not a step.',
        required: false,
        resolver: 'none',
      },
      note: {
        type: 'string',
        description: 'Note recorded against the transition.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'mark the specimen as received',
      'move this sample to processing',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Specimen chain of custody is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.mark_specimen_collected',
    aliases: ['mark_specimen_collected'],
    domain: 'clinic',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Record that a specimen has been collected from the patient.',
    variables: {
      // `parseMarkSpecimenCollectedFromPrompt` -> `resolveSpecimenByIdOrCustomerName`.
      // The collecting employee comes from the session, not from params.
      specimenId: {
        type: 'string',
        description: 'Exact specimen collected.',
        required: false,
        resolver: 'none',
      },
      orderId: {
        type: 'string',
        description: 'Find the specimen by its test order.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Find the specimen by patient.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['I have taken the sample', 'mark specimen collected'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Specimen chain of custody is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiProviderClinicCollectionService',
  },
  {
    id: 'clinic.configure_test_reference_range',
    aliases: ['configure_test_reference_range'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Set the normal range for a test, which decides what is flagged abnormal.',
    // §177 (C2/T1) — `resolveStaffContext` is a permission check and reads no
    // params, so these three are the whole contract.
    variables: {
      measurementCode: {
        type: 'string',
        description: 'Measurement whose reference range is being set.',
        required: false,
        resolver: 'none',
      },
      normalLow: {
        type: 'number',
        description: 'Lower bound of the normal range.',
        required: false,
        resolver: 'none',
      },
      normalHigh: {
        type: 'number',
        description: 'Upper bound of the normal range.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'set the normal range for haemoglobin',
      'change the reference range',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinic.configure_test_reference_range',
      captures: ['testTypeId', 'previousRange'],
    },
    handler: 'AiClinicTestResultService',
  },
  {
    id: 'clinic.create_test_order',
    aliases: ['create_test_order'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Order tests for a patient.',
    variables: {
      // `parseCreateTestOrderFromPrompt`. `testNames` is the plural form and
      // the reason this command is not one test per call — ordering a panel
      // in one go is the normal case, so both spellings are declared here
      // rather than picking one.
      testName: {
        type: 'string',
        description: 'Single test to order.',
        required: false,
        resolver: 'none',
      },
      testNames: {
        type: 'string[]',
        description: 'Several tests ordered together as one panel.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Patient the tests are for.',
        required: false,
        resolver: 'customer',
      },
      bookingId: {
        type: 'string',
        description: 'Visit the order is attached to.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Date to record against the order.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'order a full blood count for this patient',
      'request these labs',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'A test order may already have been sent to the lab and acted on; cancelling it is a clinical decision.',
    },
    handler: 'AiClinicTestOrderService',
  },
  {
    id: 'clinic.dismiss_patient_alert',
    aliases: ['dismiss_patient_alert'],
    domain: 'clinic',
    surfaces: ['dashboard', 'customer'],
    tiers: { dashboard: ['staff', 'manager', 'owner'], customer: ['client'] },
    risk: 'T1',
    description: 'Dismiss an alert raised on a patient record.',
    // §177 (C2/T1) — both fields named in one refusal; the patient comes from the
    // session.
    variables: {
      alertType: {
        type: 'string',
        description: 'Kind of alert being dismissed.',
        required: true,
        resolver: 'none',
      },
      sourceId: {
        type: 'string',
        description: 'Record the alert was raised against.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['dismiss that alert', 'clear this patient flag'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.dismiss_patient_alert',
      captures: ['alertId', 'previousStatus'],
    },
    handler: 'AiConsumerClinicTestResultsService',
  },
  {
    id: 'clinic.create_test_type',
    aliases: ['create_test_type'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Add a test to the clinic catalogue.',
    // §177 (C2/T1) — `handleCreateTestTypeLogic` refuses with `missing: ['title']`
    // and reads the rest optionally. `resolveRoleOrFail` takes `userId`, not a
    // param, so the permission check contributes no variables.
    variables: {
      title: {
        type: 'string',
        description: 'Name of the test type.',
        required: true,
        resolver: 'none',
      },
      code: {
        type: 'string',
        description: 'Short code for the test type.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'Price charged for the test.',
        required: false,
        resolver: 'money',
      },
      unit: {
        type: 'string',
        description: 'Unit the result is measured in.',
        required: false,
        resolver: 'none',
      },
      normalLow: {
        type: 'number',
        description: 'Lower bound of the normal reference range.',
        required: false,
        resolver: 'none',
      },
      normalHigh: {
        type: 'number',
        description: 'Upper bound of the normal reference range.',
        required: false,
        resolver: 'none',
      },
      requiresFasting: {
        type: 'boolean',
        description: 'Whether the patient must fast before the test.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a vitamin D test', 'create a new test type'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.delete_test_type',
      captures: ['testTypeId'],
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.update_test_type',
    aliases: ['update_test_type'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change a test in the clinic catalogue.',
    // §177 (C2/T1) — identified via `resolveTestTypeOrFail` →
    // `resolveClinicTestTypeFromList`, then applies whichever fields are present.
    variables: {
      testTypeId: {
        type: 'string',
        description: 'Test type id — tried first by `resolveByIdCodeOrTitle`.',
        required: false,
        resolver: 'none',
      },
      testTypeCode: {
        type: 'string',
        description: 'Test type code, tried second.',
        required: false,
        resolver: 'none',
      },
      testTypeName: {
        type: 'string',
        description:
          'Test type title, tried third. The handler\u2019s `missing` hint names only the id and code, though its message offers this route too.',
        required: false,
        resolver: 'none',
      },
      title: {
        type: 'string',
        description: 'New name for the test type.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'New price.',
        required: false,
        resolver: 'money',
      },
      normalLow: {
        type: 'number',
        description: 'Lower bound of the normal reference range.',
        required: false,
        resolver: 'none',
      },
      normalHigh: {
        type: 'number',
        description: 'Upper bound of the normal reference range.',
        required: false,
        resolver: 'none',
      },
      requiresFasting: {
        type: 'boolean',
        description: 'Whether the patient must fast before the test.',
        required: false,
        resolver: 'none',
      },
      isActive: {
        type: 'boolean',
        description: 'Activate or deactivate the test type.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['rename that test', 'change the test details'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.update_test_type',
      captures: ['testTypeId', 'previousValues'],
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.delete_test_type',
    aliases: ['delete_test_type'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Remove a test from the clinic catalogue.',
    // §177 (C2/T1) — reads nothing of its own; identification is the whole input.
    variables: {
      testTypeId: {
        type: 'string',
        description: 'Test type id — tried first by `resolveByIdCodeOrTitle`.',
        required: false,
        resolver: 'none',
      },
      testTypeCode: {
        type: 'string',
        description: 'Test type code, tried second.',
        required: false,
        resolver: 'none',
      },
      testTypeName: {
        type: 'string',
        description:
          'Test type title, tried third. The handler\u2019s `missing` hint names only the id and code, though its message offers this route too.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['delete the old vitamin test', 'remove that test type'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Existing orders and results reference the test type; recreating it does not restore those links.',
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.create_test_panel',
    aliases: ['create_test_panel'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Create a panel grouping several tests ordered together.',
    // §177 (C2/T1) — `handleCreateTestPanelLogic` refuses with `missing: ['title']`.
    variables: {
      title: {
        type: 'string',
        description: 'Name of the test panel.',
        required: true,
        resolver: 'none',
      },
      code: {
        type: 'string',
        description: 'Short code for the panel.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'Price charged for the panel.',
        required: false,
        resolver: 'money',
      },
    },
    examples: [
      'create a routine bloods panel',
      'group these tests into a panel',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'A panel may already have been used on orders; removing one needs an order check.',
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.update_test_panel',
    aliases: ['update_test_panel'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change a test panel - its name or description.',
    // §177 (C2/T1) — identified via `resolvePanelOrFail` →
    // `resolveClinicTestPanelFromList`.
    variables: {
      panelId: {
        type: 'string',
        description: 'Panel id — tried first by `resolveByIdCodeOrTitle`.',
        required: false,
        resolver: 'none',
      },
      panelCode: {
        type: 'string',
        description: 'Panel code, tried second.',
        required: false,
        resolver: 'none',
      },
      panelName: {
        type: 'string',
        description:
          'Panel title, tried third. The handler\u2019s `missing` hint names only the id and code, though its message offers this route too.',
        required: false,
        resolver: 'none',
      },
      title: {
        type: 'string',
        description: 'New name for the panel.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'New price.',
        required: false,
        resolver: 'money',
      },
      isActive: {
        type: 'boolean',
        description: 'Activate or deactivate the panel.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['rename the bloods panel', 'update that panel'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.update_test_panel',
      captures: ['panelId', 'previousValues'],
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.set_test_panel_items',
    aliases: ['set_test_panel_items'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Set which tests a panel contains.',
    // §177 (C2/T1) — identifies the panel, then requires the membership list:
    // it refuses with `missing: ['testTypeIds', 'testTypeNames']`, so one of the
    // two is needed.
    variables: {
      panelId: {
        type: 'string',
        description: 'Panel id — tried first by `resolveByIdCodeOrTitle`.',
        required: false,
        resolver: 'none',
      },
      panelCode: {
        type: 'string',
        description: 'Panel code, tried second.',
        required: false,
        resolver: 'none',
      },
      panelName: {
        type: 'string',
        description:
          'Panel title, tried third. The handler\u2019s `missing` hint names only the id and code, though its message offers this route too.',
        required: false,
        resolver: 'none',
      },
      testTypeIds: {
        type: 'string[]',
        description: 'Test type ids that make up the panel.',
        required: false,
        resolver: 'none',
      },
      testTypeNames: {
        type: 'string[]',
        description:
          'Test type names, when ids are not known. One of the two lists is required.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'add vitamin D to the bloods panel',
      'change what is in that panel',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.set_test_panel_items',
      captures: ['panelId', 'previousItems'],
    },
    handler: 'AiClinicTestCatalogService',
  },
  {
    id: 'clinic.import_catalog_csv',
    aliases: ['import_clinic_catalog_csv'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Import a whole test catalogue from a CSV file.',
    variables: {
      // `handleImportClinicCatalogCsvLogic` reads exactly one param.
      csv: {
        type: 'string',
        description: 'The catalog as CSV text, to be parsed into clinic tests.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['import our test catalogue', 'upload the lab catalogue csv'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Creates or updates many test types at once; unwinding needs per-row pre-state.',
    },
    handler: 'AiClinicTestCatalogService',
  },
] as const;
