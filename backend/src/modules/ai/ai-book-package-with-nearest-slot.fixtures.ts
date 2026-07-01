import type { CommandSurface } from './ai-command-registry.types.js';

export type BookPackageWithNearestSlotPromptFixture = {
  id: string;
  prompt: string;
  surface: Extract<CommandSurface, 'customer' | 'public'>;
  orderedActions: ['discover_packages', 'book_package'];
  packageName?: string;
  rescueReason: 'book_package_with_nearest_slot_compound';
};

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_CLASSIFIER_RULES = `- book_package_with_nearest_slot (compound): customer/public multi-step package booking with earliest/nearest slot — decomposes to discover_packages → book_package with bookingFirstAvailable=true. Triggers: book|buy|purchase + package|bundle|spa day + earliest|nearest|soonest|first available|ASAP. Example: "Book the spa package earliest available", "Buy deluxe bundle soonest slot for me". NOT check_package_availability alone (read availability), NOT book_package + apply_promo_code_checkout (promo compound), NOT book_package without flexible-slot cue (plain package purchase).`;

export const CUSTOMER_BOOK_PACKAGE_WITH_NEAREST_SLOT_CLASSIFIER_RULES =
  BOOK_PACKAGE_WITH_NEAREST_SLOT_CLASSIFIER_RULES;

export const PUBLIC_BOOK_PACKAGE_WITH_NEAREST_SLOT_CLASSIFIER_RULES =
  BOOK_PACKAGE_WITH_NEAREST_SLOT_CLASSIFIER_RULES;

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS: readonly BookPackageWithNearestSlotPromptFixture[] =
  [
    {
      id: 'spa-package-earliest-customer',
      prompt: 'Book the spa package earliest available',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'spa-day-soonest-customer',
      prompt: 'Buy the spa day package for the soonest slot',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'deluxe-nearest-customer',
      prompt: 'Purchase the deluxe bundle nearest available for me',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'deluxe bundle',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'wellness-first-available-customer',
      prompt: 'Book wellness package first available appointment',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'wellness package',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'any-package-asap-customer',
      prompt: 'Book a package ASAP for me',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'quoted-package-nearest-customer',
      prompt: 'Book the "Spa Day" package nearest slot',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'reserve-bundle-earliest-customer',
      prompt: 'Reserve the spa day deal earliest opening',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'get-package-next-available-customer',
      prompt: 'Get the spa package next available time',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'schedule-package-soonest-customer',
      prompt: 'Schedule my spa day package for the soonest visit',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'book-package-tomorrow-nearest-customer',
      prompt: 'Book spa day package tomorrow nearest slot',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'spa-package-earliest-public',
      prompt: 'Book the spa package earliest available',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'deluxe-soonest-public',
      prompt: 'Buy deluxe bundle soonest opening',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'deluxe bundle',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'wellness-nearest-public',
      prompt: 'Purchase wellness package nearest available',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'wellness package',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'package-asap-public',
      prompt: 'Book a spa day package ASAP',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'bundle-first-available-public',
      prompt: 'Get the deluxe package first available slot',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Deluxe',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
  ];

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-book-package',
    prompt: 'Book the spa package earliest available',
    surface: 'customer' as const,
    misclassifiedAction: 'book_package',
  },
  {
    id: 'misclassified-discover-packages',
    prompt: 'Buy deluxe bundle nearest available for me',
    surface: 'customer' as const,
    misclassifiedAction: 'discover_packages',
  },
  {
    id: 'misclassified-check-availability',
    prompt: 'Book wellness package soonest slot',
    surface: 'customer' as const,
    misclassifiedAction: 'check_package_availability',
  },
  {
    id: 'misclassified-public-book',
    prompt: 'Book the spa package earliest available',
    surface: 'public' as const,
    misclassifiedAction: 'book_appointment',
  },
] as const;
