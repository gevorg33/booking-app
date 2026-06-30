import { describe, expect, it } from 'vitest';
import { parseClinicLabUploadSearchParams } from './clinic-lab-upload-nav';

describe('clinic-lab-upload-nav', () => {
  it('parses lab upload deep-link query params', () => {
    const params = new URLSearchParams(
      'bookingId=booking-1&labTab=results&orderId=order-42&uploadResult=1',
    );
    expect(parseClinicLabUploadSearchParams(params)).toEqual({
      labTab: 'results',
      orderId: 'order-42',
      uploadResult: true,
    });
  });
});
