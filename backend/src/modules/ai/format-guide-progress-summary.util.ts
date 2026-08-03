import type { AppLocale } from '../../common/i18n/messages.js';

/**
 * e2e-bug.219 — localize the `Step N of M:` chrome prepended to guide summaries.
 * Mirrors frontend `ai.guideStepOf` (en / hy / ru).
 */
const GUIDE_STEP_OF: Record<AppLocale, string> = {
  en: 'Step {current} of {total}',
  hy: 'Քայլ {current}/{total}',
  ru: 'Шаг {current} из {total}',
};

const GUIDE_STEP_FALLBACK_TITLE: Record<AppLocale, string> = {
  en: 'Guide step',
  hy: 'Ուղեցույցի քայլ',
  ru: 'Шаг гида',
};

export function formatGuideStepOfLabel(
  current: number,
  total: number,
  locale: AppLocale = 'en',
): string {
  const template = GUIDE_STEP_OF[locale] ?? GUIDE_STEP_OF.en;
  return template
    .replace('{current}', String(current))
    .replace('{total}', String(total));
}

export function formatGuideProgressSummary(
  current: number,
  total: number,
  stepTitle: string | null | undefined,
  locale: AppLocale = 'en',
): string {
  const title =
    (typeof stepTitle === 'string' && stepTitle.trim()) ||
    GUIDE_STEP_FALLBACK_TITLE[locale] ||
    GUIDE_STEP_FALLBACK_TITLE.en;
  return `${formatGuideStepOfLabel(current, total, locale)}: ${title}`;
}
