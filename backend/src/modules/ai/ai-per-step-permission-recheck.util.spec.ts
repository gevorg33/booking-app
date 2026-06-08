import {
  assertPerStepPermissionRecheckProbes,
  buildPerStepPermissionDeniedCommandResult,
  findFirstDeniedStepAtExecute,
  PER_STEP_PERMISSION_ESCALATION_PROBES,
  PER_STEP_RUNTIME_BOUNDS_PROBE,
  resolvePlannerBoundsFromSession,
  validateStepPermissionAtExecute,
} from './ai-per-step-permission-recheck.util.js';

describe('ai-per-step-permission-recheck (parity-3.4)', () => {
  it.each(PER_STEP_PERMISSION_ESCALATION_PROBES)(
    '$id — blocks privileged step at execute time',
    (probe) => {
      for (let i = 0; i < probe.allowedBeforeDenial; i++) {
        expect(
          validateStepPermissionAtExecute(probe.steps[i].action, probe.bounds).ok,
        ).toBe(true);
      }

      const denied = findFirstDeniedStepAtExecute(probe.steps, probe.bounds);
      expect(denied?.stepIndex).toBe(probe.deniedAtStepIndex);
      expect(denied?.action).toBe(probe.deniedAction);
    },
  );

  it('re-reads live session bounds at execute time', () => {
    const session = {
      _accessTier: 'staff',
      _planTierId: 'solo',
    };
    const bounds = resolvePlannerBoundsFromSession(session, 'dashboard');
    expect(bounds.accessTier).toBe('staff');

    const denied = findFirstDeniedStepAtExecute(
      PER_STEP_RUNTIME_BOUNDS_PROBE.steps,
      bounds,
    );
    expect(denied?.action).toBe('list_employees');
  });

  it('buildPerStepPermissionDeniedCommandResult surfaces step index', () => {
    const probe = PER_STEP_PERMISSION_ESCALATION_PROBES[0];
    const result = buildPerStepPermissionDeniedCommandResult({
      parentAction: 'compound_intent',
      deniedAction: probe.deniedAction,
      stepIndex: probe.deniedAtStepIndex,
      totalSteps: probe.steps.length,
      bounds: probe.bounds,
    });
    expect(result.success).toBe(false);
    expect(result.details.perStepPermissionRecheckFailed).toBe(true);
    expect(result.details.deniedStepIndex).toBe(probe.deniedAtStepIndex);
    expect(result.summary).toMatch(/Step 2 of 2/i);
  });

  it('passes per-step permission recheck probe gate', () => {
    const status = assertPerStepPermissionRecheckProbes();
    expect(status.complete).toBe(true);
  });
});
