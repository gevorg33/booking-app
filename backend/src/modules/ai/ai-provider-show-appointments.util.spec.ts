import { PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS } from './ai-provider-show-appointments.fixtures.js';
import {
  extractShowAppointmentsParams,
  isShowAppointmentsPrompt,
  rescueShowAppointmentsIntent,
} from './ai-provider-show-appointments.util.js';

describe('ai-provider-show-appointments.util', () => {
  it.each(
    PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects show_appointments prompt %s', (_id, prompt) => {
    expect(isShowAppointmentsPrompt(prompt)).toBe(true);
  });

  it('does not misdetect sibling provider READ intents', () => {
    expect(isShowAppointmentsPrompt("How's today looking?")).toBe(false);
    expect(isShowAppointmentsPrompt('Any no-shows yet today?')).toBe(false);
    expect(isShowAppointmentsPrompt('How full is my week?')).toBe(false);
    expect(isShowAppointmentsPrompt('How busy am I this month?')).toBe(false);
    expect(
      isShowAppointmentsPrompt('How many appointments do I have tomorrow?'),
    ).toBe(false);
    expect(isShowAppointmentsPrompt("Who's next across the team?")).toBe(false);
    expect(isShowAppointmentsPrompt('How much did I make this week?')).toBe(
      false,
    );
  });

  it.each(
    PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('rescues show_appointments from unknown for %s', (_id, prompt) => {
    const rescued = rescueShowAppointmentsIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('show_appointments');
    expect(rescued?.rescueReason).toBe('show_appointments_pattern');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueShowAppointmentsIntent("How's today looking?", 'unknown'),
    ).toBeNull();
  });

  it('extracts a clock-time filter', () => {
    const params = extractShowAppointmentsParams('Who do I see at 2pm?');
    expect(params.timeSlot).toBe('14:00');
  });

  it('extracts a day-part filter', () => {
    const params = extractShowAppointmentsParams('List my afternoon');
    expect(params.timeOfDay).toBe('afternoon');
  });

  it('extracts a status filter', () => {
    const params = extractShowAppointmentsParams('List my confirmed bookings');
    expect(params.statusFilters).toEqual(['confirmed']);
  });

  it('does not override params already provided by the caller', () => {
    const params = extractShowAppointmentsParams('Who do I see at 2pm?', {
      timeSlot: '09:00',
    });
    expect(params.timeSlot).toBe('09:00');
  });
});
