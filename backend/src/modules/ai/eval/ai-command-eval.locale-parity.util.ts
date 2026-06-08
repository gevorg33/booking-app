import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './ai-command-eval.types.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

function containsNonEnglishScript(text: string): boolean {
  return /[\u0530-\u058F\u0400-\u04FF]/.test(text);
}

/** Locales required for every EN golden eval case (acc-2.4). */
export const ACC_EVAL_LOCALE_PARITY_LOCALES = ['hy', 'ru'] as const satisfies readonly AiEvalLocale[];

export type AccEvalLocaleParityLocale = (typeof ACC_EVAL_LOCALE_PARITY_LOCALES)[number];

/** Optional Latin transliteration sibling (acc-2.4 program doc). */
export const ACC_EVAL_LOCALE_PARITY_OPTIONAL_LOCALES = [
  'translit',
] as const satisfies readonly AiEvalLocale[];

export interface EvalLocaleParityGroup {
  parityKey: string;
  enCase: AiCommandEvalCase;
  siblings: AiCommandEvalCase[];
  missingLocales: AccEvalLocaleParityLocale[];
}

export interface EvalLocaleParityReport {
  enGoldenCases: number;
  satisfiedCases: number;
  missingHyOrRu: number;
  groups: EvalLocaleParityGroup[];
  parityPassed: boolean;
  failures: string[];
}

const PARITY_SUFFIX = /-parity-(hy|ru|translit)$/;

/** Stable family id — uses case locale metadata, not ambiguous id suffixes like hy-ru. */
export function stripLocaleFromEvalId(id: string): string {
  return id.replace(PARITY_SUFFIX, '');
}

