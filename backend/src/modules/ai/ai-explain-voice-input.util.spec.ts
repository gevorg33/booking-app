import {
  CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES,
  VOICE_DENIED_HINT,
  VOICE_ERROR_HINT,
  VOICE_NO_SPEECH_HINT,
  VOICE_START_LABEL,
  VOICE_UNSUPPORTED_HINT,
  buildExplainVoiceInputGuidance,
  isExplainVoiceInputIntent,
  isExplainVoiceInputPrompt,
  parseExplainVoiceInputAspect,
  parseExplainVoiceInputFromPrompt,
  parseVoiceErrorCode,
  rescueExplainVoiceInputIntent,
} from './ai-explain-voice-input.util.js';
import {
  EXPLAIN_VOICE_INPUT_PROMPTS,
  EXPLAIN_VOICE_INPUT_RESCUE_SCENARIOS,
} from './ai-explain-voice-input.fixtures.js';
import { EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS } from './ai-explain-voice-input-multilingual.fixtures.js';

describe('ai-explain-voice-input.util', () => {
  it('exports classifier rules and consumer copy labels', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES).toContain(
      'explain_voice_input',
    );
    expect(VOICE_START_LABEL).toBe('Voice input');
    expect(VOICE_DENIED_HINT).toContain('denied');
    expect(VOICE_NO_SPEECH_HINT).toContain('No speech');
    expect(VOICE_ERROR_HINT).toContain('failed');
    expect(VOICE_UNSUPPORTED_HINT).toContain('not supported');
  });

  it.each(EXPLAIN_VOICE_INPUT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain voice input prompt for $id',
    (_id, row) => {
      expect(isExplainVoiceInputPrompt(row.prompt)).toBe(true);
      expect(parseExplainVoiceInputFromPrompt(row.prompt)).toEqual({
        aspect: expect.any(String),
      });
      expect(rescueExplainVoiceInputIntent(row.prompt, 'unknown')).toEqual({
        action: 'explain_voice_input',
        rescueReason: 'explain_voice_input',
      });
    },
  );

  it.each(
    EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isExplainVoiceInputPrompt(row.prompt)).toBe(true);
    expect(rescueExplainVoiceInputIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_voice_input',
    );
  });

  it.each(
    EXPLAIN_VOICE_INPUT_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueExplainVoiceInputIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'explain_voice_input',
    });
  });

  it('steals from speak_assistant_reply (read answer aloud)', () => {
    expect(isExplainVoiceInputPrompt('Read that answer aloud')).toBe(false);
    expect(
      rescueExplainVoiceInputIntent('Read that answer aloud', 'unknown'),
    ).toBeNull();
  });

  it('parses voiceErrorCode from session params', () => {
    expect(parseVoiceErrorCode({ voiceErrorCode: 'not-allowed' })).toBe(
      'not-allowed',
    );
    expect(parseVoiceErrorCode({ voiceError: 'no-speech' })).toBe('no-speech');
    expect(parseVoiceErrorCode({ speechErrorCode: 'unsupported' })).toBe(
      'unsupported',
    );
    expect(
      parseExplainVoiceInputAspect('Mic not working', {
        voiceErrorCode: 'unsupported',
      }),
    ).toBe('unsupported');
  });

  it('builds guidance per aspect and error code', () => {
    const howTo = buildExplainVoiceInputGuidance('how_to_use');
    expect(howTo.hint).toBe(VOICE_START_LABEL);
    expect(howTo.nextSteps.length).toBeGreaterThan(0);

    const denied = buildExplainVoiceInputGuidance('mic_denied');
    expect(denied.hint).toBe(VOICE_DENIED_HINT);

    const noSpeech = buildExplainVoiceInputGuidance('no_speech', 'no-speech');
    expect(noSpeech.hint).toBe(VOICE_NO_SPEECH_HINT);

    const unsupported = buildExplainVoiceInputGuidance(
      'generic',
      'unsupported',
    );
    expect(unsupported.hint).toBe(VOICE_UNSUPPORTED_HINT);

    expect(isExplainVoiceInputIntent('explain_voice_input_wrong')).toBe(false);
    expect(isExplainVoiceInputIntent('explain_voice_input')).toBe(true);
  });
});
