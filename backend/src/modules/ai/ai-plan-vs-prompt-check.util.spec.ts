import {
  buildPlanMismatchSummary,
  buildPlanVsPromptClarifyResult,
  buildPlanVsPromptGateResult,
  promptHasBroadScope,
  promptMentionsName,
  promptMentionsService,
  runPlanVsPromptCheck,
  verifyPlanMatchesPrompt,
} from './ai-plan-vs-prompt-check.util.js';
import { PLAN_VS_PROMPT_SCENARIOS } from './ai-plan-vs-prompt-check.fixtures.js';

describe('ai-plan-vs-prompt-check.util (acc-5.2)', () => {
  it.each(PLAN_VS_PROMPT_SCENARIOS)('$id verifyPlanMatchesPrompt', (scenario) => {
    const result = verifyPlanMatchesPrompt(scenario.prompt, scenario.plan);
    expect(result.ok).toBe(scenario.expectOk);
    if (scenario.expectMismatches) {
      expect(result.mismatches).toEqual(
        expect.arrayContaining(scenario.expectMismatches),
      );
    }
  });

  it('promptMentionsName accepts first-name mention', () => {
    expect(promptMentionsName('book massage with Anna tomorrow', 'Anna Smith')).toBe(
      true,
    );
    expect(promptMentionsName('book massage tomorrow', 'Anna Smith')).toBe(false);
  });

  it('promptMentionsService accepts normalized service tokens', () => {
    expect(promptMentionsService('book swedish massage tomorrow', 'Swedish Massage')).toBe(
      true,
    );
    expect(promptMentionsService('book facial tomorrow', 'Swedish Massage')).toBe(false);
  });

  it('promptHasBroadScope detects all/every phrasing', () => {
    expect(promptHasBroadScope('cancel every booking this week')).toBe(true);
    expect(promptHasBroadScope('cancel Maria bookings tomorrow')).toBe(false);
  });

  it('buildPlanVsPromptClarifyResult surfaces mismatch details', () => {
    const scenario = PLAN_VS_PROMPT_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-scope-too-broad',
    )!;
    const verification = runPlanVsPromptCheck({
      prompt: scenario.prompt,
      plan: scenario.plan,
    });
    const result = buildPlanVsPromptClarifyResult({
      prompt: scenario.prompt,
      plan: scenario.plan,
      verification,
    });
    expect(result.details.clarifyKind).toBe('plan_vs_prompt');
    expect(result.details.planVsPromptFailed).toBe(true);
    expect(result.details.planMismatch?.length).toBeGreaterThan(0);
  });

  it('buildPlanVsPromptGateResult returns null for matching plans', () => {
    const scenario = PLAN_VS_PROMPT_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-maria-tomorrow-match',
    )!;
    expect(
      buildPlanVsPromptGateResult({
        prompt: scenario.prompt,
        plan: scenario.plan,
        action: 'cancel_bookings',
      }),
    ).toBeNull();
  });

  it('buildPlanMismatchSummary includes first mismatch reason', () => {
    const summary = buildPlanMismatchSummary([
      'plan cancels a broad scope but prompt looks narrower',
    ]);
    expect(summary).toContain('broad scope');
    expect(summary).toContain('review or rephrase');
  });
});
