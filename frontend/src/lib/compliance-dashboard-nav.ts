/** Deep-link targets for Settings → Compliance panels (mirrors backend util). */

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
  query?: Record<string, string>;
  hash?: string;
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

export function isComplianceDashboardPanel(
  value: string | null | undefined,
): value is ComplianceDashboardPanel {
  return (
    typeof value === 'string' &&
    (COMPLIANCE_DASHBOARD_PANELS as readonly string[]).includes(value)
  );
}

export function buildDashboardNavigateUrl(
  navigate: DashboardNavigateTarget,
): string {
  const query = navigate.query
    ? `?${new URLSearchParams(navigate.query).toString()}`
    : '';
  const hash = navigate.hash ? `#${navigate.hash}` : '';
  return `${navigate.path}${query}${hash}`;
}

export function scrollToCompliancePanel(
  panel: ComplianceDashboardPanel,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (typeof document === 'undefined') return;
  const id = COMPLIANCE_PANEL_SECTION_IDS[panel];
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior, block: 'start' });
}

export function resolveCompliancePanelFromSearch(
  panel: string | null,
  section: string | null,
): ComplianceDashboardPanel | null {
  if (panel !== 'compliance') return null;
  if (isComplianceDashboardPanel(section)) return section;
  return 'overview';
}
