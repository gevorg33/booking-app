import { describe, expect, it } from 'vitest';
import {
  buildProviderDashboardUrl,
  resolveProviderDashboardOrigin,
} from './provider-dashboard-url';

describe('provider-dashboard-url', () => {
  it('builds dashboard booking deep link from relative path', () => {
    const url = buildProviderDashboardUrl('/dashboard/bookings?bookingId=bk-1');
    expect(url).toContain('/dashboard/bookings?bookingId=bk-1');
    expect(resolveProviderDashboardOrigin()).toBeTruthy();
  });
});
