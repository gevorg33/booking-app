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
    expect(
      rescueProviderAiIntent('No-shows today', 'list_bookings'),
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

  it('maps day-status phrases to summarize_day (prov-exp-1 / ai-cmd-provider-5.1.1)', () => {
    expect(rescueProviderAiIntent("How's today looking?", 'unknown')).toBe(
      'summarize_day',
    );
    expect(
      rescueProviderAiIntent('Give me a rundown of today', 'unknown'),
    ).toBe('summarize_day');
    expect(
      rescueProviderAiIntent('Any no-shows yet today?', 'unknown'),
    ).toBe('summarize_day');
  });

  it('maps utilization phrases to summarize_utilization (prov-exp-1 / ai-cmd-provider-5.1.6)', () => {
    expect(rescueProviderAiIntent('How full is my week?', 'unknown')).toBe(
      'summarize_utilization',
    );
    expect(
      rescueProviderAiIntent(
        'What percent of my slots are booked?',
        'unknown',
      ),
    ).toBe('summarize_utilization');
  });

  it('maps clock-time and day-part listing phrases to show_appointments (ai-cmd-provider-5.1.2)', () => {
    expect(rescueProviderAiIntent('Who do I see at 2pm?', 'unknown')).toBe(
      'show_appointments',
    );
    expect(rescueProviderAiIntent('List my afternoon', 'unknown')).toBe(
      'show_appointments',
    );
    expect(
      rescueProviderAiIntent('Show completed appointments today', 'unknown'),
    ).toBe('show_appointments');
  });

  it('maps who-is-next phrases to show_appointments (ai-cmd-provider-5.1.4)', () => {
    expect(
      rescueProviderAiIntent("Who's my next client?", 'unknown'),
    ).toBe('show_appointments');
    expect(rescueProviderAiIntent("Who's up next?", 'unknown')).toBe(
      'show_appointments',
    );
    expect(rescueProviderAiIntent('Who do I have next?', 'unknown')).toBe(
      'show_appointments',
    );
  });

  it('maps day-walkthrough phrases to explain_today_timeline (ai-cmd-provider-5.1.5)', () => {
    expect(
      rescueProviderAiIntent('Walk me through my day', 'unknown'),
    ).toBe('explain_today_timeline');
    expect(rescueProviderAiIntent('Gaps between clients?', 'unknown')).toBe(
      'explain_today_timeline',
    );
    expect(
      rescueProviderAiIntent('Any gaps this afternoon on my book', 'unknown'),
    ).toBe('fill_unused_slots');
  });

  it('maps end-of-day wrap-up phrases to end_of_day_summary (ai-cmd-provider-5.1.7)', () => {
    expect(rescueProviderAiIntent('Wrap up today', 'unknown')).toBe(
      'end_of_day_summary',
    );
    expect(rescueProviderAiIntent('Anything still unpaid?', 'unknown')).toBe(
      'end_of_day_summary',
    );
    expect(rescueProviderAiIntent("How's today looking?", 'unknown')).toBe(
      'summarize_day',
    );
  });
});
