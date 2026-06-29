import {
  DASHBOARD_GUIDE_CORPUS_TOC,
  DASHBOARD_GUIDE_CORPUS_TOPICS,
  DASHBOARD_GUIDE_PAGE_ANCHORS,
  GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID,
  HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID,
  buildDashboardGuideTopicUrl,
} from './dashboard-guide-corpus.manifest.js';
import {
  assertGuideCorpusIntegrity,
  getGuideCorpusTopic,
  getGuideCorpusTopicByAnchor,
  getGuideCorpusTopicByHelpCenterId,
  isGuideCorpusTopicId,
  listAllGuideCorpusI18nKeys,
  listGuideCorpusI18nKeys,
  listGuideCorpusTopics,
  resolveGuideCorpusTopic,
} from './ai-guide-corpus.util.js';
import {
  assertFrontendGuideI18nPresent,
  listGuideCorpusLocales,
  resolveGuideCorpusI18nKey,
} from './ai-guide-corpus-i18n.util.js';
import { getFrontendGuideCorpusMessages } from './ai-guide-corpus-i18n.fixtures.js';
import { DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX } from './dashboard-guide-corpus.cross-link.util.js';
import { assertGuideFlowRouteCoverage } from './guide-flow.routes.manifest.js';
import { assertGuideFlowCatalogIntegrity } from './guide-flow.loader.js';

describe('ai-guide-corpus (ai-guide-1.1.1)', () => {
  it('ships stable unique topicIds aligned with dashboard guide anchors', () => {
    assertGuideCorpusIntegrity();
    expect(DASHBOARD_GUIDE_CORPUS_TOPICS).toHaveLength(21);
    expect(DASHBOARD_GUIDE_PAGE_ANCHORS).toEqual([
      'schedule',
      'calendar',
      'employees',
      'overview',
      'problems',
      'workflow',
      'locations',
      'inventory',
      'expenses',
      'commissions',
      'pl',
      'tips',
      'ai-overview',
      'ai-getting-started',
      'ai-command-bar',
      'ai-dashboard',
      'ai-approval',
      'ai-ops',
      'ai-mobile',
      'ai-examples',
      'ai-tips',
    ]);
  });

  it('guide-flow playbooks cover dashboard nav routes (ai-guide-1.1.2)', () => {
    assertGuideFlowCatalogIntegrity();
    assertGuideFlowRouteCoverage();
  });

  it('maps help-center topics and guide anchors to corpus topicIds', () => {
    expect(getGuideCorpusTopicByAnchor('schedule')?.topicId).toBe(
      'dashboard.core.schedule',
    );
    expect(getGuideCorpusTopicByHelpCenterId('operations-inventory')?.topicId).toBe(
      'dashboard.operations.inventory',
    );
    expect(HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID.schedule).toBe(
      'dashboard.core.schedule',
    );
    expect(buildDashboardGuideTopicUrl('dashboard.ai.command-bar')).toBe(
      '/dashboard/guide#ai-command-bar',
    );
  });

  it('builds cross-link index rows from manifest title refs (ai-guide-1.3.4)', () => {
    expect(DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX).toHaveLength(
      DASHBOARD_GUIDE_CORPUS_TOPICS.length,
    );
    for (const row of DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX) {
      const topic = getGuideCorpusTopic(row.topicId);
      expect(topic.anchor).toBe(row.anchor);
      expect(row.titleKey).toBe(
        topic.content.find((entry) => entry.kind === 'title')?.i18nKey,
      );
    }
  });

  it('lists TOC groups matching dashboard guide nav sections', () => {
    expect(DASHBOARD_GUIDE_CORPUS_TOC.map((group) => group.id)).toEqual([
      'core',
      'operations',
      'ai',
    ]);
    expect(listGuideCorpusTopics({ group: 'core' })).toHaveLength(3);
    expect(listGuideCorpusTopics({ group: 'operations' })).toHaveLength(9);
    expect(listGuideCorpusTopics({ group: 'ai' })).toHaveLength(9);
  });

  it('resolves every corpus i18n key in EN/HY/RU frontend catalogs', () => {
    assertFrontendGuideI18nPresent();
    const keys = listAllGuideCorpusI18nKeys();
    expect(keys.length).toBeGreaterThan(120);
    for (const locale of listGuideCorpusLocales()) {
      const messages = getFrontendGuideCorpusMessages(locale);
      for (const key of keys) {
        const text = resolveGuideCorpusI18nKey(messages, key);
        expect(text).not.toBeNull();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('resolves EN/HY/RU corpus text from frontend guide i18n', () => {
    for (const locale of listGuideCorpusLocales()) {
      const messages = getFrontendGuideCorpusMessages(locale);
      const topic = resolveGuideCorpusTopic('dashboard.core.schedule', messages);
      expect(topic?.title).toBeTruthy();
      expect(topic?.steps.length).toBeGreaterThanOrEqual(4);
      for (const key of listGuideCorpusI18nKeys('dashboard.operations.inventory')) {
        const text = resolveGuideCorpusI18nKey(messages, key);
        expect(text).toBeTruthy();
      }
    }
  });

  it.each([
    ['dashboard.core.calendar', 'calendar'],
    ['dashboard.operations.workflow', 'workflow'],
    ['dashboard.ai.getting-started', 'ai-getting-started'],
  ] as const)(
    'lookup helpers resolve topicId %s via anchor %s',
    (topicId, anchor) => {
      expect(isGuideCorpusTopicId(topicId)).toBe(true);
      expect(getGuideCorpusTopic(topicId)?.anchor).toBe(anchor);
      expect(GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID[anchor]).toBe(topicId);
    },
  );
});
