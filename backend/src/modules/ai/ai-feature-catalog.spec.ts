import {
  AI_FEATURE_CATALOG,
  AI_UI_FEATURE_CATALOG,
  AI_UI_FEATURE_CATALOG_ERRORS,
  validateFeatureCatalog,
} from './ai-feature-catalog.js';
import {
  AI_UI_FEATURE_CATALOG_MIN_COUNTS,
  AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS,
} from './ai-feature-catalog.fixtures.js';

describe('ai-feature-catalog (parity-1.1)', () => {
  it('has zero validation errors on the UI inventory', () => {
    expect(AI_UI_FEATURE_CATALOG_ERRORS).toEqual([]);
    expect(validateFeatureCatalog(AI_UI_FEATURE_CATALOG)).toEqual([]);
  });

  it('meets minimum UI action counts per surface', () => {
    for (const [surface, min] of Object.entries(AI_UI_FEATURE_CATALOG_MIN_COUNTS)) {
      const count = AI_UI_FEATURE_CATALOG.filter((entry) => entry.surface === surface).length;
      expect(count).toBeGreaterThanOrEqual(min);
    }
  });

  it('tags every UI row with surface, minTier, module, and actionKind', () => {
    for (const entry of AI_UI_FEATURE_CATALOG) {
      expect(entry.surface).toMatch(/^(dashboard|provider|customer|public)$/);
      expect(entry.minTier).toMatch(/^(client|staff|manager|owner)$/);
      expect(entry.module).toBeTruthy();
      expect(['read', 'mutate']).toContain(entry.actionKind);
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses unique ids across the UI catalog', () => {
    const ids = AI_UI_FEATURE_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes unconfirmed extraction backlog rows', () => {
    expect(AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS).toContain('dashboard.route.calendar');
    expect(AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS).toContain('public.flow.any_first_available');
  });

  it('merges UI inventory with registry intents for the live catalog', () => {
    expect(AI_FEATURE_CATALOG.length).toBeGreaterThan(AI_UI_FEATURE_CATALOG.length);
    expect(AI_FEATURE_CATALOG.some((entry) => entry.id === 'dashboard.list_bookings')).toBe(
      true,
    );
    expect(AI_FEATURE_CATALOG.some((entry) => entry.id === 'dashboard.nav.bookings')).toBe(
      true,
    );
  });
});
