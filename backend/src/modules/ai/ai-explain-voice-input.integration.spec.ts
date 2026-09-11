import { validateCommand } from './command-completion.validator.js';
import { handleExplainVoiceInputLogic } from './ai-explain-voice-input.logic.js';
import {
  EXPLAIN_VOICE_INPUT_PROMPTS,
  EXPLAIN_VOICE_INPUT_RESCUE_SCENARIOS,
} from './ai-explain-voice-input.fixtures.js';
import { rescueExplainVoiceInputIntent } from './ai-explain-voice-input.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain voice input integration (ai-cmd-customer-4.19.1)', () => {
  it.each(EXPLAIN_VOICE_INPUT_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(
      makeResolvedCommand({
        action: 'explain_voice_input',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }),
    );
    expect(validation.issues).toEqual([]);
  });

  it.each(EXPLAIN_VOICE_INPUT_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainVoiceInputIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with how-to-use guidance', async () => {
    const result = await handleExplainVoiceInputLogic(
      'biz-1',
      {},
      'How do I use voice?',
    );
    expect(result.action).toBe('explain_voice_input');
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('how_to_use');
    expect(result.details?.voiceStartLabel).toBe('Voice input');
    expect(result.summary).toContain('microphone');
  });
});
