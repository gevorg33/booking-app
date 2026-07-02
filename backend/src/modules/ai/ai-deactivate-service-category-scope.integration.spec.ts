import {
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS,
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_RESCUE_SCENARIOS,
} from './ai-deactivate-service-category-scope.fixtures.js';
import { handleDeactivateServiceLogic } from './ai-catalog.logic.js';
import { rescueDeactivateServiceCategoryScopeIntent } from './ai-deactivate-service-category-scope.util.js';

const services = [
  {
    id: 'hair-1',
    name: 'Blowdry',
    isActive: true,
    category: { name: 'Hair' },
  },
  {
    id: 'massage-1',
    name: 'Swedish Massage',
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 'skin-1',
    name: 'Basic Facial',
    isActive: true,
    category: { name: 'Skin' },
  },
  {
    id: 'dental-1',
    name: 'Cleaning',
    isActive: true,
    category: { name: 'Dental' },
  },
  {
    id: 'dental-2',
    name: 'Whitening',
    isActive: true,
    category: { name: 'Dental' },
  },
] as any[];

function buildDeps() {
  return {
    serviceService: {
      remove: jest.fn().mockResolvedValue(undefined),
    },
  } as any;
}

describe('ai-deactivate-service-category-scope integration', () => {
  it.each(DEACTIVATE_SERVICE_CATEGORY_SCOPE_RESCUE_SCENARIOS)(
    'rescues $id from $misclassifiedAction',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueDeactivateServiceCategoryScopeIntent(prompt, misclassifiedAction!)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(
    DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS.filter(
      (row) => row.paramsPartial?.allInCategory,
    ).slice(0, 4),
  )('deactivates category scope for $id', async ({ prompt }) => {
    const deps = buildDeps();
    const result = await handleDeactivateServiceLogic(
      deps,
      'biz-1',
      {},
      services,
      prompt,
    );
    expect(result.success).toBe(true);
    expect((result.details as any).count).toBeGreaterThan(0);
    expect(deps.serviceService.remove).toHaveBeenCalled();
  });

  it('deactivates all dental services in category', async () => {
    const deps = buildDeps();
    const result = await handleDeactivateServiceLogic(
      deps,
      'biz-1',
      {},
      services,
      'Deactivate all dental services',
    );
    expect(result.success).toBe(true);
    expect(deps.serviceService.remove).toHaveBeenCalledTimes(2);
    expect(result.summary.toLowerCase()).toContain('dental');
  });

  it('still deactivates a single named service', async () => {
    const deps = buildDeps();
    const result = await handleDeactivateServiceLogic(
      deps,
      'biz-1',
      { serviceName: 'Blowdry' },
      services,
      'Hide Blowdry from public catalog',
    );
    expect(result.success).toBe(true);
    expect(deps.serviceService.remove).toHaveBeenCalledWith('hair-1');
  });

  it('fails when category scope matches no active services', async () => {
    const deps = buildDeps();
    const result = await handleDeactivateServiceLogic(
      deps,
      'biz-1',
      {},
      services,
      'Deactivate all spa services',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('No active services');
  });
});
