import {
  assertAllowedClinicLabInfoType,
  assertAllowedClinicLabLocation,
  assertAllowedClinicLabIntegrationVendorCode,
  listExternalClinicLabInfo,
  normalizeClinicLabInfoName,
} from './clinic-lab-info.util.js';
import { CLINIC_LAB_INFO_FIXTURES } from '../../modules/clinic-lis/clinic-lis.fixtures.js';

describe('clinic-lab-info.util', () => {
  it('normalizes lab names', () => {
    expect(normalizeClinicLabInfoName('  Core   Lab  ')).toBe('Core Lab');
  });

  it('rejects region-specific vendor codes', () => {
    expect(() =>
      assertAllowedClinicLabIntegrationVendorCode('Dynacare'),
    ).toThrow('Region-specific LIS vendor codes are not supported');
  });

  it('lists external active labs only', () => {
    const external = listExternalClinicLabInfo([...CLINIC_LAB_INFO_FIXTURES]);
    expect(external).toHaveLength(1);
    expect(external[0]?.labLocation).toBe('External');
  });

  it('allows generic vendor codes', () => {
    expect(assertAllowedClinicLabIntegrationVendorCode('GENERIC-LIS')).toBe(
      'GENERIC-LIS',
    );
  });

  it('validates lab location and type enums', () => {
    expect(assertAllowedClinicLabLocation('External')).toBe('External');
    expect(assertAllowedClinicLabInfoType(null)).toBeNull();
    expect(() => assertAllowedClinicLabLocation('Invalid')).toThrow(
      'Unsupported clinic lab location',
    );
    expect(() => assertAllowedClinicLabInfoType('Partner')).toThrow(
      'Unsupported clinic lab type',
    );
  });
});
