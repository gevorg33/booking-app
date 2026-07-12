import { enrichCatalogNotifyRescueParams } from './ai-catalog-notify.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  AI_CMD_RESCUE_SCENARIOS,
  AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES,
  scenariosByDomain,
  scenariosBySurface,
  type AiCmdDomain,
  type AiCmdRescueScenario,
} from './ai-cmd-eval.fixtures.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './eval/ai-command-eval.runner.js';

describe('ai-cmd eval integration (ai-cmd-t2)', () => {
  const rescue = new AiIntentRescueService();
  const employees = [{ id: 'e1', name: 'Anna Kim' }];

  describe('intent rescue per domain scenario', () => {
    it.each(AI_CMD_RESCUE_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
      'rescues %s',
      (_id, scenario: AiCmdRescueScenario) => {
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: scenario.action ?? 'unknown',
          params: {},
          employees,
          surface: scenario.surface,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        if (scenario.paramsPartial) {
          expect(result?.params).toBeDefined();
          if (result?.params && result.action) {
            enrichCatalogNotifyRescueParams(
              result.action,
              result.params,
              scenario.prompt,
            );
          }
          expect(result?.params).toEqual(
            expect.objectContaining(scenario.paramsPartial),
          );
        }
      },
    );
  });

  describe('surface coverage matrix', () => {
    it.each(['dashboard', 'provider', 'customer'] as const)(
      'has rescue scenarios for %s surface',
      (surface) => {
        expect(scenariosBySurface(surface).length).toBeGreaterThanOrEqual(3);
      },
    );

    const domains: AiCmdDomain[] = [
      'booking',
      'catalog',
      'crm',
      'schedule',
      'payments',
      'gift',
      'integrations',
      'retail',
      'marketing',
      'push',
      'customer',
      'provider',
    ];

    it.each(domains)('has rescue scenarios for %s domain', (domain) => {
      expect(scenariosByDomain(domain).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('golden NL eval cases', () => {
    it.each(
      AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES.map((evalCase) => [
        evalCase.id,
        evalCase,
      ]),
    )('passes eval case %s', (_id, evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    });

    it('passes full ai-cmd domain eval suite', () => {
      const summary = runDeterministicEvalSuite(
        AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES,
      );
      expect(summary.failed).toBe(0);
      expect(summary.passed).toBe(AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES.length);
    });
  });
});
