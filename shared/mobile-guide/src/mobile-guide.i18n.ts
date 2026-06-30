import type { MobileGuideLocale, MobileGuideMessageTree } from './mobile-guide.types.ts';

/** Resolve dot-path key against a nested message tree. */
export function resolveMobileGuideI18nKey(
  messages: MobileGuideMessageTree,
  key: string,
): string | null {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = (cur as MobileGuideMessageTree)[part];
  }
  return typeof cur === 'string' ? cur : null;
}

export function resolveMobileGuideLocaleMessages(
  bundle: { i18n: Record<MobileGuideLocale, MobileGuideMessageTree> },
  locale: MobileGuideLocale,
): MobileGuideMessageTree {
  return bundle.i18n[locale] ?? bundle.i18n.en;
}

export function listMobileGuideI18nKeysForPlaybook(playbook: {
  titleKey: string;
  summaryKey?: string;
  voiceSummaryKey?: string;
  steps: readonly { titleKey: string; bodyKey: string; voiceSummaryKey?: string }[];
}): string[] {
  const keys = [playbook.titleKey];
  if (playbook.summaryKey) keys.push(playbook.summaryKey);
  if (playbook.voiceSummaryKey) keys.push(playbook.voiceSummaryKey);
  for (const step of playbook.steps) {
    keys.push(step.titleKey, step.bodyKey);
    if (step.voiceSummaryKey) keys.push(step.voiceSummaryKey);
  }
  return keys;
}
