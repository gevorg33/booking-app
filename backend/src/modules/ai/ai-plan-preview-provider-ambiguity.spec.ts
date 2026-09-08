/**
 * e2e-bug.512 / §230 — plan previews refuse an ambiguous provider too.
 *
 * `dispatchMutatingIntent`'s `planOnly` branches for `payment_sweep` and
 * `unhide_appointments_from_calendar` called `findUnpaidBookingsForSweep` /
 * `findBookingsForCalendarVisibility` **directly**, bypassing the
 * `providerNameGuard` their executing handlers run. Those finders scope by
 * `resolveEmployee`, the silent-pick wrapper, so with two providers sharing a
 * name the preview was built over whichever sorted first — showing one
 * provider's appointments in answer to a question about the other.
 *
 * Execution was never affected (the handler refuses), so the effect was a
 * confusing, mildly disclosive preview followed by a refusal on confirm. These
 * tests assert the preview now refuses at the same point.
 */
import * as fs from 'fs';
import * as path from 'path';
import { AiBookingCoreService } from './ai-booking-core.service.js';

const employee = (id: string, name: string) =>
  ({ id, name, isActive: true }) as never;

const NAMESAKES = [employee('emp-1', 'John Smith'), employee('emp-2', 'John Smith')];

describe('providerNameGuard is reachable from the plan-only previews (§230)', () => {
  const core = Object.create(AiBookingCoreService.prototype) as AiBookingCoreService & {
    providerNameGuard: (
      action: string,
      params: { employeeName?: string },
      employees: unknown[],
    ) => { success: boolean; summary: string; details?: Record<string, unknown> } | null;
  };

  it('is public, because the preview lives in a different service', () => {
    // The guard was private; the previews are in `AiCommandService`. If this
    // stops being callable the previews silently lose their refusal.
    expect(typeof core.providerNameGuard).toBe('function');
  });

  it('refuses a namesake tie and names the candidates', () => {
    const issue = core.providerNameGuard(
      'payment_sweep',
      { employeeName: 'John Smith' },
      NAMESAKES,
    );

    expect(issue).not.toBeNull();
    expect(issue!.success).toBe(false);
    expect(
      (issue!.details?.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['emp-1', 'emp-2']);
  });

  it('passes an unambiguous provider through, so previews still build', () => {
    // The guard returning null is what lets the finder run — a refusal that
    // fired on every name would block the feature rather than fix it.
    const issue = core.providerNameGuard(
      'payment_sweep',
      { employeeName: 'John Smith' },
      [employee('emp-1', 'John Smith'), employee('emp-2', 'Maria Lopez')],
    );

    expect(issue).toBeNull();
  });

  it('passes through when no provider was named at all', () => {
    expect(core.providerNameGuard('payment_sweep', {}, NAMESAKES)).toBeNull();
  });
});

describe('the plan-only branches actually call it (§230)', () => {
  // The tests above prove the guard works; this proves it is *wired in*. The
  // previews live inside a large `switch` in a private method with heavy deps,
  // so a source assertion is the honest way to pin the call — the same shape
  // the `e2e255` concurrency fixtures use for `pessimistic_write`. Without it,
  // the guard could be removed from the preview and every test above would
  // still pass.
  const src = fs.readFileSync(
    path.join(__dirname, 'ai-command.service.ts'),
    'utf8',
  );

  // Every call site, not just the two previews: the first version of this test
  // used `indexOf` and so only checked the *first* occurrence — which turned
  // out to be a third, unguarded site in `buildPlanForResolvedIntent` that
  // reading had missed. Checking all occurrences is what found it.
  const callSites = (finder: string) => {
    // `prepareDirectSchedulePlan` hangs off `scheduleHandlers`, the other two
    // off `bookingCore` — match either receiver rather than hardcoding one.
    const needle = new RegExp(`this\\.(?:bookingCore|scheduleHandlers)\\.${finder}\\(`, 'g');
    return [...src.matchAll(needle)].map((m) => m.index as number);
  };

  it.each([
    ['findUnpaidBookingsForSweep'],
    ['findBookingsForCalendarVisibility'],
    // §234 — the third preview, added when `prepareDirectSchedulePlan` turned
    // out to be guardable at its callers rather than return-shape blocked.
    ['prepareDirectSchedulePlan'],
    // §235 — the three sites the D5 tracker carried as return-shape blocked.
    // The helpers are; their callers are not.
    ['prepareApplySchedulePlan'],
    ['prepareTemplateCascadePlan'],
    ['buildCreateBookingPlanOnly'],
  ])(
    'guards *every* call to %s',
    (finder) => {
      const sites = callSites(finder);
      expect(sites.length).toBeGreaterThan(0);

      const unguarded = sites.filter((at) => {
        const preceding = src.slice(Math.max(0, at - 900), at);
        return !preceding.includes('this.bookingCore.providerNameGuard(');
      });

      expect(unguarded).toEqual([]);
    },
  );

  it('acts on the guard rather than merely calling it', () => {
    // The two previews return the refusal; `buildPlanForResolvedIntent` returns
    // `AgentPlan | null` and so returns `null` instead — no plan beats a plan
    // over the wrong namesake. Both shapes count as acting on it; calling the
    // guard and ignoring the result would not.
    expect(src).toContain('if (providerIssue) return providerIssue;');
    // Three sites now return `null` instead: they live in
    // `buildPlanForResolvedIntent`, which returns `AgentPlan | null` and has no
    // field for a reason. Counted, so a fourth cannot appear unnoticed.
    const nullRefusals = [
      ...src.matchAll(/providerNameGuard\([\s\S]{0,200}?\)\s*\)\s*\{\s*return null;/g),
    ];
    expect(nullRefusals.length).toBe(3);
  });
});
