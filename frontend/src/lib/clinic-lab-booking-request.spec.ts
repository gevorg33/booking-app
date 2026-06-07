import { describe, expect, it } from 'vitest';
import {
  unwrapClinicLabBookingAction,
  unwrapClinicLabCollectionAvailability,
  unwrapPublicClinicLabBookingRequests,
} from './clinic-lab-booking-request';

describe('clinic-lab-booking-request', () => {
  it('unwraps booking action payloads', () => {
    expect(
      unwrapClinicLabBookingAction({
        data: {
          orderId: 'order-1',
          canPush: true,
          supportedCollectionServices: [{ id: 'svc-1', name: 'Lab draw' }],
        },
      }),
    ).toMatchObject({
      orderId: 'order-1',
      canPush: true,
    });
    expect(
      unwrapClinicLabBookingAction({
        orderId: 'order-2',
        canPush: false,
      }),
    ).toMatchObject({ orderId: 'order-2' });
  });

  it('unwraps collection availability slot payloads', () => {
    expect(
      unwrapClinicLabCollectionAvailability({
        data: {
          slots: [
            {
              startTime: '2026-06-10T09:00:00.000Z',
              employeeId: 'emp-1',
            },
          ],
        },
      }),
    ).toHaveLength(1);
    expect(unwrapClinicLabCollectionAvailability({ slots: [] })).toEqual([]);
    expect(unwrapClinicLabCollectionAvailability(null)).toEqual([]);
  });

  it('unwraps public lab booking request lists', () => {
    expect(
      unwrapPublicClinicLabBookingRequests({
        data: [
          {
            orderId: 'order-1',
            collectionServiceName: 'Lab draw',
            bookUrl: 'https://app.test/book',
          },
        ],
      }),
    ).toHaveLength(1);
    expect(unwrapPublicClinicLabBookingRequests([])).toEqual([]);
    expect(unwrapPublicClinicLabBookingRequests({ data: null })).toEqual([]);
  });
});
