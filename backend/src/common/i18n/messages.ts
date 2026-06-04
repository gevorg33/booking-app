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
    nearestNeedsService: 'Which service would you like to book? Tell me the service name for the nearest available slot.',
    noNearestSlot: 'No upcoming open slots for {service}{after} in the next two weeks. Try another service or contact us directly.',
    availabilityNeedsDayOrService: 'Which day or service should I check? For example: "Free slots on Monday and Friday for massage" or "When is Gevorg free tomorrow?"',
    availabilityNeedsDay: 'Which day should I check for {service}? You can say Monday and Friday, this week, or tomorrow.',
    availabilityServiceNotFound: 'I couldn\'t find "{service}". Available services: {available}.',
    availabilityProviderNotFound: 'I couldn\'t find "{name}". Available specialists: {available}.',
    availabilityNoSlots: 'No open slots for {service} with {provider} on the requested day(s) ({days}). Try another day or specialist.',
    availabilityHeader: 'Open slots for {service} ({days} day(s)):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
    anyService: 'any service',
    anySpecialist: 'any specialist',
    recommendNeedsService: 'Which service should I rank specialists for? Available: {services}.',
    recommendHeader: 'Top-rated specialists for {service} ({period}):',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}: {times}',
    recommendNoReviews: 'No reviews yet',
    recommendRating: '★ {rating} ({count} reviews)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches: 'No available specialists for {service} during {period}. Try other days or services.',
    recommendPeriodDays: '{count} days',
  },
  booking: {
    emailOrPhoneRequired: 'Email or phone number is required',
    invalidCredentials: 'Invalid credentials',
    emailRegistered: 'Email already registered',
  },
  email: {
    appointment: 'appointment',
    appointments: 'appointments',
    defaultServiceName: 'Appointment',
    defaultProviderName: 'your provider',
    defaultCustomerName: 'there',
    footerNote: 'See you soon!',
    reminderHours: '{count} hours',
    reminderMinutes: '{count} minutes',
    reminderNow: 'now',
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} appointment(s) need confirmation',
    confirmPendingPrompt: 'Show my appointments today that still need confirmation',
    unpaidTodayTitle: '{count} unpaid appointment(s) today',
    unpaidTodayPrompt: 'Mark all completed appointments today as paid',
    gapsTodayTitle: '{count} open slot(s) this afternoon',
    gapsTodayPrompt: "What's on my schedule this afternoon? Any gaps?",
    nextUpTitle: 'Next: {customer} at {time}',
    nextUpPrompt: "Mark {customer}'s appointment at {time} as done and paid",
    emptyTodayTitle: 'No appointments today',
    emptyTodayPrompt: 'Summarize my schedule for {date}',
    defaultClient: 'client',
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
    nearestNeedsService: 'Ո՞ր ծառայությունն եք ցանկանում ամրագրել։ Ասեք ծառայության անունը՝ մոտակա ազատ slot-ի համար։',
    noNearestSlot: 'Հաջորդ երկու շաբաթվա ընթացքում {service}-ի համար ազատ slot{after} չկա։ Փորձեք այլ ծառայություն կամ կապվեք մեզ հետ։',
    availabilityNeedsDayOrService: 'Ո՞ր օր կամ ծառայություն ստուգեմ։ Օրինակ՝ «Ազատ slot-եր երկուշաբթի և ուրբաթ massage-ի համար» կամ «Ե՞րբ է Gevorg-ը ազատ վաղը»։',
    availabilityNeedsDay: 'Ո՞ր օրերն ենք ստուգում {service}-ի համար։ Կարող եք ասել երկուշաբթի և ուրբաթ, այս շաբաթ կամ վաղը։',
    availabilityServiceNotFound: '«{service}» ծառայությունը չգտա։ Հասանելի ծառայություններ՝ {available}։',
    availabilityProviderNotFound: '«{name}» մասնագետը չգտա։ Հասանելի մասնագետներ՝ {available}։',
    availabilityNoSlots: '{provider}-ի համար {service} ծառայության ազատ slot-եր չկան հարցված օր(եր)ին ({days})։ Փորձեք այլ օր կամ մասնագետ։',
    availabilityHeader: '{service}-ի ազատ slot-եր ({days} օր)—',
    availabilityDaySingleProvider: '{weekday} {date}՝ {times}',
    anyService: 'ցանկացած ծառայություն',
    anySpecialist: 'ցանկացած մասնագետ',
    recommendNeedsService: 'Ո՞ր ծառայության համար դասավորեմ մասնագետներին։ Հասանելի՝ {services}։',
    recommendHeader: 'Լավագույն վարկանիշով մասնագետներ {service}-ի համար ({period})՝',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}՝ {times}',
    recommendNoReviews: 'Դեռ կարծիքներ չկան',
    recommendRating: '★ {rating} ({count} կարծիք)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches: '{period} {service}-ի համար ազատ մասնագետներ չկան։ Փորձեք այլ օրեր կամ ծառայություններ։',
    recommendPeriodDays: '{count} օր',
  },
  booking: {
    emailOrPhoneRequired: 'Էլ. փոստ կամ հեռախոսահամար պարտադիր է',
    invalidCredentials: 'Սխալ մուտքի տվյալներ',
    emailRegistered: 'Էլ. փոստը արդեն գրանցված է',
  },
  email: {
    appointment: 'հանդիպում',
    appointments: 'հանդիպումներ',
    defaultServiceName: 'Հանդիպում',
    defaultProviderName: 'ձեր մասնագետը',
    defaultCustomerName: 'հարգելի',
    footerNote: 'Մինչ հանդիպումը!',
    reminderHours: '{count} ժամ',
    reminderMinutes: '{count} րոպե',
    reminderNow: 'հիմա',
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} ամրագրում պետք է հաստատվի',
    confirmPendingPrompt: 'Ցույց տուր այսօրվա ամրագրումները, որոնք դեռ սպասում են հաստատման',
    unpaidTodayTitle: 'Այսօր {count} չվճարված ամրագրում',
    unpaidTodayPrompt: 'Նշել այսօրվա բոլոր ավարտված ամրագրումները որպես վճարված',
    gapsTodayTitle: 'Այսօր կեսօրից հետո {count} ազատ slot',
    gapsTodayPrompt: 'Ինչ կա իմ գրաֆիկում այսօր կեսօրից հետո։ Կա՞ն ազատ slot-եր',
    nextUpTitle: 'Հաջորդը՝ {customer} {time}-ին',
    nextUpPrompt: 'Նշել {customer}-ի ամրագրումը {time}-ին որպես ավարտված և վճարված',
    emptyTodayTitle: 'Այսօր ամրագրումներ չկան',
    emptyTodayPrompt: 'Ամփոփիր իմ գրաֆիկը {date} ամսաթվի համար',
    defaultClient: 'հաճախորդ',
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
    nearestNeedsService: 'Какую услугу записать? Назовите услугу для ближайшего свободного времени.',
    noNearestSlot: 'Нет свободных слотов для {service}{after} в ближайшие две недели. Попробуйте другую услугу или свяжитесь с нами.',
    availabilityNeedsDayOrService: 'На какой день или услугу проверить? Например: «Свободные слоты в понедельник и пятницу для массажа» или «Когда Gevorg свободен завтра?»',
    availabilityNeedsDay: 'На какие дни проверить {service}? Можно сказать понедельник и пятницу, на этой неделе или завтра.',
    availabilityServiceNotFound: 'Услуга «{service}» не найдена. Доступные услуги: {available}.',
    availabilityProviderNotFound: 'Специалист «{name}» не найден. Доступные специалисты: {available}.',
    availabilityNoSlots: 'Нет свободных слотов для {service} у {provider} в указанные дни ({days}). Попробуйте другой день или специалиста.',
    availabilityHeader: 'Свободные слоты для {service} ({days} дн.):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
    anyService: 'любая услуга',
    anySpecialist: 'любой специалист',
    recommendNeedsService: 'Для какой услуги подобрать специалистов? Доступно: {services}.',
    recommendHeader: 'Лучшие специалисты для {service} ({period}):',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}: {times}',
    recommendNoReviews: 'Пока нет отзывов',
    recommendRating: '★ {rating} ({count} отзывов)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches: 'Нет доступных специалистов для {service} на {period}. Попробуйте другие дни или услуги.',
    recommendPeriodDays: '{count} дн.',
  },
  booking: {
    emailOrPhoneRequired: 'Email или телефон обязателен',
    invalidCredentials: 'Неверные учётные данные',
    emailRegistered: 'Email уже зарегистрирован',
  },
  email: {
    appointment: 'запись',
    appointments: 'записи',
    defaultServiceName: 'Запись',
    defaultProviderName: 'ваш специалист',
    defaultCustomerName: 'здравствуйте',
    footerNote: 'До встречи!',
    reminderHours: '{count} ч',
    reminderMinutes: '{count} мин',
    reminderNow: 'сейчас',
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} записей ждут подтверждения',
    confirmPendingPrompt: 'Покажи записи на сегодня, которые ещё нужно подтвердить',
    unpaidTodayTitle: '{count} неоплаченных записей сегодня',
    unpaidTodayPrompt: 'Отметить все завершённые записи сегодня как оплаченные',
    gapsTodayTitle: '{count} свободных слотов сегодня днём',
    gapsTodayPrompt: 'Что у меня в расписании сегодня днём? Есть свободные слоты?',
    nextUpTitle: 'Далее: {customer} в {time}',
    nextUpPrompt: 'Отметить запись {customer} в {time} как завершённую и оплаченную',
    emptyTodayTitle: 'На сегодня записей нет',
    emptyTodayPrompt: 'Кратко опиши моё расписание на {date}',
    defaultClient: 'клиент',
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
  if (text === key && locale !== 'en') {
    text = translate(catalogs.en, key);
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}
