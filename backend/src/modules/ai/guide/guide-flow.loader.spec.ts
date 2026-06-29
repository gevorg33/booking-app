import {
  assertGuideFlowCatalogIntegrity,
  listAllGuideFlowPlaybookDefs,
  listGuideFlowSurfacePlaybooks,
} from './guide-flow.loader.js';
import { DASHBOARD_GUIDE_NAV_ROUTES } from '../ai-product-guide-ranking.util.js';
import {
  assertGuideFlowRouteCoverage,
  GUIDE_FLOW_ROUTE_PRIMARY_TOPIC,
  resolveGuideFlowRoutePrimaryTopic,
} from './guide-flow.routes.manifest.js';

describe('guide-flow.loader (ai-guide-1.1.2)', () => {
  it('loads unique playbooks for all four surfaces', () => {
    assertGuideFlowCatalogIntegrity();
    expect(listGuideFlowSurfacePlaybooks('dashboard').length).toBeGreaterThanOrEqual(11);
    expect(listGuideFlowSurfacePlaybooks('provider').length).toBeGreaterThanOrEqual(12);
    expect(listGuideFlowSurfacePlaybooks('customer').length).toBeGreaterThanOrEqual(6);
    expect(listGuideFlowSurfacePlaybooks('public').length).toBeGreaterThanOrEqual(3);
    expect(listAllGuideFlowPlaybookDefs().length).toBeGreaterThan(30);
  });

  it('maps every dashboard nav route to a primary flow topic', () => {
    assertGuideFlowRouteCoverage();
    for (const route of DASHBOARD_GUIDE_NAV_ROUTES) {
      const topicId = resolveGuideFlowRoutePrimaryTopic(route);
      expect(topicId).toBeTruthy();
      expect(GUIDE_FLOW_ROUTE_PRIMARY_TOPIC[route]).toBe(topicId);
    }
  });
});
