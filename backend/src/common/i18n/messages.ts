export type AppLocale = 'en' | 'hy' | 'ru';

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  hy: 'Armenian',
  ru: 'Russian',
};

export function resolveLocale(
  preferred?: string | null,
  fallback: AppLocale = 'en',
): AppLocale {
  if (preferred && SUPPORTED_LOCALES.includes(preferred as AppLocale)) {
    return preferred as AppLocale;
  }
  return fallback;
}

export function localeLanguageInstruction(locale: AppLocale): string {
  if (locale === 'hy') return 'Always respond to the customer in Armenian (Հայերեն).';
  if (locale === 'ru') return 'Always respond to the customer in Russian (Русский).';
  return 'Respond to the customer in English.';
}

export function localeDisplayName(locale: AppLocale): string {
  return LOCALE_NAMES[locale];
}

type MessageTree = { [key: string]: string | MessageTree };

const en: MessageTree = {
  assistant: {
    unavailable: 'The booking assistant is temporarily unavailable. Please use the booking steps below.',
    unknown: "I didn't quite catch that. Try asking who is available, what services you offer, or say something like \"Book a massage with Gevorg tomorrow at 10:00\".",
    helpPrompt: 'I can help you find a specialist, check open times, see services and prices, or book an appointment. What would you like to do?',
    noSpecialists: 'No specialists are available for booking right now. Please contact the business directly.',
    specialistsHeader: 'Here are our specialists:',
    noUpcomingSlots: 'No upcoming slots',
    open: 'Open',
    nextOn: 'Next on',
  },
  booking: {
    emailOrPhoneRequired: 'Email or phone number is required',
    invalidCredentials: 'Invalid credentials',
    emailRegistered: 'Email already registered',
  },
};

const hy: MessageTree = {
  assistant: {
    unavailable: 'Ամրագրման օգնականը ժամանակավորապես անհասանելի է։ Խնդրում ենք օգտագործել ստորևի ամրագրման քայլերը։',
    unknown: 'Չհասկացա։ Փորձեք հարցնել՝ ով է ազատ, ինչ ծառայություններ ունեք, կամ ասեք՝ «Ամրագրիր massage Gevorg-ի հետ վաղը 10:00-ին»։',
    helpPrompt: 'Կարող եմ օգնել գտնել մասնագետ, ստուգել ազատ ժամերը, տեսնել ծառայություններն ու գները կամ ամրագրել։ Ի՞նչ եք ցանկանում։',
    noSpecialists: 'Այս պահին ամրագրման համար մասնագետներ չկան։ Խնդրում ենք կապվել բիզնեսի հետ։',
    specialistsHeader: 'Մեր մասնագետները՝',
    noUpcomingSlots: 'Ազատ slot-եր չկան',
    open: 'Ազատ',
    nextOn: 'Հաջորդը',
  },
  booking: {
    emailOrPhoneRequired: 'Էլ. փոստ կամ հեռախոսահամար պարտադիր է',
    invalidCredentials: 'Սխալ մուտքի տվյալներ',
    emailRegistered: 'Էլ. փոստը արդեն գրանցված է',
  },
};

const ru: MessageTree = {
  assistant: {
    unavailable: 'Помощник по записи временно недоступен. Используйте шаги бронирования ниже.',
    unknown: 'Не совсем понял. Спросите, кто свободен, какие услуги есть, или скажите: «Запиши массаж с Gevorg на завтра в 10:00».',
    helpPrompt: 'Могу помочь найти специалиста, проверить время, показать услуги и цены или записать. Что вам нужно?',
    noSpecialists: 'Сейчас нет доступных специалистов для записи. Свяжитесь с бизнесом напрямую.',
    specialistsHeader: 'Наши специалисты:',
    noUpcomingSlots: 'Нет свободных слотов',
    open: 'Свободно',
    nextOn: 'Ближайшее',
  },
  booking: {
    emailOrPhoneRequired: 'Email или телефон обязателен',
    invalidCredentials: 'Неверные учётные данные',
    emailRegistered: 'Email уже зарегистрирован',
  },
};

const catalogs: Record<AppLocale, MessageTree> = { en, hy, ru };

function translate(messages: MessageTree, key: string): string {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : key;
}

export function t(locale: AppLocale, key: string, vars?: Record<string, string | number>): string {
  let text = translate(catalogs[locale] ?? catalogs.en, key);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}
