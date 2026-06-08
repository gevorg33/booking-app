import { BadRequestException } from '@nestjs/common';
import type { AppLocale } from '../i18n/messages.js';
import {
  getBusinessEnabledLocales,
  normalizeAppLocale,
  resolveTenantLocale,
} from './business-locale.util.js';

export const CUSTOMER_PREFERRED_LOCALE_METADATA_KEY = 'preferredLocale';

export function readCustomerPreferredLocale(
  metadata?: Record<string, unknown> | null,
): AppLocale | null {
  return normalizeAppLocale(
    metadata?.[CUSTOMER_PREFERRED_LOCALE_METADATA_KEY] as string | undefined,
  );
}

export function applyCustomerPreferredLocale(
  metadata: Record<string, unknown> | null | undefined,
  locale: AppLocale,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [CUSTOMER_PREFERRED_LOCALE_METADATA_KEY]: locale,
  };
}

/** Notification send locale: customer preference → tenant default → en; clamped to enabledLocales. */
export function resolveCustomerNotificationLocale(
  customerMetadata: Record<string, unknown> | null | undefined,
  businessSettings?: Record<string, unknown>,
): AppLocale {
  return resolveTenantLocale(
    readCustomerPreferredLocale(customerMetadata),
    businessSettings,
  );
}

export function assertCustomerPreferredLocale(
  locale: string,
  businessSettings?: Record<string, unknown>,
): AppLocale {
  const normalized = normalizeAppLocale(locale);
  if (!normalized) {
    throw new BadRequestException(
      'preferredLocale must be one of: en, hy, ru',
    );
  }
  const enabled = getBusinessEnabledLocales(businessSettings);
  if (!enabled.includes(normalized)) {
    throw new BadRequestException(
      'preferredLocale must be one of the enabled languages',
    );
  }
  return normalized;
}
