import { AI_FEATURE_CATALOG } from './ai-feature-catalog.js';
import { AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS } from './ai-feature-catalog.fixtures.js';

export const AI_PARITY_MATRIX_SCENARIOS = [
  {
    id: 'registry-catalog-non-empty',
    minCatalogSize: 200,
  },
  {
    id: 'nav-billing-covered',
    featureId: 'dashboard.nav.billing',
    expectedStatus: 'covered',
    tier: 'owner' as const,
    surface: 'dashboard' as const,
  },
  {
    id: 'customer-book-covered',
    featureId: 'customer.nav.book',
    expectedStatus: 'covered',
    tier: 'client' as const,
    surface: 'customer' as const,
  },
] as const;

export const AI_PARITY_DIVERGENCE_FIXTURES = {
  catalog: [
    {
      id: 'dashboard.test_action',
      surface: 'dashboard' as const,
      module: 'ai-command',
      actionKind: 'read' as const,
      minTier: 'staff' as const,
      label: 'Test staff directory',
      intentIds: ['list_employees'],
      extractionSource: 'manual' as const,
      confirmed: true,
    },
  ],
  underGrantTier: 'staff' as const,
  intentId: 'list_employees',
};

export const AI_PARITY_EXTRACTION_BACKLOG = AI_UI_FEATURE_CATALOG_UNCONFIRMED_IDS;

export const AI_PARITY_LIVE_CATALOG_SIZE = AI_FEATURE_CATALOG.length;
