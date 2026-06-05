export interface CustomerSelfServiceSettings {
  allowCancel: boolean;
  allowReschedule: boolean;
  minimumNoticeHours: number;
  maxReschedulesPerBooking: number;
  allowProviderChangeOnReschedule: boolean;
}

export interface PublicPaymentSettings {
  acceptCashPayments: boolean;
}

export const DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS: CustomerSelfServiceSettings =
  {
    allowCancel: true,
    allowReschedule: true,
    minimumNoticeHours: 24,
    maxReschedulesPerBooking: 3,
    allowProviderChangeOnReschedule: false,
  };

export const DEFAULT_PUBLIC_PAYMENT_SETTINGS: PublicPaymentSettings = {
  acceptCashPayments: false,
};

export function resolveCustomerSelfServiceSettings(
  settings: Record<string, unknown> | null | undefined,
): CustomerSelfServiceSettings {
  const publicBooking =
    (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  const raw =
    (publicBooking.customerSelfService as
      | Record<string, unknown>
      | undefined) ?? {};

  const minimumNoticeHours = parseNonNegativeInt(
    raw.minimumNoticeHours,
    DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS.minimumNoticeHours,
  );
  const maxReschedulesPerBooking = parsePositiveInt(
    raw.maxReschedulesPerBooking,
    DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS.maxReschedulesPerBooking,
  );

  return {
    allowCancel: raw.allowCancel !== false,
    allowReschedule: raw.allowReschedule !== false,
    minimumNoticeHours,
    maxReschedulesPerBooking,
    allowProviderChangeOnReschedule:
      raw.allowProviderChangeOnReschedule === true,
  };
}

export function resolvePublicPaymentSettings(
  settings: Record<string, unknown> | null | undefined,
): PublicPaymentSettings {
  const publicBooking =
    (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  return {
    acceptCashPayments: publicBooking.acceptCashPayments === true,
  };
}

export function mergeCustomerSelfServiceSettingsPatch(
  current: CustomerSelfServiceSettings,
  patch: Partial<CustomerSelfServiceSettings>,
): CustomerSelfServiceSettings {
  return {
    allowCancel: patch.allowCancel ?? current.allowCancel,
    allowReschedule: patch.allowReschedule ?? current.allowReschedule,
    minimumNoticeHours: patch.minimumNoticeHours ?? current.minimumNoticeHours,
    maxReschedulesPerBooking:
      patch.maxReschedulesPerBooking ?? current.maxReschedulesPerBooking,
    allowProviderChangeOnReschedule:
      patch.allowProviderChangeOnReschedule ??
      current.allowProviderChangeOnReschedule,
  };
}

export function applyCustomerSelfServiceToBusinessSettings(
  settings: Record<string, unknown>,
  customerSelfService: CustomerSelfServiceSettings,
): Record<string, unknown> {
  const publicBooking = {
    ...((settings.publicBooking as Record<string, unknown>) ?? {}),
  };
  publicBooking.customerSelfService = customerSelfService;
  return { ...settings, publicBooking };
}

export function applyPublicPaymentSettingsToBusinessSettings(
  settings: Record<string, unknown>,
  payment: PublicPaymentSettings,
): Record<string, unknown> {
  const publicBooking = {
    ...((settings.publicBooking as Record<string, unknown>) ?? {}),
  };
  publicBooking.acceptCashPayments = payment.acceptCashPayments;
  return { ...settings, publicBooking };
}

export interface BookingPolicyInput {
  status: string;
  startTime: Date;
  metadata?: Record<string, unknown> | null;
}

export function evaluateCustomerBookingPolicy(
  booking: BookingPolicyInput,
  settings: CustomerSelfServiceSettings,
  action: 'cancel' | 'reschedule',
  now = new Date(),
): { allowed: boolean; reason?: string } {
  if (booking.status === 'cancelled') {
    return { allowed: false, reason: 'This appointment is already cancelled' };
  }
  if (booking.status === 'completed') {
    return {
      allowed: false,
      reason: 'Completed appointments cannot be changed',
    };
  }
  if (booking.status === 'no_show') {
    return { allowed: false, reason: 'This appointment is marked as no-show' };
  }

  if (action === 'cancel' && !settings.allowCancel) {
    return {
      allowed: false,
      reason: 'Online cancellation is not available for this business',
    };
  }
  if (action === 'reschedule' && !settings.allowReschedule) {
    return {
      allowed: false,
      reason: 'Online rescheduling is not available for this business',
    };
  }

  const noticeMs = settings.minimumNoticeHours * 60 * 60 * 1000;
  if (booking.startTime.getTime() - now.getTime() < noticeMs) {
    return {
      allowed: false,
      reason: `Changes must be made at least ${settings.minimumNoticeHours} hours before your appointment`,
    };
  }

  if (action === 'reschedule') {
    const count = readRescheduleCount(booking.metadata);
    if (count >= settings.maxReschedulesPerBooking) {
      return {
        allowed: false,
        reason: `This appointment has reached the maximum of ${settings.maxReschedulesPerBooking} reschedules`,
      };
    }
  }

  return { allowed: true };
}

/** True when the customer can cancel or reschedule this booking online right now. */
export function canCustomerManageBookingOnline(
  booking: BookingPolicyInput,
  settings: CustomerSelfServiceSettings,
  now = new Date(),
): boolean {
  if (!settings.allowCancel && !settings.allowReschedule) return false;
  const cancel = evaluateCustomerBookingPolicy(
    booking,
    settings,
    'cancel',
    now,
  );
  const reschedule = evaluateCustomerBookingPolicy(
    booking,
    settings,
    'reschedule',
    now,
  );
  return cancel.allowed || reschedule.allowed;
}

export function resolveBookingManageLinkLabel(
  booking: BookingPolicyInput,
  settings: CustomerSelfServiceSettings,
  now = new Date(),
): string | null {
  const cancel = evaluateCustomerBookingPolicy(
    booking,
    settings,
    'cancel',
    now,
  );
  const reschedule = evaluateCustomerBookingPolicy(
    booking,
    settings,
    'reschedule',
    now,
  );
  if (cancel.allowed && reschedule.allowed) {
    return 'Manage your booking (reschedule or cancel)';
  }
  if (reschedule.allowed) return 'Manage your booking (reschedule)';
  if (cancel.allowed) return 'Manage your booking (cancel)';
  return null;
}

export function readRescheduleCount(
  metadata?: Record<string, unknown> | null,
): number {
  const value = metadata?.customerRescheduleCount;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function parseNonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}
