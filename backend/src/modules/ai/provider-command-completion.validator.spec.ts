import {
  shouldValidateProviderAction,
  validateProviderCommand,
} from './provider-command-completion.validator.js';

describe('provider-command-completion.validator (ai-cmd-t4)', () => {
  it('shouldValidateProviderAction covers provider booking ops', () => {
    expect(shouldValidateProviderAction('cancel_bookings')).toBe(true);
    expect(shouldValidateProviderAction('mark_paid')).toBe(false);
    expect(shouldValidateProviderAction('create_package_booking')).toBe(false);
  });

  it('cancel_bookings requires filter scope', () => {
    const result = validateProviderCommand('cancel_bookings', {});
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.field).toBe('date');
  });

  it('cancel_bookings passes with date', () => {
    expect(
      validateProviderCommand('cancel_bookings', { date: 'today' }).ok,
    ).toBe(true);
  });

  it('update_bookings requires target and change', () => {
    const missing = validateProviderCommand('update_bookings', {});
    expect(missing.ok).toBe(false);
    expect(missing.issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['customerName', 'status']),
    );
  });

  it('update_bookings passes with customer and status', () => {
    expect(
      validateProviderCommand('update_bookings', {
        customerName: 'John',
        status: 'done',
      }).ok,
    ).toBe(true);
  });

  it('cancel_bookings passes with an explicit bookingId', () => {
    expect(
      validateProviderCommand('cancel_bookings', { bookingId: 'book-1' }).ok,
    ).toBe(true);
  });

  it('update_bookings passes with an explicit bookingId and status', () => {
    expect(
      validateProviderCommand('update_bookings', {
        bookingId: 'book-1',
        status: 'done',
      }).ok,
    ).toBe(true);
  });

  it('mark_no_shows requires date', () => {
    const result = validateProviderCommand('mark_no_shows', {});
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.field).toBe('date');
  });

  it('payment_sweep requires date', () => {
    const result = validateProviderCommand('payment_sweep', {});
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.field).toBe('date');
  });

  it('reschedule_booking requires customer and new time', () => {
    const result = validateProviderCommand('reschedule_booking', {});
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(1);
  });

  it('reschedule_booking passes with first-available and timeOfDay', () => {
    const result = validateProviderCommand('reschedule_booking', {
      customerName: 'John',
      bookingFirstAvailable: true,
      timeOfDay: 'evening',
      notBeforeTime: '17:00',
    });
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.field === 'timeSlot')).toBe(false);
  });

  it('check_availability requires date', () => {
    const result = validateProviderCommand('check_availability', {});
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.field).toBe('date');
  });

  it('check_availability passes with timeOfDay window', () => {
    expect(
      validateProviderCommand('check_availability', {
        timeOfDay: 'afternoon',
        notBeforeTime: '12:00',
      }).ok,
    ).toBe(true);
  });

  it('block_schedule requires employee and date', () => {
    const result = validateProviderCommand('block_schedule', {});
    expect(result.ok).toBe(false);
  });

  it('summarize_utilization passes without extra fields', () => {
    expect(validateProviderCommand('summarize_utilization', {}).ok).toBe(true);
  });

  it('skips validation for unlisted actions', () => {
    expect(validateProviderCommand('explain_last_push', {}).ok).toBe(true);
  });
});
