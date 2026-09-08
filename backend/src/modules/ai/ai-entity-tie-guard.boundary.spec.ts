/**
 * D5 conformance rule — every writing handler that resolves a named entity
 * refuses a tie (`e2e-bug.362` family, §239).
 *
 * The campaign (§225–§238) guarded four entity types across every writing path:
 * providers, customers, templates and services. Nothing yet stops a **new**
 * handler from resolving a name with one of the silent-pick helpers and acting
 * on the first match — which is how every bug in that campaign arose.
 *
 * **Pinned by name, not detected by heuristic.** A rule that tried to infer
 * "this method writes" from the source would misfire on the read-only majority,
 * and §190 records what happens to a rule that misfires: it gets switched off.
 * The list below is the reviewed output of the §231 and §236 audits. A guard
 * removed from any of these fails; a *new* writing handler is not caught
 * automatically, but the audit script in §231 re-runs in minutes and the
 * failure mode it looks for is documented here.
 *
 * The silent-pick helpers this exists to keep out of writing paths:
 * `resolveEmployees`, `resolveServices`, `resolveTemplate`, `fuzzyMatchByName`,
 * `fuzzyMatchServiceByName` — each returns the first match and cannot say
 * "ambiguous".
 */
import * as fs from 'fs';
import * as path from 'path';

type Guard =
  | 'resolveEmployeesVerdict'
  | 'resolveServicesVerdict'
  | 'resolveTemplateVerdict'
  | 'providerNameGuard'
  | 'resolveEntity';

/** file → method → the guard it must keep. */
const GUARDED: ReadonlyArray<readonly [string, string, Guard]> = [
  // §231–§233, §237 — booking-core writers
  ['ai-booking-core.service.ts', 'handleBulkSmartCancel', 'resolveServicesVerdict'],
  ['ai-booking-core.service.ts', 'handleUpdateBookings', 'resolveServicesVerdict'],
  ['ai-booking-core.service.ts', 'handleCancelBookings', 'resolveServicesVerdict'],
  ['ai-booking-core.service.ts', 'handleHideAppointmentsFromCalendar', 'resolveServicesVerdict'],
  ['ai-booking-core.service.ts', 'handleUnhideAppointmentsFromCalendar', 'resolveServicesVerdict'],
  ['ai-booking-core.service.ts', 'handleDayReplan', 'resolveEmployeesVerdict'],
  // §226–§227, §231, §233–§234 — schedule writers
  ['ai-schedule-handlers.service.ts', 'handleDeleteScheduleTemplates', 'resolveEntity'],
  ['ai-schedule-handlers.service.ts', 'handleApplySchedule', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleBlockSchedule', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleFillScheduleGaps', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleTemplateCascade', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleCreateDirectSchedule', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleDeleteScheduleBlock', 'resolveEmployeesVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleUpdateScheduleTemplate', 'resolveTemplateVerdict'],
  ['ai-schedule-handlers.service.ts', 'handleDuplicateScheduleTemplate', 'resolveTemplateVerdict'],
];

function methodBody(file: string, method: string): string | null {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const lines = src.split('\n');
  const start = lines.findIndex((l) =>
    new RegExp(`^  (?:private |public |protected )?(?:async )?${method}\\s*\\(`).test(l),
  );
  if (start === -1) return null;
  const end = lines.findIndex(
    (l, i) =>
      i > start + 2 &&
      /^  (?:private |public |protected )?(?:async )?[a-zA-Z_]\w*\s*\(/.test(l),
  );
  return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

describe('D5 — writing handlers refuse an ambiguous name (§239)', () => {
  it.each(GUARDED)('%s › %s keeps its %s guard', (file, method, guard) => {
    const body = methodBody(file, method);
    // A renamed or deleted handler must fail loudly rather than pass by
    // measuring nothing — the failure mode §215's population check exists for.
    expect(body).not.toBeNull();
    expect(body).toContain(`${guard}(`);
  });

  it('the pinned set is the reviewed audit output, and does not shrink', () => {
    // 15 at §239. Adding a handler here is fine; removing one means a guard was
    // dropped, which is the regression this file exists to catch.
    expect(GUARDED.length).toBe(15);
  });

  it('every guarded method also acts on the verdict', () => {
    // Calling the guard and discarding the result would satisfy the assertions
    // above while restoring the bug — and a window-scan for "is there a refusal
    // somewhere below" passes on exactly that break, because these methods all
    // contain unrelated `return null` paths further down. The negative control
    // caught that (§239): the check has to name the binding.
    for (const [file, method, guard] of GUARDED) {
      const body = methodBody(file, method)!;
      const at = body.indexOf(`${guard}(`);
      // The guard's result is always bound, sometimes through a ternary whose
      // other arm short-circuits (`allProviders ? … : guard(…)`, §231).
      const binding = /const (\w+)\s*=[^;]*$/.exec(body.slice(0, at))?.[1];
      expect({ method, binding }).toEqual({ method, binding: expect.any(String) });
      // That exact binding must be tested for ambiguity, and the return must sit
      // INSIDE the block — `[^}]` not `[\\s\\S]`, because a block that only logs
      // and falls through matched a `return` in the statement after it (§239).
      const test = new RegExp(
        `if \\(${binding}\\.(?:ambiguous|status === 'ambiguous')[^)]*\\)\\s*\\{[^}]{0,400}?return`,
      );
      expect({ method, refuses: test.test(body.slice(at)) }).toEqual({
        method,
        refuses: true,
      });
    }
  });
});
