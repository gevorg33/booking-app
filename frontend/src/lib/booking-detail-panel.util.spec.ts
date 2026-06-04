import { describe, expect, it } from 'vitest';
import {
  allAppointmentDetailI18nKeys,
  appointmentStartTimeLabel,
  bookingDayISO,
  bookingStatusLabel,
  bookingTimeHHmm,
  buildBookingUpdatePayload,
  canSaveBookingDetail,
  computeBookingDirtyFlags,
  paymentStatusLabel,
  readBookingError,
  toRescheduleISO,
} from './booking-detail-panel.util';

const booking = {
  startTime: '2026-06-04T14:00:00.000Z',
  status: 'confirmed',
  paymentStatus: 'pending',
  notes: 'Note',
  description: 'Desc',
  updatedAt: '2026-06-04T10:00:00.000Z',
  service: { id: 'svc-1' },
  employee: { id: 'emp-1' },
  customer: { id: 'cust-1' },
};

const baseForm = {
  status: 'confirmed' as const,
  paymentStatus: 'pending' as const,
  notes: 'Note',
  description: 'Desc',
  rescheduleDate: '2026-06-04',
  rescheduleTime: '14:00',
  rescheduleEmployeeId: 'emp-1',
  rescheduleServiceId: 'svc-1',
  customerId: 'cust-1',
};

const t = (key: string, vars?: Record<string, string | number>) => {
  if (key === 'appointments.markStatusConfirm' && vars?.status) {
    return `Mark as ${vars.status}`;
  }
  if (key === 'appointments.serviceDurationMin' && vars?.minutes != null) {
    return `(${vars.minutes} min)`;
  }
  return key;
};

