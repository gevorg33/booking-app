import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackStaffContactedCustomer } from './provider-customer-contact-analytics';

vi.mock('./app-analytics', () => ({
  track: vi.fn(),
}));

import { track } from './app-analytics';

describe('provider-customer-contact-analytics (prov-exp-6.1)', () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it('tracks staff_contacted_customer without message body', () => {
    trackStaffContactedCustomer('bk-1', 'sms', 'running-late');

    expect(track).toHaveBeenCalledWith('staff_contacted_customer', {
      bookingId: 'bk-1',
      contactChannel: 'sms',
      templateId: 'running-late',
    });
  });

  it('skips tracking when booking id is blank', () => {
    trackStaffContactedCustomer('  ', 'call');
    expect(track).not.toHaveBeenCalled();
  });
});
