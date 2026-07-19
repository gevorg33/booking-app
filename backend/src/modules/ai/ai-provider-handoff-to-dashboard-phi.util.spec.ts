import { HANDOFF_TO_DASHBOARD_PHI_PROMPT_SCENARIOS } from './ai-provider-handoff-to-dashboard-phi.fixtures.js';
import {
  buildHandoffToDashboardPhiSummary,
  isHandoffToDashboardPhiPrompt,
  rescueHandoffToDashboardPhiIntent,
} from './ai-provider-handoff-to-dashboard-phi.util.js';

describe('ai-provider-handoff-to-dashboard-phi.util (ai-cmd-provider-5.19.6)', () => {
  it.each(HANDOFF_TO_DASHBOARD_PHI_PROMPT_SCENARIOS)(
    'detects handoff_to_dashboard_phi prompt $id',
    ({ prompt }) => {
      expect(isHandoffToDashboardPhiPrompt(prompt)).toBe(true);
      const rescued = rescueHandoffToDashboardPhiIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('handoff_to_dashboard_phi');
    },
  );

  it('does not steal explain_client_intake / unrelated prompts', () => {
    expect(
      isHandoffToDashboardPhiPrompt('What does their pre-visit intake say?'),
    ).toBe(false);
    expect(isHandoffToDashboardPhiPrompt('Summarize this client')).toBe(false);
  });

  it('rescueHandoffToDashboardPhiIntent is a no-op once already classified', () => {
    expect(
      rescueHandoffToDashboardPhiIntent(
        'Open full intake on dashboard',
        'handoff_to_dashboard_phi',
      ),
    ).toBeNull();
  });

  it('builds a non-empty static summary', () => {
    const summary = buildHandoffToDashboardPhiSummary();
    expect(summary).toContain('dashboard');
    expect(summary.length).toBeGreaterThan(20);
  });
});
