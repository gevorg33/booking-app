import {
  canAccessDataCategory,
  DASHBOARD_DENIED_BY_TIER,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  isRevenueRelatedRequest,
  isStaffDirectoryRequest,
  resolveAccessTier,
  tierAccessSummary,
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
    expect(resolveAccessTier('unknown-role')).toBe('client');
  });

  it('client cannot access revenue analytics', () => {
    expect(canAccessDataCategory('client', 'revenue_analytics')).toBe(false);
    expect(canAccessDataCategory('staff', 'revenue_analytics')).toBe(false);
    expect(canAccessDataCategory('manager', 'revenue_analytics')).toBe(true);
    expect(canAccessDataCategory('owner', 'revenue_analytics')).toBe(true);
    expect(canAccessDataCategory('client', 'own_bookings')).toBe(true);
    expect(canAccessDataCategory('owner', 'owner_operations')).toBe(true);
  });

  it('staff can access assigned bookings but not staff directory', () => {
    expect(canAccessDataCategory('staff', 'assigned_bookings')).toBe(true);
    expect(canAccessDataCategory('staff', 'staff_directory')).toBe(false);
    expect(canAccessDataCategory('manager', 'staff_directory')).toBe(true);
  });

  it('summarizes tier access for capability prompts', () => {
    expect(tierAccessSummary('client')).toMatch(/Client/);
    expect(tierAccessSummary('staff')).toMatch(/Staff/);
    expect(tierAccessSummary('manager')).toMatch(/Manager/);
    expect(tierAccessSummary('owner')).toMatch(/Owner/);
  });

  it('blocks dashboard AI for clients', () => {
    expect(isDashboardIntentAllowed('client', 'list_bookings')).toBe(false);
    expect(DASHBOARD_DENIED_BY_TIER.client.size).toBeGreaterThan(20);
    expect(isDashboardIntentAllowed('client', 'unknown')).toBe(true);
    expect(isDashboardIntentAllowed('client', 'error')).toBe(true);
    expect(isDashboardIntentAllowed('client', 'security_blocked')).toBe(true);
  });

  it('staff cannot run payment sweep or list all employees', () => {
    expect(isDashboardIntentAllowed('staff', 'payment_sweep')).toBe(false);
    expect(isDashboardIntentAllowed('staff', 'list_employees')).toBe(false);
    expect(isDashboardIntentAllowed('staff', 'list_bookings')).toBe(true);
  });

  it('owner can run payment sweep', () => {
    expect(isDashboardIntentAllowed('owner', 'payment_sweep')).toBe(true);
  });

  it('enforces provider mobile deny-list per tier', () => {
    expect(isProviderIntentAllowed('client', 'list_bookings')).toBe(false);
    expect(isProviderIntentAllowed('staff', 'payment_sweep')).toBe(false);
    expect(isProviderIntentAllowed('staff', 'list_bookings')).toBe(true);
    expect(isProviderIntentAllowed('owner', 'payment_sweep')).toBe(true);
    expect(isProviderIntentAllowed('owner', 'unknown')).toBe(true);
    expect(isProviderIntentAllowed('owner', 'error')).toBe(true);
    expect(isProviderIntentAllowed('owner', 'security_blocked')).toBe(true);
  });

  it('restricts customer self-service surface to client tier (ai-cmd-0.2)', () => {
    expect(isCustomerIntentAllowed('client', 'book_package')).toBe(true);
    expect(isCustomerIntentAllowed('staff', 'book_package')).toBe(false);
    expect(isCustomerIntentAllowed('manager', 'book_package')).toBe(false);
    expect(isCustomerIntentAllowed('owner', 'book_package')).toBe(false);
    expect(isCustomerIntentAllowed('client', 'unknown')).toBe(true);
    expect(isCustomerIntentAllowed('client', 'error')).toBe(true);
    expect(isCustomerIntentAllowed('client', 'security_blocked')).toBe(true);
  });

  it('detects revenue-related requests across booking, service, and staff intents', () => {
    expect(isRevenueRelatedRequest('payment_sweep', {}, '')).toBe(true);
    expect(isRevenueRelatedRequest('summarize_utilization', {}, '')).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        { bookingMetric: 'revenue' },
        'total revenue today',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        { bookingMetric: 'unpaid' },
        'unpaid bookings',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        { bookingMetric: 'count' },
        'how much revenue today',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        { bookingMetric: 'count' },
        'how many appointments',
      ),
    ).toBe(false);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        {},
        'total $500 usd earned',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'summarize_bookings',
        { bookingMetric: 'revenue' },
        'calculate total earnings today',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'analyze_services',
        { serviceMetric: 'top_revenue' },
        'top services',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest(
        'analyze_services',
        {},
        'which services earned the most sales',
      ),
    ).toBe(true);
    expect(
      isRevenueRelatedRequest('analyze_services', {}, 'top booked services'),
    ).toBe(false);
    expect(isRevenueRelatedRequest('summarize_staff', {}, '')).toBe(true);
    expect(isRevenueRelatedRequest('summarize_customers', {}, '')).toBe(true);
    expect(isRevenueRelatedRequest('list_bookings', {}, '')).toBe(false);
  });

  it('detects staff directory requests', () => {
    expect(isStaffDirectoryRequest('list_employees')).toBe(true);
    expect(isStaffDirectoryRequest('list_bookings')).toBe(false);
  });
});
