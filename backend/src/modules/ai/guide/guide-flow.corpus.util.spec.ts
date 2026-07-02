import { getFrontendGuideCorpusMessages } from './ai-guide-corpus-i18n.fixtures.js';
import {
  listGuideCorpusLocales,
  resolveGuideCorpusI18nKey,
} from './ai-guide-corpus-i18n.util.js';
import { GUIDE_FLOW_RANK_SCENARIOS } from './guide-flow.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide-flow.loader.js';
import {
  buildGuideResponseFromFlowPlaybook,
  listAllGuideFlowI18nKeys,
  pickBestGuideFlowPlaybook,
  resolveGuideFlowPlaybook,
} from './guide-flow.corpus.util.js';
import { isGuideCorpusMatchConfident } from '../ai-product-guide-ranking.util.js';

describe('guide-flow.corpus.util (ai-guide-1.1.2)', () => {
  it('resolves every flow i18n key in EN/HY/RU snapshot catalogs', () => {
    const keys = [...new Set(listAllGuideFlowI18nKeys())];
    expect(keys.length).toBeGreaterThan(40);
    for (const locale of listGuideCorpusLocales()) {
      const messages = getFrontendGuideCorpusMessages(locale);
      for (const key of keys) {
        const text = resolveGuideCorpusI18nKey(messages, key);
        expect(text).not.toBeNull();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('builds guide responses with navigate targets from flow playbooks', () => {
    const messages = getFrontendGuideCorpusMessages('en');
    const playbook = listAllGuideFlowPlaybookDefs().find(
      (row) => row.topicId === 'dashboard.core.schedule',
    );
    expect(playbook).toBeTruthy();
    const resolved = resolveGuideFlowPlaybook(playbook!, messages);
    const guide = buildGuideResponseFromFlowPlaybook(resolved);
    expect(guide.topicId).toBe('dashboard.core.schedule');
    expect(guide.steps.length).toBeGreaterThanOrEqual(4);
    expect(guide.navigate?.path).toBe('/dashboard/schedule');
    expect(guide.steps[0]?.navigate?.path).toBe('/dashboard/schedule');
  });

  it.each(GUIDE_FLOW_RANK_SCENARIOS)(
    'ranks flow playbook for $id',
    ({ prompt, route, intent, expectedTopicId, minScore }) => {
      const messages = getFrontendGuideCorpusMessages('en');
      const best = pickBestGuideFlowPlaybook(
        { prompt, route, intent, locale: 'en' },
        messages,
      );
      expect(best?.topicId).toBe(expectedTopicId);
      expect(best?.score).toBeGreaterThanOrEqual(minScore);
      expect(isGuideCorpusMatchConfident(best!.score)).toBe(true);
    },
  );
});
