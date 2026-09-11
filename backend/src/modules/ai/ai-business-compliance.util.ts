import {
  type ComplianceDashboardPanel,
  parseComplianceDashboardPanel,
} from '../../common/utils/compliance-dashboard-nav.util.js';
import {
  buildComplianceStatusSummary,
  MAX_HIPAA_SESSION_TIMEOUT_MINUTES,
  MIN_HIPAA_SESSION_TIMEOUT_MINUTES,
  normalizeRetentionDays,
  readBusinessPrivacySettings,
  SUB_PROCESSORS,
  type BusinessGranularConsentSettings,
  type BusinessHipaaSettings,
  type BusinessPrivacySettings,
  type BusinessRetentionSettings,
  type RetentionField,
} from '../../common/utils/business-compliance.util.js';
import { isUpdateServiceDurationBufferPrompt } from './ai-service-duration-buffer.util.js';

export const BUSINESS_COMPLIANCE_READ_INTENTS = [
  'explain_compliance_status',
  'list_breach_incidents',
  'view_phi_access_audit',
  'explain_phi_encryption_status',
  'explain_minimum_necessary_phi_access',
  'explain_hipaa_session_timeout',
  'list_sub_processors',
  'explain_gdpr_checklist',
  'open_compliance_dashboard',
  'explain_enterprise_trust',
  'explain_strategy_eval',
] as const;

export const BUSINESS_COMPLIANCE_MUTATE_INTENTS = [
  'configure_privacy_retention',
  'configure_granular_consent',
  'enable_hipaa_mode',
  'configure_hipaa_session_timeout',
  'admin_delete_customer_data',
  'report_data_breach',
  'send_breach_notification',
  'accept_hipaa_baa',
  'update_strategy_eval',
] as const;

export const BUSINESS_COMPLIANCE_INTENTS = [
  ...BUSINESS_COMPLIANCE_READ_INTENTS,
  ...BUSINESS_COMPLIANCE_MUTATE_INTENTS,
] as const;

export type BusinessComplianceIntent =
  (typeof BUSINESS_COMPLIANCE_INTENTS)[number];

const MUTATE_COMPLIANCE_VERBS =
  /\b(set|keep|enable|disable|turn\s+on|turn\s+off|requir(?:e|ing)|ask\s+for|configure|activate|deactivate|use|make|show|hide|stop)\b/i;

export interface ParsedConfigurePrivacyRetention {
  retention?: Partial<BusinessRetentionSettings>;
  cookieBanner?: { enabled?: boolean; message?: string };
}

export interface ParsedConfigureGranularConsent {
  requireAiProcessing?: boolean;
  requireThirdPartyIntegrations?: boolean;
}

export interface ParsedEnableHipaaMode {
  enabled?: boolean;
  sessionTimeoutMinutes?: number;
}

export interface ParsedExplainComplianceStatus {
  aspect: 'all' | 'gdpr' | 'hipaa' | 'retention' | 'sub_processors';
}

export interface ParsedAdminDeleteCustomerData {
  customerName?: string;
}

export interface ParsedReportDataBreach {
  description: string;
  affectedCustomerCount?: number;
}

export interface ParsedSendBreachNotification {
  incidentRef: string;
}

export interface ParsedListBreachIncidents {
  aspect: 'all' | 'deadlines';
}

export interface ParsedViewPhiAccessAudit {
  daysBack?: number;
  fieldName?: string;
  limit?: number;
}

export interface ParsedExplainPhiEncryptionStatus {
  fieldName?: string;
}

export interface ParsedExplainMinimumNecessaryPhiAccess {
  aspect: 'all' | 'roles' | 'fields';
}

export interface ParsedConfigureHipaaSessionTimeout {
  sessionTimeoutMinutes: number;
}

export interface ParsedAcceptHipaaBaa {
  enableHipaa?: boolean;
}

export interface ParsedListSubProcessors {
  article28?: boolean;
}

export interface ParsedExplainGdprChecklist {
  aspect: 'checklist' | 'compliance' | 'missing';
}

export interface ParsedOpenComplianceDashboard {
  panel: ComplianceDashboardPanel;
}

export interface ParsedExplainHipaaSessionTimeout {
  personalLogout?: boolean;
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasMultilingualMutateCue(prompt: string): boolean {
  if (containsArmenianScript(prompt)) {
    return /(պահել|միացնել|անջատել|պահանջել|կարգավորել|սահմանել|մոռանալ|անոնիմացնել|միացնել|ակտիվացնել)/i.test(
      prompt,
    );
  }
  if (containsCyrillicScript(prompt)) {
    return /(хранить|включить|отключить|требовать|установить|забыть|анонимизировать|включить|отключить)/i.test(
      prompt,
    );
  }
  return false;
}

function hasPrivacyComplianceContext(prompt: string): boolean {
  return (
    /\b(retention|cookie\s+banner|cookie\s+consent|cookies?|gdpr|privacy|customer\s+data|data\s+retention|pii|booking\s+history|audit\s+log|ai\s+command\s+log)\b/i.test(
      prompt,
    ) ||
    /\bkeep\b.+\b(?:customer|client|booking|audit)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(պահել|տվյալ|cookie|գաղտնիություն)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(хранить|данн|cookie|конфиденциальн)/i.test(prompt))
  );
}

function isCustomerSelfServicePrivacyPrompt(prompt: string): boolean {
  return (
    (/\bmy\b/i.test(prompt) &&
      /\b(data|account|information|profile)\b/i.test(prompt)) ||
    (/\bprivacy\b/i.test(prompt) &&
      /\b(delete|erase|remove|export)\b/i.test(prompt) &&
      !/\b(?:customer|client|հաճախորդ|клиент)\b/i.test(prompt))
  );
}

