import { describe, expect, it } from 'vitest';
import {
  formatGuideVoiceText,
  resolveAssistantSpeakText,
} from './provider-ai-guide-reply.util';

describe('provider-ai-guide-reply.util', () => {
  it('formatGuideVoiceText prefers voiceSummary fields', () => {
    expect(
      formatGuideVoiceText({
        summary: 'Tap Today for appointments.',
        voiceSummary: 'Open Today for appointments.',
        steps: [
          {
            title: 'Step 1',
            body: 'Tap Check in.',
            voiceSummary: 'Check in when the client arrives.',
          },
        ],
      }),
    ).toBe(
      'Open Today for appointments. Check in when the client arrives.',
    );
  });

  it('resolveAssistantSpeakText prefers details voiceSummary', () => {
    expect(
      resolveAssistantSpeakText({
        summary: 'Next up: Jane',
        voiceSummary: 'Your next client is Jane at 10:30.',
      }),
    ).toBe('Your next client is Jane at 10:30.');
  });
});
