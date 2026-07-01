import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_SCENARIOS,
  PROVIDER_VOICE_NEXT_CLIENT_RESCUE_SCENARIOS,
  buildVoiceSummarizeNextClientResult,
  isVoiceSummarizeNextClientPrompt,
  rescueVoiceSummarizeNextClientIntent,
} from './ai-provider-voice-next-client.util.js';

describe('ai-provider-voice-next-client.util (ai-guide-1.4.4 / 5.24.5)', () => {
  it.each(PROVIDER_VOICE_NEXT_CLIENT_RESCUE_SCENARIOS)(
    'detects voice next-client prompt $id',
    ({ samplePrompt }) => {
      expect(isVoiceSummarizeNextClientPrompt(samplePrompt)).toBe(true);
    },
  );

  it.each(PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_SCENARIOS)(
    'rescue-dispatches $id',
    ({ prompt }) => {
      expect(rescueVoiceSummarizeNextClientIntent(prompt, 'unknown')).toBe(
        'voice_summarize_next_client',
      );
    },
  );

  it('overrides show_appointments for read-aloud next client prompts', () => {
    expect(
      rescueVoiceSummarizeNextClientIntent(
        'Read my next client aloud',
        'show_appointments',
      ),
    ).toBe('voice_summarize_next_client');
  });

  it('does not override unrelated show_appointments prompts', () => {
    expect(
      rescueVoiceSummarizeNextClientIntent(
        'Show my appointments today',
        'show_appointments',
      ),
    ).toBe('show_appointments');
  });

  it('buildVoiceSummarizeNextClientResult sets voiceSummary and autoSpeak', () => {
    const result = buildVoiceSummarizeNextClientResult({
      bookings: [
        {
          startTime: new Date('2026-06-04T10:30:00.000Z'),
          status: 'confirmed',
          customer: { name: 'Jane Doe' },
          service: { name: 'Haircut' },
        },
      ],
      formatLabel: () => '10:30 Jane Doe (Haircut)',
      formatTime: () => '10:30',
      emptySummary: 'No upcoming appointments.',
    });

    expect(result.action).toBe('voice_summarize_next_client');
    expect(result.details.autoSpeak).toBe(true);
    expect(String(result.details.voiceSummary)).toContain('Jane Doe');
    expect(String(result.details.voiceSummary)).toContain('10:30');
  });

  it('buildVoiceSummarizeNextClientResult handles empty schedule', () => {
    const result = buildVoiceSummarizeNextClientResult({
      bookings: [],
      formatLabel: () => '',
      formatTime: () => '',
      emptySummary: 'No upcoming appointments today.',
    });

    expect(result.details.matchedCount).toBe(0);
    expect(String(result.details.voiceSummary)).toMatch(/no upcoming/i);
  });
});
