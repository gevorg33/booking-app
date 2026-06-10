import {
  AI_CMD_RESCUE_SCENARIOS,
  AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES,
  CATALOG_NOTIFY_RESCUE_SCENARIOS,
  aiCmdScenarioToEvalCase,
  scenariosByDomain,
  scenariosBySurface,
} from './ai-cmd-eval.fixtures.js';

describe('ai-cmd-eval.fixtures (ai-cmd-t2)', () => {
  it('maps every rescue scenario to a unique eval case id', () => {
    const ids = AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('ai-cmd-'))).toBe(true);
  });

  it('aiCmdScenarioToEvalCase sets rescuedAction', () => {
    const scenario = AI_CMD_RESCUE_SCENARIOS[0];
    const evalCase = aiCmdScenarioToEvalCase(scenario);
    expect(evalCase.expect.rescuedAction).toBe(scenario.expectedAction);
    expect(evalCase.prompt).toBe(scenario.prompt);
  });

  it('aiCmdScenarioToEvalCase forwards paramsPartial when set', () => {
    const evalCase = aiCmdScenarioToEvalCase({
      id: 'with-params',
      domain: 'booking',
      surface: 'dashboard',
      prompt: 'test',
      expectedAction: 'mark_paid',
      paramsPartial: { bookingId: 'b1' },
    });
    expect(evalCase.expect.paramsPartial).toEqual({ bookingId: 'b1' });
  });

  it('covers all three surfaces', () => {
    expect(scenariosBySurface('dashboard').length).toBeGreaterThan(10);
    expect(scenariosBySurface('customer').length).toBeGreaterThan(5);
    expect(scenariosBySurface('provider').length).toBeGreaterThan(3);
  });

  it('covers booking and catalog domains', () => {
    expect(scenariosByDomain('booking').length).toBeGreaterThanOrEqual(4);
    expect(scenariosByDomain('catalog').length).toBeGreaterThanOrEqual(3);
  });

  it('maps every catalog-notify rescue scenario with notifyCustomers paramsPartial', () => {
    for (const scenario of CATALOG_NOTIFY_RESCUE_SCENARIOS) {
      const evalCase = aiCmdScenarioToEvalCase(scenario);
      expect(evalCase.expect.paramsPartial).toEqual({
        notifyCustomers: scenario.paramsPartial?.notifyCustomers,
      });
      expect(typeof evalCase.expect.paramsPartial?.notifyCustomers).toBe(
        'boolean',
      );
    }
  });

  it('has at least 35 domain rescue scenarios', () => {
    expect(AI_CMD_RESCUE_SCENARIOS.length).toBeGreaterThanOrEqual(35);
  });
});
