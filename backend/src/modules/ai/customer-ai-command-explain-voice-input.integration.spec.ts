import { rescueExplainVoiceInputIntent } from './ai-explain-voice-input.util.js';
import { EXPLAIN_VOICE_INPUT_PROMPTS } from './ai-explain-voice-input.fixtures.js';

describe('customer-ai-command explain_voice_input integration (ai-cmd-customer-4.19.1)', () => {
  it.each(
    EXPLAIN_VOICE_INPUT_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues explain_voice_input for $id', (row) => {
    expect(rescueExplainVoiceInputIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_voice_input',
    );
  });
});
