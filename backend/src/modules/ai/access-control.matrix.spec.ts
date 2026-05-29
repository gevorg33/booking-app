import {
  resolveAccessTier,
  canAccessDataCategory,
  isDashboardIntentAllowed,
  isRevenueRelatedRequest,
  DASHBOARD_DENIED_BY_TIER,
} from './access-control.matrix.js';
import { MemberRole } from '../business/entities/business-member.entity.js';

describe('access-control.matrix', () => {
  it('maps membership roles to access tiers', () => {
    expect(resolveAccessTier(MemberRole.OWNER)).toBe('owner');
    expect(resolveAccessTier(MemberRole.ADMIN)).toBe('owner');
    expect(resolveAccessTier(MemberRole.MANAGER)).toBe('manager');
    expect(resolveAccessTier(MemberRole.STAFF)).toBe('staff');
    expect(resolveAccessTier(MemberRole.CONTRIBUTOR)).toBe('staff');
    expect(resolveAccessTier(null)).toBe('client');
  });

  it('client cannot access revenue analytics', () => {
    expect(canAccessDataCategory('client', 'revenue_analytics')).toBe(false);
    expect(canAccessDataCategory('staff', 'revenue_analytics')).toBe(false);
    expect(canAccessDataCategory('manager', 'revenue_analytics')).toBe(true);
    expect(canAccessDataCategory('owner', 'revenue_analytics')).toBe(true);
  });

  it('staff can access assigned bookings but not staff directory', () => {
    expect(canAccessDataCategory('staff', 'assigned_bookings')).toBe(true);
    expect(canAccessDataCategory('staff', 'staff_directory')).toBe(false);
    expect(canAccessDataCategory('manager', 'staff_directory')).toBe(true);
  });

  it('blocks dashboard AI for clients', () => {
    expect(isDashboardIntentAllowed('client', 'list_bookings')).toBe(false);
    expect(DASHBOARD_DENIED_BY_TIER.client.size).toBeGreaterThan(20);
  });

  it('staff cannot run payment sweep or list all employees', () => {
    expect(isDashboardIntentAllowed('staff', 'payment_sweep')).toBe(false);
    expect(isDashboardIntentAllowed('staff', 'list_employees')).toBe(false);
    expect(isDashboardIntentAllowed('staff', 'list_bookings')).toBe(true);
  });

  it('owner can run payment sweep', () => {
    expect(isDashboardIntentAllowed('owner', 'payment_sweep')).toBe(true);
  });

  it('detects revenue-related requests', () => {
    expect(
      isRevenueRelatedRequest('summarize_bookings', { bookingMetric: 'revenue' }, 'total revenue today'),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest('summarize_bookings', { bookingMetric: 'count' }, 'how many appointments'),
    ).toBe(false);
  });
});
