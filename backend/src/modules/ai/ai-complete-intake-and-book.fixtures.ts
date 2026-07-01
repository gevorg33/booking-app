import type { CommandSurface } from './ai-command-registry.types.js';

export type CompleteIntakeAndBookPromptFixture = {
  id: string;
  prompt: string;
  surface: Extract<CommandSurface, 'customer' | 'public'>;
  orderedActions: [
    'complete_intake_and_book',
    'book_nearest_slot' | 'book_appointment',
  ];
  serviceName?: string;
  rescueReason: 'complete_intake_and_book_compound';
};

export const COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES = `- complete_intake_and_book (compound): customer/public clinic — signed-in mutate chain: pre-visit intake questionnaire then lab-test booking slot. Decomposes to complete_intake_and_book → book_nearest_slot (customer) or book_appointment (public). Triggers: fill|complete|finish + intake|questionnaire|health form + and|then + book|schedule + blood draw|lab test|CBC|lipid panel. Example: "Fill intake and book blood draw", "Complete health questionnaire then book my lab test". NOT intake_lab_book_pay (intake + lab slot + pay deposit/online), NOT explain_public_intake_form (read-only why/skip), NOT book_lab_collection (staff-pushed lab order), NOT book_lab_collection_nearest (earliest slot without intake fill), NOT book_nearest_slot|book_appointment alone (no intake mutate cue).`;

export const CUSTOMER_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES =
  COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES;

export const PUBLIC_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES =
  COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES;

export const COMPLETE_INTAKE_AND_BOOK_PROMPTS: readonly CompleteIntakeAndBookPromptFixture[] =
  [
    {
      id: 'fill-intake-book-draw-customer',
      prompt: 'Fill intake and book blood draw',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'complete-questionnaire-book-lab-customer',
      prompt: 'Complete the health questionnaire and book my lab test',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'lab test',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'intake-then-schedule-blood-customer',
      prompt: 'Fill out intake and schedule blood work',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood work',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'intake-then-cbc-customer',
      prompt: 'Complete pre-visit intake then book nearest slot for CBC',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'CBC',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'health-form-blood-draw-customer',
      prompt: 'Fill the health form and book my blood draw',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'questionnaire-reserve-lab-customer',
      prompt: 'Complete intake questionnaire and reserve lab appointment',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'lab appointment',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'answers-lipid-customer',
      prompt: 'Answer intake questions and book lipid panel',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'lipid panel',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'form-earliest-draw-customer',
      prompt: 'Fill intake form then book earliest blood draw slot',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'health-questions-lab-customer',
      prompt: 'Complete health questions and book lab test',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'lab test',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'questionnaire-collection-customer',
      prompt: 'Fill questionnaire and book blood collection',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood collection',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'finish-intake-draw-customer',
      prompt: 'Finish intake and book my draw',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'form-schedule-lab-customer',
      prompt: 'Complete the form and schedule my lab blood draw',
      surface: 'customer',
      orderedActions: ['complete_intake_and_book', 'book_nearest_slot'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'fill-intake-book-draw-public',
      prompt: 'Fill intake and book blood draw',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'complete-questionnaire-book-lab-public',
      prompt: 'Complete the health questionnaire and book my lab test',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'lab test',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'intake-then-schedule-blood-public',
      prompt: 'Fill out intake and schedule blood work',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'blood work',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'health-form-blood-draw-public',
      prompt: 'Fill the health form and book my blood draw',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'blood draw',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'questionnaire-reserve-lab-public',
      prompt: 'Complete intake questionnaire and reserve lab appointment',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'lab appointment',
      rescueReason: 'complete_intake_and_book_compound',
    },
    {
      id: 'answers-lipid-public',
      prompt: 'Answer intake questions and book lipid panel',
      surface: 'public',
      orderedActions: ['complete_intake_and_book', 'book_appointment'],
      serviceName: 'lipid panel',
      rescueReason: 'complete_intake_and_book_compound',
    },
  ];

export const COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS = [
  {
    id: 'nearest-slot-to-intake-compound',
    prompt: 'Fill intake and book blood draw',
    surface: 'customer' as const,
    misclassifiedAction: 'book_nearest_slot',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'appointment-to-intake-compound',
    prompt: 'Complete the health questionnaire and book my lab test',
    surface: 'public' as const,
    misclassifiedAction: 'book_appointment',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'explain-to-intake-compound',
    prompt: 'Fill out intake and schedule blood work',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_public_intake_form',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'lab-collection-to-intake-compound',
    prompt: 'Fill questionnaire and book blood collection',
    surface: 'customer' as const,
    misclassifiedAction: 'book_lab_collection',
    expectedAction: 'compound_intent' as const,
  },
] as const;

export const COMPLETE_INTAKE_AND_BOOK_BOUNDARY_PROMPTS = [
  {
    id: 'why-health-questions',
    prompt: 'Why these health questions?',
    surface: 'public' as const,
  },
  {
    id: 'book-lab-nearest',
    prompt: 'Book lab draw earliest slot',
    surface: 'customer' as const,
  },
  {
    id: 'book-lab-collection-only',
    prompt: 'Book my lab collection',
    surface: 'customer' as const,
  },
] as const;
