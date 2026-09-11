/**
 * tech-debt A1 / e2e-bug.392 — the planner's execution path, and what gates it.
 *
 * ## The ticket's headline is stale, and this file is the proof
 *
 * `e2e-bug.392` reads: *"`ai-gateway.service.ts` runs the planner in its
 * trace-recording tail, with the comment 'it can never affect `opts.result`',
 * behind `AI_PLANNER_SHADOW_SURFACES`, which is unset. The planner is an
 * observer that does not even observe."*
 *
 * That was true when it was written and has not been true since §90/§129. The
 * shadow runner still exists and is still unset, but it is no longer the only
 * path: `CommandUnderstandingPipelineService.stagePlannerRoute` runs on **every
 * request**, calls `decidePlannerRoute`, and pushes a real candidate. And
 * `plannerExecuteDomains()` seeds itself from `RETIRED_DETECTOR_DOMAINS`, so
 * `tour` and `guide` are enabled with no environment variable set at all.
 *
 * A stale ticket is cheap to fix; a stale ticket that makes a live code path
 * look dead is not. The first three tests below assert the path is live, so the
 * claim cannot rot again in either direction.
 */
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';
import {
  PLANNER_EXECUTE_DOMAINS_KEY,
  RETIRED_DETECTOR_DOMAINS,
  plannerExecuteDomains,
} from './ai-planner-route.util.js';
import { assessSliceRetirement } from './ai-retirement-criterion.util.js';
import { RESCUE_ACTION_LOCKED_DOMAINS } from './ai-rescue-steal-guard.js';

type InventoryRow = {
  label?: string;
  file?: string;
  reachableFromProduction?: boolean;
};

/** A single-step, valid, executable plan for the named command. */
function plannerStub(command: string, confidence = 0.93) {
  return {
    plan: async () => ({
      status: 'executable' as const,
      plan: {
        steps: [
          { id: 's1', command, variables: {}, confidence, dependsOn: [] },
        ],
        unresolved: [],
        topicChanged: false,
      },
      validation: {
        executable: true,
        problems: [],
        highestRisk: 'T0',
        requiresConfirmation: false,
      },
    }),
  };
}

function buildPipeline(planner: unknown) {
  const promptNormalization = {
    normalizeForClassifier: async (
      _b: string,
      _u: string | undefined,
      prompt: string,
    ) => ({
      original: prompt,
      normalized: prompt,
      method: 'passthrough',
      classifierContext: undefined,
    }),
  };
  return new CommandUnderstandingPipelineService(
    promptNormalization as never,
    { score: () => [] } as never,
    { match: async () => null } as never,
    { rescue: () => ({ rescued: false }) } as never,
    planner as never,
  );
}

function buildInput(
  overrides: Partial<PipelineUnderstandInput> = {},
): PipelineUnderstandInput {
  return {
    businessId: 'biz-1',
    effectivePrompt: 'what tour bookings do I have this week?',
    surface: 'dashboard',
    confidenceLow: 0.4,
    confidenceHigh: 0.8,
    // Deliberately a *different*, lower-confidence answer, so a test that
    // passes can only be the planner's candidate winning.
    classify: async () => ({
      action: 'list_upcoming_tour_departures',
      params: {},
      reasoning: 'stubbed classify',
      confidence: 0.55,
    }),
    sessionContext: { _accessTier: 'owner' },
    ...overrides,
  };
}

describe('the planner execution path is live (e2e-bug.392 is stale)', () => {
  const original = process.env[PLANNER_EXECUTE_DOMAINS_KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[PLANNER_EXECUTE_DOMAINS_KEY];
    else process.env[PLANNER_EXECUTE_DOMAINS_KEY] = original;
  });

  it('enables the retired domains with no environment variable set', () => {
    delete process.env[PLANNER_EXECUTE_DOMAINS_KEY];
    const domains = plannerExecuteDomains({} as NodeJS.ProcessEnv);
    for (const d of RETIRED_DETECTOR_DOMAINS) expect(domains.has(d)).toBe(true);
    expect(domains.size).toBeGreaterThan(0);
  });

  it('routes a tour plan through the pipeline, beating the classifier', async () => {
    delete process.env[PLANNER_EXECUTE_DOMAINS_KEY];
    const pipeline = buildPipeline(plannerStub('tour.list_calendar_week'));

    const result = await pipeline.understand(buildInput());

    // The classifier said `list_upcoming_tour_departures`. If the stage were
    // dead — the state e2e-bug.392 describes — that is what would come back.
    expect(result.action).toBe('list_tour_calendar_week');
    expect(result.trace.some((t) => t.stage === 'planner')).toBe(true);
  });

  it('is skipped, not crashed, when no planner is injected', async () => {
    const pipeline = buildPipeline(undefined);
    const result = await pipeline.understand(buildInput());
    expect(result.action).toBe('list_upcoming_tour_departures');
  });

  it('does not route a domain that is neither retired nor named by the flag', async () => {
    delete process.env[PLANNER_EXECUTE_DOMAINS_KEY];
    const pipeline = buildPipeline(plannerStub('catalog.list_packages'));

    const result = await pipeline.understand(
      buildInput({ effectivePrompt: 'what packages do we sell' }),
    );

    // `catalog` is not retired and not flagged, so the seam must decline it —
    // this is §90's "it competes, it is not privileged" holding everywhere the
    // detectors still do the work.
    expect(result.action).toBe('list_upcoming_tour_departures');
  });
});

