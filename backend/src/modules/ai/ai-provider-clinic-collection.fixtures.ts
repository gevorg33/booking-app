/** Provider mobile classifier rules for specimen collection queue (ai-cmd-clinic-v2-4). */
export const PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES = `- list_my_collection_queue: READ — clinic only: provider-scoped specimen collection worklist (NotCollected / RecollectRequired) for own assigned visits today or date range. Triggers: my collection queue|specimen collection|draw list|collection worklist|who to draw. NOT list_bookings (appointments), NOT list_test_orders (dashboard lab orders), NOT lab-results queue.
- mark_specimen_collected: MUTATE — clinic only: mark a specimen Collected on own assigned visit. Requires specimenId or customerName (+ optional orderId). Triggers: mark/collect/specimen collected + patient or specimen id. NOT mark_paid (payment), NOT complete clinic task wording without specimen, NOT dashboard enter_test_result.
- explain_specimen_recollect: READ — clinic only: why a specimen was flagged RecollectRequired and the next step (redraw, then mark collected or rejected). Requires specimenId or customerName. Triggers: why recollect required, failed draw — what next, why redraw. NOT mark_specimen_collected (mutate).
- Examples:
  - "Show my collection queue today" → list_my_collection_queue
  - "Mark specimen collected for Maria" → mark_specimen_collected, customerName=Maria
  - "Why recollect required for Maria?" → explain_specimen_recollect, customerName=Maria`;

export const LIST_MY_COLLECTION_QUEUE_PROMPTS = [
  {
    id: 'my-collection-queue',
    prompt: 'Show my collection queue today',
  },
  {
    id: 'specimen-queue-today',
    prompt: "What's on my specimen collection queue today?",
  },
  {
    id: 'list-collection-worklist',
    prompt: 'List my collection queue for today',
  },
  {
    id: 'lab-collection-queue',
    prompt: 'My lab collection queue',
  },
  {
    id: 'draw-list-today',
    prompt: 'Who do I need to draw blood from today?',
  },
  {
    id: 'collection-worklist',
    prompt: "Show today's collection worklist",
  },
  {
    id: 'waiting-specimens',
    prompt: 'Any specimens waiting for collection on my schedule?',
  },
  {
    id: 'patients-to-collect',
    prompt: 'Collection queue for my patients today',
  },
  {
    id: 'my-draw-queue',
    prompt: 'What specimens are on my draw queue?',
  },
  {
    id: 'collection-queue-question',
    prompt: 'Do I have any collection specimens today?',
  },
] as const;

/** Declared so the array is one type, not a union of literal shapes. */
export type MarkSpecimenCollectedPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
  specimenId?: string;
  orderId?: string;
};

export const MARK_SPECIMEN_COLLECTED_PROMPTS: readonly MarkSpecimenCollectedPromptFixture[] = [
  {
    id: 'mark-maria-collected',
    prompt: 'Mark specimen collected for Maria',
    customerName: 'Maria',
  },
  {
    id: 'maria-specimen-collected',
    prompt: "Mark Maria's specimen as collected",
    customerName: 'Maria',
  },
  {
    id: 'john-collected',
    prompt: 'Specimen collected for patient John',
    customerName: 'John',
  },
  {
    id: 'cbc-maria',
    prompt: 'Mark collected the CBC specimen for Maria',
    customerName: 'Maria',
  },
  {
    id: 'specimen-id-collected',
    prompt: 'Mark specimen #abc123 collected',
    specimenId: 'abc123',
  },
  {
    id: 'sample-collected-maria',
    prompt: 'I collected the sample for Maria Lopez',
    customerName: 'Maria Lopez',
  },
  {
    id: 'order-specimen-collected',
    prompt: 'Mark specimen collected order abc123',
    orderId: 'abc123',
  },
  {
    id: 'visit-specimen-collected',
    prompt: "Collected specimen for Maria's visit",
    customerName: 'Maria',
  },
  {
    id: 'mark-collected-prompt',
    prompt: 'Mark collected specimen for Sofia',
    customerName: 'Sofia',
  },
  {
    id: 'done-drawing-maria',
    prompt: 'Done drawing Maria — mark her specimen collected',
    customerName: 'Maria',
  },
] as const;

/** Declared so the array is one type, not a union of literal shapes. */
export type ExplainSpecimenRecollectPromptFixture = {
  id: string;
  prompt: string;
  customerName?: string;
  specimenId?: string;
};

export const EXPLAIN_SPECIMEN_RECOLLECT_PROMPTS: readonly ExplainSpecimenRecollectPromptFixture[] = [
  {
    id: 'why-recollect-required',
    prompt: 'Why recollect required?',
  },
  {
    id: 'failed-draw-what-next',
    prompt: 'Failed draw — what next?',
  },
  {
    id: 'why-recollect-maria',
    prompt: 'Why recollect required for Maria?',
    customerName: 'Maria',
  },
  {
    id: 'why-redraw-specimen',
    prompt: 'Why redraw specimen #abc123?',
    specimenId: 'abc123',
  },
  {
    id: 'why-recollect-hy',
    prompt: 'Ինչու է պահանջվում կրկնակի վերցում',
  },
  {
    id: 'why-recollect-ru',
    prompt: 'Почему требуется повторный забор?',
  },
] as const;

export const PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS = [
  {
    id: 'list-bookings-to-collection',
    prompt: 'Show my collection queue today',
    misclassifiedAction: 'list_bookings',
    expectedAction: 'list_my_collection_queue' as const,
  },
  {
    id: 'show-appointments-to-collection',
    prompt: "What's on my specimen collection queue today?",
    misclassifiedAction: 'show_appointments',
    expectedAction: 'list_my_collection_queue' as const,
  },
  {
    id: 'mark-paid-to-specimen',
    prompt: 'Mark specimen collected for Maria',
    misclassifiedAction: 'mark_paid',
    expectedAction: 'mark_specimen_collected' as const,
  },
  {
    id: 'update-bookings-to-specimen',
    prompt: "Mark Maria's specimen as collected",
    misclassifiedAction: 'update_bookings',
    expectedAction: 'mark_specimen_collected' as const,
  },
] as const;
