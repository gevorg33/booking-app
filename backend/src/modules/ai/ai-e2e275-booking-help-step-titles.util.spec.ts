import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import {
  buildGuideResponseFromFlowPlaybook,
  humanizeGuideStepTitle,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import { buildGuideResponseForMultiTurnStep } from './ai-product-guide-multiturn.util.js';
import { E2E275_BOOKING_HELP_LOCALE_CASES } from './ai-e2e275-booking-help-step-titles.fixtures.js';

describe('e2e-bug.275 booking_help hy/ru step titles', () => {
  it.each(
    E2E275_BOOKING_HELP_LOCALE_CASES.map((row) => [row.id, row] as const),
  )('%s — funnel step-1 summary uses real title under locale', (_id, row) => {
    const messages = getFrontendGuideCorpusMessages(row.locale);
    const playbook = listAllGuideFlowPlaybookDefs().find(
      (p) => p.topicId === 'public-booking-funnel',
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
      row.locale,
    );
    expect(stepped.summary).toMatch(row.progressPrefix);
    expect(stepped.summary).not.toMatch(row.forbiddenTitle);
    expect(guide.steps[0]?.title).not.toMatch(/^(?:Step|Քայլ|Шаг)\s*\d+\s*$/iu);
  });

  it('humanize prefers EN "from" clause short title', () => {
    expect(
      humanizeGuideStepTitle(
        'Step 1',
        'Pick a service from the public booking page.',
      ),
    ).toBe('Pick a service');
  });
});
