import type {
  ImplicationCorpusScenario,
  ImplicationTopIntent,
} from './ai-implication-corpus.fixtures.js';

/** pipe-1.11.5 — HY/RU implication corpus siblings (acc-2.4 partial). */
export const IMPLICATION_CORPUS_LOCALE_PIPE_MARKER = 'pipe-1.11.5';

type ImplicationI18nRow = {
  enScenarioId: string;
  topIntent: ImplicationTopIntent;
  expectedAction: string;
  expectedTopAnchorId?: string;
  minScore?: number;
  hy: string;
  ru: string;
};

/** EN rows already covered with distinct hy/ru ids in the base corpus. */
export const IMPLICATION_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'en-hair-long-implied-booking': {
    hy: 'hy-trim-implied-booking',
    ru: 'ru-trim-implied-booking',
  },
  'en-work-time-implied-schedule': {
    hy: 'hy-work-hours-implied-schedule',
    ru: 'ru-work-hours-implied-schedule',
  },
};

const IMPLICATION_I18N_ROWS: ImplicationI18nRow[] = [
  {
    enScenarioId: 'en-nails-chipped-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Եղունգներս կոտրվել են, մանիկյուրի կարիք ունեմ շուտով',
    ru: 'Ногти сломались, давно пора на маникюр скоро',
  },
  {
    enScenarioId: 'en-roots-color-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Ռեգենները երևում են, շատ կարիք ունեմ գույնի թարմացման',
    ru: 'Отросли корни, очень нужно освежить окрашивание скоро',
  },
  {
    enScenarioId: 'en-facial-overdue-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Դեմքի մաքրումից բազ մասին անցել է, շուտ պետք է',
    ru: 'С последней чистки лица прошло много месяцев, пора снова',
  },
  {
    enScenarioId: 'en-massage-need-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Մեջքը լարված է, մերսման սեսիայի կարիք ունեմ շուտով',
    ru: 'Спина напряжена, нужен массаж скоро',
  },
  {
    enScenarioId: 'en-beard-unkempt-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Մորուքը խլմուկ է դառնում, կտրվածք պետք է շաբաթվա վերջին',
    ru: 'Борода растет неряшливо, нужна стрижка до выходных',
  },
  {
    enScenarioId: 'en-brows-unruly-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Հաճերը խաչաձև են դառնում, ուզում եմ ձևավորում շուտով',
    ru: 'Брови растут неровно, хочу коррекцию скоро',
  },
  {
    enScenarioId: 'en-dental-due-implied-booking',
    topIntent: 'booking',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    hy: 'Հնացել է ատամի մանրագույն մաքրումը, այց է պետք շուտով',
    ru: 'Давно не была на чистке зубов, нужен визит скоро',
  },
  {
    enScenarioId: 'en-new-hire-shifts-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    hy: 'Նոր աշխատողին հերթացուցակում ստանդարտ հերթեր են պետք հաջորդ ամիս',
    ru: 'Новому сотруднику нужны стандартные смены в графике на следующий месяц',
  },
  {
    enScenarioId: 'en-weekday-blocks-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    hy: 'Աշխատակիցին առավոտյան հերթացուցակի բլոկներ են պետք աշխատանքային օրերին',
    ru: 'Сотруднику нужны утренние смены в графике на буднях',
  },
  {
    enScenarioId: 'en-recurring-shifts-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    hy: 'Կրկնվող աշխատանքային հերթեր ավելացնել մինչև ուրբաթ',
    ru: 'Поставь повторяющиеся рабочие смены до пятницы',
  },
  {
    enScenarioId: 'en-normal-hours-grid-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    hy: 'Նորմալ աշխատանքային ժամեր ավելացնել գրաֆիկում հաջորդ շաբաթվա համար',
    ru: 'Добавь обычные рабочие часы в расписание на следующую неделю',
  },
  {
    enScenarioId: 'en-shift-pattern-week-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    hy: 'Սահմանել աշխատանքային ժամերը պլաներում առաջիկա շաբաթվա համար',
    ru: 'Настроить рабочие часы в планировщике на грядущую неделю',
  },
  {
    enScenarioId: 'en-coverage-blocks-planner-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    hy: 'Հերթացուցակում ապահովման բլոկներ են պետք աշխատանքային օրերին կեսօր',
    ru: 'Нужны блоки покрытия в графике на будние после обеда',
  },
  {
    enScenarioId: 'en-morning-blocks-implied-schedule',
    topIntent: 'schedule',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-work-time',
    minScore: 0.65,
    hy: 'Աշխատակցին պետք է բացել սովորական ժամերը օրացույցում',
    ru: 'Сотруднику нужно открыть обычные часы в календаре',
  },
  {
    enScenarioId: 'en-wondering-fit-in-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հետաքրքրում է՝ արդյոք մեկը ազատ է վաղը թարմացման համար',
    ru: 'Интересно, есть ли окно завтра на наращивание ресниц',
  },
  {
    enScenarioId: 'en-hoping-opening-massage-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հույս ունեմ մեկը ազատ է մերսման համար այս շաբաթ',
    ru: 'Надеюсь, у кого-то есть окно на массаж на этой неделе',
  },
  {
    enScenarioId: 'en-curious-room-highlights-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հետաքրքրում է՝ որ մասնագետներն ունեն տեղ highlights-ի համար վաղը երեկոյան',
    ru: 'Интересно, у каких мастеров есть место на мелирование завтра вечером',
  },
  {
    enScenarioId: 'en-trying-find-opening-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Փորձում եմ հասկանալ՝ ազատ slot կա այս երեկո կտրվածքի համար',
    ru: 'Пытаюсь понять, есть ли окно на стрижку сегодня вечером',
  },
  {
    enScenarioId: 'en-before-commit-openings-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Նախքան որոշելը՝ ում է ազատ հինգշաբթի երեկոյան',
    ru: 'Прежде чем решиться, кто свободен для услуги в четверг вечером',
  },
  {
    enScenarioId: 'en-squeeze-in-facial-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հույս ունեմ թիմն ունի ազատ slot շաբաթ օրը առավոտյան դեմքի համար',
    ru: 'Надеюсь, в команде есть окно в субботу утром на чистку лица',
  },
  {
    enScenarioId: 'en-anyone-floor-blowouts-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    minScore: 0.65,
    hy: 'Հետաքրքրում է՝ հարկում կա՞ մեկը blowout-ի համար վաղը',
    ru: 'Интересно, есть ли на смене кто делает укладку завтра',
  },
  {
    enScenarioId: 'en-team-time-brows-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հետաքրքրում է՝ ում է տեղ հաճերի ձևավորման համար ուրբաթ',
    ru: 'Интересно, у кого из команды есть место на коррекцию бровей в пятницу',
  },
  {
    enScenarioId: 'en-specialists-room-spa-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Փնտրում եմ ով կարող է ընդունել spa package հաջորդ շաբաթ',
    ru: 'Ищу, кто может принять клиентов на spa-пакет на следующей неделе',
  },
  {
    enScenarioId: 'en-not-sure-color-tomorrow-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-check-who-free',
    minScore: 0.65,
    hy: 'Չգիտեմ ով է անում գույնը վաղը կեսօր',
    ru: 'Не уверен, кто делает окрашивание завтра днем',
  },
  {
    enScenarioId: 'en-chance-slot-tonight-implied-availability',
    topIntent: 'availability',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    hy: 'Հույս ունեմ ինչ-որ մեկը կարող է highlights վաղը գիշերը',
    ru: 'Надеюсь, кто-то из персонала сможет сделать мелирование завтра вечером',
  },
];

