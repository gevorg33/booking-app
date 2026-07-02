import { describe, expect, it } from '@jest/globals';
import {
  buildVoiceFriendlyFallback,
  enrichGuideResponseVoiceSummaries,
  formatGuideVoiceText,
  interpolateVoiceTemplate,
  resolveGuideStepVoiceSummary,
} from './ai-product-guide-voice.util.js';
import type { GuideResponse } from './command-completion.types.js';

describe('ai-product-guide-voice.util (ai-guide-1.4.4)', () => {
  it('buildVoiceFriendlyFallback strips tap bullets', () => {
    expect(buildVoiceFriendlyFallback('Tap Check in.\n• Open Profile')).toBe(
      'Open Check in. Open Profile',
    );
  });

  it('interpolateVoiceTemplate fills placeholders', () => {
    expect(
      interpolateVoiceTemplate(
        'Your next client is {customerName} at {time}.',
        { customerName: 'Jane', time: '10:30' },
      ),
    ).toBe('Your next client is Jane at 10:30.');
  });

  it('formatGuideVoiceText prefers voiceSummary fields', () => {
    const guide: GuideResponse = {
      summary: 'Long visual summary with UI labels.',
      voiceSummary: 'Short spoken summary.',
      steps: [
        {
          title: 'Step title',
          body: 'Tap the Profile tab.',
          voiceSummary: 'Open the Profile tab.',
        },
      ],
    };
    expect(formatGuideVoiceText(guide)).toBe(
      'Short spoken summary. Open the Profile tab.',
    );
  });

  it('enrichGuideResponseVoiceSummaries derives step voice from body', () => {
    const enriched = enrichGuideResponseVoiceSummaries({
      summary: 'Tap Today to see appointments.',
      steps: [{ title: 'Today', body: 'Tap Today to see appointments.' }],
    });
    expect(enriched.voiceSummary).toContain('Open Today');
    expect(resolveGuideStepVoiceSummary(enriched.steps[0])).toContain(
      'Open Today',
    );
  });
});