export function isAdminDeleteCustomerDataPrompt(prompt: string): boolean {
  if (isCustomerSelfServicePrivacyPrompt(prompt)) return false;

  if (/\bforget\b/i.test(prompt) && /\b(?:this\s+)?customer\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(?:right\s+to|gdpr)\b/i.test(prompt) &&
    /\b(?:erasure|forgotten|forget)\b/i.test(prompt) &&
    /\b(?:customer|client)\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\banonymize\b/i.test(prompt) && /\bpii\b/i.test(prompt)) {
    return true;
  }
  if (
    /\banonymize\b/i.test(prompt) &&
    /\b(?:personal\s+data|profile)\b/i.test(prompt) &&
    /\b(?:customer|client)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bremove\b/i.test(prompt) &&
    /\bpersonal\s+data\b/i.test(prompt) &&
    /\b(?:customer|client)\s+profile\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (/մոռանալ/i.test(prompt) && /հաճախորդ/i.test(prompt)) return true;
    if (/անոնիմացնել/i.test(prompt) && /(pii|տվյալ|հաճախորդ)/i.test(prompt)) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (/забыть/i.test(prompt) && /клиент/i.test(prompt)) return true;
    if (
      /анонимизировать/i.test(prompt) &&
      /(pii|персональн|клиент)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

function extractAdminDeleteCustomerName(
  prompt: string,
  params: Record<string, unknown> = {},
): string | undefined {
  if (typeof params.customerName === 'string' && params.customerName.trim()) {
    return params.customerName.trim();
  }

  const forMatch = prompt.match(
    /\bfor\s+(?:customer\s+)?([A-Za-z][\w\s'-]{1,40}?)(?:\s+'s|\s+s|$)/i,
  );
  if (forMatch?.[1]) return forMatch[1].trim();

  const forgetMatch = prompt.match(
    /\bforget\s+(?:this\s+)?customer\s+([A-Za-z][\w\s'-]{1,40})/i,
  );
  if (forgetMatch?.[1]) return forgetMatch[1].trim();

  const possessiveMatch = prompt.match(
    /\b([A-Za-z][\w'-]{1,40})'s\s+customer\s+profile/i,
  );
  if (possessiveMatch?.[1]) return possessiveMatch[1].trim();

  const customerMatch = prompt.match(
    /\bcustomer\s+([A-Za-z][\w\s'-]{1,40}?)(?:\s+'s|\s+s|$)/i,
  );
  if (customerMatch?.[1]) return customerMatch[1].trim();

  const hyMatch = prompt.match(
    /հաճախորդ(?:ին)?\s+([Ա-Ֆա-ֆ][Ա-Ֆա-ֆ\s'-]{1,40})/,
  );
  if (hyMatch?.[1]) return hyMatch[1].trim();

  const ruMatch = prompt.match(
    /клиент[аеу]?\s+([А-Яа-яЁё][А-Яа-яЁё\s'-]{1,40})/i,
  );
  if (ruMatch?.[1]) return ruMatch[1].trim();

  return undefined;
}

function hasHipaaComplianceContext(prompt: string): boolean {
  return (
    /\b(?:hipaa|baa|business\s+associate|phi|session\s+timeout|safeguards?)\b/i.test(
      prompt,
    ) ||
    (/\bhipaa\b/i.test(prompt) &&
      /(тайм[- ]?аут|timeout|session|պաշտպանություն)/i.test(prompt)) ||
    /\b(?:clinic|medical|dental)\b.+\b(?:hipaa|compliance)\b/i.test(prompt)
  );
}

function hasComplianceStatusContext(prompt: string): boolean {
  return (
    /\b(?:compliance\s+status|gdpr\s+checklist|sub[- ]?processors?|data\s+processors?|article\s+28|baa\s+status|hipaa\s+status|retention\s+periods?)\b/i.test(
      prompt,
    ) ||
    (/\b(?:gdpr|hipaa|baa|privacy|compliance)\b/i.test(prompt) &&
      /\b(?:status|checklist|summary|overview|configured|current)\b/i.test(
        prompt,
      )) ||
    (/\b(?:explain|describe|show|what|which)\b/i.test(prompt) &&
      /\b(?:compliance|gdpr|hipaa|retention|sub[- ]?processors?)\b/i.test(
        prompt,
      )) ||
    (containsArmenianScript(prompt) &&
      /(gdpr|hipaa|compliance|պահպանման\s+ժամկետ|checklist)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(gdpr|hipaa|compliance|хранен|чеклист|срок)/i.test(prompt))
  );
}

function hasGranularConsentContext(prompt: string): boolean {
  return (
    /\b(granular\s+consent|ai\s+processing\s+consent|ai\s+consent|third[- ]?party\s+integration\s+consent|integration\s+consent)\b/i.test(
      prompt,
    ) ||
    (/\b(?:requir(?:e|ing)|ask\s+for|enable|disable|stop)\b/i.test(prompt) &&
      /\b(?:ai(?:\s+processing)?|third[- ]?party|integration)\b/i.test(
        prompt,
      ) &&
      /\bconsent\b/i.test(prompt)) ||
    (containsArmenianScript(prompt) &&
      /(պահանջել|կարգավորել)/i.test(prompt) &&
      /(ai|համաձայնություն|ինտեգրաց)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(требовать|запросить)/i.test(prompt) &&
      /(ai|согласие|интеграц)/i.test(prompt))
  );
}

function parseRetentionDurationDays(prompt: string): number | undefined {
  const yearMatch = prompt.match(
    /(\d+)\s*(?:year|years|yr|տարի|лет|года)(?:\s|$|[.,!?])/i,
  );
  if (yearMatch?.[1]) return Number(yearMatch[1]) * 365;

  const monthMatch = prompt.match(
    /(\d+)\s*(?:month|months|ամիս|месяц)(?:\s|$|[.,!?])/i,
  );
  if (monthMatch?.[1]) return Number(monthMatch[1]) * 30;

  const dayMatch = prompt.match(
    /(\d+)\s*(?:day|days|օր|дней|дня)(?:\s|$|[.,!?])/i,
  );
  if (dayMatch?.[1]) return Number(dayMatch[1]);

  return undefined;
}

function detectRetentionField(prompt: string): RetentionField {
  if (/\b(?:ai\s+command|ai\s+log)/i.test(prompt)) return 'aiCommandLogsDays';
  if (/\baudit\b/i.test(prompt)) return 'auditLogsDays';
  if (/\bbooking\s+history\b/i.test(prompt)) return 'bookingHistoryDays';
  return 'customerPiiDays';
}

function extractCookieBannerMessage(prompt: string): string | undefined {
  const quoted = prompt.match(/["“]([^"”]{3,500})["”]/);
  return quoted?.[1]?.trim();
}

function parseCookieBannerFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { enabled?: boolean; message?: string } | undefined {
  if (typeof params.cookieBannerEnabled === 'boolean') {
    const message =
      typeof params.cookieBannerMessage === 'string'
        ? params.cookieBannerMessage.trim()
        : undefined;
    return {
      enabled: params.cookieBannerEnabled,
      ...(message ? { message } : {}),
    };
  }

  if (
    (/\b(?:enable|turn\s+on|show|activate)\b/i.test(prompt) ||
      /(միացնել|ակտիվացնել|включить)/i.test(prompt)) &&
    /\b(?:cookie\s+banner|cookie\s+consent|cookies?)\b/i.test(prompt)
  ) {
    const message = extractCookieBannerMessage(prompt);
    return { enabled: true, ...(message ? { message } : {}) };
  }

  if (
    (/\b(?:disable|turn\s+off|hide|deactivate)\b/i.test(prompt) ||
      /(անջատել|отключить)/i.test(prompt)) &&
    /\b(?:cookie\s+banner|cookie\s+consent|cookies?)\b/i.test(prompt)
  ) {
    return { enabled: false };
  }

  return undefined;
}

function parseRetentionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Partial<BusinessRetentionSettings> | undefined {
  const retention: Partial<BusinessRetentionSettings> = {};
  let changed = false;

  for (const field of [
    'bookingHistoryDays',
    'customerPiiDays',
    'aiCommandLogsDays',
    'auditLogsDays',
  ] as const) {
    const fromParams = params[field];
    const normalized = normalizeRetentionDays(fromParams, field);
    if (normalized != null) {
      retention[field] = normalized;
      changed = true;
    }
  }

  const duration = parseRetentionDurationDays(prompt);
  if (duration != null) {
    const field = detectRetentionField(prompt);
    const normalized = normalizeRetentionDays(duration, field);
    if (normalized != null) {
      retention[field] = normalized;
      changed = true;
    }
  }

  return changed ? retention : undefined;
}

function parseHipaaSessionTimeoutMinutes(
  prompt: string,
  params: Record<string, unknown> = {},
): number | undefined {
  const fromParams = Number(params.sessionTimeoutMinutes);
  if (
    Number.isFinite(fromParams) &&
    fromParams >= MIN_HIPAA_SESSION_TIMEOUT_MINUTES &&
    fromParams <= MAX_HIPAA_SESSION_TIMEOUT_MINUTES
  ) {
    return Math.round(fromParams);
  }

  const minuteMatch = prompt.match(
    /(\d+)\s*[-\s–]?(?:minute|min|минут(?:ный|а)?)(?:s)?(?:\s|$|[.,!?])/i,
  );
  if (minuteMatch?.[1]) {
    const parsed = Number(minuteMatch[1]);
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_HIPAA_SESSION_TIMEOUT_MINUTES &&
      parsed <= MAX_HIPAA_SESSION_TIMEOUT_MINUTES
    ) {
      return Math.round(parsed);
    }
  }
  return undefined;
}

export function isOpenComplianceDashboardPrompt(prompt: string): boolean {
  const navigateCue =
    /\b(?:open|go\s+to|take\s+me\s+to|navigate\s+to|jump\s+to)\b/i.test(
      prompt,
    ) || /\bshow\s+me\s+the\b/i.test(prompt);

  if (!navigateCue) return false;

  if (isExplainComplianceStatusPrompt(prompt)) return false;
  if (isExplainGdprChecklistPrompt(prompt)) return false;
  if (isExplainPhiEncryptionStatusPrompt(prompt)) return false;
  if (isExplainMinimumNecessaryPhiAccessPrompt(prompt)) return false;
  if (isSendBreachNotificationPrompt(prompt)) return false;
  if (isReportDataBreachPrompt(prompt)) return false;

  if (/\bcompliance\s+settings?\b/i.test(prompt)) return true;
  if (
    /\b(?:breach\s+(?:log|incidents?)|breach\s+notification\s+log)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\bphi\s+(?:access\s+)?audit\b/i.test(prompt)) return true;
  if (
    /\b(?:hipaa|baa)\b/i.test(prompt) &&
    /\b(?:settings?|compliance)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bsub[\s-]?processors?\b/i.test(prompt) &&
    /\b(?:list|page|settings?)\b/i.test(prompt)
  ) {
    return true;
  }

  return (
    /\b(?:compliance|gdpr|privacy)\b/i.test(prompt) &&
    /\b(?:settings?|dashboard|panel|page|section)\b/i.test(prompt)
  );
}

export function parseOpenComplianceDashboardFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedOpenComplianceDashboard | null {
  if (!isOpenComplianceDashboardPrompt(prompt)) return null;
  return { panel: parseComplianceDashboardPanel(prompt, params) };
}

export function isListBreachIncidentsPrompt(prompt: string): boolean {
  if (isSendBreachNotificationPrompt(prompt)) return false;
  if (isReportDataBreachPrompt(prompt)) return false;
  if (
    /\b(?:open|go\s+to|take\s+me\s+to|navigate\s+to)\b/i.test(prompt) &&
    /\b(?:breach\s+(?:log|incidents?))\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:gdpr\s+)?72[\s-]?hour(?:s)?\s+(?:deadline|notification)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return (
    /\b(show|list|view|display|what\s+are|what\s+is\s+our)\b/i.test(prompt) &&
    /\b(breach\s+incidents?|reported\s+breaches?|logged\s+breaches?|data\s+breach(?:es)?)\b/i.test(
      prompt,
    )
  );
}

function mapPhiFieldFromPrompt(prompt: string): string | undefined {
  if (/\breferral\s+notes?\b/i.test(prompt)) return 'referralNotes';
  if (/\bsymptoms?\b/i.test(prompt)) return 'symptoms';
  if (
    /\b(?:lab\s+)?review\s+comments?\b/i.test(prompt) &&
    /\b(?:lab|result|test)\b/i.test(prompt)
  ) {
    return 'reviewComment';
  }
  if (/\b(?:lab\s+)?release\s+comments?\b/i.test(prompt)) {
    return 'releaseComment';
  }
  if (
    /\b(?:lab\s+result|result\s+entry|result)\s+comments?\b/i.test(prompt) ||
    /\blab\s+result\s+notes?\b/i.test(prompt)
  ) {
    return 'comment';
  }
  if (
    /\b(?:lab\s+)?measurement\s+comments?\b/i.test(prompt) ||
    (/\blab\s+comments?\b/i.test(prompt) && /\bmeasurement\b/i.test(prompt))
  ) {
    return 'labComment';
  }
  if (
    /\b(?:lab\s+)?measurement\s+values?\b/i.test(prompt) ||
    /\bresult\s+measurements?\b/i.test(prompt)
  ) {
    return 'value';
  }
  if (/\b(?:lab\s+)?status\s+history\s+notes?\b/i.test(prompt)) {
    return 'statusHistoryNote';
  }
  if (/\bpatient\s+test\s+results?\b/i.test(prompt)) {
    return 'patient_test_results';
  }
  if (/\bpatient\s+notes?\b/i.test(prompt) || /\bnotes?\b/i.test(prompt)) {
    return 'notes';
  }
  return undefined;
}

export const PHI_ACCESS_AUDIT_FIELD_LABELS: Record<string, string> = {
  referralNotes: 'referral notes',
  symptoms: 'symptoms',
  notes: 'patient notes',
  patient_test_results: 'legacy patient test result notes (booking metadata)',
  comment: 'lab result comments',
  reviewComment: 'lab review comments',
  releaseComment: 'lab release comments',
  value: 'lab measurement values',
  labComment: 'lab measurement comments',
  statusHistoryNote: 'lab status history notes',
};

export function formatPhiAccessAuditFieldLabel(fieldName: string): string {
  return PHI_ACCESS_AUDIT_FIELD_LABELS[fieldName] ?? fieldName;
}

function parsePhiAccessAuditDaysBack(
  prompt: string,
  params: Record<string, unknown> = {},
): number | undefined {
  const fromParams = Number(params.daysBack);
  if (Number.isFinite(fromParams) && fromParams > 0) {
    return Math.min(Math.round(fromParams), 365);
  }

  if (/\b(?:last|past)\s+week\b/i.test(prompt)) return 7;
  if (/\b(?:last|past)\s+month\b/i.test(prompt)) return 30;
  if (/\b(?:last|past)\s+(\d{1,3})\s+days?\b/i.test(prompt)) {
    const match = prompt.match(/\b(?:last|past)\s+(\d{1,3})\s+days?\b/i);
    return match ? Math.min(parseInt(match[1], 10), 365) : undefined;
  }
  if (/\byesterday\b/i.test(prompt)) return 1;
  if (/\btoday\b/i.test(prompt)) return 1;
  return undefined;
}

export function isExplainPhiEncryptionStatusPrompt(prompt: string): boolean {
  if (/\bis\s+hipaa\s+encryption\s+on\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(encrypted?\s+at\s+rest|encryption\s+(?:on|enabled|configured|status)|phi\s+encryption|hipaa\s+encryption)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\b(is|are)\b/i.test(prompt) &&
    /\b(encrypted?|encryption)\b/i.test(prompt) &&
    /\b(referral\s+notes?|patient\s+notes?|symptoms?|phi|patient\s+test\s+results?)\b/i.test(
      prompt,
    )
  );
}

export function isConfigureHipaaSessionTimeoutPrompt(prompt: string): boolean {
  if (isUpdateServiceDurationBufferPrompt(prompt)) return false;
  if (!MUTATE_COMPLIANCE_VERBS.test(prompt)) return false;

  const timeout = parseHipaaSessionTimeoutMinutes(prompt);
  const hasTimeoutMutateCue =
    timeout != null ||
    /\b(?:session\s+timeout|hipaa\s+timeout|auto\s+logout|auto[\s-]?log\s*out)\b/i.test(
      prompt,
    );

  if (!hasTimeoutMutateCue) return false;

  if (/\bfor\s+hipaa\b/i.test(prompt)) return false;

  if (
    /\b(?:enable|disable|turn\s+on|turn\s+off|activate|deactivate)\b/i.test(
      prompt,
    ) &&
    /\b(?:hipaa\s+(?:mode|safeguards?)|safeguards?)\b/i.test(prompt)
  ) {
    return false;
  }

  return true;
}

export function isExplainHipaaSessionTimeoutPrompt(prompt: string): boolean {
  if (isConfigureHipaaSessionTimeoutPrompt(prompt)) return false;
  if (/\bprovider\s+(?:mobile\s+)?app\b/i.test(prompt)) return false;
  if (
    /\b(?:mobile\s+app|provider\s+app)\b/i.test(prompt) &&
    /\blog\s*(?:ged?\s*out|out)\b/i.test(prompt)
  ) {
    return false;
  }

  if (/\bwhen\s+will\s+i\s+be\s+logged\s+out\b/i.test(prompt)) {
    return true;
  }

  if (/\bwhat\s+is\s+(?:our\s+)?hipaa\s+session\s+timeout\b/i.test(prompt)) {
    return true;
  }

  if (
    MUTATE_COMPLIANCE_VERBS.test(prompt) &&
    parseHipaaSessionTimeoutMinutes(prompt) != null
  ) {
    return false;
  }

  return (
    /\b(?:when|what|how\s+long)\b/i.test(prompt) &&
    /\b(?:logged?\s*out|log\s*out|session\s+timeout|auto\s+logout|inactivity)\b/i.test(
      prompt,
    ) &&
    !MUTATE_COMPLIANCE_VERBS.test(prompt)
  );
}

export function isExplainMinimumNecessaryPhiAccessPrompt(
  prompt: string,
): boolean {
  if (/\bminimum\s+necessary\b/i.test(prompt)) {
    return true;
  }

  if (
    /\bwho\s+can\s+see\b/i.test(prompt) &&
    /\b(patient\s+notes?|phi|referral\s+notes?|symptoms?)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\bwhat\s+(?:phi\s+)?can\s+staff\b/i.test(prompt) &&
    /\b(access|see|view)\b/i.test(prompt)
  ) {
    return true;
  }

  return /\bwhat\s+phi\s+can\s+staff\s+access\b/i.test(prompt);
}

export function isViewPhiAccessAuditPrompt(prompt: string): boolean {
  if (isExplainMinimumNecessaryPhiAccessPrompt(prompt)) return false;
  if (
    /\b(?:open|go\s+to|take\s+me\s+to|navigate\s+to)\b/i.test(prompt) &&
    /\bphi\s+(?:access\s+)?audit\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(phi\s+access\s+audit|hipaa\s+phi\s+audit|phi\s+audit\s+log)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(who\s+accessed|who\s+viewed|who\s+read)\b/i.test(prompt) &&
    /\b(patient\s+notes?|phi|referral\s+notes?|symptoms|lab\s+result|result\s+comments?|review\s+comments?|release\s+comments?|measurements?|lab\s+comments?)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return (
    /\b(show|list|view|display)\b/i.test(prompt) &&
    /\b(hipaa|phi)\b/i.test(prompt) &&
    /\b(audit|access\s+log|log)\b/i.test(prompt)
  );
}

function isReadOnlyComplianceStatusPrompt(prompt: string): boolean {
  if (
    /\b(?:open|go\s+to|take\s+me\s+to|navigate\s+to|jump\s+to)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isListBreachIncidentsPrompt(prompt)) return false;
  if (isViewPhiAccessAuditPrompt(prompt)) return false;
  if (isExplainPhiEncryptionStatusPrompt(prompt)) return false;
  if (isExplainMinimumNecessaryPhiAccessPrompt(prompt)) return false;
  if (isExplainHipaaSessionTimeoutPrompt(prompt)) return false;
  if (isAcceptHipaaBaaPrompt(prompt)) return false;
  if (isListSubProcessorsPrompt(prompt)) return false;
  if (isExplainGdprChecklistPrompt(prompt)) return false;
  if (!hasComplianceStatusContext(prompt)) return false;

  const readCue =
    /\b(?:explain|describe|what|which|why|how|list|summarize|overview)\b/i.test(
      prompt,
    ) ||
    /\bshow\s+(?:me\s+)?(?:our\s+)?(?:gdpr|hipaa|baa|compliance|retention|sub)/i.test(
      prompt,
    ) ||
    /\b(?:status|checklist)\b/i.test(prompt) ||
    /(բացատրիր|ցույց\s+տալ|ինչ\s+է|объяснить|показать|какой)/i.test(prompt) ||
    /\?\s*$/.test(prompt.trim());

  if (!readCue) return false;

  if (isAdminDeleteCustomerDataPrompt(prompt)) return false;

  if (
    hasHipaaComplianceContext(prompt) &&
    (/\b(?:enable|disable|turn\s+on|turn\s+off|activate|deactivate|set)\b/i.test(
      prompt,
    ) ||
      hasMultilingualMutateCue(prompt))
  ) {
    return false;
  }

  if (
    hasGranularConsentContext(prompt) &&
    (MUTATE_COMPLIANCE_VERBS.test(prompt) || /\bconsent\b/i.test(prompt))
  ) {
    return false;
  }

  if (
    hasPrivacyComplianceContext(prompt) &&
    (parseRetentionFromPrompt(prompt) || parseCookieBannerFromPrompt(prompt))
  ) {
    return false;
  }

  return true;
}

export function isListSubProcessorsPrompt(prompt: string): boolean {
  if (
    /\b(?:open|go\s+to|take\s+me\s+to|navigate\s+to)\b/i.test(prompt) &&
    /\b(?:sub[- ]?processors?|processor\s+list)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\bwho\s+are\s+(?:our\s+)?(?:data\s+)?sub[- ]?processors?\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:article\s+28|processor\s+list)\b/i.test(prompt) &&
    /\b(?:show|list|who)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:sub[- ]?processors?|data\s+processors?)\b/i.test(prompt) &&
    /\b(?:list|show|who)\b/i.test(prompt)
  ) {
    return true;
  }

  return (
    /\barticle\s+28\b/i.test(prompt) &&
    /\b(?:processor|sub[- ]?processor)\b/i.test(prompt)
  );
}

export function isExplainGdprChecklistPrompt(prompt: string): boolean {
  if (isListSubProcessorsPrompt(prompt)) return false;

  if (/\bare\s+we\s+gdpr\s+compliant\b/i.test(prompt)) {
    return true;
  }

  if (
    /\bwhat\s+privacy\s+items?\s+(?:are\s+)?(?:still\s+)?missing\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\bgdpr\s+checklist\b/i.test(prompt)) {
    return true;
  }

  return (
    /\b(?:gdpr|privacy)\b/i.test(prompt) &&
    /\b(?:compliant|compliance|missing|checklist|items?\s+missing)\b/i.test(
      prompt,
    ) &&
    !/\b(?:hipaa|baa|sub[- ]?processors?|retention\s+periods?)\b/i.test(prompt)
  );
}

export function isExplainComplianceStatusPrompt(prompt: string): boolean {
  return isReadOnlyComplianceStatusPrompt(prompt);
}

function extractEnableHipaaModeFields(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedEnableHipaaMode | null {
  const parsed: ParsedEnableHipaaMode = {};
  let changed = false;

  if (typeof params.enabled === 'boolean') {
    parsed.enabled = params.enabled;
    changed = true;
  }

  const timeout = parseHipaaSessionTimeoutMinutes(prompt, params);
  if (timeout != null) {
    parsed.sessionTimeoutMinutes = timeout;
    changed = true;
  }

  const disable =
    /\b(?:disable|turn\s+off|stop|deactivate)\b/i.test(prompt) &&
    /\b(?:hipaa|safeguards?)\b/i.test(prompt);

  if (
    (/\b(?:enable|turn\s+on|activate)\b/i.test(prompt) ||
      /(միացնել|ակտիվացնել|включить)/i.test(prompt)) &&
    /\b(?:hipaa|safeguards?|պաշտպանություն)\b/i.test(prompt)
  ) {
    parsed.enabled = true;
    changed = true;
  } else if (disable) {
    parsed.enabled = false;
    changed = true;
  }

  return changed ? parsed : null;
}

export function isAcceptHipaaBaaPrompt(prompt: string): boolean {
  if (
    /\b(?:what|which|show|explain|describe|status)\b/i.test(prompt) &&
    /\b(?:baa|business\s+associate)\b/i.test(prompt) &&
    !/\b(?:accept|sign|agree)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:accept|sign|agree)\b/i.test(prompt) &&
    /\b(?:baa|business\s+associate(?:\s+agreement)?)\b/i.test(prompt)
  ) {
    return true;
  }

  return (
    /\bsign\s+baa\b/i.test(prompt) &&
    /\b(?:enable|turn\s+on|activate)\b/i.test(prompt) &&
    /\bhipaa\b/i.test(prompt)
  );
}

export function isEnableHipaaModePrompt(prompt: string): boolean {
  if (isAcceptHipaaBaaPrompt(prompt)) return false;
  if (isConfigureHipaaSessionTimeoutPrompt(prompt)) return false;
  if (!hasHipaaComplianceContext(prompt)) return false;
  if (isReadOnlyComplianceStatusPrompt(prompt)) return false;

  if (
    /\b(explain|describe|what|which|why|how|show\s+me|status|checklist)\b/i.test(
      prompt,
    ) &&
    !MUTATE_COMPLIANCE_VERBS.test(prompt)
  ) {
    return false;
  }

  if (extractEnableHipaaModeFields(prompt)) return true;

  return (
    MUTATE_COMPLIANCE_VERBS.test(prompt) &&
    /\b(?:hipaa|safeguards?|baa|session\s+timeout)\b/i.test(prompt)
  );
}

export function isConfigureGranularConsentPrompt(prompt: string): boolean {
  if (isAdminDeleteCustomerDataPrompt(prompt)) return false;
  if (!hasGranularConsentContext(prompt)) return false;
  if (
    containsArmenianScript(prompt) &&
    /(պահանջել|կարգավորել)/i.test(prompt) &&
    /(ai|համաձայնություն|ինտեգրաց)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(требовать|запросить)/i.test(prompt) &&
    /(ai|согласие|интеграц)/i.test(prompt)
  ) {
    return true;
  }
  if (isReadOnlyComplianceStatusPrompt(prompt)) return false;

  if (
    /\b(explain|describe|what|which|why|how|show\s+me|status)\b/i.test(
      prompt,
    ) &&
    !MUTATE_COMPLIANCE_VERBS.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(cookie\s+banner|retention|keep\s+customer|hipaa|baa)\b/i.test(prompt)
  ) {
    return false;
  }

  return MUTATE_COMPLIANCE_VERBS.test(prompt) || /\bconsent\b/i.test(prompt);
}

export function isConfigurePrivacyRetentionPrompt(prompt: string): boolean {
  if (isAdminDeleteCustomerDataPrompt(prompt)) return false;
  if (isConfigureGranularConsentPrompt(prompt)) return false;
  if (isEnableHipaaModePrompt(prompt)) return false;
  if (isReadOnlyComplianceStatusPrompt(prompt)) return false;
  if (
    containsArmenianScript(prompt) &&
    /(պահել|միացնել|անջատել)/i.test(prompt) &&
    /(տվյալ|cookie|հաճախորդ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(хранить|включить|отключить)/i.test(prompt) &&
    /(данн|cookie|клиент)/i.test(prompt)
  ) {
    return true;
  }
  if (!hasPrivacyComplianceContext(prompt)) return false;

  if (
    /\b(explain|describe|what|which|why|how|show\s+me|status|checklist)\b/i.test(
      prompt,
    ) &&
    !MUTATE_COMPLIANCE_VERBS.test(prompt)
  ) {
    return false;
  }

  if (parseRetentionFromPrompt(prompt) || parseCookieBannerFromPrompt(prompt)) {
    return true;
  }

  return MUTATE_COMPLIANCE_VERBS.test(prompt);
}

export function parseConfigureGranularConsentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureGranularConsent | null {
  if (!isConfigureGranularConsentPrompt(prompt)) return null;

  const parsed: ParsedConfigureGranularConsent = {};
  let changed = false;

  if (typeof params.requireAiProcessing === 'boolean') {
    parsed.requireAiProcessing = params.requireAiProcessing;
    changed = true;
  }
  if (typeof params.requireThirdPartyIntegrations === 'boolean') {
    parsed.requireThirdPartyIntegrations = params.requireThirdPartyIntegrations;
    changed = true;
  }

  const disable =
    /\b(?:disable|turn\s+off|stop|remove|don't|do\s+not|no\s+longer)\b/i.test(
      prompt,
    );

  if (
    (/\b(?:ai(?:\s+processing)?|ai\s+consent)\b/i.test(prompt) ||
      /(ai\s+մշակման|обработк[аи]\s+ai)/i.test(prompt)) &&
    (/\bconsent\b/i.test(prompt) || /(համաձայնություն|согласие)/i.test(prompt))
  ) {
    parsed.requireAiProcessing = !disable;
    changed = true;
  }

  if (
    (/\b(?:third[- ]?party|integration)\b/i.test(prompt) ||
      /(երրորդ\s+կողմ|сторонн)/i.test(prompt)) &&
    (/\bconsent\b/i.test(prompt) || /(համաձայնություն|согласие)/i.test(prompt))
  ) {
    parsed.requireThirdPartyIntegrations = !disable;
    changed = true;
  }

  return changed ? parsed : null;
}

export function parseConfigurePrivacyRetentionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigurePrivacyRetention | null {
  if (!isConfigurePrivacyRetentionPrompt(prompt)) return null;

  const retention = parseRetentionFromPrompt(prompt, params);
  const cookieBanner = parseCookieBannerFromPrompt(prompt, params);

  if (!retention && !cookieBanner) return null;

  const parsed: ParsedConfigurePrivacyRetention = {};
  if (retention) parsed.retention = retention;
  if (cookieBanner) parsed.cookieBanner = cookieBanner;
  return parsed;
}

export function parseEnableHipaaModeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedEnableHipaaMode | null {
  if (!isEnableHipaaModePrompt(prompt)) return null;
  return extractEnableHipaaModeFields(prompt, params);
}

export function parseExplainComplianceStatusAspect(
  prompt: string,
): ParsedExplainComplianceStatus['aspect'] {
  if (
    /\b(?:sub[- ]?processors?|data\s+processors?|article\s+28)\b/i.test(prompt)
  ) {
    return 'sub_processors';
  }
  if (
    (/\b(?:retention|retention\s+periods?)\b/i.test(prompt) ||
      /(պահպանման\s+ժամկետ|срок[аи]\s+хранен)/i.test(prompt)) &&
    !/\b(?:hipaa|baa)\b/i.test(prompt)
  ) {
    return 'retention';
  }
  if (/\bgdpr\b/i.test(prompt) && /\bchecklist\b/i.test(prompt)) {
    return 'gdpr';
  }
  if (/\b(?:hipaa|baa)\b/i.test(prompt) && !/\bgdpr\b/i.test(prompt)) {
    return 'hipaa';
  }
  if (/\bgdpr\b/i.test(prompt) && !/\b(?:hipaa|baa)\b/i.test(prompt)) {
    return 'gdpr';
  }
  return 'all';
}

export function parseAdminDeleteCustomerDataFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedAdminDeleteCustomerData | null {
  if (!isAdminDeleteCustomerDataPrompt(prompt)) return null;
  const customerName = extractAdminDeleteCustomerName(prompt, params);
  return customerName ? { customerName } : {};
}

export function parseListSubProcessorsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListSubProcessors | null {
  if (!isListSubProcessorsPrompt(prompt)) return null;
  const article28 =
    typeof params.article28 === 'boolean'
      ? params.article28
      : /\barticle\s+28\b/i.test(prompt);
  return article28 ? { article28: true } : {};
}

export function parseExplainGdprChecklistFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainGdprChecklist | null {
  if (!isExplainGdprChecklistPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  if (
    aspectFromParams &&
    ['checklist', 'compliance', 'missing'].includes(aspectFromParams)
  ) {
    return {
      aspect: aspectFromParams as ParsedExplainGdprChecklist['aspect'],
    };
  }
  if (/\bare\s+we\s+gdpr\s+compliant\b/i.test(prompt)) {
    return { aspect: 'compliance' };
  }
  if (
    /\bwhat\s+privacy\s+items?\s+(?:are\s+)?(?:still\s+)?missing\b/i.test(
      prompt,
    )
  ) {
    return { aspect: 'missing' };
  }
  return { aspect: 'checklist' };
}

export function parseExplainComplianceStatusFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainComplianceStatus | null {
  if (!isExplainComplianceStatusPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams &&
    ['all', 'gdpr', 'hipaa', 'retention', 'sub_processors'].includes(
      aspectFromParams,
    )
      ? (aspectFromParams as ParsedExplainComplianceStatus['aspect'])
      : parseExplainComplianceStatusAspect(prompt);
  return { aspect };
}

export function isSendBreachNotificationPrompt(prompt: string): boolean {
  if (
    /\bemail\s+affected\s+customers?\b/i.test(prompt) &&
    /\bbreach\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(send|email|dispatch|deliver|notify)\b/i.test(prompt) &&
    /\b(?:draft\s+)?breach\s+(?:notice|notification|email)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(send|email|notify)\b/i.test(prompt) &&
    /\b(?:affected\s+)?customers?\b/i.test(prompt) &&
    /\b(?:about|regarding|for)\b/i.test(prompt) &&
    /\b(?:breach|incident)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isReportDataBreachPrompt(prompt: string): boolean {
  if (isSendBreachNotificationPrompt(prompt)) return false;

  if (
    /\breport\s+a\s+data\s+breach\b/i.test(prompt) ||
    /\blog\s+security\s+incident\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\b(report|log|record|document)\b/i.test(prompt) &&
    /\b(data\s*breach|security\s+incident|breach\s+incident)\b/i.test(prompt)
  );
}

function extractBreachIncidentRef(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  const fromParams =
    typeof params.incidentRef === 'string' ? params.incidentRef.trim() : '';
  if (fromParams) return fromParams;

  const brMatch = prompt.match(/\b(BR-[A-Za-z0-9-]+)\b/i);
  if (brMatch) return brMatch[1];

  const incidentMatch = prompt.match(/\bincident\s+([A-Za-z0-9-]+)\b/i);
  if (incidentMatch) return incidentMatch[1];

  const uuidMatch = prompt.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  );
  if (uuidMatch) return uuidMatch[0];

  const shortUuidMatch = prompt.match(
    /\b(?:breach|incident)\s+([0-9a-f]{8})\b/i,
  );
  if (shortUuidMatch) return shortUuidMatch[1];

  return undefined;
}

function extractReportDataBreachDescription(
  prompt: string,
  params: Record<string, unknown>,
): string {
  const fromParams =
    typeof params.description === 'string' ? params.description.trim() : '';
  if (fromParams.length >= 10) return fromParams.slice(0, 5000);

  const colonMatch = prompt.match(/:\s*(.+)$/s);
  const candidate = colonMatch ? colonMatch[1].trim() : prompt.trim();
  return candidate.slice(0, 5000);
}

function extractAffectedCustomerCount(
  prompt: string,
  params: Record<string, unknown>,
): number | undefined {
  const fromParams = Number(params.affectedCustomerCount);
  if (Number.isFinite(fromParams) && fromParams >= 0) {
    return Math.round(fromParams);
  }

  const countMatch = prompt.match(
    /\b(\d{1,7})\s+(?:affected\s+)?(?:customers?|clients?|emails?|accounts?)\b/i,
  );
  if (countMatch) return parseInt(countMatch[1], 10);

  if (/\baffecting\s+customer\s+emails?\b/i.test(prompt)) {
    return undefined;
  }

  return undefined;
}

export function parseListBreachIncidentsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListBreachIncidents | null {
  if (!isListBreachIncidentsPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'deadlines' || aspectFromParams === 'all'
      ? aspectFromParams
      : /\b(?:gdpr\s+)?72[\s-]?hour(?:s)?\s+(?:deadline|notification)\b/i.test(
            prompt,
          )
        ? 'deadlines'
        : 'all';
  return { aspect };
}

export function parseExplainPhiEncryptionStatusFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainPhiEncryptionStatus | null {
  if (!isExplainPhiEncryptionStatusPrompt(prompt)) return null;
  const fieldName =
    typeof params.fieldName === 'string' && params.fieldName.trim()
      ? params.fieldName.trim()
      : mapPhiFieldFromPrompt(prompt);
  return fieldName ? { fieldName } : {};
}

export function parseAcceptHipaaBaaFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedAcceptHipaaBaa | null {
  if (!isAcceptHipaaBaaPrompt(prompt)) return null;
  const enableHipaa =
    typeof params.enableHipaa === 'boolean'
      ? params.enableHipaa
      : /\b(?:enable|turn\s+on|activate)\b/i.test(prompt) &&
        /\bhipaa\b/i.test(prompt);
  return enableHipaa ? { enableHipaa: true } : {};
}

export function parseConfigureHipaaSessionTimeoutFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureHipaaSessionTimeout | null {
  if (!isConfigureHipaaSessionTimeoutPrompt(prompt)) return null;
  const timeout = parseHipaaSessionTimeoutMinutes(prompt, params);
  if (timeout == null) return null;
  return { sessionTimeoutMinutes: timeout };
}

export function parseExplainHipaaSessionTimeoutFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainHipaaSessionTimeout | null {
  if (!isExplainHipaaSessionTimeoutPrompt(prompt)) return null;
  const personalLogout =
    typeof params.personalLogout === 'boolean'
      ? params.personalLogout
      : /\bwhen\s+will\s+i\s+be\s+logged\s+out\b/i.test(prompt);
  return { personalLogout };
}

export function parseExplainMinimumNecessaryPhiAccessFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainMinimumNecessaryPhiAccess | null {
  if (!isExplainMinimumNecessaryPhiAccessPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams && ['all', 'roles', 'fields'].includes(aspectFromParams)
      ? (aspectFromParams as ParsedExplainMinimumNecessaryPhiAccess['aspect'])
      : /\bwho\s+can\s+see\b/i.test(prompt)
        ? 'roles'
        : (/\bwhat\s+phi\b/i.test(prompt) && /\bstaff\b/i.test(prompt)) ||
            /\bwhat\s+can\s+staff\s+(?:see|access|view)\b/i.test(prompt)
          ? 'fields'
          : 'all';
  return { aspect };
}

export function parseViewPhiAccessAuditFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedViewPhiAccessAudit | null {
  if (!isViewPhiAccessAuditPrompt(prompt)) return null;
  const daysBack = parsePhiAccessAuditDaysBack(prompt, params);
  const fieldName =
    typeof params.fieldName === 'string' && params.fieldName.trim()
      ? params.fieldName.trim()
      : mapPhiFieldFromPrompt(prompt);
  const limitRaw = Number(params.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.round(limitRaw), 200)
      : undefined;
  return {
    ...(daysBack != null ? { daysBack } : {}),
    ...(fieldName ? { fieldName } : {}),
    ...(limit != null ? { limit } : {}),
  };
}

export function parseReportDataBreachFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedReportDataBreach | null {
  if (!isReportDataBreachPrompt(prompt)) return null;
  const description = extractReportDataBreachDescription(prompt, params);
  if (description.length < 10) return null;
  const affectedCustomerCount = extractAffectedCustomerCount(prompt, params);
  return {
    description,
    ...(affectedCustomerCount != null ? { affectedCustomerCount } : {}),
  };
}

export function parseSendBreachNotificationFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSendBreachNotification | null {
  if (!isSendBreachNotificationPrompt(prompt)) return null;
  const incidentRef = extractBreachIncidentRef(prompt, params);
  if (!incidentRef) return null;
  return { incidentRef };
}

export function rescueBusinessComplianceIntent(
  prompt: string,
  action: string,
): { action: BusinessComplianceIntent; rescueReason: string } | null {
  if ((BUSINESS_COMPLIANCE_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (parseSendBreachNotificationFromPrompt(prompt)) {
    return {
      action: 'send_breach_notification',
      rescueReason: 'send_breach_notification',
    };
  }

  if (parseOpenComplianceDashboardFromPrompt(prompt)) {
    return {
      action: 'open_compliance_dashboard',
      rescueReason: 'open_compliance_dashboard',
    };
  }

  if (parseReportDataBreachFromPrompt(prompt)) {
    return {
      action: 'report_data_breach',
      rescueReason: 'report_data_breach',
    };
  }

  if (parseListBreachIncidentsFromPrompt(prompt)) {
    return {
      action: 'list_breach_incidents',
      rescueReason: 'list_breach_incidents',
    };
  }

  if (parseViewPhiAccessAuditFromPrompt(prompt)) {
    return {
      action: 'view_phi_access_audit',
      rescueReason: 'view_phi_access_audit',
    };
  }

  if (parseExplainPhiEncryptionStatusFromPrompt(prompt)) {
    return {
      action: 'explain_phi_encryption_status',
      rescueReason: 'explain_phi_encryption_status',
    };
  }

  if (parseExplainMinimumNecessaryPhiAccessFromPrompt(prompt)) {
    return {
      action: 'explain_minimum_necessary_phi_access',
      rescueReason: 'explain_minimum_necessary_phi_access',
    };
  }

  if (parseExplainHipaaSessionTimeoutFromPrompt(prompt)) {
    return {
      action: 'explain_hipaa_session_timeout',
      rescueReason: 'explain_hipaa_session_timeout',
    };
  }

  if (parseListSubProcessorsFromPrompt(prompt)) {
    return {
      action: 'list_sub_processors',
      rescueReason: 'list_sub_processors',
    };
  }

  if (parseExplainGdprChecklistFromPrompt(prompt)) {
    return {
      action: 'explain_gdpr_checklist',
      rescueReason: 'explain_gdpr_checklist',
    };
  }

  if (parseExplainComplianceStatusFromPrompt(prompt)) {
    return {
      action: 'explain_compliance_status',
      rescueReason: 'explain_compliance_status',
    };
  }

  if (parseAdminDeleteCustomerDataFromPrompt(prompt)) {
    return {
      action: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
    };
  }

  if (parseConfigureHipaaSessionTimeoutFromPrompt(prompt)) {
    return {
      action: 'configure_hipaa_session_timeout',
      rescueReason: 'configure_hipaa_session_timeout',
    };
  }

  if (parseAcceptHipaaBaaFromPrompt(prompt)) {
    return {
      action: 'accept_hipaa_baa',
      rescueReason: 'accept_hipaa_baa',
    };
  }

  if (parseEnableHipaaModeFromPrompt(prompt)) {
    return {
      action: 'enable_hipaa_mode',
      rescueReason: 'enable_hipaa_mode',
    };
  }

  if (parseConfigureGranularConsentFromPrompt(prompt)) {
    return {
      action: 'configure_granular_consent',
      rescueReason: 'configure_granular_consent',
    };
  }

  if (parseConfigurePrivacyRetentionFromPrompt(prompt)) {
    return {
      action: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
    };
  }

  return null;
}

export function formatRetentionFieldLabel(field: RetentionField): string {
  switch (field) {
    case 'bookingHistoryDays':
      return 'booking history';
    case 'customerPiiDays':
      return 'customer PII';
    case 'aiCommandLogsDays':
      return 'AI command logs';
    case 'auditLogsDays':
      return 'audit logs';
    default:
      return field;
  }
}

export function summarizePrivacyRetentionChange(
  previous: BusinessPrivacySettings,
  next: BusinessPrivacySettings,
): string[] {
  const lines: string[] = [];
  for (const field of [
    'bookingHistoryDays',
    'customerPiiDays',
    'aiCommandLogsDays',
    'auditLogsDays',
  ] as const) {
    if (previous.retention[field] !== next.retention[field]) {
      lines.push(
        `${formatRetentionFieldLabel(field)} retention: ${previous.retention[field]} → ${next.retention[field]} days`,
      );
    }
  }
  if (previous.cookieBanner.enabled !== next.cookieBanner.enabled) {
    lines.push(
      `Cookie banner: ${previous.cookieBanner.enabled ? 'enabled' : 'disabled'} → ${next.cookieBanner.enabled ? 'enabled' : 'disabled'}`,
    );
  } else if (
    next.cookieBanner.enabled &&
    previous.cookieBanner.message !== next.cookieBanner.message &&
    next.cookieBanner.message
  ) {
    lines.push('Cookie banner message updated.');
  }
  return lines;
}

export function summarizeGranularConsentChange(
  previous: BusinessGranularConsentSettings,
  next: BusinessGranularConsentSettings,
): string[] {
  const lines: string[] = [];
  if (previous.requireAiProcessing !== next.requireAiProcessing) {
    lines.push(
      `AI processing consent: ${next.requireAiProcessing ? 'required' : 'optional'}`,
    );
  }
  if (
    previous.requireThirdPartyIntegrations !==
    next.requireThirdPartyIntegrations
  ) {
    lines.push(
      `Third-party integration consent: ${next.requireThirdPartyIntegrations ? 'required' : 'optional'}`,
    );
  }
  return lines;
}

export function summarizeHipaaChange(
  previous: BusinessHipaaSettings,
  next: BusinessHipaaSettings,
): string[] {
  const lines: string[] = [];
  if (previous.enabled !== next.enabled) {
    lines.push(`HIPAA mode: ${next.enabled ? 'enabled' : 'disabled'}`);
  }
  if (previous.sessionTimeoutMinutes !== next.sessionTimeoutMinutes) {
    lines.push(
      `Session timeout: ${previous.sessionTimeoutMinutes} → ${next.sessionTimeoutMinutes} minutes`,
    );
  }
  return lines;
}

export function formatComplianceStatusSummary(
  settings: Record<string, unknown> | undefined,
  businessType: string | null | undefined,
  aspect: ParsedExplainComplianceStatus['aspect'] = 'all',
): string {
  const privacy = readBusinessPrivacySettings(settings);
  const status = buildComplianceStatusSummary(settings, businessType);
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'gdpr') {
    parts.push(
      `GDPR checklist: cookie banner ${status.gdpr.cookieBannerEnabled ? 'on' : 'off'}, granular consent ${status.gdpr.granularConsentEnabled ? 'on' : 'off'}, privacy policy v${status.gdpr.privacyPolicyVersion}, data residency ${status.gdpr.dataResidencyRegion}.`,
    );
  }

  if (aspect === 'all' || aspect === 'retention') {
    const retention = privacy.retention;
    parts.push(
      `Retention periods: customer PII ${retention.customerPiiDays} days, booking history ${retention.bookingHistoryDays} days, AI command logs ${retention.aiCommandLogsDays} days, audit logs ${retention.auditLogsDays} days.`,
    );
  }

  if (aspect === 'all' || aspect === 'hipaa') {
    if (status.hipaa.eligible) {
      parts.push(
        `HIPAA/BAA: ${status.hipaa.enabled ? 'enabled' : 'disabled'}, BAA ${status.hipaa.baaSigned ? 'signed' : 'not signed'}, session timeout ${status.hipaa.sessionTimeoutMinutes} min${status.hipaa.sessionTimeoutEnforced ? ' (enforced)' : ''}, PHI encryption ${status.hipaa.phiEncryptionConfigured ? 'configured' : 'not configured'}.`,
      );
    } else {
      parts.push('HIPAA/BAA: not eligible for this business type.');
    }
  }

  if (aspect === 'all' || aspect === 'sub_processors') {
    const list = SUB_PROCESSORS.map(
      (processor) =>
        `${processor.name} (${processor.purpose}; ${processor.region})`,
    ).join('; ');
    parts.push(`Sub-processors: ${list}.`);
  }

  return parts.join(' ');
}

export function formatSubProcessorsList(article28 = false): string {
  const prefix = article28
    ? 'Article 28 data processors (sub-processors): '
    : 'Data sub-processors: ';
  const list = SUB_PROCESSORS.map(
    (processor) =>
      `${processor.name} — ${processor.purpose}; data: ${processor.dataTypes.join(', ')}; region: ${processor.region}`,
  ).join('; ');
  return `${prefix}${list}.`;
}

export function collectGdprMissingItems(
  settings: Record<string, unknown> | undefined,
): string[] {
  const status = buildComplianceStatusSummary(settings);
  const privacy = readBusinessPrivacySettings(settings);
  const missing: string[] = [];

  if (!status.gdpr.cookieBannerEnabled) {
    missing.push('cookie banner on the public booking page');
  }
  if (!status.gdpr.granularConsentEnabled) {
    missing.push(
      'granular consent at checkout (AI processing and/or third-party integrations)',
    );
  }
  if (privacy.cookieBanner.enabled && !privacy.cookieBanner.message.trim()) {
    missing.push('cookie banner message text');
  }

  return missing;
}

export function formatGdprChecklistSummary(
  settings: Record<string, unknown> | undefined,
  aspect: ParsedExplainGdprChecklist['aspect'] = 'checklist',
): string {
  const status = buildComplianceStatusSummary(settings);
  const privacy = readBusinessPrivacySettings(settings);
  const missing = collectGdprMissingItems(settings);
  const checklistLine = formatComplianceStatusSummary(
    settings,
    typeof settings?.businessType === 'string' ? settings.businessType : null,
    'gdpr',
  );

  if (aspect === 'missing') {
    if (missing.length === 0) {
      return 'No outstanding GDPR privacy checklist items — cookie banner, granular consent, privacy policy version, and data residency are configured.';
    }
    return `Privacy items still missing: ${missing.join('; ')}.`;
  }

  if (aspect === 'compliance') {
    if (missing.length === 0) {
      return `Yes — core GDPR privacy controls look configured. ${checklistLine}`;
    }
    return `Not fully — address these privacy items: ${missing.join('; ')}. ${checklistLine}`;
  }

  const missingSuffix =
    missing.length > 0
      ? ` Still missing: ${missing.join('; ')}.`
      : ' All core checklist items are configured.';
  return `${checklistLine}${missingSuffix} Retention: customer PII ${privacy.retention.customerPiiDays} days, booking history ${privacy.retention.bookingHistoryDays} days.`;
}

export function isExplainEnterpriseTrustPrompt(prompt: string): boolean {
  return /\b(enterprise\s+trust|dpa|data\s+processing\s+agreement|security\s+one[- ]?pager|trust\s+(?:documents?|center)|eu\s+representative|dpo\b)\b/i.test(
    prompt,
  );
}

export function parseExplainEnterpriseTrustFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: 'settings' | 'documents' | 'security' } | null {
  if (
    typeof params.aspect === 'string' &&
    ['settings', 'documents', 'security'].includes(params.aspect)
  ) {
    return { aspect: params.aspect as 'settings' | 'documents' | 'security' };
  }
  if (!isExplainEnterpriseTrustPrompt(prompt)) return null;
  if (
    /\b(dpa|data\s+processing\s+agreement|privacy\s+policy|documents?)\b/i.test(
      prompt,
    )
  ) {
    return { aspect: 'documents' };
  }
  if (/\bsecurity\s+one[- ]?pager\b/i.test(prompt)) {
    return { aspect: 'security' };
  }
  return { aspect: 'settings' };
}

export function isExplainStrategyEvalPrompt(prompt: string): boolean {
  return /\b(hipaa\s+(?:readiness|decision|eval)|marketplace\s+(?:positioning|decision|eval)|strategy\s+eval|business\s+associate\s+agreement\s+decision)\b/i.test(
    prompt,
  );
}

export function parseExplainStrategyEvalFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: 'hipaa' | 'marketplace' | 'all' } | null {
  if (
    typeof params.aspect === 'string' &&
    ['hipaa', 'marketplace', 'all'].includes(params.aspect)
  ) {
    return { aspect: params.aspect as 'hipaa' | 'marketplace' | 'all' };
  }
  if (!isExplainStrategyEvalPrompt(prompt)) return null;
  if (/\bhipaa\b/i.test(prompt) && !/\bmarketplace\b/i.test(prompt)) {
    return { aspect: 'hipaa' };
  }
  if (/\bmarketplace\b/i.test(prompt) && !/\bhipaa\b/i.test(prompt)) {
    return { aspect: 'marketplace' };
  }
  return { aspect: 'all' };
}

export function isUpdateStrategyEvalPrompt(prompt: string): boolean {
  return (
    isExplainStrategyEvalPrompt(prompt) &&
    /\b(submit|record|save|set|decide|update)\b/i.test(prompt)
  );
}
