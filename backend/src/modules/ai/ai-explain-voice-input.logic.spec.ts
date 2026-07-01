import { handleExplainVoiceInputLogic } from './ai-explain-voice-input.logic.js';
import {
  EXPLAIN_VOICE_INPUT_HANDLER_FIXTURES,
  EXPLAIN_VOICE_INPUT_PROMPTS,
} from './ai-explain-voice-input.fixtures.js';
import { VOICE_START_LABEL } from './ai-explain-voice-input.util.js';

describe('ai-explain-voice-input.logic', () => {
  it.each(EXPLAIN_VOICE_INPUT_HANDLER_FIXTURES)(
    'returns aspect-specific copy for $id',
    async ({ prompt, aspect, params }) => {
      const result = await handleExplainVoiceInputLogic(
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_voice_input');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.voiceInputHelp).toBe(true);
      expect(result.details?.voiceStartLabel).toBe(VOICE_START_LABEL);
      expect(Array.isArray(result.details?.nextSteps)).toBe(true);
    },
  );

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainVoiceInputLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('includes voiceErrorCode in details when present', async () => {
    const result = await handleExplainVoiceInputLogic(
      'biz-1',
      { voiceErrorCode: 'not-allowed' },
      EXPLAIN_VOICE_INPUT_PROMPTS[2].prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.voiceErrorCode).toBe('not-allowed');
  });
});
