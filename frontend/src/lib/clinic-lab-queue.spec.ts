import { describe, expect, it } from 'vitest';
import {
  buildLabQueueQueryParams,
  LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER,
} from './clinic-lab-queue';

describe('clinic-lab-queue', () => {
  it('builds query params with normalized date bounds', () => {
    expect(
      buildLabQueueQueryParams({
        status: 'NotCollected',
        department: 'Laboratory',
        from: '2026-06-01',
        to: '2026-06-07',
      }),
    ).toEqual({
      status: 'NotCollected',
      department: 'Laboratory',
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-07T23:59:59.999Z',
    });
  });

  it('maps awaiting patient booking filter to query param', () => {
    expect(
      buildLabQueueQueryParams({
        status: LAB_QUEUE_AWAITING_PATIENT_BOOKING_FILTER,
      }),
    ).toEqual({
      awaitingPatientBooking: 'true',
    });
  });

  it('omits empty filters', () => {
    expect(buildLabQueueQueryParams({})).toEqual({});
  });
});
