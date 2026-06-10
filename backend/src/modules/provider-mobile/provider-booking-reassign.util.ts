/** prov-exp-4.2 — provider mobile booking reassignment (same day, slot resolver). */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { MobileViewMode } from './provider-mobile-access.js';

export interface ProviderReassignAccess {
  viewMode: MobileViewMode;
  employeeId?: string | null;
}

export interface ProviderReassignBookingLike {
  id: string;
  employeeId: string;
  status: string;
  startTime: Date | string;
  serviceId: string;
  multiServiceGroupId?: string | null;
}

export interface ProviderReassignEligibility {
  allowed: boolean;
  reason: string | null;
}

export interface ProviderReassignCandidate {
  id: string;
  name: string;
}

const BLOCKED_STATUSES = new Set<string>([
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
]);

export function buildProviderReassignEligibility(
  access: ProviderReassignAccess,
  booking: ProviderReassignBookingLike,
): ProviderReassignEligibility {
  if (BLOCKED_STATUSES.has(booking.status)) {
    return {
      allowed: false,
      reason: 'Completed, cancelled, and no-show visits cannot be reassigned',
    };
  }

  if (booking.multiServiceGroupId) {
    return {
      allowed: false,
      reason: 'Multi-service visits must be reassigned from the dashboard',
    };
  }

  if (access.viewMode === 'provider') {
    if (!access.employeeId || booking.employeeId !== access.employeeId) {
      return {
        allowed: false,
        reason: 'You can only reassign your own appointments',
      };
    }
  }

  return { allowed: true, reason: null };
}

export function canMutateProviderBookingEmployee(
  access: ProviderReassignAccess,
  bookingEmployeeId: string,
): boolean {
  if (access.viewMode === 'team') return true;
  return Boolean(access.employeeId && bookingEmployeeId === access.employeeId);
}

export function filterReassignTargetEmployees<T extends { id: string; name: string }>(
  employees: T[],
  currentEmployeeId: string,
): T[] {
  return employees.filter((employee) => employee.id !== currentEmployeeId);
}

export function assertReassignKeepsStartTime(
  currentStart: Date,
  nextStart?: Date | string | null,
): boolean {
  if (!nextStart) return true;
  return new Date(nextStart).getTime() === currentStart.getTime();
}
