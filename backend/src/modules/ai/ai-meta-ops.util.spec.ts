import {
  formatExplainAiCapabilitiesSummary,
  isExplainAiCapabilitiesPrompt,
  isSummarizeAiSettingsPrompt,
  rescueMetaOpsIntent,
} from './ai-meta-ops.util.js';

describe('ai-meta-ops.util (e2e-bug.137)', () => {
  it.each([
    'Summarize my AI automation settings and autopilot rules',
    'What are my current AI settings?',
    'Is autopilot on and what macros do I have?',
  ])('rescues summarize_ai_settings for %s', (prompt) => {
    expect(isSummarizeAiSettingsPrompt(prompt)).toBe(true);
    expect(rescueMetaOpsIntent(prompt, 'unknown')).toEqual({
      action: 'summarize_ai_settings',
      rescueReason: 'summarize_ai_settings',
    });
  });

  it('does not rescue configure/how-to prompts', () => {
    expect(isSummarizeAiSettingsPrompt('Turn on AI autopilot')).toBe(false);
    expect(
      isSummarizeAiSettingsPrompt('How do I configure AI automation settings?'),
    ).toBe(false);
  });
});

describe('ai-meta-ops.util (e2e-bug.162)', () => {
  it.each([
    {
      id: 'e2e-162-remaining',
      prompt:
        'How many AI commands do I have left this month before hitting my limit?',
    },
    {
      id: 'e2e-162-used',
      prompt: 'How many AI commands have I used this month?',
    },
    {
      id: 'e2e-162-near-limit',
      prompt: 'Am I near my AI command quota?',
    },
    {
      id: 'e2e-162-capabilities',
      prompt: 'What can the AI do on my plan?',
    },
  ])('$id rescues explain_ai_capabilities', ({ prompt }) => {
    expect(isExplainAiCapabilitiesPrompt(prompt)).toBe(true);
    expect(isSummarizeAiSettingsPrompt(prompt)).toBe(false);
    expect(rescueMetaOpsIntent(prompt, 'unknown')).toEqual({
      action: 'explain_ai_capabilities',
      rescueReason: 'explain_ai_capabilities',
    });
  });

  it('formatExplainAiCapabilitiesSummary uses real quota, not allowedIntentCount', () => {
    const summary = formatExplainAiCapabilitiesSummary({
      tierName: 'Business',
      accessTier: 'owner',
      allowedIntentCount: 382,
      aiCommandsThisMonth: 661,
      aiCommandsPerMonth: 5000,
      atAiCommandLimit: false,
      aiUsageWarning: false,
    });
    expect(summary).toContain('661 used of 5000 (4339 left)');
    expect(summary).toContain('within your AI command quota');
    expect(summary).toContain(
      '382 distinct AI action type(s) available on this plan/role (not a usage quota)',
    );
    expect(summary).not.toMatch(/exceeded/i);
    expect(summary).not.toContain('limit of 382');
  });

  it('formatExplainAiCapabilitiesSummary respects atLimit flag', () => {
    const summary = formatExplainAiCapabilitiesSummary({
      tierName: 'Solo',
      accessTier: 'owner',
      allowedIntentCount: 50,
      aiCommandsThisMonth: 25,
      aiCommandsPerMonth: 25,
      atAiCommandLimit: true,
      aiUsageWarning: false,
    });
    expect(summary).toContain('at your AI command limit');
    expect(summary).toContain('25 used of 25 (0 left)');
  });
});
