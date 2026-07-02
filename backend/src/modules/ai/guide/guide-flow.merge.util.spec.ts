import {
  GUIDE_FLOW_ROLE_SCENARIOS,
  GUIDE_FLOW_ROUTE_PRIMARY_SCENARIOS,
  GUIDE_FLOW_VERTICAL_SCENARIOS,
} from './guide-flow.fixtures.js';
import { listAllGuideFlowPlaybookDefs } from './guide-flow.loader.js';
import {
  listGuideFlowPlaybooks,
  mergeGuideFlowPlaybooks,
  pickGuideFlowPlaybookForRoute,
  resolveActiveGuideVerticalOverlays,
  resolveGuideFlowSurfaceFromRoute,
} from './guide-flow.merge.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide-flow.routes.manifest.js';

describe('guide-flow.merge.util (ai-guide-1.1.3 / 1.1.4)', () => {
  it.each(GUIDE_FLOW_ROUTE_PRIMARY_SCENARIOS)(
    'resolves route primary topic for $id',
    ({ route, topicId }) => {
      expect(resolveGuideFlowRoutePrimaryTopic(route)).toBe(topicId);
      const surface = resolveGuideFlowSurfaceFromRoute(route)!;
      const playbooks = mergeGuideFlowPlaybooks({
        surface,
        route,
        vertical: 'clinic',
        planTierId: 'business',
        enabledModules: ['giftCards'],
        roleProfile:
          surface === 'dashboard'
            ? 'owner'
            : surface === 'provider'
              ? 'provider'
              : 'customer',
      });
      const picked = pickGuideFlowPlaybookForRoute(route, playbooks);
      expect(picked?.topicId).toBe(topicId);
    },
  );

  it.each(GUIDE_FLOW_ROLE_SCENARIOS)(
    'role overlay visibility for $id',
    ({ topicId, ctx, expectedVisible }) => {
      const playbooks = listGuideFlowPlaybooks(ctx);
      expect(playbooks.some((row) => row.topicId === topicId)).toBe(
        expectedVisible,
      );
    },
  );

  it.each(GUIDE_FLOW_VERTICAL_SCENARIOS)(
    'vertical overlay visibility for $id',
    ({ topicId, ctx, expectedVisible }) => {
      const playbooks = listGuideFlowPlaybooks(ctx);
      expect(playbooks.some((row) => row.topicId === topicId)).toBe(
        expectedVisible,
      );
    },
  );

  it('merges clinic overlay playbooks when vertical is clinic', () => {
    const overlays = resolveActiveGuideVerticalOverlays({ vertical: 'clinic' });
    expect(overlays).toContain('clinic');
    const playbooks = listGuideFlowPlaybooks({
      surface: 'customer',
      vertical: 'clinic',
    });
    expect(playbooks.some((row) => row.topicId === 'consumer-clinic')).toBe(
      true,
    );
  });

  it('ships ordered steps with navigate targets on dashboard schedule playbook', () => {
    const playbook = listAllGuideFlowPlaybookDefs().find(
      (row) => row.topicId === 'dashboard.core.schedule',
    );
    expect(playbook?.steps.length).toBeGreaterThanOrEqual(4);
    expect(playbook?.navigateTarget?.path).toBe('/dashboard/schedule');
    expect(playbook?.steps[0]?.navigate?.path).toBe('/dashboard/schedule');
  });
});
