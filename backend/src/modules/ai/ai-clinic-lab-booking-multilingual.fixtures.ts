import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  BOOK_LAB_COLLECTION_PROMPTS,
  CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS,
  DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
  LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
  PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS,
  PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
  STAFF_BOOK_LAB_COLLECTION_PROMPTS,
} from './ai-clinic-lab-booking.fixtures.js';

export type BilingualLabBookingPrompt = { hy: string; ru: string };

function tx(hy: string, ru: string): BilingualLabBookingPrompt {
  return { hy, ru };
}

/** HY/RU prompt variants keyed by ai-cmd-clinic-v2-8 fixture id (i18n-clinic-v2-ai-8). */
export const CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS: Record<
  string,
  BilingualLabBookingPrompt
> = {
  'push-maria-cbc': tx(
    'Ուղարկիր Մարիային լաբորատոր հավաքման ամրագրման հրավերը CBC պատվերի համար',
    'Отправь Марии запрос на бронирование лабораторного забора для заказа CBC',
  ),
  'send-blood-draw-link': tx(
    'Ուղարկիր Մարիային հղում արյան վերցման ամրագրման համար',
    'Отправь Марии ссылку для бронирования забора крови',
  ),
  'notify-patient-collection': tx(
    'Տեղեկացրիր հիվանդ Ալեքսին ամրագրել լաբորատոր հավաքում',
    'Уведоми пациента Алекса забронировать лабораторный забор',
  ),
  'push-collection-request': tx(
    'Ուղարկիր հավաքման ամրագրման հրավերը Ջեյնին',
    'Отправь запрос на бронирование забора Джейн',
  ),
  'ask-patient-book-lab': tx(
    'Հարցրիր Մարիային ամրագրել իր լաբ այցը',
    'Попроси Марию забронировать свой лабораторный визит',
  ),
  'push-order-id': tx(
    'Ուղարկիր լաբ ամրագրման հրավերը ord-123 պատվերի համար',
    'Отправь запрос на лабораторное бронирование для заказа ord-123',
  ),
  'send-lipid-draw': tx(
    'Ուղարկիր հիվանդ Ջոնին lipid panel հավաքման ամրագրման հղում',
    'Отправь пациенту Джону ссылку на бронирование забора lipid panel',
  ),
  'push-blood-work': tx(
    'Ուղարկիր արյան աշխատանքի հավաքման հրավերը հիվանդ Սոֆիային',
    'Отправь пациенту Софии запрос на бронирование забора крови',
  ),
  'patient-self-book': tx(
    'Թող Մարիան ինքնուրույն ամրագրի իր լաբորատոր հավաքումը',
    'Попроси Марию самостоятельно забронировать лабораторный забор',
  ),
  'push-lab-draw': tx(
    'Ուղարկիր լաբ հավաքման ամրագրման հրավերը Մարիային',
    'Отправь Марии запрос на бронирование лабораторного забора',
  ),
  'question-push': tx(
    'Կարո՞ղ եք ուղարկել լաբ հավաքման ամրագրման հրավերը Ալեքսին',
    'Можете отправить Алексу запрос на бронирование лабораторного забора',
  ),
  'book-maria-tomorrow': tx(
    'Ամրագրիր լաբորատոր հավաքում Մարիայի համար վաղը ժամը 9-ին',
    'Забронируй лабораторный забор для Марии завтра в 9 утра',
  ),
  'schedule-alex-draw': tx(
    'Գրանցիր արյան վերցում Ալեքսի համար ուրբաթ ժամը 10:00',
    'Запиши забор крови для Алекса в пятницу в 10:00',
  ),
  'staff-book-order': tx(
    'Ամրագրիր հավաքման այց ord-55 պատվերի համար վաղը առավոտ',
    'Забронируй приём на забор для заказа ord-55 завтра утром',
  ),
  'book-jane-lab': tx(
    'Ամրագրիր Ջեյնի լաբորատոր հավաքումը հաջորդ երեքշաբթի ժամը 14:00',
    'Забронируй лабораторный забор для Джейн в следующий вторник в 14:00',
  ),
  'reserve-draw-slot': tx(
    'Գրանցիր լաբ հավաքման սլոթ հիվանդ Մարիայի համար',
    'Зарезервируй слот на лабораторный забор для пациента Марии',
  ),
  'staff-schedule-collection': tx(
    'Անձնակազմ՝ ամրագրիր լաբ հավաքում Ջոնի համար',
    'Запиши лабораторный забор для Джона от имени персонала',
  ),
  'book-blood-draw-visit': tx(
    'Ամրագրիր արյան վերցման այց Սոֆիայի համար վաղը',
    'Забронируй визит на забор крови для Софии завтра',
  ),
  'collection-for-order': tx(
    'Գրանցիր հավաքում ord-88 լաբ պատվերի համար վաղը ժամը 9:30',
    'Запланируй забор для лабораторного заказа ord-88 завтра в 9:30',
  ),
  'book-lab-slot': tx(
    'Ամրագրիր լաբորատոր հավաքման սլոթ Մարիայի համար',
    'Забронируй слот на лабораторный забор для Марии',
  ),
  'question-staff-book': tx(
    'Կարո՞ղ եք վաղը ամրագրել լաբ հավաքում Ալեքսի համար',
    'Можете завтра забронировать лабораторный забор для Алекса',
  ),
  'lab-to-book': tx(
    'Ինչ լաբ այցեր պետք է ամրագրեմ',
    'Какие лабораторные визиты мне нужно забронировать',
  ),
  'pending-lab-collection': tx(
    'Ցույց տուր իմ սպասող լաբորատոր հավաքման հայտերը',
    'Покажи мои ожидающие запросы на лабораторный забор',
  ),
  'lab-appointments-to-book': tx(
    'Լաբ այցեր ամրագրման համար',
    'Лабораторные визиты для бронирования',
  ),
  'clinic-asked-book': tx(
    'Ինչ լաբ թեստեր է կլինիկան խնդրել ինձ ամրագրել',
    'Какие лабораторные тесты клиника попросила меня забронировать',
  ),
  'my-lab-to-book': tx(
    'Իմ լաբ ամրագրման ցուցակը',
    'Мой список лабораторных бронирований',
  ),
  'pending-draw': tx(
    'Կա՞ արյան վերցումներ, որոնք դեռ պետք է գրանցեմ',
    'Есть ли заборы крови, которые мне ещё нужно записать',
  ),
  'open-lab-requests': tx(
    'Բացիր իմ լաբ ամրագրման հայտերը',
    'Открой мои запросы на лабораторное бронирование',
  ),
  'collection-to-schedule': tx(
    'Լաբ հավաքումներ, որոնք պետք է գրանցեմ',
    'Лабораторные заборы, которые мне нужно записать',
  ),
  'account-lab-book': tx(
    'Իմ հաշվում լաբ ամրագրման համար',
    'Лабораторное бронирование в моём аккаунте',
  ),
  'waiting-lab-booking': tx(
    'Սպասո՞ւմ եմ որևէ լաբ այցի ամրագրման',
    'Жду ли я бронирования каких-либо лабораторных визитов',
  ),
  'list-lab-book': tx(
    'Ցուցակավորիր լաբ այցերը, որոնք պետք է ամրագրեմ',
    'Список лабораторных визитов, которые мне нужно забронировать',
  ),
  'clinic-lab-request': tx(
    'Կլինիկայի սպասող լաբ ամրագրման հայտերը',
    'Ожидающие запросы на лабораторное бронирование от моей клиники',
  ),
  'book-my-collection': tx(
    'Ամրագրիր իմ լաբորատոր հավաքումը',
    'Забронируй мой лабораторный забор',
  ),
  'schedule-blood-draw': tx(
    'Գրանցիր իմ լաբորատոր արյան վերցումը',
    'Запиши мой лабораторный забор крови',
  ),
  'book-lab-draw': tx(
    'Ամրագրիր իմ լաբ հավաքման այցը',
    'Забронируй мой визит на лабораторный забор',
  ),
  'reserve-collection': tx(
    'Գրանցիր իմ լաբ հավաքման սլոթը',
    'Зарезервируй мой слот на лабораторный забор',
  ),
  'book-pending-lab': tx(
    'Ամրագրիր կլինիկայի ուղարկած լաբ հավաքումը',
    'Забронируй лабораторный забор, который отправила клиника',
  ),
  'schedule-collection-appt': tx(
    'Գրանցիր իմ հավաքման այցը',
    'Запиши мой визит на забор',
  ),
  'book-clinic-lab': tx(
    'Ամրագրիր իմ պատվիրած լաբ թեստի հավաքումը',
    'Забронируй мой забор лабораторных тестов, которые заказали',
  ),
  'need-book-draw': tx(
    'Պետք է ամրագրեմ իմ արյան վերցումը',
    'Мне нужно забронировать свой забор крови',
  ),
  'book-lab-visit': tx(
    'Ամրագրիր իմ լաբ այցը պատվիրած թեստերի համար',
    'Забронируй мой лабораторный визит для заказанных тестов',
  ),
  'complete-lab-booking': tx(
    'Ավարտիր իմ լաբ հավաքման ամրագրումը',
    'Заверши моё бронирование лабораторного забора',
  ),
  'book-from-request': tx(
    'Ամրագրիր իմ լաբ հավաքումը կլինիկայի հայտից',
    'Забронируй мой лабораторный забор по запросу клиники',
  ),
  'question-book-lab': tx(
    'Ինչպես ամրագրեմ իմ լաբ հավաքումը',
    'Как забронировать мой лабораторный забор',
  ),
  'pending-patient-bookings': tx(
    'Որ հիվանդներն են դեռ պետք ամրագրեն լաբ հավաքում',
    'Какие пациенты ещё должны забронировать лабораторный забор',
  ),
  'waiting-self-book': tx(
    'Որ հիվանդներն են սպասում ինքնուրույն ամրագրել արյան վերցում',
    'Какие пациенты ожидают самостоятельно забронировать забор крови',
  ),
  'pending-lab-requests': tx(
    'Ցույց տուր իմ հիվանդների սպասող լաբ ամրագրման հայտերը',
    'Покажи ожидающие запросы на лабораторное бронирование для моих пациентов',
  ),
  'who-needs-lab-book': tx(
    'Ով հիվանդներն են դեռ պետք ամրագրեն լաբ այց',
    'Какие пациенты ещё должны забронировать лабораторный визит',
  ),
  'awaiting-patient-lab': tx(
    'Որ հիվանդներն են դեռ սպասում լաբ պատվերի ինքնուրույն ամրագրման',
    'Какие пациенты ещё ждут самостоятельного бронирования лабораторного заказа',
  ),
  'patients-lab-to-book': tx(
    'Ցույց տուր իմ հիվանդներին, ովքեր սպասում են լաբ ամրագրման',
    'Покажи моих пациентов, ожидающих лабораторного бронирования',
  ),
  'unbooked-lab-collection': tx(
    'Ցուցակավորիր չամրագրված լաբ հավաքման հայտերը',
    'Список незабронированных запросов на лабораторный забор',
  ),
  'patient-lab-pending': tx(
    'Որ հիվանդների լաբ հավաքումը դեռ չի ամրագրվել',
    'У каких пациентов лабораторный забор ещё не забронирован',
  ),
  'lab-push-pending': tx(
    'Ցույց տուր ուղարկված լաբ հայտերը առանց ամրագրված հավաքման',
    'Покажи отправленные лабораторные запросы без забронированного забора',
  ),
  'check-pending-lab': tx(
    'Ստուգիր իմ սպասող լաբ ամրագրման հայտերը',
    'Проверь ожидающие запросы на лабораторное бронирование моих пациентов',
  ),
  'list-awaiting-book': tx(
    'Ցուցակավորիր հիվանդներին, որոնք սպասում են լաբ ամրագրման',
    'Список пациентов, ожидающих лабораторного бронирования',
  ),
  'awaiting-patient-booking': tx(
    'Ցույց տուր սպասող պատվերները հիվանդի ինքնուրույն ամրագրման համար',
    'Покажи заказы, ожидающие бронирования пациентом',
  ),
  'waiting-patient-lab-queue': tx(
    'Լաբ հերթ սպասող հիվանդի ամրագրման',
    'Очередь лабораторных заказов, ожидающих бронирования пациентом',
  ),
  'pushed-not-booked': tx(
    'Ցուցակավորիր լաբ պատվերները, որոնք ուղարկվել են, բայց հիվանդը դեռ չի ամրագրել',
    'Список лабораторных заказов, отправленных пациенту, но ещё не забронированных им',
  ),
  'patient-has-not-booked': tx(
    'Ցույց տուր լաբ պատվերները, որոնք սպասում են հիվանդի հավաքման ամրագրման',
    'Покажи лабораторные заказы, ожидающие бронирования забора пациентом',
  ),
  'awaiting-self-book': tx(
    'Պատվերներ հիվանդի ինքնուրույն ամրագրման սպասման',
    'Заказы, ожидающие самостоятельного бронирования пациентом',
  ),
  'create-booking-to-push': tx(
    'Ուղարկիր լաբ հավաքման ամրագրման հրավերը Մարիային',
    'Отправь Марии запрос на бронирование лабораторного забора',
  ),
  'list-orders-to-push': tx(
    'Ուղարկիր Մարիային հղում արյան վերցման ամրագրման համար',
    'Отправь Марии ссылку для бронирования забора крови',
  ),
  'create-order-to-staff-book': tx(
    'Ամրագրիր լաբ հավաքում Մարիայի համար վաղը ժամը 9-ին',
    'Забронируй лабораторный забор для Марии завтра в 9 утра',
  ),
  'results-to-lab-requests': tx(
    'Ինչ լաբ այցեր պետք է ամրագրեմ',
    'Какие лабораторные визиты мне нужно забронировать',
  ),
  'appointments-to-book-lab': tx(
    'Ամրագրիր իմ լաբ հավաքումը',
    'Забронируй мой лабораторный забор',
  ),
  'book-appointment-to-lab': tx(
    'Գրանցիր իմ լաբորատոր արյան վերցումը',
    'Запиши мой лабораторный забор крови',
  ),
  'collection-queue-to-pending-lab': tx(
    'Որ հիվանդներն են դեռ պետք ամրագրեն լաբ հավաքում',
    'Какие пациенты ещё должны забронировать лабораторный забор',
  ),
};

