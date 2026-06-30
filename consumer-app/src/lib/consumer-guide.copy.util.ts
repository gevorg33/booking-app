import type { GuideFlowPlaybookDef, MobileGuideBundle, MobileGuideLocale } from '@mobile-guide/mobile-guide.types.ts';
import {
  listMobileGuideI18nKeysForPlaybook,
  resolveMobileGuideI18nKey,
  resolveMobileGuideLocaleMessages,
} from '@mobile-guide/index.ts';

const ARMENIAN_SCRIPT = /[\u0530-\u058F]/;
const CYRILLIC_SCRIPT = /[\u0400-\u04FF]/;

export const CONSUMER_GUIDE_COPY_LOCALES: readonly MobileGuideLocale[] = ['en', 'hy', 'ru'];

export interface ConsumerGuideCopyScenario {
  id: string;
  topicId: string;
  titleKey: string;
  summaryKey?: string;
}

/** Customer-surface playbooks shipped in the consumer mobile bundle (ai-guide-1.9.4). */
export function listConsumerMobileGuidePlaybooks(
  bundle: MobileGuideBundle,
): GuideFlowPlaybookDef[] {
  const overlayPlaybooks = bundle.overlays.flatMap((overlay) =>
    overlay.playbooks.filter((playbook) => playbook.surface === bundle.surface),
  );
  return [...bundle.playbooks, ...overlayPlaybooks].sort((a, b) =>
    a.topicId.localeCompare(b.topicId),
  );
}

export function buildConsumerGuideCopyScenarios(
  bundle: MobileGuideBundle,
): ConsumerGuideCopyScenario[] {
  return listConsumerMobileGuidePlaybooks(bundle).map((playbook) => ({
    id: playbook.topicId,
    topicId: playbook.topicId,
    titleKey: playbook.titleKey,
    summaryKey: playbook.summaryKey,
  }));
}

export function consumerGuideLocaleHasScript(
  locale: MobileGuideLocale,
  text: string,
): boolean {
  if (locale === 'hy') return ARMENIAN_SCRIPT.test(text);
  if (locale === 'ru') return CYRILLIC_SCRIPT.test(text);
  return true;
}

export function resolveConsumerGuideCopyKey(
  bundle: MobileGuideBundle,
  locale: MobileGuideLocale,
  key: string,
): string | null {
  const messages = resolveMobileGuideLocaleMessages(bundle, locale);
  return resolveMobileGuideI18nKey(messages, key);
}

export function listConsumerGuideCopyKeysForTopic(
  bundle: MobileGuideBundle,
  topicId: string,
): string[] {
  const playbook = listConsumerMobileGuidePlaybooks(bundle).find(
    (row) => row.topicId === topicId,
  );
  if (!playbook) {
    throw new Error(`unknown consumer guide topicId: ${topicId}`);
  }
  return listMobileGuideI18nKeysForPlaybook(playbook);
}

export function assertConsumerGuideCopyLocaleCoverage(
  bundle: MobileGuideBundle,
  locale: MobileGuideLocale,
): void {
  const playbooks = listConsumerMobileGuidePlaybooks(bundle);
  for (const playbook of playbooks) {
    for (const key of listMobileGuideI18nKeysForPlaybook(playbook)) {
      const resolved = resolveConsumerGuideCopyKey(bundle, locale, key);
      if (!resolved?.trim()) {
        throw new Error(
          `missing consumer guide copy ${key} for ${playbook.topicId} (${locale})`,
        );
      }
    }
  }
}
