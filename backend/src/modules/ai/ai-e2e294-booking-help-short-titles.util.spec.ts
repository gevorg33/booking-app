import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import {
  buildGuideResponseFromFlowPlaybook,
  humanizeGuideStepTitle,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import { buildGuideResponseForMultiTurnStep } from './ai-product-guide-multiturn.util.js';
import {
  E2E294_FUNNEL_SHORT_TITLE_CASES,
  E2E294_HUMANIZE_CASES,
} from './ai-e2e294-booking-help-short-titles.fixtures.js';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('e2e-bug.294 booking_help short step titles', () => {
  it.each(E2E294_HUMANIZE_CASES.map((row) => [row.id, row] as const))(
    'humanize %s',
    (_id, row) => {
      expect(humanizeGuideStepTitle(row.title, row.body)).toBe(row.expected);
    },
  );

  it.each(E2E294_FUNNEL_SHORT_TITLE_CASES.map((row) => [row.id, row] as const))(
    '%s — funnel step titles are short + EN-parity',
    (_id, row) => {
      const messages = getFrontendGuideCorpusMessages(row.locale);
      const playbook = listAllGuideFlowPlaybookDefs().find(
        (p) => p.topicId === 'public-booking-funnel',
      );
      expect(playbook).toBeTruthy();
      expect(playbook!.steps.every((s) => Boolean(s.shortTitleKey))).toBe(true);

      const resolved = resolveGuideFlowPlaybook(playbook!, messages);
      const guide = buildGuideResponseFromFlowPlaybook(resolved);
      expect(guide.steps[0]?.title).toBe(row.expectedStep1Title);

      for (const step of guide.steps) {
        expect(wordCount(step.title)).toBeLessThanOrEqual(row.maxTitleWords);
        expect(step.title).not.toMatch(/^(?:Step|Քայլ|Шаг)\s*\d+\s*$/iu);
        expect(step.title).not.toMatch(/հանրային|на странице|public booking page/iu);
      }

      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        {
          guideFlowId: 'public-booking-funnel',
          guideStepIndex: 0,
          completedSteps: [],
        },
        row.locale,
      );
      expect(stepped.summary).toContain(row.expectedStep1Title);
      expect(stepped.summary).not.toMatch(
        /հանրային|на странице|public booking page/iu,
      );
    },
  );

  it('documents every funnel short-title scenario id', () => {
    expect(E2E294_FUNNEL_SHORT_TITLE_CASES.map((c) => c.id)).toEqual([
      'ai-e2e294-en-step1-short',
      'ai-e2e294-hy-step1-short',
      'ai-e2e294-ru-step1-short',
    ]);
  });
});