describe('booking-detail-panel.util', () => {
  it('parses booking day and time helpers', () => {
    expect(bookingDayISO('2026-06-04T14:00:00.000Z')).toBe('2026-06-04');
    expect(bookingTimeHHmm('2026-06-04T14:00:00.000Z')).toMatch(/\d{2}:\d{2}/);
    expect(toRescheduleISO('2026-06-04', '15:30')).toBe('2026-06-04T15:30:00.000Z');
  });

  it('reads API errors from string and object shapes', () => {
    expect(readBookingError(null, 'fallback').message).toBe('fallback');
    expect(
      readBookingError(
        { response: { data: { message: 'Server said no' } } },
        'fallback',
      ).message,
    ).toBe('Server said no');
    expect(
      readBookingError(
        {
          response: {
            data: {
              message: { message: 'Conflict', code: 'BOOKING_VERSION_CONFLICT', updatedAt: 'x' },
            },
          },
        },
        'fallback',
      ),
    ).toEqual({
      message: 'Conflict',
      code: 'BOOKING_VERSION_CONFLICT',
      updatedAt: 'x',
    });
    expect(readBookingError({}, 'fallback').message).toBe('fallback');
    expect(
      readBookingError({ response: { data: { message: {} } } }, 'fallback').message,
    ).toBe('fallback');
  });

  it('computes dirty flags and save eligibility', () => {
    const unchanged = computeBookingDirtyFlags(booking, baseForm, true);
    expect(unchanged.dirty).toBe(false);
    expect(unchanged.editable).toBe(true);
    expect(canSaveBookingDetail(unchanged, false)).toBe(false);

    const paymentOnly = computeBookingDirtyFlags(
      booking,
      { ...baseForm, paymentStatus: 'paid' },
      true,
    );
    expect(paymentOnly.paymentChanged).toBe(true);
    expect(paymentOnly.dirty).toBe(true);
    expect(canSaveBookingDetail(paymentOnly, false)).toBe(true);

    const customerOnly = computeBookingDirtyFlags(
      booking,
      { ...baseForm, customerId: 'cust-2' },
      true,
    );
    expect(customerOnly.customerOnlyDirty).toBe(true);
    expect(canSaveBookingDetail(customerOnly, false)).toBe(true);

    const invalidReschedule = computeBookingDirtyFlags(
      booking,
      { ...baseForm, rescheduleTime: '15:00' },
      false,
    );
    expect(invalidReschedule.rescheduleChanged).toBe(true);
    expect(canSaveBookingDetail(invalidReschedule, false)).toBe(false);
    expect(canSaveBookingDetail(invalidReschedule, true)).toBe(false);
  });

  it('builds update payload for status, reschedule, and customer changes', () => {
    const flags = computeBookingDirtyFlags(
      booking,
      {
        ...baseForm,
        status: 'completed',
        rescheduleTime: '16:00',
        customerId: 'cust-9',
      },
      true,
    );

    const payload = buildBookingUpdatePayload(
      booking,
      {
        ...baseForm,
        status: 'completed',
        rescheduleTime: '16:00',
        customerId: 'cust-9',
      },
      flags,
    );

    expect(payload).toMatchObject({
      status: 'completed',
      startTime: '2026-06-04T16:00:00.000Z',
      customerId: 'cust-9',
      expectedUpdatedAt: booking.updatedAt,
    });

    const statusOverride = buildBookingUpdatePayload(
      booking,
      { ...baseForm, status: 'confirmed' },
      computeBookingDirtyFlags(booking, baseForm, true),
      'no_show',
    );
    expect(statusOverride?.status).toBe('no_show');
    expect(statusOverride?.paymentStatus).toBe('not_applicable');
  });

  it('marks terminal bookings as not editable', () => {
    const flags = computeBookingDirtyFlags(
      { ...booking, status: 'completed' },
      baseForm,
      true,
    );
    expect(flags.editable).toBe(false);
    expect(flags.canEditCustomer).toBe(true);

    const cancelled = computeBookingDirtyFlags(
      { ...booking, status: 'cancelled' },
      baseForm,
      true,
    );
    expect(cancelled.canEditCustomer).toBe(false);
  });

  it('builds payload for notes, payment-only, and service-only reschedule', () => {
    const detailsForm = { ...baseForm, notes: 'Updated note', description: 'Updated desc' };
    const detailsFlags = computeBookingDirtyFlags(booking, detailsForm, true);
    expect(
      buildBookingUpdatePayload(booking, detailsForm, detailsFlags),
    ).toMatchObject({
      notes: 'Updated note',
      description: 'Updated desc',
    });

    const paymentForm = { ...baseForm, paymentStatus: 'paid' as const };
    const paymentFlags = computeBookingDirtyFlags(booking, paymentForm, true);
    expect(buildBookingUpdatePayload(booking, paymentForm, paymentFlags)).toMatchObject({
      paymentStatus: 'paid',
    });

    const serviceOnlyForm = { ...baseForm, rescheduleServiceId: 'svc-2' };
    const serviceFlags = computeBookingDirtyFlags(booking, serviceOnlyForm, true);
    expect(serviceFlags.serviceChanged).toBe(true);
    expect(serviceFlags.scheduleChanged).toBe(false);
    expect(buildBookingUpdatePayload(booking, serviceOnlyForm, serviceFlags)).toMatchObject({
      serviceId: 'svc-2',
    });
    expect(
      buildBookingUpdatePayload(booking, serviceOnlyForm, serviceFlags)?.startTime,
    ).toBeUndefined();

    const walkInForm = { ...baseForm, customerId: '' };
    const walkInFlags = computeBookingDirtyFlags(booking, walkInForm, true);
    expect(buildBookingUpdatePayload(booking, walkInForm, walkInFlags)?.customerId).toBeUndefined();
  });

  it('handles bookings missing optional relations and save guard branches', () => {
    const sparse = {
      startTime: '2026-06-04T14:00:00.000Z',
      status: 'confirmed',
    };
    const sparseForm = {
      ...baseForm,
      rescheduleEmployeeId: '',
      rescheduleServiceId: '',
      customerId: 'cust-new',
    };
    const sparseFlags = computeBookingDirtyFlags(sparse, sparseForm, true);
    expect(sparseFlags.customerChanged).toBe(true);
    expect(sparseFlags.scheduleFieldsUnchanged).toBe(true);
    expect(canSaveBookingDetail(sparseFlags, false)).toBe(true);

    const cancelledCustomer = computeBookingDirtyFlags(
      { ...booking, status: 'cancelled' },
      { ...baseForm, customerId: 'cust-2' },
      true,
    );
    expect(cancelledCustomer.customerChanged).toBe(true);
    expect(cancelledCustomer.canEditCustomer).toBe(false);
    expect(canSaveBookingDetail(cancelledCustomer, false)).toBe(false);

    const notesOnly = computeBookingDirtyFlags(
      { ...booking, status: 'completed' },
      { ...baseForm, notes: 'x' },
      true,
    );
    expect(canSaveBookingDetail(notesOnly, false)).toBe(false);

    const statusWithPayment = buildBookingUpdatePayload(
      booking,
      { ...baseForm, paymentStatus: 'paid' },
      computeBookingDirtyFlags(booking, { ...baseForm, paymentStatus: 'paid' }, true),
      'completed',
    );
    expect(statusWithPayment).toMatchObject({
      status: 'completed',
      paymentStatus: 'paid',
    });

    const descriptionOnly = computeBookingDirtyFlags(
      booking,
      { ...baseForm, description: 'Only description changed' },
      true,
    );
    expect(descriptionOnly.detailsChanged).toBe(true);
    expect(descriptionOnly.dirty).toBe(true);

    const missingNotes = computeBookingDirtyFlags(
      { startTime: booking.startTime, status: booking.status },
      { ...baseForm, notes: 'First note' },
      true,
    );
    expect(missingNotes.detailsChanged).toBe(true);

    const missingDescription = computeBookingDirtyFlags(
      { startTime: booking.startTime, status: booking.status, notes: 'Note' },
      { ...baseForm, notes: 'Note', description: 'New description' },
      true,
    );
    expect(missingDescription.detailsChanged).toBe(true);
  });

  it('exposes label helpers and the full i18n key list', () => {
    expect(bookingStatusLabel(t, 'confirmed')).toBe('bookings.statusConfirmed');
    expect(paymentStatusLabel(t, 'partially_paid')).toBe('bookings.paymentPartiallyPaid');
    expect(appointmentStartTimeLabel(t)).toBe('appointments.startTime24h common.timeFormat24h');
    expect(allAppointmentDetailI18nKeys().length).toBeGreaterThan(40);
  });
});
