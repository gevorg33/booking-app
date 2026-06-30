import {
  listMobileGuideI18nKeysForPlaybook,
  resolveMobileGuideI18nKey,
  resolveMobileGuideLocaleMessages,
} from './mobile-guide.i18n.ts';
import { mergeGuideFlowPlaybooks } from './mobile-guide.merge.util.ts';
import type {
  GuideFlowPlaybookDef,
  MobileGuideBundle,
  MobileGuideListContext,
  MobileGuideLocale,
  ResolvedGuideFlowPlaybook,
} from './mobile-guide.types.ts';

function resolveFlowText(
  messages: ReturnType<typeof resolveMobileGuideLocaleMessages>,
  key: string,
): string {
  return resolveMobileGuideI18nKey(messages, key) ?? key;
}

export function resolveGuideFlowPlaybook(
  playbook: GuideFlowPlaybookDef,
  locale: MobileGuideLocale,
  bundle: MobileGuideBundle,
): ResolvedGuideFlowPlaybook {
  const messages = resolveMobileGuideLocaleMessages(bundle, locale);
  return {
    topicId: playbook.topicId,
    surface: bundle.surface,
    routes: playbook.routes,
    title: resolveFlowText(messages, playbook.titleKey),
    summary: playbook.summaryKey
      ? resolveFlowText(messages, playbook.summaryKey)
      : undefined,
    voiceSummary: playbook.voiceSummaryKey
      ? resolveFlowText(messages, playbook.voiceSummaryKey)
      : undefined,
    steps: playbook.steps.map((step) => ({
      title: resolveFlowText(messages, step.titleKey),
      body: resolveFlowText(messages, step.bodyKey),
      voiceSummary: step.voiceSummaryKey
        ? resolveFlowText(messages, step.voiceSummaryKey)
        : undefined,
      navigate: step.navigate,
    })),
    navigateTarget: playbook.navigateTarget,
    corpusTopicId: playbook.corpusTopicId,
    verticals: playbook.verticals,
    roles: playbook.roles,
    keywords: playbook.keywords,
  };
}

export function listGuideTopics(
  ctx: MobileGuideListContext,
  bundle: MobileGuideBundle,
): GuideFlowPlaybookDef[] {
  return mergeGuideFlowPlaybooks(ctx, bundle.playbooks, bundle.overlays);
}

export function resolveGuidePlaybook(
  topicId: string,
  locale: MobileGuideLocale,
  ctx: MobileGuideListContext,
  bundle: MobileGuideBundle,
): ResolvedGuideFlowPlaybook | null {
  const playbook = listGuideTopics(ctx, bundle).find((row) => row.topicId === topicId);
  if (!playbook) return null;
  return resolveGuideFlowPlaybook(playbook, locale, bundle);
}

export function assertMobileGuideCatalogIntegrity(bundle: MobileGuideBundle): void {
  const topicIds = new Set<string>();
  for (const playbook of [...bundle.playbooks, ...bundle.overlays.flatMap((o) => o.playbooks)]) {
    if (topicIds.has(playbook.topicId)) {
      throw new Error(`duplicate mobile guide topicId: ${playbook.topicId}`);
    }
    topicIds.add(playbook.topicId);
  }

  for (const playbook of bundle.playbooks) {
    if (playbook.surface !== bundle.surface) {
      throw new Error(
        `playbook ${playbook.topicId} surface mismatch: expected ${bundle.surface}, got ${playbook.surface}`,
      );
    }
  }
}

export function assertMobileGuideI18nCoverage(
  bundle: MobileGuideBundle,
  locale: MobileGuideLocale = 'en',
): void {
  const messages = resolveMobileGuideLocaleMessages(bundle, locale);
  for (const playbook of [...bundle.playbooks, ...bundle.overlays.flatMap((o) => o.playbooks)]) {
    for (const key of listMobileGuideI18nKeysForPlaybook(playbook)) {
      const resolved = resolveMobileGuideI18nKey(messages, key);
      if (!resolved) {
        throw new Error(`missing mobile guide i18n key ${key} for ${playbook.topicId} (${locale})`);
      }
    }
  }
}
