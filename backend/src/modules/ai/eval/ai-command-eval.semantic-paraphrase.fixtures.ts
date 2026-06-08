import type { ClassificationSurface } from '../ai-classification-engine.types.js';
import type { AiEvalLocale } from './ai-command-eval.types.js';

/** acc-3.16 — minimum lexically-distinct paraphrases per locale per intent. */
export const SEMANTIC_PARAPHRASE_MIN_PER_LOCALE = 5;

export const SEMANTIC_PARAPHRASE_LOCALES = ['en', 'hy', 'ru'] as const satisfies readonly AiEvalLocale[];

export type SemanticParaphraseLocale = (typeof SEMANTIC_PARAPHRASE_LOCALES)[number];

export interface SemanticParaphraseIntentConfig {
  surface: ClassificationSurface;
  en: readonly string[];
  hy: readonly string[];
  ru: readonly string[];
}

/** Canonical semantic intents — 5+ lexically-distinct paraphrases per locale (acc-3.16). */
export const SEMANTIC_PARAPHRASE_INTENT_BANK: Record<
  string,
  SemanticParaphraseIntentConfig
> = {
  create_booking: {
    surface: 'dashboard',
    en: [
      'Put Maria on the books for facemassage tomorrow at 14:00',
      'Schedule a facemassage visit for Maria tomorrow afternoon at 2pm',
      'Add Maria to the calendar for facemassage tomorrow at fourteen hundred',
      'Slot Maria in for a facemassage tomorrow at 2 in the afternoon',
      "Set up tomorrow's facemassage booking for Maria at 14:00",
      'Register Maria for facemassage tomorrow at two pm',
    ],
    hy: [
      'Պատվիր Maria-ի facemassage ծառայությունը վաղը ժամը 14:00',
      'Ամրագրիր Maria-ին facemassage վաղը ժամը 14:00-ին',
      'Գրանցիր Maria-ի facemassage այցը վաղը երեկոյան',
      'Պլանավորիր Maria-ի facemassage պատվերը վաղը ժամը 14:00',
      'Նշանակիր Maria-ին facemassage վաղը ժամը երկանիս',
    ],
    ru: [
      'Запиши Maria на facemassage завтра в 14:00',
      'Назначь Maria facemassage на завтра в два часа дня',
      'Поставь Maria на facemassage завтра в 14:00',
      'Оформи запись Maria на facemassage завтра днем в 14:00',
      'Забронируй facemassage для Maria на завтра в 14:00',
    ],
  },
  check_providers_for_service: {
    surface: 'dashboard',
    en: [
      'Which stylists have openings tomorrow evening for lashes',
      'Any provider available tomorrow night for permanent lashes',
      'Who has free time tomorrow for lash extensions',
      'See which specialists are open tomorrow for lashes service',
      'Who can take lashes appointments tomorrow evening',
      'Find providers with availability tomorrow for lash service',
    ],
    hy: [
      'Ով ունի ազատ slot վաղը երեկոյան massage-ի համար',
      'Ով է ազատ վաղը lashes-ի համար',
      'Որ մասնագետներն են ազատ վաղը երեկոյան massage-ի համար',
      'Ով կարող է վաղը lashes ծառայություն տալ',
      'Ով ունի բաց slot վաղը permanent lashes-ի համար',
    ],
    ru: [
      'Кто свободен завтра вечером для массажа',
      'У кого есть свободное время завтра для ресниц',
      'Какие специалисты свободны завтра для lashes',
      'Кто может принять на lashes завтра вечером',
      'Есть ли свободные мастера завтра для massage',
    ],
  },
  book_nearest_slot: {
    surface: 'customer',
    en: [
      'Grab the soonest opening for massage tomorrow evening',
      'Book the nearest available slot for massage tomorrow evening',
      'Find the first open massage appointment tomorrow night',
      'Reserve the earliest massage slot tomorrow evening',
      'Get me the next available massage opening tomorrow',
    ],
    hy: [
      'Ամրագրիր ամենամոտ ազատ slot massage-ի համար վաղը',
      'Փնտրիր ամենամոտ massage slot-ը վաղը երեկոյան',
      'Գտիր առաջին ազատ massage slot-ը վաղը',
      'Պահիր ամենաառաջին massage slot-ը վաղը երեկոյան',
      'Վերցրու ամենամոտ massage opening-ը վաղը',
    ],
    ru: [
      'Запиши на ближайшее свободное время массаж завтра вечером',
      'Забронируй ближайший слот на массаж завтра',
      'Найди самое раннее свободное время для массажа завтра вечером',
      'Запиши на первый свободный массаж завтра',
      'Забронируй ближайший massage slot на завтра вечером',
    ],
  },
  book_appointment: {
    surface: 'public',
    en: [
      'Reserve the earliest lashes appointment tomorrow evening',
      'Book the soonest lash slot on any stylist tomorrow',
      'Hold the first available lashes opening tomorrow night',
      'Schedule the nearest lash appointment tomorrow evening',
      'Lock in the earliest lashes slot tomorrow on any provider',
    ],
    hy: [
      'Ամրագրիր ամենավաղ lashes slot-ը վաղը երեկոյան',
      'Պահիր ամենամոտ lashes appointment-ը վաղը',
      'Գտիր ամենաառաջին lashes slot-ը ցանկացած stylist-ի հետ',
      'Վերցրու ամենամոտ lashes opening-ը վաղը երեկոյան',
      'Նշանակիր ամենավաղ lashes այցը վաղը',
    ],
    ru: [
      'Забронируй самое раннее время для lashes завтра вечером',
      'Запиши на ближайший lashes slot любому мастеру завтра',
      'Найди первый свободный lashes appointment на завтра вечером',
      'Забронируй первый свободный lashes slot завтра',
      'Запиши на самое раннее lashes время завтра',
    ],
  },
  cancel_bookings: {
    surface: 'dashboard',
    en: [
      'Call off all of Maria appointments next Friday between 16:30 and 17:30',
      'Cancel every Maria booking next Friday from 4:30 to 5:30 pm',
      'Void all Maria appointments next Friday afternoon slot',
      "Remove Maria's bookings next Friday between sixteen thirty and seventeen thirty",
      'Drop all Maria appointments scheduled next Friday late afternoon',
    ],
    hy: [
      'Չեղարկիր Մարիայի բոլոր այցելությունները ուրբաթ',
      'Չեղարկիր Maria-ի բոլոր booking-ները հաջորդ ուրբաթ',
      'Ջնջիր Maria-ի բոլոր appointments-ները ուրբաթ կեսօրին',
      'Չեղարկ Maria-ի բոլոր այցերը ուրբաթ երեկոյան',
      'Հանի Maria-ի բոլոր գործառույթները ուրբաթից',
    ],
    ru: [
      'Отмени все записи Maria в пятницу',
      'Отмени все appointments Maria в следующую пятницу',
      'Сними все брони Maria в пятницу днем',
      'Удали все записи Maria на пятницу',
      'Отмени Maria все appointments в пятницу вечером',
    ],
  },
  summarize_bookings: {
    surface: 'dashboard',
    en: [
      'Total earnings for today',
      'How much did we earn today',
      "Show today's revenue summary",
      'Calculate total bookings revenue for today',
      "What were today's earnings across all providers",
    ],
    hy: [
      'Այսօրվա ընդհանուր եկամուտ',
      'Ցույց տուր այսօրվա revenue summary-ն',
      'Հաշվիր այսօրվա bookings revenue-ն',
      'Քանի եկամուտ ունեցանք այսօր',
      'Այսօրվա earnings report-ը ցույց տուր',
    ],
    ru: [
      'Общая выручка за сегодня',
      'Сколько мы заработали сегодня',
      'Покажи revenue summary за сегодня',
      'Посчитай bookings revenue за сегодня',
      'Какой earnings был сегодня',
    ],
  },
  clear_schedule: {
    surface: 'dashboard',
    en: [
      'Wipe Gevorg calendar for Friday',
      'Clear Gevorg schedule for Friday completely',
      'Empty Gevorg calendar on Friday',
      'Remove all Gevorg slots from Friday calendar',
      'Reset Gevorg Friday schedule to blank',
    ],
    hy: [
      'Մաքրիր մասնագետի օրացույցը ուրբաթի համար',
      'Մաքրիր Gevorg-ի schedule-ը ուրբաթ',
      'Դատարկ Gevorg-ի calendar-ը ուրբաթ',
      'Հանի Gevorg-ի բոլոր slot-երը ուրբաթ',
      'Reset արա Gevorg-ի ուրբաթ schedule-ը',
    ],
    ru: [
      'Очисти расписание мастера на пятницу',
      'Сотри Gevorg calendar на пятницу',
      'Очисти Gevorg schedule в пятницу полностью',
      'Удали все слоты Gevorg на пятницу',
      'Обнули Gevorg schedule на пятницу',
    ],
  },
  lookup_service_assignment: {
    surface: 'dashboard',
    en: [
      'Who is doing facemassage today',
      'Which provider is assigned facemassage today',
      'Who performs facemassage appointments today',
      'Show who is scheduled for facemassage today',
      'Who is giving facemassage sessions today',
    ],
    hy: [
      'Ով է անում facemassage այսօր',
      'Որ provider-ը facemassage է անում այսօր',
      'Ով է scheduled facemassage-ի համար այսօր',
      'Ցույց տուր ով facemassage session է տալիս այսօր',
      'Ով մասնագետն facemassage է անում այսօր',
    ],
    ru: [
      'Кто делает facemassage сегодня',
      'Какой мастер назначен на facemassage сегодня',
      'Кто выполняет facemassage appointments сегодня',
      'Покажи кто scheduled на facemassage сегодня',
      'Кто проводит facemassage sessions сегодня',
    ],
  },
};
