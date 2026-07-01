import type { CommandSurface } from './ai-command-registry.types.js';

export type BookLabCollectionNearestPromptFixture = {
  id: string;
  prompt: string;
  surface: Extract<CommandSurface, 'customer' | 'public'>;
  orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'];
  testName?: string;
  rescueReason: 'book_lab_collection_nearest_compound';
};

export const BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES = `- book_lab_collection_nearest (compound): customer/public clinic — multi-step lab collection booking with earliest/nearest slot. Decomposes to list_my_lab_booking_requests → book_lab_collection with bookingFirstAvailable=true, timeSlot=null. Triggers: book|schedule + lab collection|blood draw|lab draw + earliest|nearest|soonest|first available|ASAP. Example: "Book lab draw earliest slot", "Schedule my blood draw soonest opening". NOT book_lab_collection alone (no flexible-slot cue), NOT book_nearest_slot|book_appointment (generic service booking), NOT list_my_lab_booking_requests alone (list only).`;

export const CUSTOMER_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES =
  BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES;

export const PUBLIC_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES =
  BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES;

export const BOOK_LAB_COLLECTION_NEAREST_PROMPTS: readonly BookLabCollectionNearestPromptFixture[] =
  [
    {
      id: 'lab-draw-earliest-customer',
      prompt: 'Book lab draw earliest slot',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'blood-draw-soonest-customer',
      prompt: 'Schedule my blood draw for the soonest opening',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'lab-collection-nearest-customer',
      prompt: 'Book my lab collection nearest available',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'lab-draw-first-available-customer',
      prompt: 'Book my lab blood draw first available appointment',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'collection-asap-customer',
      prompt: 'Schedule my lab collection ASAP',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'cbc-earliest-customer',
      prompt: 'Book my CBC blood draw earliest slot',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      testName: 'CBC',
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'clinic-lab-soonest-customer',
      prompt: 'Book the lab collection my clinic sent soonest slot',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'next-available-draw-customer',
      prompt: 'Reserve my lab draw next available time',
      surface: 'customer',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'lab-draw-earliest-public',
      prompt: 'Book lab draw earliest slot',
      surface: 'public',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'blood-draw-soonest-public',
      prompt: 'Schedule my lab blood draw soonest opening',
      surface: 'public',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'lab-collection-nearest-public',
      prompt: 'Book my lab collection nearest available',
      surface: 'public',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'collection-asap-public',
      prompt: 'Book lab collection ASAP from my clinic request',
      surface: 'public',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      rescueReason: 'book_lab_collection_nearest_compound',
    },
    {
      id: 'lipid-earliest-public',
      prompt: 'Book lipid panel blood draw earliest available',
      surface: 'public',
      orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
      testName: 'lipid panel',
      rescueReason: 'book_lab_collection_nearest_compound',
    },
  ];

export const BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS = [
  {
    id: 'book-lab-to-nearest-compound',
    prompt: 'Book lab draw earliest slot',
    surface: 'customer' as const,
    misclassifiedAction: 'book_lab_collection',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'nearest-slot-to-lab-compound',
    prompt: 'Book my lab collection nearest available',
    surface: 'customer' as const,
    misclassifiedAction: 'book_nearest_slot',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'list-to-nearest-compound',
    prompt: 'Schedule my blood draw for the soonest opening',
    surface: 'public' as const,
    misclassifiedAction: 'list_my_lab_booking_requests',
    expectedAction: 'compound_intent' as const,
  },
  {
    id: 'appointment-to-lab-nearest',
    prompt: 'Book lab collection ASAP from my clinic request',
    surface: 'public' as const,
    misclassifiedAction: 'book_appointment',
    expectedAction: 'compound_intent' as const,
  },
] as const;
