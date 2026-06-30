import { PRODUCT_GUIDE_HANDOFF_SCENARIOS } from './ai-product-guide.fixtures.js';
import {
  buildGuideHandoffDispatch,
  buildGuideHandoffExecutionPrompt,
  enrichGuideResponseHandoffs,
  GUIDE_HANDOFF_ALLOWED_ACTIONS,
  GUIDE_HANDOFF_CONTEXT_KEY,
  GUIDE_HANDOFF_RULES,
  isGuideHandoffMutatingAction,
  readGuideHandoffDispatch,
  validateGuideHandoffDispatch,
} from './ai-product-guide-handoff.util.js';

describe('ai-product-guide-handoff.util (ai-guide-1.2.5)', () => {
  it('exports nine deterministic handoff rules', () => {
    expect(GUIDE_HANDOFF_RULES.length).toBe(9);
    expect(GUIDE_HANDOFF_ALLOWED_ACTIONS.size).toBe(8);
  });

  it('maps known setup prompts to mutate handoffs', () => {
    expect(
      buildGuideHandoffExecutionPrompt('configure_service_online_payment', {
        serviceName: 'Massage',
        prepaymentMode: 'deposit',
      }),
    ).toContain('Massage');
  });

  it('buildGuideHandoffDispatch preserves params and prompt', () => {
    expect(
      buildGuideHandoffDispatch({
        action: 'create_service',
        label: 'Add a service',
        params: { serviceName: 'Haircut' },
        prompt: 'Create a new service called Haircut',
      }),
    ).toEqual({
      action: 'create_service',
      params: {
        serviceName: 'Haircut',
        prompt: 'Create a new service called Haircut',
      },
      source: 'product_guide',
    });
  });

  it('readGuideHandoffDispatch reads session context', () => {
    const handoff = { action: 'create_employee', params: { prompt: 'Add stylist' } };
    expect(
      readGuideHandoffDispatch({
        context: { [GUIDE_HANDOFF_CONTEXT_KEY]: handoff },
      }),
    ).toEqual({ ...handoff, source: 'product_guide' });
  });

  it('validateGuideHandoffDispatch rejects unknown actions', () => {
    expect(
      validateGuideHandoffDispatch({ action: 'totally_fake_action' }),
    ).toEqual({
      ok: false,
      summary: 'That guide action is not enabled for direct execution yet.',
    });
  });

  it('validateGuideHandoffDispatch accepts registered handoff actions', () => {
    for (const action of GUIDE_HANDOFF_ALLOWED_ACTIONS) {
      expect(validateGuideHandoffDispatch({ action })).toEqual({ ok: true });
    }
  });

  it('isGuideHandoffMutatingAction follows registry mutating flag', () => {
    expect(isGuideHandoffMutatingAction('create_service')).toBe(true);
    expect(isGuideHandoffMutatingAction('explain_app_feature')).toBe(false);
  });

  it.each(PRODUCT_GUIDE_HANDOFF_SCENARIOS)(
    'enriches relatedActions for $id',
    ({ prompt, expectedTopicId, expectedAction }) => {
      const guide = enrichGuideResponseHandoffs(
        {
          summary: 'Setup guide',
          topicId: expectedTopicId,
          steps: [{ title: 'Step 1', body: 'Do setup.' }],
          sources: [{ topicId: expectedTopicId, kind: 'topic' }],
        },
        { prompt, intent: 'guide_user_flow' },
      );

      expect(guide.relatedActions?.some((row) => row.action === expectedAction)).toBe(
        true,
      );
      const handoff = guide.relatedActions?.find((row) => row.action === expectedAction);
      expect(handoff?.prompt?.length).toBeGreaterThan(0);
    },
  );
});
