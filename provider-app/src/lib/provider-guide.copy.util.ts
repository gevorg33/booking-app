import type { GuideFlowPlaybookDef, MobileGuideBundle, MobileGuideLocale } from '@mobile-guide/mobile-guide.types.ts';
import {
  listMobileGuideI18nKeysForPlaybook,
  resolveMobileGuideI18nKey,
  resolveMobileGuideLocaleMessages,
} from '@mobile-guide/index.ts';

const ARMENIAN_SCRIPT = /[\u0530-\u058F]/;
const CYRILLIC_SCRIPT = /[\u0400-\u04FF]/;

export const PROVIDER_GUIDE_COPY_LOCALES: readonly MobileGuideLocale[] = ['en', 'hy', 'ru'];

export interface ProviderGuideCopyScenario {
  id: string;
  topicId: string;
  titleKey: string;
  summaryKey?: string;
}

/** Provider-surface playbooks shipped in the provider mobile bundle (ai-guide-1.9.10). */
export function listProviderMobileGuidePlaybooks(
  bundle: MobileGuideBundle,
): GuideFlowPlaybookDef[] {
  const overlayPlaybooks = bundle.overlays.flatMap((overlay) =>
    overlay.playbooks.filter((playbook) => playbook.surface === bundle.surface),
  );
  return [...bundle.playbooks, ...overlayPlaybooks].sort((a, b) =>
    a.topicId.localeCompare(b.topicId),
  );
}

export function buildProviderGuideCopyScenarios(
  bundle: MobileGuideBundle,
): ProviderGuideCopyScenario[] {
  return listProviderMobileGuidePlaybooks(bundle).map((playbook) => ({
    id: playbook.topicId,
    topicId: playbook.topicId,
    titleKey: playbook.titleKey,
    summaryKey: playbook.summaryKey,
  }));
}

export function providerGuideLocaleHasScript(
  locale: MobileGuideLocale,
  text: string,
): boolean {
  if (locale === 'hy') return ARMENIAN_SCRIPT.test(text);
  if (locale === 'ru') return CYRILLIC_SCRIPT.test(text);
  return true;
}

export function resolveProviderGuideCopyKey(
  bundle: MobileGuideBundle,
  locale: MobileGuideLocale,
  key: string,
): string | null {
  const messages = resolveMobileGuideLocaleMessages(bundle, locale);
  return resolveMobileGuideI18nKey(messages, key);
}

export function listProviderGuideCopyKeysForTopic(
  bundle: MobileGuideBundle,
  topicId: string,
): string[] {
  const playbook = listProviderMobileGuidePlaybooks(bundle).find(
    (row) => row.topicId === topicId,
  );
  if (!playbook) {
    throw new Error(`unknown provider guide topicId: ${topicId}`);
  }
  return listMobileGuideI18nKeysForPlaybook(playbook);
}

export function assertProviderGuideCopyLocaleCoverage(
  bundle: MobileGuideBundle,
  locale: MobileGuideLocale,
): void {
  const playbooks = listProviderMobileGuidePlaybooks(bundle);
  for (const playbook of playbooks) {
    for (const key of listMobileGuideI18nKeysForPlaybook(playbook)) {
      const resolved = resolveProviderGuideCopyKey(bundle, locale, key);
      if (!resolved?.trim()) {
        throw new Error(
          `missing provider guide copy ${key} for ${playbook.topicId} (${locale})`,
        );
      }
    }
  }
}
