import { ForbiddenException } from '@nestjs/common';
import {
  getClinicLabFeatureGate,
  isClinicLabFeaturesEnabled,
} from '../../../common/utils/clinic-lab-state.util.js';
import type { AppLocale } from '../../../common/i18n/messages.js';

export function readBusinessTypeFromSettings(
  settings: Record<string, unknown> | null | undefined,
): string | undefined {
  const value = settings?.businessType;
  return typeof value === 'string' ? value : undefined;
}

export function assertClinicLabFeaturesEnabled(
  businessType: string | undefined | null,
  locale: AppLocale = 'en',
): void {
  const gate = getClinicLabFeatureGate(businessType, locale);
  if (!gate.enabled) {
    throw new ForbiddenException(
      gate.reason ?? 'Clinic lab features are disabled.',
    );
  }
}

export function isClinicLabModuleEnabledForBusinessType(
  businessType: string | undefined | null,
): boolean {
  return isClinicLabFeaturesEnabled(businessType);
}
