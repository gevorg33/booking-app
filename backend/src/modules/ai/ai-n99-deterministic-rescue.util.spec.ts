import {
  AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES,
  N99_DETERMINISTIC_RESCUE_SCENARIOS,
  N99_SUSPECTED_MISS_MINING_FIXTURES,
  N99_SUSPECTED_MISS_RESCUE_RULES,
} from './ai-n99-deterministic-rescue.fixtures.js';
import {
  applyDeterministicRescue,
  evaluateN99DeterministicRescueScenario,
  mineSuspectedMissRescueCandidates,
  N99_SUSPECTED_MISS_MIN_OCCURRENCES,
} from './ai-n99-deterministic-rescue.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('ai-n99-deterministic-rescue.util (n99-2.5)', () => {
  const rescue = new AiIntentRescueService();

  it('documents n99 suspected_miss rescue rules', () => {
    expect(N99_SUSPECTED_MISS_RESCUE_RULES.length).toBeGreaterThanOrEqual(10);
    expect(
      N99_SUSPECTED_MISS_RESCUE_RULES.every(
        (rule) => rule.telemetrySignal === 'suspected_miss',
      ),
    ).toBe(true);
  });

  it('mines recurring suspected_miss confusion pairs (acc-1.4)', () => {
    const candidates = mineSuspectedMissRescueCandidates(
      [...N99_SUSPECTED_MISS_MINING_FIXTURES],
      N99_SUSPECTED_MISS_MIN_OCCURRENCES,
    );
    expect(candidates.some((entry) => entry.toAction === 'send_reminder')).toBe(
      true,
    );
    expect(
      candidates.some((entry) => entry.toAction === 'fill_unused_slots'),
    ).toBe(true);
    expect(
      candidates.every((entry) => entry.count >= N99_SUSPECTED_MISS_MIN_OCCURRENCES),
    ).toBe(true);
  });

  it.each(N99_DETERMINISTIC_RESCUE_SCENARIOS)(
    '$id applies deterministic rescue without LLM',
    (scenario) => {
      const result = evaluateN99DeterministicRescueScenario(scenario);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it.each(N99_DETERMINISTIC_RESCUE_SCENARIOS.filter((entry) => entry.surface))(
    '$id flows through AiIntentRescueService with surface',
    (scenario) => {
      const rescued = rescue.rescue({
        prompt: scenario.prompt,
        action: scenario.fromAction,
        params: {},
        surface: scenario.surface,
      });
      expect(rescued?.action).toBe(scenario.expectedAction);
      expect(rescued?.rescued).toBe(true);
      expect(rescued?.rescueReason).toBe(scenario.rescueReason);
    },
  );

  it('prefers n99 rules ahead of generic telemetry rules for reminder prompts', () => {
    const match = applyDeterministicRescue(
      'Remind Maria about her appointment tomorrow',
      'create_booking',
      'dashboard',
    );
    expect(match?.ruleId).toBe('n99-create-to-send-reminder');
    expect(match?.toAction).toBe('send_reminder');
  });
});
