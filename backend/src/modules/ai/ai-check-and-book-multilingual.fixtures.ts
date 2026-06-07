import type { CheckAndBookEvalScenario } from './ai-check-and-book.fixtures.js';
import type { FlexibleBookingEvalScenario } from './ai-check-and-book.fixtures.js';

/** Extra classifier guidance for hy/ru check+book and flexible-slot phrasing (ai-cmd-h1.5). */
export const CHECK_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian/transliteration check+book and flexible booking:
  - Compound (who is free + book nearest): hy «ով է ազատ … ամրագրիր մոտակա slot»; ru «кто свободен … забронируй ближайший слот»; translit «kto svoboden … zabroniruy blizhayshiy slot». Set allProviders=true, bookingFirstAvailable=true, timeSlot=null; extract serviceName, date, timeOfDay.
  - Check-only: hy «ով է ազատ …» / ru «кто свободен …» → check_providers_for_service (dashboard/customer) or check_availability (public).
  - Flexible book only: hy «ամրագրիր մոտակա …» / ru «запиши ближайшее …» → book_nearest_slot or book_appointment with bookingFirstAvailable=true, timeSlot=null.
  - timeOfDay: hy առավոտ/ցերեկ/երեկոյան; ru утром/днём/вечером; translit erek/utrom/dnyom → morning/afternoon/evening.
  - tomorrow: hy վաղը; ru завтра; translit vagh@/zavtra → resolve to DD/MM/YYYY from context.
  - Keep Latin catalog names (massage, permanent lashes) as serviceName when embedded in hy/ru sentences.`;

/** Core hy/ru/translit check+book compound prompts. */
export const MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS = [
  {
    id: 'hy-free-book-nearest',
    locale: 'hy' as const,
    prompt:
      'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար, ամրագրիր մոտակա slot-ը',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'ru-free-book-nearest',
    locale: 'ru' as const,
    prompt:
      'Кто свободен завтра вечером для permanent lashes, забронируй ближайший слот',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'translit-free-book-nearest',
    locale: 'translit' as const,
    prompt:
      'kto svoboden zavtra vecherom dlya permanent lashes, zabroniruy blizhayshiy slot',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'hy-who-free-comma-book',
    locale: 'hy' as const,
    prompt: 'Ով է ազատ վաղը ցերեկով massage-ի համար, ամրագրիր ամենամոտ slot-ը',
    serviceName: 'massage',
    notBeforeTime: '12:00',
    timeOfDay: 'afternoon',
  },
  {
    id: 'ru-who-free-comma-book',
    locale: 'ru' as const,
    prompt:
      'Кто свободен завтра днём для massage, запиши ближайшее свободное время',
    serviceName: 'massage',
    notBeforeTime: '12:00',
    timeOfDay: 'afternoon',
  },
] as const;

/** hy/ru/translit flexible-slot-only prompts (single-intent rescue). */
export const MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS = [
  {
    id: 'hy-book-nearest-massage',
    locale: 'hy' as const,
    prompt: 'Ամրագրիր մոտակա massage-ը վաղը երեկոյան',
    rescuedAction: 'book_nearest_slot' as const,
    rescueReason: 'nearest_slot' as const,
  },
  {
    id: 'ru-book-nearest-massage',
    locale: 'ru' as const,
    prompt: 'Запиши ближайшее свободное время для массажа завтра вечером',
    rescuedAction: 'book_nearest_slot' as const,
    rescueReason: 'nearest_slot' as const,
  },
  {
    id: 'translit-book-nearest-massage',
    locale: 'translit' as const,
    prompt: 'amsagrum blizhayshee massage vagh@ vecherom',
    rescuedAction: 'book_nearest_slot' as const,
    rescueReason: 'nearest_slot' as const,
  },
  {
    id: 'hy-check-providers-only',
    locale: 'hy' as const,
    prompt: 'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար',
    rescuedAction: 'check_providers_for_service' as const,
    rescueReason: 'providers_for_service' as const,
  },
  {
    id: 'ru-check-providers-only',
    locale: 'ru' as const,
    prompt: 'Кто свободен завтра вечером для permanent lashes',
    rescuedAction: 'check_providers_for_service' as const,
    rescueReason: 'providers_for_service' as const,
  },
  {
    id: 'hy-misclassified-check-book-compound',
    locale: 'hy' as const,
    prompt:
      'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար, ամրագրիր մոտակա slot-ը',
    rescueFromAction: 'create_booking' as const,
    rescuedAction: 'create_booking' as const,
    rescueReason: 'check_and_book_compound' as const,
    paramsPartial: {
      bookingFirstAvailable: true,
      allProviders: true,
      timeOfDay: 'evening',
    },
  },
  {
    id: 'ru-misclassified-first-available',
    locale: 'ru' as const,
    prompt: 'Запиши ближайший слот для massage завтра вечером',
    rescueFromAction: 'create_booking' as const,
    rescuedAction: 'create_booking' as const,
    rescueReason: 'booking_first_available' as const,
    paramsPartial: { bookingFirstAvailable: true, timeOfDay: 'evening' },
  },
] as const;

/** Golden eval scenarios for hy/ru check+book decomposition (dashboard + customer). */
export const MULTILINGUAL_CHECK_AND_BOOK_EVAL_SCENARIOS: CheckAndBookEvalScenario[] =
  (['dashboard', 'customer'] as const).flatMap((surface) =>
    MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS.map((entry) => ({
      id: `${surface}-${entry.id}`,
      surface,
      prompt: entry.prompt,
      serviceName: entry.serviceName,
      notBeforeTime: entry.notBeforeTime,
      timeOfDay: entry.timeOfDay,
    })),
  );

/** Golden eval scenarios for hy/ru flexible booking rescue. */
export const MULTILINGUAL_FLEXIBLE_BOOKING_EVAL_SCENARIOS: FlexibleBookingEvalScenario[] =
  MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.map((entry) => ({
    id: entry.id,
    prompt: entry.prompt,
    rescueFromAction:
      'rescueFromAction' in entry ? entry.rescueFromAction : undefined,
    rescuedAction: entry.rescuedAction,
    rescueReason: entry.rescueReason,
    paramsPartial: 'paramsPartial' in entry ? entry.paramsPartial : undefined,
  }));