function resolveLocaleAnchorId(
  anchorId: string | undefined,
  locale: 'hy' | 'ru',
): string | undefined {
  if (!anchorId) return undefined;
  if (anchorId.startsWith('en-')) {
    return anchorId.replace(/^en-/, `${locale}-`);
  }
  return anchorId;
}

function buildImplicationMultilingualScenarios(): ImplicationCorpusScenario[] {
  const rows: ImplicationCorpusScenario[] = [];

  for (const entry of IMPLICATION_I18N_ROWS) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.enScenarioId.replace(/^en-/, `${locale}-`)}`,
        topIntent: entry.topIntent,
        prompt: locale === 'hy' ? entry.hy : entry.ru,
        surface: 'dashboard',
        expectedAction: entry.expectedAction,
        expectedTopAnchorId: resolveLocaleAnchorId(
          entry.expectedTopAnchorId,
          locale,
        ),
        minScore: entry.minScore,
        locale,
      });
    }
  }

  return rows;
}

export const IMPLICATION_EN_SCENARIO_IDS: string[] = [
  ...IMPLICATION_I18N_ROWS.map((row) => row.enScenarioId),
  ...Object.keys(IMPLICATION_LEGACY_LOCALE_SIBLING_IDS),
];

export const IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS: ImplicationCorpusScenario[] =
  buildImplicationMultilingualScenarios();
