import { describe, expect, it } from 'vitest';
import {
  clampDashboardSidebarWidth,
  DASHBOARD_SIDEBAR_DEFAULT_WIDTH,
  DASHBOARD_SIDEBAR_MAX_WIDTH,
  DASHBOARD_SIDEBAR_MIN_WIDTH,
  readDashboardSidebarWidth,
} from './dashboard-sidebar-width';

describe('dashboard-sidebar-width', () => {
  it('clamps width between min and max', () => {
    expect(clampDashboardSidebarWidth(100)).toBe(DASHBOARD_SIDEBAR_MIN_WIDTH);
    expect(clampDashboardSidebarWidth(999)).toBe(DASHBOARD_SIDEBAR_MAX_WIDTH);
    expect(clampDashboardSidebarWidth(280.6)).toBe(281);
  });

  it('returns default when localStorage is missing or invalid', () => {
    expect(readDashboardSidebarWidth()).toBe(DASHBOARD_SIDEBAR_DEFAULT_WIDTH);
  });
});
