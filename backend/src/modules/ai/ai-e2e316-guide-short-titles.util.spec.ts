import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import {
  buildGuideResponseFromFlowPlaybook,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import { buildGuideResponseForMultiTurnStep } from './ai-product-guide-multiturn.util.js';
import {
  E2E316_HIGH_TRAFFIC_TOPIC_IDS,
  E2E316_PLAYBOOK_SHORT_TITLE_CASES,
} from './ai-e2e316-guide-short-titles.fixtures.js';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('e2e-bug.316 high-traffic guide shortTitleKey', () => {
  it('targets the five high-traffic playbooks from the bug write-up', () => {
    expect([...E2E316_HIGH_TRAFFIC_TOPIC_IDS]).toEqual([
      'consumer-booking-flow',
      'consumer-packages-gift-cards',
      'public-booking-professionals',
      'public-booking-services',
      'public-checkout',
    ]);
  });

  it.each(E2E316_PLAYBOOK_SHORT_TITLE_CASES.map((row) => [row.id, row] as const))(
    '%s — short titles EN-parity',
    (_id, row) => {
      const messages = getFrontendGuideCorpusMessages(row.locale);
      const playbook = listAllGuideFlowPlaybookDefs().find(
        (p) => p.topicId === row.topicId,
      );
      expect(playbook).toBeTruthy();
      expect(playbook!.steps.every((s) => Boolean(s.shortTitleKey))).toBe(true);

      const resolved = resolveGuideFlowPlaybook(playbook!, messages);
      const guide = buildGuideResponseFromFlowPlaybook(resolved);
      expect(guide.steps[0]?.title).toBe(row.expectedStep1Title);

      for (const step of guide.steps) {
        expect(wordCount(step.title)).toBeLessThanOrEqual(row.maxTitleWords);
        expect(step.title).not.toMatch(/^(?:Step|Քայլ|Шаг)\s*\d+\s*$/iu);
        expect(step.title).not.toMatch(row.forbidTitleFragment);
      }

      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        {
          guideFlowId: row.topicId,
          guideStepIndex: 0,
          completedSteps: [],
        },
        row.locale,
      );
      expect(stepped.summary).toContain(row.expectedStep1Title);
      expect(stepped.summary).not.toMatch(row.forbidTitleFragment);
    },
  );

  it('documents every short-title scenario id', () => {
    expect(E2E316_PLAYBOOK_SHORT_TITLE_CASES.map((c) => c.id)).toEqual(
      E2E316_HIGH_TRAFFIC_TOPIC_IDS.flatMap((topicId) =>
        (['en', 'hy', 'ru'] as const).map(
          (locale) => `ai-e2e316-${topicId}-${locale}-step1-short`,
        ),
      ),
    );
  });
});
