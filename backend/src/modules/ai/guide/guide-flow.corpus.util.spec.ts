import { getFrontendGuideCorpusMessages } from './ai-guide-corpus-i18n.fixtures.js';
import {
  listGuideCorpusLocales,
  resolveGuideCorpusI18nKey,
} from './ai-guide-corpus-i18n.util.js';
import { GUIDE_FLOW_RANK_SCENARIOS } from './guide-flow.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide-flow.loader.js';
import {
  buildGuideResponseFromFlowPlaybook,
  humanizeGuideStepTitle,
  listAllGuideFlowI18nKeys,
  pickBestGuideFlowPlaybook,
  resolveGuideFlowPlaybook,
} from './guide-flow.corpus.util.js';
import { isGuideCorpusMatchConfident } from '../ai-product-guide-ranking.util.js';
import { buildGuideResponseForMultiTurnStep } from '../ai-product-guide-multiturn.util.js';

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

  // e2e-bug.275 — placeholder common.stepN titles must not leak into summaries.
  it.each([
    {
      id: 'en-from-clause',
      title: 'Step 1',
      body: 'Pick a service from the public booking page.',
      expected: 'Pick a service',
    },
    {
      id: 'hy-short-body',
      title: 'Քայլ 1',
      body: 'Ընտրեք ծառայություն հանրային ամրագրման էջից։',
      expected: 'Ընտրեք ծառայություն',
    },
    {
      id: 'ru-short-body',
      title: 'Шаг 1',
      body: 'Выберите услугу на странице онлайн-записи.',
      expected: 'Выберите услугу',
    },
    {
      id: 'keeps-real-title',
      title: 'Select Service',
      body: 'Pick a service from the public booking page.',
      expected: 'Select Service',
    },
  ])('humanizeGuideStepTitle: $id', ({ title, body, expected }) => {
    expect(humanizeGuideStepTitle(title, body)).toBe(expected);
  });

  it.each(['en', 'hy', 'ru'] as const)(
    'public-booking-funnel step titles are not placeholders (%s)',
    (locale) => {
      const messages = getFrontendGuideCorpusMessages(locale);
      const playbook = listAllGuideFlowPlaybookDefs().find(
        (row) => row.topicId === 'public-booking-funnel',
      );
      expect(playbook).toBeTruthy();
      const resolved = resolveGuideFlowPlaybook(playbook!, messages);
      const guide = buildGuideResponseFromFlowPlaybook(resolved);
      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        {
          guideFlowId: 'public-booking-funnel',
          guideStepIndex: 0,
          completedSteps: [],
        },
        locale,
      );
      for (const step of guide.steps) {
        expect(step.title).not.toMatch(/^(?:Step|Քայլ|Шаг)\s*\d+\s*$/iu);
      }
      expect(stepped.summary).not.toMatch(/: (?:Step|Քայլ|Шаг)\s*\d+\s*$/u);
      expect(stepped.summary).toMatch(
        locale === 'hy'
          ? /^Քայլ 1\/3:/
          : locale === 'ru'
            ? /^Шаг 1 из 3:/
            : /^Step 1 of 3:/,
      );
    },
  );
});
