export const DASHBOARD_SIDEBAR_WIDTH_KEY = 'dashboard-sidebar-width';
export const DASHBOARD_SIDEBAR_DEFAULT_WIDTH = 256;
export const DASHBOARD_SIDEBAR_MIN_WIDTH = 200;
export const DASHBOARD_SIDEBAR_MAX_WIDTH = 420;

export function clampDashboardSidebarWidth(width: number): number {
  return Math.min(
    DASHBOARD_SIDEBAR_MAX_WIDTH,
    Math.max(DASHBOARD_SIDEBAR_MIN_WIDTH, Math.round(width)),
  );
}

export function readDashboardSidebarWidth(): number {
  if (typeof window === 'undefined') return DASHBOARD_SIDEBAR_DEFAULT_WIDTH;
  const raw = window.localStorage.getItem(DASHBOARD_SIDEBAR_WIDTH_KEY);
  if (!raw) return DASHBOARD_SIDEBAR_DEFAULT_WIDTH;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DASHBOARD_SIDEBAR_DEFAULT_WIDTH;
  return clampDashboardSidebarWidth(parsed);
}

export function persistDashboardSidebarWidth(width: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    DASHBOARD_SIDEBAR_WIDTH_KEY,
    String(clampDashboardSidebarWidth(width)),
  );
}
