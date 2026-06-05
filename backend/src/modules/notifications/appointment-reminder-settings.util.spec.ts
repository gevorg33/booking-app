import { mergeBusinessNotificationSettingsWithReminders } from './merge-business-notification-settings.js';
import {
  assertValidCustomerReminderHours,
  buildBookingReminderMetadata,
  buildPublicAppointmentReminderSettings,
  mergeCustomerReminderChoiceSettings,
  normalizeReminderOptionsHours,
  readBookingReminderHoursBefore,
  reminderNotificationKind,
  resolveBookingReminderHoursBefore,
  resolveReminderChannelFlags,
} from './appointment-reminder-settings.util.js';
import { mergeBusinessNotificationSettings } from './notification.types.js';

describe('appointment-reminder-settings.util', () => {
  it('normalizes reminder hour options', () => {
    expect(normalizeReminderOptionsHours([24, 1, 24, 0, 200, NaN])).toEqual([
      24, 1,
    ]);
    expect(normalizeReminderOptionsHours('bad')).toEqual([24, 1]);
    expect(normalizeReminderOptionsHours([])).toEqual([24, 1]);
    expect(normalizeReminderOptionsHours([3, 12, 6])).toEqual([12, 6, 3]);
  });

  it('merges customer reminder choice settings with default fallbacks', () => {
    const merged = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [12, 6, 3],
      defaultCustomerReminderHours: 6,
    });
    expect(merged).toEqual({
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [12, 6, 3],
      defaultCustomerReminderHours: 6,
    });

    expect(
      mergeCustomerReminderChoiceSettings({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [12, 6],
      }).defaultCustomerReminderHours,
    ).toBe(12);

    expect(
      mergeCustomerReminderChoiceSettings({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [12, 6],
        defaultCustomerReminderHours: 99,
      }).defaultCustomerReminderHours,
    ).toBe(12);

    expect(
      mergeCustomerReminderChoiceSettings({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [12, 6],
        defaultCustomerReminderHours: Number.NaN,
      }).defaultCustomerReminderHours,
    ).toBe(12);

    expect(
      mergeCustomerReminderChoiceSettings({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [],
        defaultCustomerReminderHours: 8,
      }).customerReminderOptionsHours,
    ).toEqual([24, 1]);
  });

  it('delegates mergeBusinessNotificationSettingsWithReminders', () => {
    expect(
      mergeBusinessNotificationSettingsWithReminders({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [6],
      }),
    ).toEqual(
      mergeBusinessNotificationSettings({
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [6],
      }),
    );
  });

  it('reads booking reminder hours from metadata safely', () => {
    expect(readBookingReminderHoursBefore(undefined)).toBeUndefined();
    expect(readBookingReminderHoursBefore({})).toBeUndefined();
    expect(
      readBookingReminderHoursBefore({ reminderHoursBefore: null }),
    ).toBeNull();
    expect(readBookingReminderHoursBefore({ reminderHoursBefore: 6 })).toBe(6);
    expect(
      readBookingReminderHoursBefore({ reminderHoursBefore: 'bad' }),
    ).toBeUndefined();
  });

  it('builds public profile reminder settings only when enabled', () => {
    expect(buildPublicAppointmentReminderSettings(undefined)).toBeUndefined();
    expect(
      buildPublicAppointmentReminderSettings({
        notifications: { allowCustomerReminderChoice: false },
      }),
    ).toBeUndefined();
    expect(
      buildPublicAppointmentReminderSettings({
        notifications: {
          allowCustomerReminderChoice: true,
          customerReminderOptionsHours: [24, 12],
          defaultCustomerReminderHours: 12,
        },
      }),
    ).toEqual({ enabled: true, optionsHours: [24, 12], defaultHours: 12 });
  });

  it('stores booking reminder metadata when customer choice is enabled', () => {
    const enabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: true,
    });
    expect(buildBookingReminderMetadata(6, enabled)).toEqual({
      reminderHoursBefore: 6,
    });
    expect(buildBookingReminderMetadata(null, enabled)).toEqual({
      reminderHoursBefore: null,
    });
    expect(buildBookingReminderMetadata(undefined, enabled)).toEqual({
      reminderHoursBefore: 24,
    });

    const disabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: false,
    });
    expect(buildBookingReminderMetadata(6, disabled)).toEqual({});

    const noDefault = {
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [24, 1],
      defaultCustomerReminderHours: null,
    };
    expect(buildBookingReminderMetadata(undefined, noDefault)).toEqual({
      reminderHoursBefore: null,
    });
  });

  it('resolves booking reminder hours from metadata', () => {
    const enabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [24, 6],
      defaultCustomerReminderHours: 24,
    });
    expect(
      resolveBookingReminderHoursBefore({ reminderHoursBefore: 6 }, enabled),
    ).toBe(6);
    expect(
      resolveBookingReminderHoursBefore({ reminderHoursBefore: null }, enabled),
    ).toBeNull();
    expect(resolveBookingReminderHoursBefore({}, enabled)).toBe(24);
    expect(
      resolveBookingReminderHoursBefore({ reminderHoursBefore: 99 }, enabled),
    ).toBe(24);

    const disabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: false,
    });
    expect(
      resolveBookingReminderHoursBefore({ reminderHoursBefore: 6 }, disabled),
    ).toBe(6);
    expect(resolveBookingReminderHoursBefore({}, disabled)).toBeNull();
  });

  it('validates customer reminder hours only when choice is enabled', () => {
    const enabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: true,
      customerReminderOptionsHours: [24, 1],
    });
    const disabled = mergeCustomerReminderChoiceSettings({
      allowCustomerReminderChoice: false,
    });

    expect(() => assertValidCustomerReminderHours(99, enabled)).toThrow(
      /Invalid appointment reminder/,
    );
    expect(() => assertValidCustomerReminderHours(24, enabled)).not.toThrow();
    expect(() => assertValidCustomerReminderHours(null, enabled)).not.toThrow();
    expect(() =>
      assertValidCustomerReminderHours(undefined, enabled),
    ).not.toThrow();
    expect(() => assertValidCustomerReminderHours(99, disabled)).not.toThrow();
  });

  it('maps reminder kinds and channel flags', () => {
    expect(reminderNotificationKind(24)).toBe('reminder_24h');
    expect(reminderNotificationKind(1)).toBe('reminder_1h');
    expect(reminderNotificationKind(12)).toBe('reminder_12h');

    const settings = mergeBusinessNotificationSettings({
      reminder24hEmail: true,
      reminder24hSms: true,
      reminder24hWhatsapp: false,
      reminder1hEmail: false,
      reminder1hSms: true,
      reminder1hWhatsapp: true,
    });
    expect(resolveReminderChannelFlags(settings, 24)).toEqual({
      email: true,
      sms: true,
      whatsapp: false,
    });
    expect(resolveReminderChannelFlags(settings, 2)).toEqual({
      email: true,
      sms: true,
      whatsapp: false,
    });
    expect(resolveReminderChannelFlags(settings, 1)).toEqual({
      email: false,
      sms: true,
      whatsapp: true,
    });
    expect(resolveReminderChannelFlags(settings, 1.5)).toEqual({
      email: true,
      sms: true,
      whatsapp: false,
    });
  });
});
