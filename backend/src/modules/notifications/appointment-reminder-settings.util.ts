import { BadRequestException } from '@nestjs/common';
import type { BusinessNotificationSettings } from './notification.types.js';

export interface CustomerReminderChoiceSettings {
  /** When true, checkout shows a reminder timing picker. */
  allowCustomerReminderChoice: boolean;
  /** Hours-before options the customer can pick (e.g. 24, 12, 1). */
  customerReminderOptionsHours: number[];
  /** Pre-selected option when the customer does not change the dropdown. */
  defaultCustomerReminderHours: number | null;
}

export const DEFAULT_CUSTOMER_REMINDER_OPTIONS_HOURS = [24, 1];

export const DEFAULT_CUSTOMER_REMINDER_CHOICE_SETTINGS: CustomerReminderChoiceSettings =
  {
    allowCustomerReminderChoice: false,
    customerReminderOptionsHours: DEFAULT_CUSTOMER_REMINDER_OPTIONS_HOURS,
    defaultCustomerReminderHours: 24,
  };

export function normalizeReminderOptionsHours(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CUSTOMER_REMINDER_OPTIONS_HOURS];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const entry of raw) {
    const hours = Number(entry);
    if (!Number.isFinite(hours)) continue;
    const rounded = Math.round(hours);
    if (rounded < 1 || rounded > 168 || seen.has(rounded)) continue;
    seen.add(rounded);
    result.push(rounded);
  }
  result.sort((a, b) => b - a);
  return result.length ? result : [...DEFAULT_CUSTOMER_REMINDER_OPTIONS_HOURS];
}

export function mergeCustomerReminderChoiceSettings(
  raw?: Partial<CustomerReminderChoiceSettings> | Record<string, unknown>,
): CustomerReminderChoiceSettings {
  const options = normalizeReminderOptionsHours(
    raw?.customerReminderOptionsHours,
  );
  const defaultHoursRaw = raw?.defaultCustomerReminderHours;
  let defaultCustomerReminderHours: number | null =
    defaultHoursRaw === null || defaultHoursRaw === undefined
      ? options[0]
      : Math.round(Number(defaultHoursRaw));
  if (
    !Number.isFinite(defaultCustomerReminderHours) ||
    !options.includes(defaultCustomerReminderHours)
  ) {
    defaultCustomerReminderHours = options[0];
  }

  return {
    allowCustomerReminderChoice: raw?.allowCustomerReminderChoice === true,
    customerReminderOptionsHours: options,
    defaultCustomerReminderHours,
  };
}

export function readBookingReminderHoursBefore(
  metadata?: Record<string, unknown>,
): number | null | undefined {
  if (!metadata || !('reminderHoursBefore' in metadata)) return undefined;
  const raw = metadata.reminderHoursBefore;
  if (raw === null) return null;
  const hours = Number(raw);
  if (!Number.isFinite(hours)) return undefined;
  return Math.round(hours);
}

export function resolveBookingReminderHoursBefore(
  metadata: Record<string, unknown> | undefined,
  settings: CustomerReminderChoiceSettings,
): number | null {
  const stored = readBookingReminderHoursBefore(metadata);
  if (!settings.allowCustomerReminderChoice) {
    return stored ?? null;
  }
  if (stored === null) return null;
  if (stored !== undefined) {
    return settings.customerReminderOptionsHours.includes(stored)
      ? stored
      : settings.defaultCustomerReminderHours;
  }
  return settings.defaultCustomerReminderHours;
}

export function assertValidCustomerReminderHours(
  value: number | null | undefined,
  settings: CustomerReminderChoiceSettings,
): void {
  if (!settings.allowCustomerReminderChoice) return;
  if (value === undefined || value === null) return;
  const hours = Math.round(Number(value));
  if (!settings.customerReminderOptionsHours.includes(hours)) {
    throw new BadRequestException('Invalid appointment reminder option');
  }
}

export function reminderNotificationKind(hoursBefore: number): string {
  if (hoursBefore === 24) return 'reminder_24h';
  if (hoursBefore === 1) return 'reminder_1h';
  return `reminder_${hoursBefore}h`;
}

export function resolveReminderChannelFlags(
  businessSettings: BusinessNotificationSettings,
  hoursBefore: number,
): { email: boolean; sms: boolean; whatsapp: boolean } {
  if (hoursBefore >= 2) {
    return {
      email: businessSettings.reminder24hEmail,
      sms: businessSettings.reminder24hSms,
      whatsapp: businessSettings.reminder24hWhatsapp,
    };
  }
  if (hoursBefore <= 1) {
    return {
      email: businessSettings.reminder1hEmail,
      sms: businessSettings.reminder1hSms,
      whatsapp: businessSettings.reminder1hWhatsapp,
    };
  }
  return {
    email: businessSettings.reminder24hEmail,
    sms: businessSettings.reminder24hSms,
    whatsapp: businessSettings.reminder24hWhatsapp,
  };
}

export function buildPublicAppointmentReminderSettings(
  settings?: Record<string, unknown>,
):
  | {
      enabled: boolean;
      optionsHours: number[];
      defaultHours: number | null;
    }
  | undefined {
  const merged = mergeCustomerReminderChoiceSettings(
    settings?.notifications as Record<string, unknown>,
  );
  if (!merged.allowCustomerReminderChoice) return undefined;
  return {
    enabled: true,
    optionsHours: merged.customerReminderOptionsHours,
    defaultHours: merged.defaultCustomerReminderHours,
  };
}

export function buildBookingReminderMetadata(
  reminderHoursBefore: number | null | undefined,
  settings: CustomerReminderChoiceSettings,
): Record<string, number | null> | Record<string, never> {
  if (!settings.allowCustomerReminderChoice) return {};
  if (reminderHoursBefore === undefined) {
    return settings.defaultCustomerReminderHours == null
      ? { reminderHoursBefore: null }
      : { reminderHoursBefore: settings.defaultCustomerReminderHours };
  }
  return { reminderHoursBefore: reminderHoursBefore ?? null };
}
