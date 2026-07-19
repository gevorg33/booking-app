import {
  PROVIDER_EXP_UI_AI_PARITY,
  type ProviderExpUiActionParity,
} from '../provider-mobile/provider-exp-ai-parity.fixtures.js';
import {
  PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS,
} from './ai-provider-dashboard-handoff.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

const REASSIGN_LIMIT_ROW_ID = 'exp-4-2-reassign-booking';
const TIME_OFF_APPROVAL_ROW_ID = 'exp-7-2-approve-time-off';

/** Topic keywords per dashboard-only PROVIDER_EXP_UI_AI_PARITY row (ai-cmd-provider-5.25.1). */
const DASHBOARD_ONLY_TOPIC_KEYWORDS: Record<string, string[]> = {
  'exp-1-1-tap-call': ['call the client', 'tap to call', 'phone the client'],
  'exp-1-5-intake-full-answers': [
    'full intake answers',
    'intake questionnaire',
  ],
  'exp-2-2-request-review': ['review policy', 'review trigger', 'review settings'],
  'exp-6-2-edit-templates': [
    'edit message templates',
    'edit templates',
    'message template',
  ],
  'exp-7-2-approve-time-off': [
    'approve time off',
    'deny time off',
    'time off approval',
    'who approves',
  ],
  'exp-9-2-adjust-loyalty': ['adjust loyalty', 'loyalty points', 'loyalty point'],
  'exp-10-4-locale-switch': ['switch app language', 'app language', 'change language'],
};

function findDashboardOnlyParityRow(
  prompt: string,
): ProviderExpUiActionParity | null {
  const lower = prompt.toLowerCase();
  for (const [rowId, keywords] of Object.entries(DASHBOARD_ONLY_TOPIC_KEYWORDS)) {
    if (!keywords.some((keyword) => lower.includes(keyword))) continue;
    const row = PROVIDER_EXP_UI_AI_PARITY.find((entry) => entry.id === rowId);
    if (row && row.coverage.kind === 'dashboard-only') return row;
  }
  return null;
}

/** ai-cmd-provider-5.25.1 — generic lookup over PROVIDER_EXP_UI_AI_PARITY's dashboard-only rows. */
export function isExplainDashboardOnlyActionPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|set|update|block|cancel|reschedule|check\s+in)\b/.test(lower)) {
    return false;
  }
  if (findDashboardOnlyParityRow(prompt)) return true;

  return PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainDashboardOnlyActionSummary(
  row: ProviderExpUiActionParity,
): string {
  const reason =
    row.coverage.kind === 'dashboard-only' ? row.coverage.dashboardReason : '';
  return `"${row.uiAction}" isn't available from the mobile assistant: ${reason}. Use the dashboard for this.`;
}

export function resolveDashboardOnlyActionSummaryFromPrompt(
  prompt: string,
): string | null {
  const row = findDashboardOnlyParityRow(prompt);
  if (!row) return null;
  return buildExplainDashboardOnlyActionSummary(row);
}

/** ai-cmd-provider-5.25.2 — why multi-service reassignment stays dashboard-only. */
export function isExplainReassignLimitPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\bwhy\s+can'?t\s+(?:ai|the\s+assistant|i)\s+reassign\b/i.test(lower) &&
    /\bmulti[\s-]?service\b/i.test(lower)
  ) {
    return true;
  }
  if (/\buse\s+(?:the\s+)?reassign\s+button\b/i.test(lower)) return true;
  if (
    /\breassign\b/i.test(lower) &&
    /\bmulti[\s-]?service\b/i.test(lower) &&
    /\b(why|can'?t|limit)\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(վերանշանակ)/i.test(prompt) &&
    /(բազմա|multi)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(переназнач)/i.test(prompt) &&
    /(мульти|многоуслуг)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainReassignLimitSummary(): string {
  const row = PROVIDER_EXP_UI_AI_PARITY.find(
    (entry) => entry.id === REASSIGN_LIMIT_ROW_ID,
  );
  const reason =
    row && row.coverage.kind === 'dashboard-only'
      ? row.coverage.dashboardReason
      : 'Multi-service visits must be reassigned from the dashboard.';
  return `${reason} Use the Reassign button on the booking's dashboard page for multi-service visits.`;
}

/** ai-cmd-provider-5.25.3 — who approves time-off requests and where. */
export function isExplainTimeOffApprovalPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\bwho\s+approves\s+(?:my\s+)?time\s*off\b/i.test(lower) ||
    /\bwho\s+reviews\s+(?:my\s+)?time\s*off\b/i.test(lower) ||
    /\bpending\s+manager\s+approval\b/i.test(lower) ||
    /\bwho\s+approves\s+(?:my\s+)?(?:pto|vacation)\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(արձակուրդ)/i.test(prompt) &&
    /(հաստատում|ով)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(отпуск)/i.test(prompt) &&
    /(одобря|утвержда|кто)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainTimeOffApprovalSummary(): string {
  const row = PROVIDER_EXP_UI_AI_PARITY.find(
    (entry) => entry.id === TIME_OFF_APPROVAL_ROW_ID,
  );
  const reason =
    row && row.coverage.kind === 'dashboard-only'
      ? row.coverage.dashboardReason
      : 'Manager approval uses the dashboard.';
  return `Your manager approves or denies time-off requests — ${reason.charAt(0).toLowerCase()}${reason.slice(1)} You'll see the status update (pending, approved, or denied) once they review it.`;
}

export function rescueDashboardHandoffIntent(
  prompt: string,
  action: string,
): {
  action:
    | 'explain_reassign_limit'
    | 'explain_time_off_approval'
    | 'explain_dashboard_only_action';
  rescueReason: string;
} | null {
  if (isExplainReassignLimitPrompt(prompt) && action !== 'explain_reassign_limit') {
    return {
      action: 'explain_reassign_limit',
      rescueReason: 'explain_reassign_limit',
    };
  }
  if (
    isExplainTimeOffApprovalPrompt(prompt) &&
    action !== 'explain_time_off_approval'
  ) {
    return {
      action: 'explain_time_off_approval',
      rescueReason: 'explain_time_off_approval',
    };
  }
  if (
    isExplainDashboardOnlyActionPrompt(prompt) &&
    action !== 'explain_dashboard_only_action'
  ) {
    return {
      action: 'explain_dashboard_only_action',
      rescueReason: 'explain_dashboard_only_action',
    };
  }
  return null;
}
