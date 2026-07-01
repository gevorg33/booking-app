/** prov-exp-7.2 — provider time-off request helpers. */

import type { CreateBlockScheduleDto } from '../schedule/dto/block-schedule.dto.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import type { ProviderTimeOffRequest } from './entities/provider-time-off-request.entity.js';

export interface ProviderTimeOffSettings {
  enabled: boolean;
}

export interface ProviderTimeOffRangeInput {
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  reason?: string | null;
}

export const PROVIDER_TIME_OFF_REASON_MAX = 500;
export const OPEN_TIME_OFF_STATUSES = ['pending'] as const;

export function readProviderTimeOffSettings(
  raw?: Record<string, unknown> | null,
): ProviderTimeOffSettings {
  const block = raw?.providerTimeOff as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function isProviderTimeOffEnabled(
  settings: ProviderTimeOffSettings,
): boolean {
  return settings.enabled;
}

export function normalizeDateKey(value: string): string | null {
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function normalizeDailyTime(
  value: string,
  fallback: string,
): string | null {
  return normalizeTime24(value) ?? normalizeTime24(fallback);
}

export function validateProviderTimeOffRange(
  input: ProviderTimeOffRangeInput,
): string | null {
  const startDate = normalizeDateKey(input.startDate);
  const endDate = normalizeDateKey(input.endDate);
  const dailyStartTime = normalizeDailyTime(input.dailyStartTime, '00:00');
  const dailyEndTime = normalizeDailyTime(input.dailyEndTime, '23:59');

  if (!startDate || !endDate || !dailyStartTime || !dailyEndTime) {
    return 'Invalid date or time';
  }
  if (endDate < startDate) {
    return 'End date must be on or after start date';
  }
  if (dailyEndTime <= dailyStartTime) {
    return 'Daily end time must be after start time';
  }

  const earliest = new Date(`${startDate}T${dailyStartTime}:00.000Z`);
  if (Number.isNaN(earliest.getTime())) {
    return 'Invalid date or time';
  }
  if (earliest.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return 'Cannot request time off in the past';
  }

  return null;
}

export function buildBlockScheduleDtoFromTimeOffRequest(
  employeeId: string,
  request: Pick<
    ProviderTimeOffRangeInput,
    'startDate' | 'endDate' | 'dailyStartTime' | 'dailyEndTime' | 'reason'
  >,
): CreateBlockScheduleDto | null {
  const startDate = normalizeDateKey(request.startDate);
  const endDate = normalizeDateKey(request.endDate);
  const dailyStartTime = normalizeDailyTime(request.dailyStartTime, '00:00');
  const dailyEndTime = normalizeDailyTime(request.dailyEndTime, '23:59');
  if (!startDate || !endDate || !dailyStartTime || !dailyEndTime) {
    return null;
  }

  const validationError = validateProviderTimeOffRange({
    startDate,
    endDate,
    dailyStartTime,
    dailyEndTime,
    reason: request.reason,
  });
  if (validationError) return null;

  const placeholder = request.reason?.trim().slice(0, 64) || 'Time off';

  if (startDate === endDate) {
    return {
      employeeId,
      placeholder,
      isRepetitive: false,
      singleBlock: {
        startTime: `${startDate}T${dailyStartTime}:00.000Z`,
        endTime: `${startDate}T${dailyEndTime}:00.000Z`,
      },
    };
  }

  return {
    employeeId,
    placeholder,
    isRepetitive: true,
    repetitiveBlock: {
      startDay: startDate,
      endDay: endDate,
      startTime: dailyStartTime,
      endTime: dailyEndTime,
      weeksCount: 1,
      isActiveOnMonday: true,
      isActiveOnTuesday: true,
      isActiveOnWednesday: true,
      isActiveOnThursday: true,
      isActiveOnFriday: true,
      isActiveOnSaturday: true,
      isActiveOnSunday: true,
    },
  };
}

export interface ProviderTimeOffRequestView {
  id: string;
  employeeId: string;
  employeeName: string | null;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  reason: string | null;
  status: ProviderTimeOffRequest['status'];
  reviewNotes: string | null;
  reviewedAt: string | null;
  blockScheduleId: string | null;
  createdAt: string;
}

export function mapProviderTimeOffRequestView(
  request: ProviderTimeOffRequest,
): ProviderTimeOffRequestView {
  return {
    id: request.id,
    employeeId: request.employeeId,
    employeeName: request.employee?.name ?? null,
    startDate: request.startDate,
    endDate: request.endDate,
    dailyStartTime: request.dailyStartTime,
    dailyEndTime: request.dailyEndTime,
    reason: request.reason,
    status: request.status,
    reviewNotes: request.reviewNotes,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    blockScheduleId: request.blockScheduleId,
    createdAt: request.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export function summarizeTimeOffRequests(
  requests: ProviderTimeOffRequestView[],
): string {
  if (!requests.length) return 'No time-off requests found.';
  return requests
    .slice(0, 8)
    .map((row) => {
      const range =
        row.startDate === row.endDate
          ? row.startDate
          : `${row.startDate} – ${row.endDate}`;
      return `${row.employeeName ?? 'Provider'}: ${range} (${row.status})`;
    })
    .join('; ');
}
