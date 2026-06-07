import { describe, expect, it } from 'vitest';
import {
  isClinicVerticalBusinessType,
  shouldShowPatientResultsTab,
} from './clinic-service.js';

describe('clinic-service', () => {
  it('detects clinic vertical business types', () => {
    expect(isClinicVerticalBusinessType('clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('polyclinic')).toBe(true);
    expect(isClinicVerticalBusinessType('hair_salon')).toBe(false);
    expect(isClinicVerticalBusinessType(undefined)).toBe(false);
  });

  it('gates patient results tab by clinic vertical', () => {
    expect(shouldShowPatientResultsTab('dental')).toBe(true);
    expect(shouldShowPatientResultsTab('tour_operator')).toBe(false);
  });
});
