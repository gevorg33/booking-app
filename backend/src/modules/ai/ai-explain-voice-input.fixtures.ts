export type ExplainVoiceInputAspect =
  | 'how_to_use'
  | 'mic_denied'
  | 'no_speech'
  | 'mic_error'
  | 'unsupported'
  | 'generic'
  | 'all';

export type ExplainVoiceInputPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_voice_input';
  rescueReason: 'explain_voice_input';
  aspect?: ExplainVoiceInputAspect;
};

export const CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES = `- explain_voice_input: READ — customer app or public booking web: explain how to use the assistant microphone (Voice input button) or troubleshoot speech recognition errors (denied, no speech, unsupported, failed). Triggers: "How do I use voice?", "Mic not working", "Microphone access was denied", "No speech detected". Uses voiceErrorCode from session when present (unsupported|not-allowed|no-speech|error). NOT speak_assistant_reply (read answer aloud / TTS), NOT explain_voice_input for typing help, NOT booking_help (general funnel), NOT give_ai_feedback (wrong answer feedback).`;

export const EXPLAIN_VOICE_INPUT_PROMPTS: readonly ExplainVoiceInputPromptFixture[] =
  [
    {
      id: 'how-use-voice-customer',
      prompt: 'How do I use voice?',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'mic-not-working-customer',
      prompt: 'Mic not working',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'microphone-denied-customer',
      prompt: 'Microphone access was denied',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_denied',
    },
    {
      id: 'no-speech-customer',
      prompt: 'No speech detected',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'no_speech',
    },
    {
      id: 'voice-input-failed-customer',
      prompt: 'Voice input failed',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'enable-voice-booking-customer',
      prompt: 'How do I talk to the booking assistant?',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'where-mic-button-customer',
      prompt: 'Where is the microphone button?',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'voice-unsupported-customer',
      prompt: 'Voice input is not supported on this device',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'unsupported',
    },
    {
      id: 'cant-use-voice-customer',
      prompt: "Can't use voice on the assistant",
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'generic',
    },
    {
      id: 'speech-recognition-broken-customer',
      prompt: 'Speech recognition is broken',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'allow-microphone-customer',
      prompt: 'How do I allow microphone access?',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_denied',
    },
    {
      id: 'use-voice-instead-type-customer',
      prompt: 'Can I speak instead of typing?',
      surface: 'customer',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'how-use-voice-public',
      prompt: 'How do I use voice?',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'mic-not-working-public',
      prompt: 'Mic not working',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'microphone-denied-public',
      prompt: 'Microphone access was denied',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_denied',
    },
    {
      id: 'no-speech-public',
      prompt: 'No speech detected',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'no_speech',
    },
    {
      id: 'voice-input-failed-public',
      prompt: 'Voice input failed',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'enable-voice-booking-public',
      prompt: 'How do I talk to the booking assistant?',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'where-mic-button-public',
      prompt: 'Where is the microphone button?',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
    {
      id: 'voice-unsupported-public',
      prompt: 'Voice input is not supported on this device',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'unsupported',
    },
    {
      id: 'cant-use-voice-public',
      prompt: "Can't use voice on the assistant",
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'generic',
    },
    {
      id: 'speech-recognition-broken-public',
      prompt: 'Speech recognition is broken',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_error',
    },
    {
      id: 'allow-microphone-public',
      prompt: 'How do I allow microphone access?',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'mic_denied',
    },
    {
      id: 'use-voice-instead-type-public',
      prompt: 'Can I speak instead of typing?',
      surface: 'public',
      expectedAction: 'explain_voice_input',
      rescueReason: 'explain_voice_input',
      aspect: 'how_to_use',
    },
  ] as const;

export const EXPLAIN_VOICE_INPUT_HANDLER_FIXTURES = [
  {
    id: 'how-to-use',
    prompt: 'How do I use voice?',
    aspect: 'how_to_use',
    params: {},
  },
  {
    id: 'mic-denied',
    prompt: 'Microphone access was denied',
    aspect: 'mic_denied',
    params: { voiceErrorCode: 'not-allowed' },
  },
  {
    id: 'no-speech',
    prompt: 'No speech detected',
    aspect: 'no_speech',
    params: { voiceErrorCode: 'no-speech' },
  },
] as const;

export const EXPLAIN_VOICE_INPUT_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-voice-input',
    prompt: 'How do I use voice?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_voice_input',
  },
  {
    id: 'booking-help-steal-guard',
    prompt: 'Mic not working',
    misclassifiedAction: 'booking_help',
    expectedAction: 'explain_voice_input',
  },
  {
    id: 'explain-app-feature-steal-guard',
    prompt: 'Where is the microphone button?',
    misclassifiedAction: 'explain_app_feature',
    expectedAction: 'explain_voice_input',
  },
  {
    id: 'speak-reply-steal-guard',
    prompt: 'How do I use voice?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_voice_input',
  },
] as const;
