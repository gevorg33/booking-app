import {
  buildClinicLabBookingRequestBookUrl,
  buildClinicOrderBookingMetadata,
  buildClinicStaffOrderLinkMetadata,
  canPushClinicLabBookingRequest,
  canStaffBookCollectionForOrder,
  isClinicLabBookingRequestPending,
  readClinicOrderBookingTokenFromMetadata,
  readClinicStaffOrderIdFromMetadata,
  shouldSkipAutoLabOrderForBookingMetadata,
} from './clinic-lab-booking-request.util.js';

describe('clinic-lab-booking-request.util', () => {
  it('builds book and metadata helpers', () => {
    expect(
      buildClinicLabBookingRequestBookUrl(
        'https://app.example.com',
        'acme-clinic',
        'svc-1',
        'token-abc',
      ),
    ).toBe(
      'https://app.example.com/book/acme-clinic/any/availability?serviceId=svc-1&clinicOrderToken=token-abc',
    );
    expect(buildClinicOrderBookingMetadata('token-abc')).toEqual({
      clinicOrderToken: 'token-abc',
    });
    expect(
      readClinicOrderBookingTokenFromMetadata({
        clinicOrderToken: 'token-abc',
      }),
    ).toBe('token-abc');
  });

  it('builds staff order link metadata and skip-auto helpers', () => {
    expect(buildClinicStaffOrderLinkMetadata('order-1')).toEqual({
      clinicStaffOrderId: 'order-1',
    });
    expect(
      readClinicStaffOrderIdFromMetadata({ clinicStaffOrderId: 'order-1' }),
    ).toBe('order-1');
    expect(
      shouldSkipAutoLabOrderForBookingMetadata({ clinicOrderToken: 'token-1' }),
    ).toBe(true);
    expect(
      shouldSkipAutoLabOrderForBookingMetadata({
        clinicStaffOrderId: 'order-1',
      }),
    ).toBe(true);
    expect(shouldSkipAutoLabOrderForBookingMetadata({})).toBe(false);
  });

  it('detects staff book eligibility', () => {
    expect(
      canStaffBookCollectionForOrder({
        status: 'NotCollected',
        collectionBookingId: null,
        customerId: 'cust-1',
      }),
    ).toBe(true);
    expect(
      canStaffBookCollectionForOrder({
        status: 'NotCollected',
        collectionBookingId: null,
        customerId: null,
      }),
    ).toBe(false);
  });

  it('detects pending push and push eligibility', () => {
    expect(
      isClinicLabBookingRequestPending({
        status: 'NotCollected',
        bookingRequestPushedAt: new Date().toISOString(),
        collectionBookingId: null,
      }),
    ).toBe(true);
    expect(
      canPushClinicLabBookingRequest({
        status: 'NotCollected',
        collectionBookingId: null,
      }),
    ).toBe(true);
    expect(
      canPushClinicLabBookingRequest({
        status: 'Cancelled',
        collectionBookingId: null,
      }),
    ).toBe(false);
  });
});
