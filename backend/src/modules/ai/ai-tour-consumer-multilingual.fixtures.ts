import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type TourConsumerEvalAction =
  | 'explain_tour_day_slots'
  | 'explain_tour_booking'
  | 'diagnose_tour_capacity'
  | 'explain_tour_booking_record';

export interface TourConsumerEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: TourConsumerEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian tour consumer + booking-record phrasing (ai-cmd-tour-10). */
export const TOUR_CONSUMER_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian tour booking page + checkout capacity (customer/public) and dashboard booking record:
  - explain_tour_day_slots: hy «ինչու մեկ մեկնում օրական», «քանի տեղ է մնացել», «ամբողջությամբ ամրագրված ամսաթիվ», «մեկ ժամանակ ցուցադրում է»; ru «почему одно время в день», «сколько мест осталось», «дата недоступна», «полностью забронирован». READ how multi-day tours show one departure per day, remainingSpots, and fully booked dates on the booking page — NOT diagnose_tour_capacity (checkout rejected pax/date) and NOT explain_tour_booking (catalog max group / per-person price / duration).
  - explain_tour_booking: hy «քանի հոգի կարող է մասնակցել», «քանի օր է տևում», «գինը մեկ անձի համար», «առավելագույն խումբ այս էջում»; ru «максимальный размер группы на странице записи», «сколько дней длится», «цена за человека», «указан за человека». READ catalog tour metadata on the booking page — NOT explain_tour_day_slots (slot display) and NOT diagnose_tour_capacity (checkout rejection).
  - diagnose_tour_capacity: hy «checkout-ը մերժեց N հոգի», «չի ընդունում checkout», «pax-ը նվազեցվեց»; ru «checkout отклонил N человек», «не принимает checkout», «pax уменьшен». READ why checkout rejected pax or date — NOT explain_tour_booking (catalog overview without rejection) and NOT explain_tour_day_slots (educational remainingSpots display).
  - explain_tour_booking_record: hy «բացատրիր էքսկուրսիայի ամրագրումը pax-ով», «տարեթվեր ամրագրումում», «հատուկ պահանջներ ամրագրումում»; ru «объясни запись тура pax и даты», «даты начала/конца бронирования», «особые требования бронирования». READ one stored tour booking's paxCount, tourStartDate, tourEndDate, specialRequirements — NOT explain_tour_services (catalog list) and NOT explain_tour_booking (public catalog).`;