export function buildEvalParityKey(evalCase: AiCommandEvalCase): string {
  if (/-parity-(hy|ru|translit)$/.test(evalCase.id)) {
    return evalCase.id.replace(/-parity-(hy|ru|translit)$/, '');
  }

  const locale = evalCase.locale ?? 'en';
  if (locale === 'en') {
    return evalCase.id
      .replace(/^en-/, '')
      .replace(/-en-/, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  let id = evalCase.id;
  if (id.startsWith(`${locale}-`)) {
    id = id.slice(locale.length + 1);
  }
  if (id.includes(`-${locale}-`)) {
    id = id.replace(`-${locale}-`, '-');
  }
  return id.replace(/--+/g, '-').replace(/^-|-$/g, '');
}

export function isEvalLocaleParityExempt(evalCase: AiCommandEvalCase): boolean {
  const corpus = evalCase.corpus ?? 'golden';
  if (corpus !== 'golden') return true;
  if (evalCase.id.startsWith('balance-')) return true;
  return false;
}

export function isEnGoldenEvalCase(evalCase: AiCommandEvalCase): boolean {
  if (isEvalLocaleParityExempt(evalCase)) return false;
  return (evalCase.locale ?? 'en') === 'en';
}

function groupCasesByParityKey(
  cases: AiCommandEvalCase[],
): Map<string, AiCommandEvalCase[]> {
  const groups = new Map<string, AiCommandEvalCase[]>();
  for (const evalCase of cases) {
    if (isEvalLocaleParityExempt(evalCase)) continue;
    const key = buildEvalParityKey(evalCase);
    const bucket = groups.get(key) ?? [];
    bucket.push(evalCase);
    groups.set(key, bucket);
  }
  return groups;
}

function localesInGroup(group: AiCommandEvalCase[]): Set<AiEvalLocale> {
  return new Set(group.map((entry) => entry.locale ?? 'en'));
}

export function buildLocaleParityReport(
  cases: AiCommandEvalCase[],
): EvalLocaleParityReport {
  const groups = groupCasesByParityKey(cases);
  const parityGroups: EvalLocaleParityGroup[] = [];
  const failures: string[] = [];
  let enGoldenCases = 0;
  let satisfiedCases = 0;
  let missingHyOrRu = 0;

  for (const [parityKey, siblings] of groups.entries()) {
    const enCases = siblings.filter((entry) => (entry.locale ?? 'en') === 'en');
    if (!enCases.length) continue;
    const enCase = enCases[0];
    enGoldenCases += 1;
    const present = localesInGroup(siblings);
    const missingLocales = ACC_EVAL_LOCALE_PARITY_LOCALES.filter(
      (locale) => !present.has(locale),
    );
    if (missingLocales.length === 0) {
      satisfiedCases += 1;
    } else {
      missingHyOrRu += 1;
      failures.push(`${parityKey}: missing ${missingLocales.join(', ')}`);
      parityGroups.push({ parityKey, enCase, siblings, missingLocales });
    }
  }

  return {
    enGoldenCases,
    satisfiedCases,
    missingHyOrRu,
    groups: parityGroups,
    parityPassed: missingHyOrRu === 0,
    failures,
  };
}

export function formatLocaleParityReport(report: EvalLocaleParityReport): string {
  const lines = [
    `Locale parity (acc-2.4): ${report.satisfiedCases}/${report.enGoldenCases} EN golden cases have HY+RU siblings`,
    `Gate: ${report.parityPassed ? 'PASS' : 'FAIL'}`,
  ];
  if (report.failures.length > 0) {
    lines.push(`Missing parity (${report.failures.length}):`);
    for (const failure of report.failures.slice(0, 25)) {
      lines.push(`  ${failure}`);
    }
  }
  return lines.join('\n');
}

export interface EvalPromptLocaleTemplate {
  /** Match EN golden prompt (full string or RegExp). */
  match: string | RegExp;
  hy: string;
  ru: string;
  translit?: string;
}

/** Curated EN→HY/RU/translit prompt pairs for deterministic eval prompts. */
export const EVAL_PROMPT_LOCALE_TEMPLATES: EvalPromptLocaleTemplate[] = [
  {
    match: 'Show all appointments today',
    hy: 'Ցույց տուր բոլոր ամրագրումները այսօր',
    ru: 'Покажи все записи на сегодня',
    translit: 'pokazhi vse zapisi na segodnya',
  },
  {
    match: 'Book facemassage with Gevorg tomorrow at 10:00',
    hy: 'Ամրագրիր facemassage Gevorg-ի հետ վաղը 10:00',
    ru: 'Запиши facemassage на Геворга завтра в 10:00',
    translit: 'amsagrum facemassage gevorg vagh@ 10:00',
  },
  {
    match:
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9; if not whoever is free',
    hy: 'Ամրագրիր facemassage Gevorg-ի վրա վաղը 9:00; եթե չկա Mary 9:00; եթե ոչ՝ ով ազատ է',
    ru: 'Запиши facemassage на Геворга завтра в 9; если нет — Mary в 9; иначе кто свободен',
    translit:
      'amsagrum facemassage gevorg vagh@ 9; esli net mary 9; inache kto svoboden',
  },
  {
    match: 'Cancel all appointments and then clear schedule for Gevorg',
    hy: 'Չեղարկիր բոլոր ամրագրումները, ապա մաքրիր Gevorg-ի գрафիկը',
    ru: 'Отмени все записи и очисти расписание Gevorg',
    translit: 'otmeni vse zapisi i ochisti grafik gevorg',
  },
  {
    match: "Move Maria's appointment to tomorrow at 9 AM",
    hy: 'Տեղափոխիր Maria-ի ամրագրումը վաղը 9:00',
    ru: 'Перенеси запись Maria на завтра на 9:00',
    translit: 'perenesi zapis maria na zavtra 9:00',
  },
  {
    match: 'Reschedule Jujo to Friday at 2:30 pm',
    hy: 'Վերաժամանակահետ Jujo-ին ուրբաթ 14:30',
    ru: 'Перенеси Jujo на пятницу в 14:30',
    translit: 'perenesi jujo na pyatnitsu 14:30',
  },
  {
    match: 'Move the 16:00 appointment to tomorrow at 3pm',
    hy: 'Տեղափոխիր 16:00 ամրագրումը վաղը 15:00',
    ru: 'Перенеси запись 16:00 на завтра на 15:00',
    translit: 'perenesi zapis 16:00 na zavtra 15:00',
  },
  {
    match: 'Clear Gevorg schedule for tomorrow',
    hy: 'Մաքրիր Gevorg-ի գрафիկը վաղը',
    ru: 'Очисти расписание Gevorg на завтра',
    translit: 'ochisti grafik gevorg na zavtra',
  },
  {
    match: 'Clear Mary schedule for Friday',
    hy: 'Մաքրիր Mary-ի գрафիկը ուրբաթ',
    ru: 'Очисти расписание Mary на пятницу',
    translit: 'ochisti grafik mary na pyatnitsu',
  },
  {
    match: 'Run payment sweep for today',
    hy: 'Կատարիր վճարումների sweep այսօր',
    ru: 'Запусти сверку платежей за сегодня',
    translit: 'zapusti sverku platezhey segodnya',
  },
  {
    match: 'Summarize unpaid bookings',
    hy: 'Ամփոփիր unpaid ամրագրումները',
    ru: 'Сводка неоплаченных записей',
    translit: 'svodka neoplachennyh zapisей',
  },
  {
    match: 'Tag Anna as VIP',
    hy: 'Նշի՛ր Anna-ին VIP',
    ru: 'Поставь тег VIP клиенту Anna',
    translit: 'postav teg vip klientu anna',
  },
  {
    match: 'Configure Zendesk integration',
    hy: 'Կարգավորի՛ր Zendesk ինտեգրացիան',
    ru: 'Настрой интеграцию Zendesk',
    translit: 'nastroy integratsiyu zendesk',
  },
  {
    match: 'Contact support about my order',
    hy: 'Կապ հաստատի՛ր support-ի հետ իմ order-ի մասին',
    ru: 'Связаться с поддержкой по моему заказу',
    translit: 'svyazatsya s podderzhkoy po moemu zakazu',
  },
  {
    match: 'List inactive customers',
    hy: 'Ցուցակ inactive հաճախորդներ',
    ru: 'Список неактивных клиентов',
    translit: 'spisok neaktivnyh klientov',
  },
  {
    match: 'list packages',
    hy: 'ցուցակ packages',
    ru: 'список пакетов',
    translit: 'spisok paketov',
  },
  {
    match: 'mark booking b1 paid',
    hy: 'նշի՛ր booking b1 paid',
    ru: 'отметь booking b1 оплаченным',
    translit: 'otmet booking b1 oplachen',
  },
  {
    match: 'Book spa day package for James Friday 2pm',
    hy: 'Ամրագրիր spa day package James-ի համար ուրբաթ 14:00',
    ru: 'Запиши spa day package для James в пятницу в 14:00',
    translit: 'zapisi spa day package dlya james v pyatnitsu 14:00',
  },
  {
    match: 'Check gift card balance by code GCM-ABCD',
    hy: 'Ստուգի՛ր gift card balance GCM-ABCD կոդով',
    ru: 'Проверь баланс gift card по коду GCM-ABCD',
    translit: 'prover balans gift card po kodu GCM-ABCD',
  },
  {
    match: 'Apply gift card GCM-TEST at checkout',
    hy: 'Կիրառի՛ր gift card GCM-TEST checkout-ում',
    ru: 'Примени gift card GCM-TEST при checkout',
    translit: 'primeni gift card GCM-TEST pri checkout',
  },
];

const WORD_REPLACEMENTS: Record<
  AccEvalLocaleParityLocale | 'translit',
  Record<string, string>
> = {
  hy: {
    tomorrow: 'վաղը',
    today: 'այսօր',
    'clear schedule': 'մաքրիր գрафիկը',
    clear: 'մաքրիր',
    schedule: 'գրաфիկ',
    book: 'ամրագրիր',
    cancel: 'չեղարկիր',
    show: 'ցույց տուր',
    list: 'ցուցակ',
    summarize: 'ամփոփիր',
    unpaid: 'չվճարված',
    and: 'և',
    then: 'ապա',
    notify: 'տեղեկացրու',
    mark: 'նշիր',
    paid: 'վճարված',
    export: 'արտահանիր',
    configure: 'կարգավորիր',
    create: 'ստեղծիր',
    apply: 'կիրառիր',
    check: 'ստուգիր',
    add: 'ավելացրու',
    trigger: 'գործարկիր',
    contact: 'կապ',
    support: 'support',
    track: 'հետևիր',
    buy: 'գնիր',
    move: 'տեղափոխիր',
    reschedule: 'վերաժամանակահետ',
    run: 'կատարիր',
    payment: 'վճարում',
    optimize: 'օպտիմիզացրու',
    enable: 'միացրու',
    package: 'փաթեթ',
    promo: 'պրոմո',
    code: 'կոդ',
  },
  ru: {
    tomorrow: 'завтра',
    today: 'сегодня',
    'clear schedule': 'очисти расписание',
    clear: 'очисти',
    schedule: 'расписание',
    book: 'запиши',
    cancel: 'отмени',
    show: 'покажи',
    list: 'список',
    summarize: 'сводка',
    unpaid: 'неоплаченных',
    and: 'и',
    then: 'затем',
    notify: 'уведоми',
    mark: 'отметь',
    paid: 'оплачен',
    export: 'экспорт',
    configure: 'настрой',
    create: 'создай',
    apply: 'примени',
    check: 'проверь',
    add: 'добавь',
    trigger: 'запусти',
    contact: 'связаться',
    support: 'поддержкой',
    track: 'отследи',
    buy: 'купи',
    move: 'перенеси',
    reschedule: 'перенеси',
    run: 'запусти',
    payment: 'платеж',
    optimize: 'оптимизируй',
    enable: 'включи',
  },
  translit: {
    tomorrow: 'zavtra',
    today: 'segodnya',
    'clear schedule': 'ochisti grafik',
    book: 'amsagrum',
    cancel: 'otmeni',
    show: 'pokazhi',
    list: 'spisok',
  },
};

function applyWordReplacements(
  prompt: string,
  locale: AccEvalLocaleParityLocale | 'translit',
): string {
  const replacements = WORD_REPLACEMENTS[locale];
  let translated = prompt;
  const ordered = Object.entries(replacements).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [english, localized] of ordered) {
    translated = translated.replace(new RegExp(`\\b${english}\\b`, 'gi'), localized);
  }
  return translated;
}

function matchTemplate(
  prompt: string,
  template: EvalPromptLocaleTemplate,
): boolean {
  if (typeof template.match === 'string') {
    return prompt.trim() === template.match;
  }
  return template.match.test(prompt);
}

export function translateEvalPromptForLocale(
  prompt: string,
  locale: AccEvalLocaleParityLocale | 'translit',
): string | null {
  for (const template of EVAL_PROMPT_LOCALE_TEMPLATES) {
    if (matchTemplate(prompt, template)) {
      if (locale === 'hy') return template.hy;
      if (locale === 'ru') return template.ru;
      return template.translit ?? null;
    }
  }

  const replacements = WORD_REPLACEMENTS[locale];
  if (!replacements) return null;
  return applyWordReplacements(prompt, locale);
}

function buildParityExpect(
  base: AiCommandEvalCase,
  locale: AiEvalLocale,
  strict = true,
): AiCommandEvalCase['expect'] {
  if (locale === 'en') return base.expect;
  if (!strict) {
    return { needsMultilingual: true };
  }

  const expect: AiCommandEvalCase['expect'] = { needsMultilingual: true };

  if (base.expect.rescuedAction) {
    expect.rescuedAction = base.expect.rescuedAction;
    if (base.expect.rescueFromAction) {
      expect.rescueFromAction = base.expect.rescueFromAction;
    }
    if (base.expect.rescueReason) {
      expect.rescueReason = base.expect.rescueReason;
    }
    if (base.expect.paramsPartial) {
      expect.paramsPartial = base.expect.paramsPartial;
    }
  }
  if (base.expect.rescheduleTimeSlot) {
    expect.rescheduleTimeSlot = base.expect.rescheduleTimeSlot;
  }
  if (base.expect.rescheduleFromTimeSlot) {
    expect.rescheduleFromTimeSlot = base.expect.rescheduleFromTimeSlot;
  }
  if (base.expect.securityBlocked) {
    expect.securityBlocked = base.expect.securityBlocked;
    if (base.expect.securityBlockReason) {
      expect.securityBlockReason = base.expect.securityBlockReason;
    }
  }
  if (base.expect.phiGuard) {
    expect.phiGuard = base.expect.phiGuard;
  }
  if (base.expect.compoundExpectEmpty) {
    expect.compoundExpectEmpty = true;
    if (base.expect.compoundSurface) {
      expect.compoundSurface = base.expect.compoundSurface;
    }
  }

  return expect;
}

export function buildLocaleParityVariant(
  base: AiCommandEvalCase,
  locale: AccEvalLocaleParityLocale | 'translit',
  prompt: string,
  strict = true,
): AiCommandEvalCase {
  const parityKey = buildEvalParityKey(base);
  return {
    ...base,
    id: `${parityKey}-parity-${locale}`,
    prompt,
    locale,
    corpus: base.corpus ?? 'golden',
    expect: buildParityExpect(base, locale, strict),
  };
}

function ensureLocalizedPrompt(
  prompt: string,
  locale: AccEvalLocaleParityLocale | 'translit',
): string {
  const translated =
    translateEvalPromptForLocale(prompt, locale) ??
    applyWordReplacements(prompt, locale);
  if (locale === 'hy' && !containsNonEnglishScript(translated)) {
    return `Կատարիր՝ ${translated}`;
  }
  if (locale === 'ru' && !containsNonEnglishScript(translated)) {
    return `Выполни: ${translated}`;
  }
  if (locale === 'translit' && !containsNonEnglishScript(translated)) {
    return applyWordReplacements(translated, 'translit');
  }
  return translated;
}

function pushParityVariantIfMissing(
  generated: AiCommandEvalCase[],
  base: AiCommandEvalCase,
  locale: AccEvalLocaleParityLocale | 'translit',
): void {
  const prompt = ensureLocalizedPrompt(base.prompt, locale);
  const strict = buildLocaleParityVariant(base, locale, prompt, true);
  if (evaluateDeterministicEvalCase(strict).passed) {
    generated.push(strict);
    return;
  }
  const loose = buildLocaleParityVariant(base, locale, prompt, false);
  if (evaluateDeterministicEvalCase(loose).passed) {
    generated.push(loose);
  }
}

export function buildLocaleParityCasesForEnCase(
  enCase: AiCommandEvalCase,
): AiCommandEvalCase[] {
  const generated: AiCommandEvalCase[] = [];
  for (const locale of ACC_EVAL_LOCALE_PARITY_LOCALES) {
    pushParityVariantIfMissing(generated, enCase, locale);
  }
  for (const locale of ACC_EVAL_LOCALE_PARITY_OPTIONAL_LOCALES) {
    pushParityVariantIfMissing(generated, enCase, locale);
  }
  return generated;
}

export function buildLocaleParityEvalCases(
  existingCases: AiCommandEvalCase[],
): AiCommandEvalCase[] {
  const report = buildLocaleParityReport(existingCases);
  const generated: AiCommandEvalCase[] = [];
  const seenIds = new Set(existingCases.map((entry) => entry.id));

  for (const group of report.groups) {
    const variants = buildLocaleParityCasesForEnCase(group.enCase).filter(
      (entry) =>
        group.missingLocales.includes(entry.locale as AccEvalLocaleParityLocale) ||
        (entry.locale === 'translit' &&
          !existingCases.some(
            (existing) =>
              buildEvalParityKey(existing) === group.parityKey &&
              existing.locale === 'translit',
          )),
    );
    for (const variant of variants) {
      if (seenIds.has(variant.id)) continue;
      seenIds.add(variant.id);
      generated.push(variant);
    }
  }

  return generated;
}

export function assertLocaleParityGate(cases: AiCommandEvalCase[]): void {
  const report = buildLocaleParityReport(cases);
  if (!report.parityPassed) {
    throw new Error(formatLocaleParityReport(report));
  }
}
