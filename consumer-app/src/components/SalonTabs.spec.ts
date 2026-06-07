import { describe, expect, it } from 'vitest';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import {
  resolvePatientAlertConsumerRoute,
  type ClinicPatientAlertView,
} from '../lib/clinic-patient-alerts.js';

describe('SalonTabs clinic gating', () => {
  it('shows results tab only for clinic vertical tenants', () => {
    expect(shouldShowPatientResultsTab('clinic')).toBe(true);
    expect(shouldShowPatientResultsTab('beauty_clinic')).toBe(true);
    expect(shouldShowPatientResultsTab('hair_salon')).toBe(false);
    expect(shouldShowPatientResultsTab(undefined)).toBe(false);
  });

  it('routes lab booking alerts to the lab-to-book tab', () => {
    const chartTab: ClinicPatientAlertView['chartTab'] = 'orders';
    expect(resolvePatientAlertConsumerRoute(chartTab)).toBe('/lab-to-book');
  });
});
