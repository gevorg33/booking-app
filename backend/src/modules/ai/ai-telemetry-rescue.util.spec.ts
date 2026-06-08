import {
  AI_COMMAND_EVAL_TELEMETRY_RESCUE_CASES,
  TELEMETRY_RESCUE_RULES,
  TELEMETRY_RESCUE_SCENARIOS,
  telemetryRescueScenarioToEvalCase,
} from './ai-telemetry-rescue.fixtures.js';
import {
  applyTelemetryRescueRule,
  matchTelemetryRescueHint,
} from './ai-telemetry-rescue.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-telemetry-rescue.util (acc-3.8)', () => {
  it('documents top telemetry-derived rescue rules', () => {
    expect(TELEMETRY_RESCUE_RULES.length).toBeGreaterThanOrEqual(10);
    expect(
      TELEMETRY_RESCUE_RULES.some(
        (rule) => rule.telemetrySignal === 'suspected_miss',
      ),
    ).toBe(true);
    expect(
      TELEMETRY_RESCUE_RULES.some(
        (rule) => rule.telemetrySignal === 'wrong_execution',
      ),
    ).toBe(true);
  });

  it.each(TELEMETRY_RESCUE_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'telemetry rescue scenario %s',
    (_id, scenario) => {
      const match = applyTelemetryRescueRule(
        scenario.prompt,
        scenario.fromAction,
        scenario.surface,
      );
      expect(match?.toAction).toBe(scenario.expectedAction);
      expect(match?.rescueReason).toBe(scenario.rescueReason);
      expect(match?.ruleId).toBe(scenario.ruleId);
    },
  );

  it('matchTelemetryRescueHint maps create_booking revenue mislabels', () => {
    const hint = matchTelemetryRescueHint(
      'Calculate total earnings for today',
      'create_booking',
    );
    expect(hint?.toAction).toBe('summarize_bookings');
    expect(hint?.hintId).toBe('telemetry-create-to-summarize-revenue');
  });

  it('does not rescue when booking verb is present', () => {
    expect(
      applyTelemetryRescueRule(
        'Book massage and show appointments tomorrow',
        'create_booking',
      ),
    ).toBeNull();
  });
});

describe('ai-telemetry-rescue eval regression (acc-3.8)', () => {
  it.each(
    AI_COMMAND_EVAL_TELEMETRY_RESCUE_CASES.map((evalCase) => [evalCase.id, evalCase]),
  )('eval case %s passes deterministic rescue runner', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });

  it('every telemetry scenario has a matching eval case id', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_TELEMETRY_RESCUE_CASES.map((entry) => entry.id),
    );
    for (const scenario of TELEMETRY_RESCUE_SCENARIOS) {
      expect(evalIds.has(scenario.id)).toBe(true);
      expect(telemetryRescueScenarioToEvalCase(scenario).id).toBe(scenario.id);
    }
  });

  it('acc-6.2 — learned business rescue rules take precedence', () => {
    const match = applyTelemetryRescueRule(
      'show my appointments today',
      'list_bookings',
      'dashboard',
      [
        {
          id: 'learned-show-appts',
          fromAction: 'list_bookings',
          toAction: 'show_appointments',
          rescueReason: 'failure_closure',
          promptSnippet: 'show my appointments today',
          promptHash: 'abc123',
          surfaces: ['dashboard'],
          learnedAt: new Date().toISOString(),
        },
      ],
    );
    expect(match?.ruleId).toBe('learned-show-appts');
    expect(match?.toAction).toBe('show_appointments');
  });
});
