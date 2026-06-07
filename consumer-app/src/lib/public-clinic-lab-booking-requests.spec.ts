import { describe, expect, it } from 'vitest';
import {
  buildLabBookingRequestPath,
  normalizePublicClinicLabBookingRequestsPayload,
} from './public-clinic-lab-booking-requests.js';

describe('public-clinic-lab-booking-requests', () => {
  const sample = [
    {
      orderId: 'order-1',
      displayNames: 'CBC',
      collectionServiceId: 'svc-1',
      collectionServiceName: 'Lab blood draw',
      token: 'token-abc',
      pushedAt: '2026-06-22T10:00:00.000Z',
      collectionBookingId: null,
      bookUrl:
        'https://app.test/book/city-clinic/any/availability?serviceId=svc-1&clinicOrderToken=token-abc',
    },
  ];

  it('normalizes top-level arrays', () => {
    expect(normalizePublicClinicLabBookingRequestsPayload(sample)).toEqual(sample);
  });

  it('normalizes wrapped data payloads', () => {
    expect(normalizePublicClinicLabBookingRequestsPayload({ data: sample })).toEqual(sample);
    expect(normalizePublicClinicLabBookingRequestsPayload({ data: { data: sample } })).toEqual(
      sample,
    );
  });

  it('returns empty array for invalid payloads', () => {
    expect(normalizePublicClinicLabBookingRequestsPayload(null)).toEqual([]);
    expect(normalizePublicClinicLabBookingRequestsPayload({ data: {} })).toEqual([]);
  });

  it('builds in-app book path with clinic order token', () => {
    expect(buildLabBookingRequestPath('city-clinic', 'svc-1', 'token-abc')).toBe(
      '/s/city-clinic/book/svc-1?clinicOrderToken=token-abc',
    );
  });
});
