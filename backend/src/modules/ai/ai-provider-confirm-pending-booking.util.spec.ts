import { describe, expect, it } from '@jest/globals';
import { PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS } from './ai-provider-confirm-pending-booking.fixtures.js';
import {
  isConfirmPendingBookingPrompt,
  parseConfirmPendingBookingFromPrompt,
  rescueConfirmPendingBookingIntent,
} from './ai-provider-confirm-pending-booking.util.js';
import { isConfirmBookingFromPushPrompt } from './ai-provider-mobile-hints.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-confirm-pending-booking.util (e2e-bug.242 / ai-cmd-provider-5.16.4)', () => {
  it('registers confirm_pending_booking on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('confirm_pending_booking', 'provider'),
    ).toBe(true);
  });

  it.each(
    PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects %s', (_id, prompt) => {
    expect(isConfirmPendingBookingPrompt(prompt as string)).toBe(true);
  });

  it.each(
    PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('does not steal into confirm_booking_from_push for %s', (_id, prompt) => {
    expect(isConfirmBookingFromPushPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s from unknown', (_id, prompt) => {
    const rescued = rescueConfirmPendingBookingIntent(
      prompt as string,
      'unknown',
    );
    expect(rescued?.action).toBe('confirm_pending_booking');
  });

  it('extracts customerName for named confirms', () => {
    expect(
      parseConfirmPendingBookingFromPrompt("Accept Maria's booking"),
    ).toEqual(expect.objectContaining({ customerName: 'Maria' }));
    expect(
      parseConfirmPendingBookingFromPrompt("Confirm Jane's appointment"),
    ).toEqual(expect.objectContaining({ customerName: 'Jane' }));
  });

  it('marks allAppointments for bulk phrasing without customerName', () => {
    const parsed = parseConfirmPendingBookingFromPrompt(
      'Confirm all pending today',
    );
    expect(parsed.allAppointments).toBe(true);
    expect(parsed.customerName).toBeUndefined();
  });

  it.each([
    ['push-en', 'Confirm this booking from the push'],
    ['alert-en', 'Accept the booking from that alert'],
    ['paid-en', 'Mark as paid'],
    ['visit-complete-en', 'Mark visit complete'],
    ['in-progress-en', 'Mark in progress'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isConfirmPendingBookingPrompt(prompt)).toBe(false);
    expect(rescueConfirmPendingBookingIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not re-rescue when already confirm_pending_booking', () => {
    expect(
      rescueConfirmPendingBookingIntent(
        'Confirm all pending today',
        'confirm_pending_booking',
      ),
    ).toBeNull();
  });
});
