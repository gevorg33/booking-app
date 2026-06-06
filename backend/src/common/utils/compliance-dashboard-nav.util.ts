/** Deep-link targets for Settings → Compliance panels (compliance-1.16 deferred). */

export const COMPLIANCE_DASHBOARD_PANELS = [
  'overview',
  'breach',
  'hipaa',
  'phi_audit',
  'sub_processors',
] as const;

export type ComplianceDashboardPanel =
  (typeof COMPLIANCE_DASHBOARD_PANELS)[number];

export interface DashboardNavigateTarget {
  path: string;
  query: Record<string, string>;
  hash: string;
}

export const COMPLIANCE_PANEL_SECTION_IDS: Record<
  ComplianceDashboardPanel,
  string
> = {
  overview: 'compliance-overview',
  breach: 'compliance-breach',
  hipaa: 'compliance-hipaa',
  phi_audit: 'compliance-phi-audit',
  sub_processors: 'compliance-sub-processors',
};

export function compliancePanelLabel(panel: ComplianceDashboardPanel): string {
  switch (panel) {
    case 'breach':
      return 'breach log';
    case 'hipaa':
      return 'HIPAA settings';
    case 'phi_audit':
      return 'PHI access audit';
    case 'sub_processors':
      return 'sub-processors list';
    default:
      return 'compliance overview';
  }
}

export function buildComplianceDashboardNavigate(
  panel: ComplianceDashboardPanel,
): DashboardNavigateTarget {
  const sectionId = COMPLIANCE_PANEL_SECTION_IDS[panel];
  return {
    path: '/dashboard/settings',
    query: { panel: 'compliance', section: panel },
    hash: sectionId,
  };
}

export function parseComplianceDashboardPanel(
  prompt: string,
  params: Record<string, unknown> = {},
): ComplianceDashboardPanel {
  const fromParams =
    typeof params.panel === 'string' ? params.panel.trim() : undefined;
  if (
    fromParams &&
    (COMPLIANCE_DASHBOARD_PANELS as readonly string[]).includes(fromParams)
  ) {
    return fromParams as ComplianceDashboardPanel;
  }

  if (
    /\b(?:breach\s+(?:log|incidents?)|breach\s+notification\s+log)\b/i.test(
      prompt,
    )
  ) {
    return 'breach';
  }

  if (/\bphi\s+(?:access\s+)?audit\b/i.test(prompt)) {
    return 'phi_audit';
  }

  if (/\b(?:hipaa|baa)\b/i.test(prompt)) {
    return 'hipaa';
  }

  if (/\bsub[\s-]?processors?\b/i.test(prompt)) {
    return 'sub_processors';
  }

  return 'overview';
}
