import {
  PROVIDER_EXP_UI_AI_PARITY,
  type ProviderExpUiActionParity,
} from '../provider-mobile/provider-exp-ai-parity.fixtures.js';
import {
  PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS,
} from './ai-provider-dashboard-handoff.fixtures.js';
import {
  resolveLocale,
  t,
  type AppLocale,
} from '../../common/i18n/messages.js';

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
  'exp-1-1-tap-call': [
    'call the client',
    'tap to call',
    'phone the client',
    'call the customer',
    'phone the customer',
  ],
  'exp-1-5-intake-full-answers': [
    'full intake answers',
    'intake questionnaire',
    // HY why-can't-open full intake (e2e-bug.266 probe / e2e-bug.282 family)
    'ընդունելության պատասխան',
    'ամբողջական ընդունելութ',
  ],
  'exp-2-2-request-review': ['review policy', 'review trigger', 'review settings'],
  'exp-6-2-edit-templates': [
    'edit message templates',
    'edit templates',
    'message template',
    'հաղորդագրության ձևանմուշ',
  ],
  'exp-7-2-approve-time-off': [
    'approve time off',
    'deny time off',
    'time off approval',
    'who approves',
  ],
  'exp-9-2-adjust-loyalty': [
    'adjust loyalty',
    'loyalty points',
    'loyalty point',
    'հավատարմության միավոր',
  ],
  'exp-10-4-locale-switch': ['switch app language', 'app language', 'change language'],
};

/** e2e-bug.301 — i18n keys for dashboard-only row action/reason copy. */
const DASHBOARD_HANDOFF_ROW_I18N: Record<
  string,
  { actionKey: string; reasonKey: string }
> = {
  'exp-1-1-tap-call': {
    actionKey: 'assistant.dashboardHandoffActionTapCall',
    reasonKey: 'assistant.dashboardHandoffReasonTapCall',
  },
  'exp-1-5-intake-full-answers': {
    actionKey: 'assistant.dashboardHandoffActionIntake',
    reasonKey: 'assistant.dashboardHandoffReasonIntake',
  },
  'exp-2-2-request-review': {
    actionKey: 'assistant.dashboardHandoffActionReview',
    reasonKey: 'assistant.dashboardHandoffReasonReview',
  },
  'exp-6-2-edit-templates': {
    actionKey: 'assistant.dashboardHandoffActionTemplates',
    reasonKey: 'assistant.dashboardHandoffReasonTemplates',
  },
  'exp-7-2-approve-time-off': {
    actionKey: 'assistant.dashboardHandoffActionTimeOff',
    reasonKey: 'assistant.dashboardHandoffReasonTimeOff',
  },
  'exp-9-2-adjust-loyalty': {
    actionKey: 'assistant.dashboardHandoffActionLoyalty',
    reasonKey: 'assistant.dashboardHandoffReasonLoyalty',
  },
  'exp-10-4-locale-switch': {
    actionKey: 'assistant.dashboardHandoffActionLocale',
    reasonKey: 'assistant.dashboardHandoffReasonLocale',
  },
};

/**
 * e2e-bug.301 — prefer request locale; else infer from HY/RU script in the prompt.
 */
export function resolveDashboardHandoffLocale(
  locale?: string,
  prompt?: string,
): AppLocale {
  if (typeof locale === 'string' && locale.trim()) {
    return resolveLocale(locale);
  }
  if (prompt && containsArmenianScript(prompt)) return 'hy';
  if (prompt && containsCyrillicScript(prompt)) return 'ru';
  return resolveLocale(undefined);
}

/** e2e-bug.282 — why-can't + call + client (EN/HY/RU), even without exact keyword phrases. */
export function isWhyCantCallClientDashboardHandoffPrompt(
  prompt: string,
): boolean {
  const lower = prompt.toLowerCase();
  const whyCant =
    /\bwhy\s+can'?t\s+i\b/i.test(lower) ||
    /\bwhy\s+cannot\s+i\b/i.test(lower) ||
    /ինչու\s+չեմ\s+կարող/i.test(prompt) ||
    /почему\s+(?:я\s+)?не\s+могу/i.test(prompt);
  if (!whyCant) return false;

  const call =
    /\b(?:call|phone)\b/i.test(lower) ||
    /զանգահարել|զանգել/i.test(prompt) ||
    /позвон|звонить/i.test(prompt);
  if (!call) return false;

  return (
    /\b(?:client|customer)\b/i.test(lower) ||
    /հաճախորդ/i.test(prompt) ||
    /клиент/i.test(prompt)
  );
}

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
  if (isWhyCantCallClientDashboardHandoffPrompt(prompt)) return true;
  if (findDashboardOnlyParityRow(prompt)) return true;

  return PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function buildExplainDashboardOnlyActionSummary(
  row: ProviderExpUiActionParity,
  locale?: string,
): string {
  const loc = resolveLocale(locale);
  const i18n = DASHBOARD_HANDOFF_ROW_I18N[row.id];
  const action = i18n
    ? t(loc, i18n.actionKey)
    : row.uiAction;
  const reason = i18n
    ? t(loc, i18n.reasonKey)
    : row.coverage.kind === 'dashboard-only'
      ? row.coverage.dashboardReason
      : '';
  return t(loc, 'assistant.dashboardHandoffTemplate', { action, reason });
}

export function resolveDashboardOnlyActionSummaryFromPrompt(
  prompt: string,
  locale?: string,
): string | null {
  let row = findDashboardOnlyParityRow(prompt);
  if (!row && isWhyCantCallClientDashboardHandoffPrompt(prompt)) {
    row =
      PROVIDER_EXP_UI_AI_PARITY.find((entry) => entry.id === 'exp-1-1-tap-call') ??
      null;
  }
  if (!row) return null;
  const loc = resolveDashboardHandoffLocale(locale, prompt);
  return buildExplainDashboardOnlyActionSummary(row, loc);
}

export function buildExplainDashboardOnlyActionFallbackSummary(
  locale?: string,
  prompt?: string,
): string {
  const loc = resolveDashboardHandoffLocale(locale, prompt);
  return t(loc, 'assistant.dashboardHandoffFallback');
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
