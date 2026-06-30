import {
  GUIDE_MULTITURN_SCENARIO_FIXTURES,
} from './ai-product-guide-multiturn.fixtures.js';
import {
  applyGuideNavigation,
  attachGuideMultiTurnSessionToResult,
  createInitialGuideMultiTurnSession,
  detectGuideNavigationIntent,
  hasActiveGuideMultiTurnSession,
  initializeGuideMultiTurnResult,
  mergeGuideMultiTurnSessionIntoContext,
  readGuideMultiTurnSession,
  tryHandleGuideMultiTurnNavigation,
} from './ai-product-guide-multiturn.util.js';
import { handleGuideUserFlowLogic } from './ai-product-guide.logic.js';
import { buildGuideCommandResult } from './ai-product-guide.util.js';
import type { GuideResponse } from './command-completion.types.js';

describe('ai-product-guide-multiturn.util (ai-guide-1.8.2)', () => {
  it.each(
    GUIDE_MULTITURN_SCENARIO_FIXTURES.map((row) => [row.id, row] as const),
  )('detectGuideNavigationIntent for $id', (_id, scenario) => {
    expect(detectGuideNavigationIntent(scenario.prompt)).toBe(scenario.navigation);
  });

  it('readGuideMultiTurnSession parses guide fields from context', () => {
    expect(
      readGuideMultiTurnSession({
        guideFlowId: 'dashboard.core.schedule',
        guideStepIndex: '2',
        completedSteps: '[0,1]',
      }),
    ).toEqual({
      guideFlowId: 'dashboard.core.schedule',
      guideStepIndex: 2,
      completedSteps: [0, 1],
    });
  });

  it('mergeGuideMultiTurnSessionIntoContext clears stale guide session', () => {
    expect(
      mergeGuideMultiTurnSessionIntoContext(
        { guideFlowId: 'old', guideStepIndex: 3, completedSteps: [0, 1, 2] },
        null,
      ),
    ).toEqual({});
  });

  it('applyGuideNavigation advances, backs up, and restarts', () => {
    const initial = createInitialGuideMultiTurnSession('dashboard.core.schedule');
    const next = applyGuideNavigation(initial, 'next', 4);
    expect(next.session.guideStepIndex).toBe(1);
    expect(next.session.completedSteps).toEqual([0]);

    const back = applyGuideNavigation(next.session, 'back', 4);
    expect(back.session.guideStepIndex).toBe(0);
    expect(back.session.completedSteps).toEqual([]);

    const restart = applyGuideNavigation(next.session, 'restart', 4);
    expect(restart.session).toEqual(initial);

    expect(applyGuideNavigation(initial, 'back', 4).boundary).toBe('first');
    expect(applyGuideNavigation({ ...initial, guideStepIndex: 3 }, 'next', 4).boundary).toBe(
      'last',
    );
  });

  it('initializeGuideMultiTurnResult seeds guide session on first guide response', () => {
    const guide: GuideResponse = {
      summary: 'Schedule templates',
      topicId: 'dashboard.core.schedule',
      steps: [
        { title: 'Open schedule', body: 'Go to Schedule.' },
        { title: 'Create template', body: 'Add a weekly template.' },
      ],
    };
    const result = initializeGuideMultiTurnResult(
      buildGuideCommandResult('guide_user_flow', guide),
      {},
    );
    expect(result.guide?.guideSession).toMatchObject({
      guideFlowId: 'dashboard.core.schedule',
      guideStepIndex: 0,
      completedSteps: [],
      totalSteps: 2,
    });
    expect(result.details.sessionContext).toMatchObject({
      guideFlowId: 'dashboard.core.schedule',
      guideStepIndex: 0,
      completedSteps: [],
    });
  });

  it('attachGuideMultiTurnSessionToResult writes sessionContext for clients', () => {
    const session = createInitialGuideMultiTurnSession('dashboard.core.schedule');
    const attached = attachGuideMultiTurnSessionToResult(
      {
        success: true,
        action: 'guide_user_flow',
        summary: 'Step 1',
        details: {},
        guide: {
          summary: 'Step 1',
          steps: [{ title: 'One', body: 'Body' }],
        },
      },
      session,
      { employeeName: 'Anna' },
    );
    expect(attached.details.sessionContext).toMatchObject({
      employeeName: 'Anna',
      guideFlowId: 'dashboard.core.schedule',
      guideStepIndex: 0,
      completedSteps: [],
    });
  });

  it('tryHandleGuideMultiTurnNavigation ignores navigation without active session', () => {
    expect(
      tryHandleGuideMultiTurnNavigation(
        'guide_user_flow',
        { prompt: 'next step', route: '/dashboard/schedule' },
        'en',
      ),
    ).toBeNull();
  });

  it('handleGuideUserFlowLogic supports next/back/restart across turns', () => {
    const start = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      locale: 'en',
    });
    expect(start.success).toBe(true);
    expect(hasActiveGuideMultiTurnSession(start.details.sessionContext)).toBe(true);

    const session = { context: start.details.sessionContext as Record<string, unknown> };
    const next = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'next step',
      route: '/dashboard/schedule',
      locale: 'en',
      session,
    });
    expect(next.success).toBe(true);
    expect(next.details.guideNavigation).toBe('next');
    expect(next.guide?.guideSession?.guideStepIndex).toBe(1);

    const back = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'go back',
      route: '/dashboard/schedule',
      locale: 'en',
      session: { context: next.details.sessionContext as Record<string, unknown> },
    });
    expect(back.success).toBe(true);
    expect(back.details.guideNavigation).toBe('back');
    expect(back.guide?.guideSession?.guideStepIndex).toBe(0);

    const restart = handleGuideUserFlowLogic({
      businessId: 'biz-1',
      prompt: 'start over',
      route: '/dashboard/schedule',
      locale: 'en',
      session: { context: next.details.sessionContext as Record<string, unknown> },
    });
    expect(restart.success).toBe(true);
    expect(restart.details.guideNavigation).toBe('restart');
    expect(restart.guide?.guideSession?.guideStepIndex).toBe(0);
    expect(restart.guide?.guideSession?.completedSteps).toEqual([]);
  });
});
