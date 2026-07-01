import type { BookPackageWithNearestSlotPromptFixture } from './ai-book-package-with-nearest-slot.fixtures.js';

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_CLASSIFIER_RULES = `- book_package_with_nearest_slot HY/RU: ամրագրել|գնել + փաթեթ|spa day + ամենամոտ|ամենաառաջին|скорее|ближайш|раньше + пакет|spa day.`;

export const BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS: readonly BookPackageWithNearestSlotPromptFixture[] =
  [
    {
      id: 'hy-spa-nearest-customer',
      prompt: 'Ամրագրել spa day փաթեթը ամենամոտ slot-ով',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'hy-package-earliest-public',
      prompt: 'Գնել spa day փաթեթը ամենաառաջին ազատ ժամով',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'ru-spa-nearest-customer',
      prompt: 'Забронировать spa day пакет на ближайший слот',
      surface: 'customer',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
    {
      id: 'ru-package-soonest-public',
      prompt: 'Купить пакет spa day на самое раннее время',
      surface: 'public',
      orderedActions: ['discover_packages', 'book_package'],
      packageName: 'Spa Day',
      rescueReason: 'book_package_with_nearest_slot_compound',
    },
  ];
