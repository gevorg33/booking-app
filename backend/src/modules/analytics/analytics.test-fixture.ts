import type {
  ServicePopularityRow,
  StaffPerformanceRow,
} from './analytics.service.js';

/**
 * Complete analytics report rows for tests.
 *
 * Five specs mock `staffPerformance` / `servicePopularity` and all five wrote
 * partial rows — `StaffPerformanceRow` also carries `employeeId`, `completed`,
 * `noShows` and `hoursBooked`, and `ServicePopularityRow` carries `serviceId`.
 * The assertions in those specs are about `currency` and the revenue figures, so
 * the omitted fields are inert; a builder supplies them once instead of five
 * times, and adding a column to a report later breaks this file rather than
 * every spec that ever built a row by hand.
 */
export function makeStaffPerformanceRow(
  partial: Partial<StaffPerformanceRow> = {},
): StaffPerformanceRow {
  return {
    employeeId: 'emp-test',
    employeeName: 'Test employee',
    bookings: 0,
    completed: 0,
    noShows: 0,
    revenue: 0,
    hoursBooked: 0,
    utilizationPercent: 0,
    ...partial,
  };
}

export function makeServicePopularityRow(
  partial: Partial<ServicePopularityRow> = {},
): ServicePopularityRow {
  return {
    serviceId: 'svc-test',
    serviceName: 'Test service',
    bookings: 0,
    revenue: 0,
    ...partial,
  };
}
