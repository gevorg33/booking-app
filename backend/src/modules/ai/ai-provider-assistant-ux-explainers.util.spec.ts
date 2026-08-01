import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS,
} from './ai-provider-assistant-ux-explainers.fixtures.js';
import {
  buildExplainAccessibilitySettingsSummary,
  buildExplainOfflineSuggestionsSummary,
  isExplainAccessibilitySettingsPrompt,
  isExplainOfflineSuggestionsPrompt,
  rescueAssistantUxExplainersIntent,
} from './ai-provider-assistant-ux-explainers.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-assistant-ux-explainers.util (e2e-bug.246 / ai-cmd-provider-5.24.1–5.24.6)', () => {
  it('registers both explainers on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('explain_offline_suggestions', 'provider'),
    ).toBe(true);
    expect(
      isIntentAllowedOnSurface('explain_accessibility_settings', 'provider'),
    ).toBe(true);
  });

  it.each(
    PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects offline-suggestions explainer %s', (_id, prompt) => {
    expect(isExplainOfflineSuggestionsPrompt(prompt as string)).toBe(true);
    expect(isExplainAccessibilitySettingsPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects accessibility explainer %s', (_id, prompt) => {
    expect(isExplainAccessibilitySettingsPrompt(prompt as string)).toBe(true);
    expect(isExplainOfflineSuggestionsPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_offline_suggestions', (_id, prompt) => {
    expect(
      rescueAssistantUxExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_offline_suggestions',
      rescueReason: 'explain_offline_suggestions',
    });
  });

  it.each(
    PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_accessibility_settings', (_id, prompt) => {
    expect(
      rescueAssistantUxExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_accessibility_settings',
      rescueReason: 'explain_accessibility_settings',
    });
  });

  it.each([
    ['offline-queue', 'Show my offline queue status'],
    ['ai-suggestions', 'What do these suggestion chips mean?'],
    ['block-lunch', 'Block my lunch from 12 to 1'],
    ['calendar-bands', 'What do the green bands mean?'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isExplainOfflineSuggestionsPrompt(prompt)).toBe(false);
    expect(isExplainAccessibilitySettingsPrompt(prompt)).toBe(false);
    expect(rescueAssistantUxExplainersIntent(prompt, 'unknown')).toBeNull();
  });

  it('builds summaries with required vocabulary', () => {
    const offline = buildExplainOfflineSuggestionsSummary();
    expect(offline.toLowerCase()).toContain('stale');
    expect(offline.toLowerCase()).toContain('offline');
    expect(offline.toLowerCase()).toContain('refresh');
    const a11y = buildExplainAccessibilitySettingsSummary();
    expect(a11y.toLowerCase()).toContain('accessibility');
    expect(a11y.toLowerCase()).toContain('ios');
    expect(a11y.toLowerCase()).toContain('android');
  });
});