export const CLINIC_LAB_BOOKING_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic lab collection push/book (ai-cmd-clinic-v2-8):
  - dashboard hy/ru push_lab_booking_to_patient: ուղարկ/տեղեկաց + հիվանդ + լաբ հավաք|արյան վերց / отправь|уведоми + пациент + лабораторный забор|забор крови — NOT create_booking or create_test_order
  - dashboard hy/ru staff_book_lab_collection: ամրագրիր/գրանցիր + լաբ հավաք|արյան վերց + հիվանդի համար / забронируй|запиши + лабораторный забор + для пациента — staff slot booking, NOT push link
  - customer hy/ru list_my_lab_booking_requests: ինչ լաբ պետք է ամրագրեմ|սպասող լաբ հայտեր / какие лаб визиты забронировать|ожидающие лаб запросы — NOT list_my_test_results
  - customer hy/ru book_lab_collection: ամրագրիր իմ լաբ հավաքումը / забронируй мой лабораторный забор — NOT book_appointment or my_appointments
  - provider hy/ru list_patient_pending_lab_requests: որ հիվանդներն են դեռ պետք ամրագրեն / какие пациенты ещё должны забронировать — NOT list_my_collection_queue
  - dashboard awaitingPatientBooking list: սպասող պատվերներ հիվանդի ամրագրման / заказы ожидающие бронирования пациентом → list_test_orders awaitingPatientBooking=true`;

export type ClinicLabBookingMultilingualSurface = Extract<
  CommandSurface,
  'dashboard' | 'customer' | 'provider'
>;

export interface ClinicLabBookingMultilingualEvalScenario {
  id: string;
  sourceScenarioId: string;
  locale: AiEvalLocale;
  surface: ClinicLabBookingMultilingualSurface;
  prompt: string;
  expectedAction: string;
  rescueReason?: string;
  rescueFromAction?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual: true;
}

function buildLocalizedScenarios<T extends { id: string }>(
  entries: readonly T[],
  surface: ClinicLabBookingMultilingualSurface,
  expectedAction: string,
  options?: {
    rescueReason?: string;
    paramsFromEntry?: (entry: T) => Record<string, unknown> | undefined;
  },
): ClinicLabBookingMultilingualEvalScenario[] {
  return entries.flatMap((entry) => {
    const translation = CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS[entry.id];
    if (!translation) {
      throw new Error(
        `Missing clinic lab booking HY/RU translation for ${entry.id}`,
      );
    }
    const paramsPartial = options?.paramsFromEntry?.(entry);
    return (['hy', 'ru'] as const).map((locale) => ({
      id: `${entry.id}-${locale}`,
      sourceScenarioId: entry.id,
      locale,
      surface,
      prompt: translation[locale],
      expectedAction,
      rescueReason: options?.rescueReason ?? expectedAction,
      ...(paramsPartial ? { paramsPartial } : {}),
      needsMultilingual: true as const,
    }));
  });
}

function buildMultilingualClinicLabBookingEvalScenarios(): ClinicLabBookingMultilingualEvalScenario[] {
  return [
    ...buildLocalizedScenarios(
      PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
      'dashboard',
      'push_lab_booking_to_patient',
      {
        paramsFromEntry: (entry) => {
          const params: Record<string, unknown> = {};
          if ('customerName' in entry && entry.customerName) {
            params.customerName = entry.customerName;
          }
          if ('orderId' in entry && entry.orderId) {
            params.orderId = entry.orderId;
          }
          return Object.keys(params).length > 0 ? params : undefined;
        },
      },
    ),
    ...buildLocalizedScenarios(
      STAFF_BOOK_LAB_COLLECTION_PROMPTS,
      'dashboard',
      'staff_book_lab_collection',
      {
        paramsFromEntry: (entry) => {
          const params: Record<string, unknown> = {};
          if ('customerName' in entry && entry.customerName) {
            params.customerName = entry.customerName;
          }
          if ('orderId' in entry && entry.orderId) {
            params.orderId = entry.orderId;
          }
          return Object.keys(params).length > 0 ? params : undefined;
        },
      },
    ),
    ...buildLocalizedScenarios(
      AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
      'dashboard',
      'list_test_orders',
      {
        paramsFromEntry: () => ({ awaitingPatientBooking: true }),
      },
    ),
    ...buildLocalizedScenarios(
      LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
      'customer',
      'list_my_lab_booking_requests',
    ),
    ...buildLocalizedScenarios(
      BOOK_LAB_COLLECTION_PROMPTS,
      'customer',
      'book_lab_collection',
    ),
    ...buildLocalizedScenarios(
      LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
      'provider',
      'list_patient_pending_lab_requests',
    ),
    ...DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS.flatMap((entry) => {
      const translation =
        CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS[entry.id];
      if (!translation) {
        throw new Error(
          `Missing clinic lab booking HY/RU translation for ${entry.id}`,
        );
      }
      return (['hy', 'ru'] as const).map((locale) => ({
        id: `${entry.id}-${locale}`,
        sourceScenarioId: entry.id,
        locale,
        surface: 'dashboard' as const,
        prompt: translation[locale],
        expectedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        rescueFromAction: entry.misclassifiedAction,
        needsMultilingual: true as const,
      }));
    }),
    ...CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS.flatMap((entry) => {
      const translation =
        CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS[entry.id];
      if (!translation) {
        throw new Error(
          `Missing clinic lab booking HY/RU translation for ${entry.id}`,
        );
      }
      return (['hy', 'ru'] as const).map((locale) => ({
        id: `${entry.id}-${locale}`,
        sourceScenarioId: entry.id,
        locale,
        surface: 'customer' as const,
        prompt: translation[locale],
        expectedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        rescueFromAction: entry.misclassifiedAction,
        needsMultilingual: true as const,
      }));
    }),
    ...PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS.flatMap((entry) => {
      const translation =
        CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS[entry.id];
      if (!translation) {
        throw new Error(
          `Missing clinic lab booking HY/RU translation for ${entry.id}`,
        );
      }
      return (['hy', 'ru'] as const).map((locale) => ({
        id: `${entry.id}-${locale}`,
        sourceScenarioId: entry.id,
        locale,
        surface: 'provider' as const,
        prompt: translation[locale],
        expectedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        rescueFromAction: entry.misclassifiedAction,
        needsMultilingual: true as const,
      }));
    }),
  ];
}

export const MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS: ClinicLabBookingMultilingualEvalScenario[] =
  buildMultilingualClinicLabBookingEvalScenarios();

export function assertClinicLabBookingMultilingualParity(): {
  push: number;
  staffBook: number;
  listMy: number;
  bookCollection: number;
  providerPending: number;
  awaiting: number;
  rescue: number;
} {
  const requiredIds = [
    ...PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS.map((entry) => entry.id),
    ...STAFF_BOOK_LAB_COLLECTION_PROMPTS.map((entry) => entry.id),
    ...LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS.map((entry) => entry.id),
    ...BOOK_LAB_COLLECTION_PROMPTS.map((entry) => entry.id),
    ...LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS.map((entry) => entry.id),
    ...AWAITING_PATIENT_BOOKING_LIST_PROMPTS.map((entry) => entry.id),
    ...DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS.map((entry) => entry.id),
    ...CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS.map((entry) => entry.id),
    ...PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS.map((entry) => entry.id),
  ];
  const missing = requiredIds.filter(
    (id) => !CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS[id],
  );
  if (missing.length > 0) {
    throw new Error(
      `Clinic lab booking multilingual parity missing ${missing.length} id(s): ${missing.join(', ')}`,
    );
  }
  return {
    push: PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS.length * 2,
    staffBook: STAFF_BOOK_LAB_COLLECTION_PROMPTS.length * 2,
    listMy: LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS.length * 2,
    bookCollection: BOOK_LAB_COLLECTION_PROMPTS.length * 2,
    providerPending: LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS.length * 2,
    awaiting: AWAITING_PATIENT_BOOKING_LIST_PROMPTS.length * 2,
    rescue:
      (DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS.length +
        CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS.length +
        PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS.length) *
      2,
  };
}
