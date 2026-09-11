/**
 * e2e-bug.448 — a partially-successful catalog compound must not report as if
 * nothing happened.
 *
 * `handleCatalogCompoundLogic` runs steps in order and returns on the first
 * failure. Earlier steps have already written to the database by then, so the
 * old `Stopped at step N (X): …` told the user their request failed while a
 * category and its services existed.
 *
 * This is the shared residual of e2e-bug.348 and e2e-bug.349: both reported
 * prompts end with an online-payment instruction, `enable_online_payment` is
 * not one of the 14 supported step kinds, and so the compound failed on top of
 * a successful catalog creation.
 *
 * The run still stops — a later step may depend on the failed one — but what
 * landed is now named, and exposed separately as `details.completedSteps`.
 */
import { handleCatalogCompoundLogic } from './ai-catalog.logic.js';

/** Minimal deps: only the bulk-create path is exercised before the failure. */
const deps = {
  categoryService: {
    findAll: async () => [],
    create: async (_b: string, dto: any) => ({ id: 'cat-1', name: dto.name }),
  },
  serviceService: {
    findAll: async () => [],
    create: async (_b: string, dto: any) => ({ id: `svc-${dto.name}`, ...dto }),
  },
} as any;

const PROMPT =
  'Create a category Y with three services: service A, 30 minutes, $50; service B, 45 minutes, $45; service C, 60 minutes, $70. Turn on online payment for all of them.';

/** The plan shape reported in e2e-bug.348, ending in an unsupported step. */
const STEPS = [
  {
    action: 'bulk_create_catalog',
    params: {
      catalogDraft: {
        categoryName: 'Y',
        services: [
          { serviceName: 'A', durationMinutes: 30, price: 50 },
          { serviceName: 'B', durationMinutes: 45, price: 45 },
        ],
      },
    },
    segment: 'create category Y with services',
  },
  {
    action: 'enable_online_payment',
    params: {},
    segment: 'turn on online payment',
  },
];

const run = () =>
  handleCatalogCompoundLogic(
    deps,
    'biz-1',
    PROMPT,
    { compoundSteps: STEPS },
    [] as any,
    [] as any,
    () => undefined,
  );

describe('e2e-bug.448 — partial catalog compound reporting', () => {
  it('still stops at the failing step', async () => {
    const r = await run();
    expect(r.success).toBe(false);
    expect((r.details as any).failedStep).toBe('enable_online_payment');
  });

  it('names the work that already landed in the summary', async () => {
    const r = await run();
    expect(r.summary).toMatch(
      /Completed before stopping: bulk create catalog\./,
    );
  });

  it('exposes completedSteps separately from the step list', async () => {
    const r = await run();
    const d = r.details as any;
    // `steps` includes the failed action; `completedSteps` must not.
    expect(d.steps).toEqual(['bulk_create_catalog', 'enable_online_payment']);
    expect(d.completedSteps.map((s: any) => s.action)).toEqual([
      'bulk_create_catalog',
    ]);
  });

  it('says nothing about completed work when the first step is the one that fails', async () => {
    const r = await handleCatalogCompoundLogic(
      deps,
      'biz-1',
      PROMPT,
      {
        compoundSteps: [
          { action: 'enable_online_payment', params: {}, segment: 'x' },
          { action: 'bulk_create_catalog', params: {}, segment: 'y' },
        ],
      },
      [] as any,
      [] as any,
      () => undefined,
    );
    expect(r.success).toBe(false);
    expect(r.summary).not.toMatch(/Completed before stopping/);
    expect((r.details as any).completedSteps).toEqual([]);
  });
});
