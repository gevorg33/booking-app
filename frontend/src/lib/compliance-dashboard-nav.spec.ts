import { describe, expect, it } from 'vitest';
import {
  buildDashboardNavigateUrl,
  resolveCompliancePanelFromSearch,
} from './compliance-dashboard-nav';

describe('compliance-dashboard-nav', () => {
  it('builds settings deep link with query and hash', () => {
    expect(
      buildDashboardNavigateUrl({
        path: '/dashboard/settings',
        query: { panel: 'compliance', section: 'breach' },
        hash: 'compliance-breach',
      }),
    ).toBe(
      '/dashboard/settings?panel=compliance&section=breach#compliance-breach',
    );
  });

  it('resolves compliance panel from search params', () => {
    expect(resolveCompliancePanelFromSearch('compliance', 'breach')).toBe(
      'breach',
    );
    expect(resolveCompliancePanelFromSearch('notifications', 'breach')).toBeNull();
  });
});
