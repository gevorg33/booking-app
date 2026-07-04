import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { EXPLAIN_PROVIDER_CONTEXT_PROMPTS } from './ai-explain-provider-context.fixtures.js';

describe('ai explain provider context rescue (ai-cmd-provider-6.1.2)', () => {
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_PROVIDER_CONTEXT_PROMPTS)(
    'rescues $id to explain_provider_context',
    ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_provider_context');
    },
  );

  it('does not rescue an already-correct action', () => {
    const rescued = rescue.rescue({
      prompt: 'What can I see right now?',
      action: 'explain_provider_context',
      params: {},
    });
    expect(rescued).toBeNull();
  });
});
