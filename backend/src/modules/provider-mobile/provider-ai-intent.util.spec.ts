import { describe, expect, it } from '@jest/globals';
import { rescueProviderAiIntent } from './provider-ai-intent.util.js';

describe('rescueProviderAiIntent', () => {
  it('maps quick-action phrasing to provider intents', () => {
    expect(rescueProviderAiIntent("Who's next?", 'unknown')).toBe(
      'show_appointments',
    );
    expect(
      rescueProviderAiIntent(
        "Who's next across the team in the next 2 hours?",
        'unknown',
      ),
    ).toBe('team_whos_next');
    expect(rescueProviderAiIntent('Mark all today paid', 'unknown')).toBe(
      'payment_sweep',
    );
    expect(rescueProviderAiIntent('Any gaps this afternoon?', 'unknown')).toBe(
      'fill_unused_slots',
    );
    expect(
      rescueProviderAiIntent('Check my availability tomorrow', 'unknown'),
    ).toBe('check_availability');
    expect(
      rescueProviderAiIntent('Block lunch 12:00–13:00 today', 'unknown'),
    ).toBe('block_schedule');
    expect(
      rescueProviderAiIntent('Summarize utilization this week', 'unknown'),
    ).toBe('summarize_utilization');
    expect(
      rescueProviderAiIntent('Mark no-shows for today', 'list_bookings'),
    ).toBe('mark_no_shows');
  });

  it('preserves classified actions when no rescue match', () => {
    expect(
      rescueProviderAiIntent('Cancel John at 14:00', 'cancel_bookings'),
    ).toBe('cancel_bookings');
  });

  it('maps schedule listing phrases to show_appointments', () => {
    expect(
      rescueProviderAiIntent("What's on my schedule today?", 'unknown'),
    ).toBe('show_appointments');
  });
});