/**
 * A1's third checkbox: *"measure recovery per slice **before** enabling it, not
 * after."* A habit cannot be enforced; a table can.
 *
 * Every domain that routes without configuration has to carry its §94 evidence
 * here, judged by A4's criterion (`e2e-bug.406`). Adding a domain to
 * `RETIRED_DETECTOR_DOMAINS` without adding a row fails.
 */
const SLICE_EVIDENCE: Record<
  string,
  {
    sliceTraces: number;
    rescueDependentTraces: number;
    recoveredTraces: number;
  }
> = {
  tour: { sliceTraces: 166, rescueDependentTraces: 34, recoveredTraces: 33 },
  guide: { sliceTraces: 245, rescueDependentTraces: 2, recoveredTraces: 0 },
};

/**
 * `guide` was enabled without evidence of its own.
 *
 * It was carried along with `tour` as one slice in §93 — same commit, same
 * argument — but §94 measured its recovery separately and it is **0 of 2**: the
 * planner routes its one rescue-dependent prompt to the wrong command. Under
 * A4's criterion it does not clear, and it would not be enabled today.
 *
 * Recorded rather than reverted. The population is 2 traces of 245, rescue is
 * locked for the domain either way, and reverting on n=2 would be the same
 * error in the other direction — acting on a sample too small to carry a
 * decision. It is listed here so "guide is retired" is never again read as
 * "guide was measured".
 */
const ENABLED_WITHOUT_CLEARING = ['guide'];

describe('every domain enabled by default carries its evidence', () => {
  it('has a row for every retired domain', () => {
    for (const domain of RETIRED_DETECTOR_DOMAINS) {
      expect(SLICE_EVIDENCE[domain]).toBeDefined();
    }
  });

  it.each(
    RETIRED_DETECTOR_DOMAINS.filter(
      (d) => !ENABLED_WITHOUT_CLEARING.includes(d),
    ),
  )('%s clears the retirement criterion', (domain) => {
    const verdict = assessSliceRetirement({
      domain,
      ...SLICE_EVIDENCE[domain],
    });
    expect(verdict.ready).toBe(true);
  });

  it('states plainly that `guide` does not clear it', () => {
    // If this ever starts passing `ready`, the exception should be removed
    // rather than left as a lie that happens to be harmless.
    const verdict = assessSliceRetirement({
      domain: 'guide',
      ...SLICE_EVIDENCE.guide,
    });
    expect(verdict.ready).toBe(false);
    expect(verdict.beatsNothing).toBe(false);
  });

  it('keeps the exception list from growing silently', () => {
    expect(ENABLED_WITHOUT_CLEARING).toEqual(['guide']);
  });
});

describe('routing without the flag is justified by the rescue lock', () => {
  it('enables exactly the domains where rescue is locked', () => {
    // The argument for making these ungateable is that rescue can no longer
    // correct the classifier for them, so the planner is the only thing left
    // that can — §92's 20.2%. If the two lists drift, a domain is either
    // routed with rescue still able to overrule it, or locked with nothing
    // left to route it. Both are worse than either list alone suggests.
    expect([...RETIRED_DETECTOR_DOMAINS].sort()).toEqual(
      [...RESCUE_ACTION_LOCKED_DOMAINS].sort(),
    );
  });

  it('has not deleted the detectors it is named after', () => {
    // The constant used to be documented as "domains whose detectors have been
    // deleted". They are all still here and still reachable — e2e-bug.394. The
    // assertion exists so the corrected comment cannot quietly become wrong
    // again in the other direction.
    const inventory = require('./ai-command-inventory.json') as
      | InventoryRow[]
      | { detectors: InventoryRow[] };
    const rows = Array.isArray(inventory) ? inventory : inventory.detectors;
    const tourDetectors = rows.filter(
      (d) =>
        d.label === 'legacy_paraphrase' &&
        (d.file ?? '').toLowerCase().includes('tour'),
    );

    expect(tourDetectors.length).toBeGreaterThan(0);
    expect(tourDetectors.every((d) => d.reachableFromProduction)).toBe(true);
  });
});
