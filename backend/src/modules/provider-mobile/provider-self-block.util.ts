/** prov-exp-7.1 — provider self-service lunch/break blocks on own calendar. */

import type { CreateBlockScheduleDto } from '../schedule/dto/block-schedule.dto.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';

export interface ProviderSelfBlockSettings {
  enabled: boolean;
}

export interface ProviderSelfBlockFormInput {
  date: string;
  startTime: string;
  endTime: string;
  placeholder?: string | null;
}

export const PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX = 64;

export const PROVIDER_SELF_BLOCK_PRESETS = [
  {
    id: 'lunch',
    label: 'Lunch',
    startTime: '12:00',
    endTime: '13:00',
    placeholder: 'Lunch',
  },
  {
    id: 'break',
    label: 'Break',
    startTime: '15:00',
    endTime: '15:15',
    placeholder: 'Break',
  },
] as const;

export function readProviderSelfBlockSettings(
  raw?: Record<string, unknown> | null,
): ProviderSelfBlockSettings {
  const block = raw?.providerSelfBlock as Record<string, unknown> | undefined;
  return { enabled: block?.enabled === true };
}

export function isProviderSelfBlockEnabled(
  settings: ProviderSelfBlockSettings,
): boolean {
  return settings.enabled;
}

export function buildProviderSelfBlockIso(
  date: string,
  time: string,
): string | null {
  const day = date.trim();
  const normalized = normalizeTime24(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !normalized) return null;
  return `${day}T${normalized}:00.000Z`;
}

export function validateProviderSelfBlockWindow(
  startIso: string,
  endIso: string,
): string | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Invalid date or time';
  }
  if (end <= start) {
    return 'End time must be after start time';
  }
  if (start.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return 'Cannot create a block in the past';
  }
  return null;
}

export function buildCreateBlockScheduleDto(
  employeeId: string,
  input: ProviderSelfBlockFormInput,
): CreateBlockScheduleDto | null {
  const startTime = buildProviderSelfBlockIso(input.date, input.startTime);
  const endTime = buildProviderSelfBlockIso(input.date, input.endTime);
  if (!startTime || !endTime) return null;

  const validationError = validateProviderSelfBlockWindow(startTime, endTime);
  if (validationError) return null;

  const placeholder = input.placeholder
    ?.trim()
    .slice(0, PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX);

  return {
    employeeId,
    placeholder: placeholder || 'Blocked',
    isRepetitive: false,
    singleBlock: { startTime, endTime },
  };
}
