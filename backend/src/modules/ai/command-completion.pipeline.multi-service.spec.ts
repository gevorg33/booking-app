/**
 * e2e-bug.445 / §221 — the multi-service completeness path.
 *
 * `resolve()` sets `entities.service = services[0]` unconditionally. That line
 * used to read `services.length === 1 ? services[0] : services[0]`, whose two
 * identical branches look like a bug and invite the "obvious fix" of matching
 * the `employee` shape one line above (`length === 1 ? … : undefined`).
 *
 * Applying that fix breaks nothing in the 8,464-case corpus and nothing in the
 * 40 suites around the pipeline — measured, not assumed — because **no test
 * covered a multi-service resolve reaching the completeness check**. It is a
 * coverage gap, not evidence of safety: `enrichedParams.serviceId` is only set
 * when exactly one service resolves, so with the singular withheld the check
 * `entities.service || enrichedParams.serviceId` fails and the validator asks
 * for a service the user has already named several of.
 *
 * These tests close that gap, so the next person to tidy the branch gets a red
 * suite rather than a silent regression.
 */
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import type { BusinessCatalog } from './command-completion.types.js';

const service = (id: string, name: string) =>
  ({ id, name, businessId: 'biz-1', duration: 30, price: 10 }) as never;

const catalog: BusinessCatalog = {
  employees: [],
  services: [service('svc-cut', 'Haircut'), service('svc-beard', 'Beard trim')],
  customers: [],
  templates: [],
};

describe('resolve() multi-service entities (e2e-bug.445)', () => {
  const pipeline = new CommandCompletionPipelineService();

  const resolveWith = (params: Record<string, unknown>) =>
    pipeline.resolve(
      'biz-1',
      'book a haircut and a beard trim',
      { action: 'create_multi_service_booking', params } as never,
      catalog,
      'UTC',
    );

  it('resolves both named services', () => {
    const resolved = resolveWith({ serviceNames: ['Haircut', 'Beard trim'] });
    expect(resolved.entities.services.map((s) => s.name)).toEqual([
      'Haircut',
      'Beard trim',
    ]);
  });

  it('still exposes a singular `service` when several were named', () => {
    // The load-bearing assertion. Naming several services is a deliberate
    // multi-service visit, not an ambiguous match, so the singular must stay
    // set — unlike `employee`, which is withheld precisely because more than
    // one match there means the name was ambiguous.
    const resolved = resolveWith({ serviceNames: ['Haircut', 'Beard trim'] });
    expect(resolved.entities.services.length).toBeGreaterThan(1);
    expect(resolved.entities.service).toBeDefined();
    expect(resolved.entities.service!.id).toBe('svc-cut');
  });

  it('leaves `serviceId` unset for several, which is why `service` must carry it', () => {
    // If this ever starts being set, the singular above stops being the only
    // thing holding the completeness check up, and the branch can be revisited.
    const resolved = resolveWith({ serviceNames: ['Haircut', 'Beard trim'] });
    expect(resolved.enrichedParams.serviceId).toBeUndefined();
  });

  it('sets both `service` and `serviceId` when exactly one resolves', () => {
    const resolved = resolveWith({ serviceNames: ['Haircut'] });
    expect(resolved.entities.service!.id).toBe('svc-cut');
    expect(resolved.enrichedParams.serviceId).toBe('svc-cut');
  });
});
