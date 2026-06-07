import {
  buildComplianceDashboardNavigate,
  parseComplianceDashboardPanel,
} from './compliance-dashboard-nav.util.js';

describe('compliance-dashboard-nav.util', () => {
  it('builds settings deep link for breach panel', () => {
    expect(buildComplianceDashboardNavigate('breach')).toEqual({
      path: '/dashboard/settings',
      query: { panel: 'compliance', section: 'breach' },
      hash: 'compliance-breach',
    });
  });

  it('parses panel from prompt phrasing', () => {
    expect(parseComplianceDashboardPanel('Open compliance settings')).toBe(
      'overview',
    );
    expect(parseComplianceDashboardPanel('Take me to breach log')).toBe(
      'breach',
    );
    expect(
      parseComplianceDashboardPanel('Open HIPAA compliance settings'),
    ).toBe('hipaa');
    expect(parseComplianceDashboardPanel('Show PHI access audit')).toBe(
      'phi_audit',
    );
    expect(parseComplianceDashboardPanel('Open sub-processors list')).toBe(
      'sub_processors',
    );
  });
});
