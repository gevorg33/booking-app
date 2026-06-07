import { ForbiddenException } from '@nestjs/common';
import {
  assertClinicLabFeaturesEnabled,
  isClinicLabModuleEnabledForBusinessType,
  readBusinessTypeFromSettings,
} from './clinic-test-results-gate.util.js';

describe('clinic-test-results-gate.util', () => {
  it('reads business type from settings', () => {
    expect(readBusinessTypeFromSettings({ businessType: 'clinic' })).toBe(
      'clinic',
    );
    expect(readBusinessTypeFromSettings({})).toBeUndefined();
  });

  it('enables module for clinic vertical types only', () => {
    expect(isClinicLabModuleEnabledForBusinessType('polyclinic')).toBe(true);
    expect(isClinicLabModuleEnabledForBusinessType('hair_salon')).toBe(false);
  });

  it('throws when lab features disabled without custom reason', () => {
    expect(() => assertClinicLabFeaturesEnabled('hair_salon')).toThrow(
      ForbiddenException,
    );
  });

  it('allows clinic vertical tenants', () => {
    expect(() => assertClinicLabFeaturesEnabled('clinic')).not.toThrow();
  });
});
