/**
 * F3 / e2e-bug.415 — §129's confirmation gate, the half its workaround left open.
 *
 * §129 could not test the gate in place, so it extracted the decision into
 * `shouldConfirmBeforeExecute` and tested that. `ai-planner-confirmation.util.spec.ts`
 * covers the predicate thoroughly. What no test covered is the **call site**:
 * that `executeSingleIntent` asks the question with the right inputs, and that a
 * `true` answer returns *before* anything dispatches.
 *
 * That is the half that fails open. The predicate can be perfect and a money
 * command still executes silently if the call is passed a stale
 * `alreadyConfirmed`, or if a later edit moves a dispatch above the gate.
 *
 * These are source-shape assertions, deliberately. Driving `executeSingleIntent`
 * to the gate needs `understand` and the completion handoff stubbed into exact
 * internal shapes; such a test breaks whenever those shapes move and teaches
 * nothing about the invariant that matters here, which is *ordering*. The
 * behavioural half already exists in the predicate's own spec — these two
 * together are the property §129 wanted.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// `__dirname`, not `import.meta.url`: the project resolves as nodenext but jest
// runs the CommonJS output, where `import.meta` is a syntax error.
const SERVICE_SRC = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

/** Body of `executeSingleIntent`, from its signature to the next method. */
function executeSingleIntentBody(): string {
  const start = SERVICE_SRC.indexOf('private async executeSingleIntent(');
  expect(start).toBeGreaterThan(-1);
  const rest = SERVICE_SRC.slice(start + 1);
  const nextMethod = rest.search(/\n {2}(private |public |async )[a-zA-Z_]+\(/);
  return nextMethod === -1 ? rest : rest.slice(0, nextMethod);
}

describe('§129 — the execute-time confirmation gate is wired, not just written', () => {
  const body = executeSingleIntentBody();

  it('asks the gate before any dispatch', () => {
    // The invariant that fails open. `dashboardCore.tryDispatch` is the first
    // thing that can execute a command; the gate must precede it.
    const gate = body.indexOf('shouldConfirmBeforeExecute({');
    const dispatch = body.indexOf('this.dashboardCore.tryDispatch(');
    expect(gate).toBeGreaterThan(-1);
    expect(dispatch).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(dispatch);
  });

  it('passes the live confirmation state, not a literal', () => {
    // `confirmed` is `isExecutionConfirmed(session)`. Hard-coding `false` would
    // confirm every time; hard-coding `true` would confirm never — the second
    // is the dangerous one and would look like a passing build.
    expect(body).toMatch(/alreadyConfirmed:\s*confirmed\b/);
    expect(body).toMatch(/const confirmed = isExecutionConfirmed\(session\)/);
  });

  it('passes the resolved candidate source, so planner traffic is covered', () => {
    // e2e-bug.404: the spec model applies to planner-routed actions, and
    // `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` covers only 59 of the 210 commands
    // `CommandSpec` says must be confirmed. Losing this argument would let the
    // planner execute `appointment.mark_paid` silently.
    expect(body).toMatch(/candidateSource:\s*traceCtx\.candidateSource/);
  });

  it('returns on a positive answer rather than falling through', () => {
    const gate = body.indexOf('shouldConfirmBeforeExecute({');
    const afterGate = body.slice(gate);
    const branchEnd = afterGate.indexOf('\n    }');
    const branch = afterGate.slice(0, branchEnd);
    expect(branch).toContain('buildExecutionConfirmationResult');
    expect(branch).toMatch(/return traceStamp\(confirmResult\)/);
  });
});
