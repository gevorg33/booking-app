import type { ClinicLabQueueItem } from '../clinic-test-results/order/clinic-test-order.service.js';
import type { ClinicResultQueueItem } from '../clinic-test-results/test-result/clinic-test-result.service.js';

export const PROVIDER_PATIENT_SEARCH_MIN_LENGTH = 2;
export const PROVIDER_PATIENT_SEARCH_LIMIT = 20;

export interface ProviderPatientChartTodayWindow {
  date: string;
  from: string;
  to: string;
}

export interface ProviderPatientChartOrderView {
  id: string;
  status: string;
  displayNames: string | null;
  department: string | null;
  bookingId: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
}

export interface ProviderPatientChartResultView {
  id: string;
  status: string;
  testName: string | null;
  department: string | null;
  orderId: string | null;
  bookingId: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  measurementFlag: string | null;
}

export function buildProviderPatientChartTodayWindow(
  now = new Date(),
): ProviderPatientChartTodayWindow {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return {
    date: today.toISOString().slice(0, 10),
    from: today.toISOString(),
    to: dayEnd.toISOString(),
  };
}

export function mapProviderPatientChartOrder(
  order: ClinicLabQueueItem,
): ProviderPatientChartOrderView {
  return {
    id: order.id,
    status: order.status,
    displayNames: order.displayNames ?? null,
    department: order.department ?? null,
    bookingId: order.bookingId ?? null,
    bookingStartTime: order.bookingStartTime ?? null,
    employeeName: order.employeeName ?? null,
  };
}

export function mapProviderPatientChartResult(
  result: ClinicResultQueueItem,
): ProviderPatientChartResultView {
  return {
    id: result.id,
    status: result.status,
    testName: result.testName ?? null,
    department: result.department ?? null,
    orderId: result.orderId ?? null,
    bookingId: result.bookingId ?? null,
    bookingStartTime: result.bookingStartTime ?? null,
    employeeName: result.employeeName ?? null,
    measurementFlag: result.measurementFlag ?? null,
  };
}

export function customerIdsAssignedToProvider(
  bookings: Array<{
    customerId: string;
    employeeId: string | null;
    linkedEmployeeIds: string[] | null;
  }>,
  employeeId: string,
): string[] {
  return [
    ...new Set(
      bookings
        .filter(
          (booking) =>
            booking.customerId &&
            (booking.employeeId === employeeId ||
              (booking.linkedEmployeeIds ?? []).includes(employeeId)),
        )
        .map((booking) => booking.customerId),
    ),
  ];
}
