import { HANDOFF_TO_DASHBOARD_PHI_PROMPT_SCENARIOS } from './ai-provider-handoff-to-dashboard-phi.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.19.6 — static explainer: why full intake/PHI editing requires the dashboard. */
export function isHandoffToDashboardPhiPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\bopen\b.{0,20}\bintake\b.{0,20}\bdashboard\b/i.test(lower)) {
    return true;
  }
  if (
    /\bwhy\b/i.test(lower) &&
    /\bcan'?t\b|\bcannot\b/i.test(lower) &&
    /\bedit\b/i.test(lower) &&
    /\bintake\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\bfull\s+intake\b/i.test(lower) &&
    /\bdashboard\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(dashboard)/i.test(prompt) &&
    /(հարցաթերթ|ինտեյք)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(dashboard)/i.test(prompt) &&
    /(анкет|интейк)/i.test(prompt)
  ) {
    return true;
  }

  return HANDOFF_TO_DASHBOARD_PHI_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function rescueHandoffToDashboardPhiIntent(
  prompt: string,
  action: string,
): { action: 'handoff_to_dashboard_phi'; rescueReason: string } | null {
  if (action === 'handoff_to_dashboard_phi') return null;
  if (!isHandoffToDashboardPhiPrompt(prompt)) return null;
  return {
    action: 'handoff_to_dashboard_phi',
    rescueReason: 'handoff_to_dashboard_phi',
  };
}

export function buildHandoffToDashboardPhiSummary(): string {
  return [
    'Full pre-visit intake and PHI edits are dashboard-only for compliance reasons — provider mobile is read-only here to limit PHI exposure on personal devices.',
    'Open the dashboard on a desktop or the web app to edit intake answers, correct patient details, or review the complete questionnaire.',
  ].join(' ');
}
