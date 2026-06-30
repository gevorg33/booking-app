import {
  buildClinicLabResultUploadApiPath,
  buildClinicLabResultUploadHandoff,
  buildClinicLabResultUploadNavigate,
  CLINIC_LAB_UPLOAD_QUERY_KEYS,
} from './clinic-lab-upload-nav.util.js';

describe('clinic-lab-upload-nav.util (ai-cmd-clinic-6-gap-5.2)', () => {
  it('builds booking results-tab navigate when bookingId is known', () => {
    expect(
      buildClinicLabResultUploadNavigate({
        orderId: 'abc123',
        bookingId: 'booking-1',
      }),
    ).toEqual({
      path: '/dashboard/bookings',
      query: {
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.bookingId]: 'booking-1',
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.labTab]: 'results',
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.orderId]: 'abc123',
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.uploadResult]: '1',
      },
    });
  });

  it('falls back to lab queue when bookingId is missing', () => {
    expect(buildClinicLabResultUploadNavigate({ orderId: 'abc123' })).toEqual({
      path: '/dashboard/lab-queue',
      query: {
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.orderId]: 'abc123',
        [CLINIC_LAB_UPLOAD_QUERY_KEYS.uploadResult]: '1',
      },
    });
  });

  it('builds upload API path and handoff payload', () => {
    const handoff = buildClinicLabResultUploadHandoff('biz-1', {
      orderId: 'order-42',
      bookingId: 'booking-9',
    });
    expect(handoff).toEqual({
      orderId: 'order-42',
      bookingId: 'booking-9',
      uploadApiPath:
        '/businesses/biz-1/clinic-test-results/orders/order-42/result-attachments',
      requiresFilePicker: true,
    });
    expect(buildClinicLabResultUploadApiPath('biz-1', 'order-42')).toBe(
      handoff.uploadApiPath,
    );
  });
});
