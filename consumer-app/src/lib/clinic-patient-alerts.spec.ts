import { describe, expect, it } from 'vitest';
import {
  resolvePatientAlertAccountAnchor,
  resolvePatientAlertConsumerRoute,
  unwrapPatientChartAlerts,
} from './clinic-patient-alerts.js';

describe('clinic-patient-alerts', () => {
  it('unwraps alert list payloads', () => {
    expect(unwrapPatientChartAlerts({ alerts: [{ id: 'a1' }], totalCount: 1 })).toEqual({
      alerts: [{ id: 'a1' }],
      totalCount: 1,
    });
    expect(unwrapPatientChartAlerts({ data: { alerts: [], totalCount: 0 } })).toEqual({
      alerts: [],
      totalCount: 0,
    });
    expect(unwrapPatientChartAlerts(null)).toEqual({ alerts: [], totalCount: 0 });
  });

  it('maps chart tabs to account anchors', () => {
    expect(resolvePatientAlertAccountAnchor('results')).toBe('my-results');
    expect(resolvePatientAlertAccountAnchor('orders')).toBe('my-lab-requests');
    expect(resolvePatientAlertAccountAnchor('intake')).toBe('my-intake');
    expect(
      resolvePatientAlertAccountAnchor('unknown' as 'results'),
    ).toBe('my-bookings');
  });

  it('maps chart tabs to consumer routes', () => {
    expect(resolvePatientAlertConsumerRoute('results')).toBe('/results');
    expect(resolvePatientAlertConsumerRoute('orders')).toBe('/lab-to-book');
    expect(resolvePatientAlertConsumerRoute('intake')).toBe('/account');
  });
});