export const MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS: TourConsumerEvalScenario[] =
  [
    {
      id: 'hy-day-one-departure',
      locale: 'hy',
      prompt:
        'Ինչու է Mountain Trek-ը մեկ մեկնում ցույց տալիս օրական',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: { serviceName: 'Mountain Trek', aspect: 'oneDeparture' },
      needsMultilingual: true,
    },
    {
      id: 'hy-day-spots-left',
      locale: 'hy',
      prompt: 'Քանի տեղ է մնացել 15/08/2026-ին Mountain Trek-ի համար',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: {
        serviceName: 'Mountain Trek',
        date: '2026-08-15',
        aspect: 'remainingSpots',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-day-fully-booked',
      locale: 'hy',
      prompt:
        'Ինչու է 15/08/2026-ը ամբողջությամբ ամրագրված Mountain Trek-ի համար',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: {
        serviceName: 'Mountain Trek',
        date: '2026-08-15',
        aspect: 'fullyBooked',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-booking-max-group',
      locale: 'hy',
      prompt:
        'Քանի հոգի կարող է մասնակցել Garni Temple տուրին այս էջում',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'Garni Temple', aspect: 'groupSize' },
      needsMultilingual: true,
    },
    {
      id: 'hy-booking-duration',
      locale: 'hy',
      prompt: 'Քանի օր է տևում Wine Country տուրը գրանցման էջում',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'Wine Country', aspect: 'duration' },
      needsMultilingual: true,
    },
    {
      id: 'hy-booking-per-person',
      locale: 'hy',
      prompt: 'Garni Temple-ի գինը մեկ անձի համար է ցուցադրվում',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'Garni Temple', aspect: 'pricing' },
      needsMultilingual: true,
    },
    {
      id: 'hy-capacity-reject-pax',
      locale: 'hy',
      prompt: 'Ինչու checkout-ը մերժեց 4 հոգի City Tour-ի համար',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: { serviceName: 'City Tour', requestedPax: 4 },
      needsMultilingual: true,
    },
    {
      id: 'hy-capacity-clamped-pax',
      locale: 'hy',
      prompt:
        'Ինչու checkout-ը նվազեցրեց pax-ը 8-ի 3-Day Mountain Trek-ի համար',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: { serviceName: '3-Day Mountain Trek', aspect: 'clampedPax' },
      needsMultilingual: true,
    },
    {
      id: 'hy-capacity-reject-date',
      locale: 'hy',
      prompt:
        'Ինչու checkout-ը չի ընդունում 15/08/2026-ը Mountain Trek-ի համար',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: { serviceName: 'Mountain Trek', date: '2026-08-15' },
      needsMultilingual: true,
    },
    {
      id: 'hy-record-pax-dates',
      locale: 'hy',
      prompt: 'Բացատրիր էքսկուրսիայի ամրագրումը pax-ով և տարեթվերով',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { aspect: 'all' },
      needsMultilingual: true,
    },
    {
      id: 'hy-record-special-req',
      locale: 'hy',
      prompt:
        'Ցույց տուր հատուկ պահանջները City Tour ամրագրումում Maria-ի համար',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { customerName: 'Maria', aspect: 'specialRequirements' },
      needsMultilingual: true,
    },
    {
      id: 'hy-record-bk-tour-1',
      locale: 'hy',
      prompt: 'Ինչ pax է պահված bk-tour-1 էքսկուրսիայի ամրագրումում',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { bookingId: 'bk-tour-1', aspect: 'paxCount' },
      needsMultilingual: true,
    },
    {
      id: 'ru-day-one-departure',
      locale: 'ru',
      prompt:
        'Почему многодневный Mountain Trek показывает одно время в день?',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: { serviceName: 'Mountain Trek', aspect: 'oneDeparture' },
      needsMultilingual: true,
    },
    {
      id: 'ru-day-spots-left',
      locale: 'ru',
      prompt: 'Сколько мест осталось на 15/08/2026 для Mountain Trek?',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: {
        serviceName: 'Mountain Trek',
        date: '2026-08-15',
        aspect: 'remainingSpots',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-day-fully-booked',
      locale: 'ru',
      prompt: 'Почему 15/08/2026 недоступен для Mountain Trek?',
      expectedAction: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
      paramsPartial: {
        serviceName: 'Mountain Trek',
        date: '2026-08-15',
        aspect: 'fullyBooked',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-booking-max-group',
      locale: 'ru',
      prompt:
        'Какой максимальный размер группы у City Tour на странице записи?',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'City Tour', aspect: 'groupSize' },
      needsMultilingual: true,
    },
    {
      id: 'ru-booking-duration',
      locale: 'ru',
      prompt: 'Сколько дней длится Mountain Trek?',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'Mountain Trek', aspect: 'duration' },
      needsMultilingual: true,
    },
    {
      id: 'ru-booking-per-person',
      locale: 'ru',
      prompt:
        'Почему цена City Tour указана за человека на странице записи?',
      expectedAction: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
      paramsPartial: { serviceName: 'City Tour', aspect: 'pricing' },
      needsMultilingual: true,
    },
    {
      id: 'ru-capacity-reject-pax',
      locale: 'ru',
      prompt: 'Почему checkout отклонил 5 человек на Mountain Trek 15/08/2026?',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: {
        serviceName: 'Mountain Trek',
        date: '2026-08-15',
        requestedPax: 5,
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-capacity-clamped-pax',
      locale: 'ru',
      prompt: 'Почему checkout уменьшил pax до 8 для 3-Day Mountain Trek?',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: { serviceName: '3-Day Mountain Trek', aspect: 'clampedPax' },
      needsMultilingual: true,
    },
    {
      id: 'ru-capacity-reject-date',
      locale: 'ru',
      prompt:
        'Почему checkout не принимает бронирование на 15/08/2026 для Mountain Trek?',
      expectedAction: 'diagnose_tour_capacity',
      rescueReason: 'diagnose_tour_capacity',
      paramsPartial: { serviceName: 'Mountain Trek', date: '2026-08-15' },
      needsMultilingual: true,
    },
    {
      id: 'ru-record-pax-dates',
      locale: 'ru',
      prompt:
        'Объясни запись тура: pax и даты начала/конца для бронирования bk-tour-1',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { bookingId: 'bk-tour-1', aspect: 'all' },
      needsMultilingual: true,
    },
    {
      id: 'ru-record-special-req',
      locale: 'ru',
      prompt:
        'Покажи особые требования бронирования City Tour для Maria',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { customerName: 'Maria', aspect: 'specialRequirements' },
      needsMultilingual: true,
    },
    {
      id: 'ru-record-calendar-span',
      locale: 'ru',
      prompt:
        'Почему это бронирование тура занимает несколько дней в календаре провайдера?',
      expectedAction: 'explain_tour_booking_record',
      rescueReason: 'explain_tour_booking_record',
      paramsPartial: { aspect: 'calendarSpan' },
      needsMultilingual: true,
    },
  ] as const;
