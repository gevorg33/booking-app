import { PrepaymentMode } from '../service/entities/service.entity.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';
import {
  computeServiceDepositAmount,
  parseDepositPercent,
} from './ai-service-online-payment.util.js';

export const CREATE_SERVICE_PREPAYMENT_CLASSIFIER_RULES = `- create_service prepayment on create (ai-cmd-ext-5.2): when adding ONE new catalog service, set prepaymentMode (none|full|deposit) and/or depositPercent when the user states online payment policy on the new row. Triggers: add/create/register/new service/offering + price/duration + full prepayment|deposit prepayment|50% prepayment|no online prepayment|cash only. depositPercent for non-50% percentages; omit or null for default 50% deposit. NOT configure_service_online_payment (mutate existing services / all services scope), NOT configure_service_deposit_policy (tier/featured/category deposit policy), NOT configure_checkout_defaults (defaults for future services).
- Examples:
  - "Add massage 60 minutes $80 with 50% online prepayment" → create_service, prepaymentMode=deposit, depositPercent=50
  - "Create service Facemassage 60min $50 with full prepayment" → create_service, prepaymentMode=full
  - "Add haircut 30 min $35, no online prepayment" → create_service, prepaymentMode=none
- create_services prepayment on bulk create (ai-cmd-ext-5.3): same prepaymentMode/depositPercent/depositAmount as create_service but per row in services[]. Global policy: trailing "— all with 50% online prepayment" or leading "Add these services with full prepayment:". Per-row overrides in each comma-separated line ("facemassage 60min $50 full prepayment, haircut 30min $25 no prepayment"). NOT configure_service_online_payment (existing catalog scope), NOT import_services_from_menu (OCR review flow).
- Examples:
  - "Add services: facemassage 60min $50, haircut 30min $25 — all with 50% online prepayment" → create_services, each row prepaymentMode=deposit, depositPercent=50
  - "Add services: massage 60min $80 full prepayment, facial 45min $60 no online prepayment" → create_services, per-row prepaymentMode full|none`;

const CREATE_SERVICE_CUE =
  /\b(?:create|add|register|offer|introduce|set\s+up)\s+(?:a\s+)?(?:new\s+)?(?:service|offering|treatment)s?\b/i;
const SHORT_ADD_CUE =
  /\badd\s+(?:a\s+)?(?:new\s+)?[a-z]/i;

export type ParsedCreateServicePrepayment = {
  prepaymentMode?: 'none' | 'full' | 'deposit';
  depositPercent?: number | null;
  depositAmount?: number;
};

function hasPrepaymentPolicyCue(prompt: string): boolean {
  return (
    /\b(?:online\s+payment|online\s+prepayment|prepayment|pay(?:ing)?(?:\s+for)?\s+online|deposit\s+prepayment|full\s+prepayment|cash[\s-]?only)\b/i.test(
      prompt,
    ) ||
    /\b(?:no|without)\s+online\s+prepayment\b/i.test(prompt) ||
    /\b\d{1,3}\s*%\s*(?:deposit|prepayment|pre[-\s]?pay)\b/i.test(prompt)
  );
}

function hasCreateServiceCue(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (CREATE_SERVICE_CUE.test(text)) return true;
  return (
    SHORT_ADD_CUE.test(text) &&
    (/\$\s*\d/.test(text) || /\b\d+\s*(?:min(?:ute)?s?|m)\b/i.test(text))
  );
}

function isConfigureExistingServicesScope(prompt: string): boolean {
  return (
    /\b(?:all|every|each|existing|catalog)\s+services?\b/i.test(prompt) ||
    (/\b(?:accept|enable|configure|decline|disable|set|require)\b/i.test(
      prompt,
    ) &&
      /\b(?:online\s+payment|online\s+prepayment)\b/i.test(prompt) &&
      !/\b(?:create|add|register|offer|introduce)\s+(?:a\s+)?(?:new\s+)?(?:service|offering)\b/i.test(
        prompt,
      ) &&
      !SHORT_ADD_CUE.test(prompt))
  );
}

function normalizePrepaymentModeParam(
  value: unknown,
): ParsedCreateServicePrepayment['prepaymentMode'] | undefined {
  if (value === 'none' || value === 'full' || value === 'deposit') {
    return value;
  }
  return undefined;
}

function parseCreateServiceDepositPercent(prompt: string): number | undefined {
  const pct = parseDepositPercent(prompt);
  if (typeof pct === 'number' && pct > 0 && pct < 100) return pct;

  const inline = prompt.match(
    /\b(\d{1,2})\s*%\s+(?:online\s+)?(?:deposit\s+)?prepayment\b/i,
  );
  if (inline) return Number.parseInt(inline[1], 10);

  if (
    /\b(?:half|50\s*%)\b/i.test(prompt) &&
    /\b(?:deposit|prepayment|pre[-\s]?pay|online)\b/i.test(prompt)
  ) {
    return 50;
  }

  return undefined;
}

function parseCreateServiceFixedDepositAmount(prompt: string): number | undefined {
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s+deposit\b/i,
    /\bdeposit\s+(?:of\s+)?\$(\d+(?:\.\d+)?)/i,
    /\b\$(\d+(?:\.\d+)?)\s+deposit\s+prepayment/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return Number.parseFloat(match[1]);
  }
  return undefined;
}

function parsePrepaymentModeFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): ParsedCreateServicePrepayment['prepaymentMode'] | undefined {
  const fromParams = normalizePrepaymentModeParam(params.prepaymentMode);
  if (fromParams) return fromParams;

  const text = prompt.trim();
  if (!text) return undefined;

  if (
    /\b(?:no|without)\s+online\s+prepayment\b/i.test(text) ||
    /\bcash[\s-]?only\b/i.test(text) ||
    (/\b(?:no|without)\s+online\s+payment\b/i.test(text) &&
      /\b(?:public\s+booking|on\s+public)\b/i.test(text))
  ) {
    return 'none';
  }

  const depositPct = parseDepositPercent(text);
  if (depositPct === 100) {
    return 'full';
  }

  if (
    (/\bfull\s+prepayment\b/i.test(text) ||
      /\bpay\s+in\s+full\b/i.test(text) ||
      /\b100\s*%\s*prepayment\b/i.test(text)) &&
    /\b(?:prepayment|online\s+payment)\b/i.test(text)
  ) {
    return 'full';
  }

  if (depositPct != null && depositPct < 100) {
    return 'deposit';
  }

  if (
    /\b(?:deposit|prepayment|pre[-\s]?pay|partial|half)\b/i.test(text) &&
    !/\bfull\s+prepayment\b/i.test(text) &&
    !/\bpay\s+in\s+full\b/i.test(text)
  ) {
    return 'deposit';
  }

  if (
    /\b(?:require|requiring|accept|accepting)\b/i.test(text) &&
    /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(text) &&
    !/\b(?:don'?t|do\s+not|without|missing|still)\b/i.test(text)
  ) {
    return 'full';
  }

  if (
    /\b(?:requiring|require)\b/i.test(text) &&
    /\bonline\s+payment\b/i.test(text)
  ) {
    return 'full';
  }

  return undefined;
}

export function parseCreateServicePrepaymentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedCreateServicePrepayment | null {
  const parsed: ParsedCreateServicePrepayment = {};
  const prepaymentMode = parsePrepaymentModeFromPrompt(prompt, params);
  if (prepaymentMode) parsed.prepaymentMode = prepaymentMode;

  if (typeof params.depositPercent === 'number') {
    parsed.depositPercent = params.depositPercent;
  } else if (params.depositPercent === null) {
    parsed.depositPercent = null;
  } else if (parsed.prepaymentMode === 'deposit') {
    const pct = parseCreateServiceDepositPercent(prompt);
    if (pct != null) parsed.depositPercent = pct;
  }

  const fixedDeposit =
    typeof params.depositAmount === 'number'
      ? params.depositAmount
      : parseCreateServiceFixedDepositAmount(prompt);
  if (fixedDeposit != null && fixedDeposit > 0) {
    parsed.depositAmount = fixedDeposit;
  }

  if (!parsed.prepaymentMode) {
    return Object.keys(parsed).length ? parsed : null;
  }

  return parsed;
}

const CREATE_SERVICES_CUE =
  /\b(?:add|create|register)\s+(?:these\s+|following\s+)?services?\s*:/i;
const BULK_SERVICE_SEGMENT =
  /([^,;]+?\d+\s*(?:m|min(?:ute)?s?)\s*(?:\$|USD\s*)?\d+(?:\.\d{1,2})?[^,;]*)/gi;

export function hasCreateServicesCue(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (CREATE_SERVICES_CUE.test(text)) return true;
  if (splitBulkCreateServiceSegments(text).length >= 2) return true;
  if (
    /\b(?:add|create)\s+(?:these|following)\s+services?\b/i.test(text) &&
    /\d+\s*(?:min(?:ute)?s?|m)\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

export function splitBulkCreateServiceSegments(prompt: string): string[] {
  const { body } = stripBulkPrepaymentAffixes(prompt);
  const afterColon = body.match(/\bservices?\s*:\s*(.+)$/i)?.[1] ?? body;
  const segments: string[] = [];
  const re = new RegExp(BULK_SERVICE_SEGMENT.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(afterColon)) !== null) {
    segments.push(match[1].trim());
  }
  return segments;
}

function stripBulkPrepaymentAffixes(prompt: string): {
  body: string;
  globalPrompt: string;
} {
  const suffix = prompt.match(
    /^(.+?)(?:\s*[-—–]\s*)\s*((?:all|each)\s+(?:services?\s+)?(?:(?:with|requiring)\s+)?.+)$/i,
  );
  if (suffix) {
    return {
      body: suffix[1].trim(),
      globalPrompt: suffix[2].trim(),
    };
  }

  const prefix = prompt.match(
    /^(?:add|create|register)\s+(?:these\s+|following\s+)?services?\s+with\s+(.+?)\s*:\s*(.+)$/i,
  );
  if (prefix) {
    return {
      body: prefix[2].trim(),
      globalPrompt: prefix[1].trim(),
    };
  }

  return { body: prompt, globalPrompt: '' };
}

function matchBulkServiceSegment(
  segments: string[],
  serviceName: string,
): string | undefined {
  const normalized = serviceName.trim().toLowerCase();
  return segments.find((segment) =>
    segment.toLowerCase().includes(normalized),
  );
}

function parseBulkServiceRowFromSegment(
  segment: string,
): Record<string, unknown> | null {
  const match = segment.match(
    /^(.+?)\s+(\d+)\s*(?:m|min(?:ute)?s?)\s*(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)/i,
  );
  if (!match) return null;
  const serviceName = match[1].replace(/^[\s:-]+|[\s:-]+$/g, '').trim();
  if (!serviceName) return null;
  return {
    serviceName,
    durationMinutes: Math.max(10, Number.parseInt(match[2], 10)),
    price: Number.parseFloat(match[3]),
  };
}

export function enrichCreateServicesPrepaymentParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const { globalPrompt } = stripBulkPrepaymentAffixes(prompt);
  const globalParsed = parseCreateServicePrepaymentFromPrompt(
    globalPrompt ||
      (/\b(?:all|each)\s+requiring\s+online\s+payment\b/i.test(prompt)
        ? 'requiring online payment on public booking'
        : prompt),
    params,
  );
  const segments = splitBulkCreateServiceSegments(prompt);
  let rows = Array.isArray(params.services) ? params.services : [];

  if (rows.length === 0 && segments.length >= 2) {
    rows = segments
      .map((segment) => parseBulkServiceRowFromSegment(segment))
      .filter((row): row is Record<string, unknown> => row != null);
  }

  if (rows.length === 0) {
    return enrichCreateServicePrepaymentParamsFromPrompt(
      params,
      globalPrompt || prompt,
    );
  }

  const enrichedRows = rows.map((row, index) => {
    const rowObj =
      row && typeof row === 'object'
        ? ({ ...(row as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    const serviceName = String(rowObj.serviceName ?? rowObj.name ?? '').trim();
    const segment =
      segments[index] ??
      (serviceName ? matchBulkServiceSegment(segments, serviceName) : undefined) ??
      prompt;
    const rowParsed = parseCreateServicePrepaymentFromPrompt(segment, rowObj);
    return {
      ...rowObj,
      ...(globalParsed?.prepaymentMode
        ? { prepaymentMode: globalParsed.prepaymentMode }
        : {}),
      ...(globalParsed?.depositPercent !== undefined
        ? { depositPercent: globalParsed.depositPercent }
        : {}),
      ...(globalParsed?.depositAmount != null
        ? { depositAmount: globalParsed.depositAmount }
        : {}),
      ...(rowParsed?.prepaymentMode
        ? { prepaymentMode: rowParsed.prepaymentMode }
        : {}),
      ...(rowParsed?.depositPercent !== undefined
        ? { depositPercent: rowParsed.depositPercent }
        : {}),
      ...(rowParsed?.depositAmount != null
        ? { depositAmount: rowParsed.depositAmount }
        : {}),
    };
  });

  return {
    ...params,
    ...(globalParsed?.prepaymentMode && enrichedRows.every((row) => !row.prepaymentMode)
      ? { prepaymentMode: globalParsed.prepaymentMode }
      : {}),
    services: enrichedRows,
  };
}

export function isCreateServicesPrepaymentPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text || !hasCreateServicesCue(text) || !hasPrepaymentPolicyCue(text)) {
    return false;
  }
  if (isConfigureExistingServicesScope(text)) return false;
  if (
    isConfigureServiceDepositPolicyPrompt(text) &&
    /\bdeposit\s+policy\b/i.test(text)
  ) {
    return false;
  }

  const { globalPrompt } = stripBulkPrepaymentAffixes(text);
  if (
    globalPrompt &&
    parseCreateServicePrepaymentFromPrompt(globalPrompt, {})?.prepaymentMode
  ) {
    return true;
  }

  if (
    /\b(?:all|each)\s+requiring\s+online\s+payment\b/i.test(text) &&
    hasCreateServicesCue(text)
  ) {
    return true;
  }

  return splitBulkCreateServiceSegments(text).some(
    (segment) => !!parseCreateServicePrepaymentFromPrompt(segment, {})?.prepaymentMode,
  );
}

export function isCreateServicePrepaymentPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (hasCreateServicesCue(text)) return false;
  if (!text || !hasCreateServiceCue(text) || !hasPrepaymentPolicyCue(text)) {
    return false;
  }
  if (isConfigureExistingServicesScope(text)) return false;
  if (
    isConfigureServiceDepositPolicyPrompt(text) &&
    /\bdeposit\s+policy\b/i.test(text)
  ) {
    return false;
  }
  return !!parseCreateServicePrepaymentFromPrompt(text, {})?.prepaymentMode;
}

export function enrichCreateServicePrepaymentParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseCreateServicePrepaymentFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.prepaymentMode ? { prepaymentMode: parsed.prepaymentMode } : {}),
    ...(parsed.depositPercent !== undefined
      ? { depositPercent: parsed.depositPercent }
      : {}),
    ...(parsed.depositAmount != null
      ? { depositAmount: parsed.depositAmount }
      : {}),
  };
}

export function buildCreateServicePrepaymentFields(
  params: Record<string, unknown>,
  prompt: string | undefined,
  price: number,
): { prepaymentMode?: PrepaymentMode; depositAmount?: number } {
  const parsed = parseCreateServicePrepaymentFromPrompt(prompt ?? '', params);
  if (!parsed?.prepaymentMode) return {};

  const prepaymentMode = parsed.prepaymentMode as PrepaymentMode;
  if (prepaymentMode === PrepaymentMode.NONE) {
    return { prepaymentMode: PrepaymentMode.NONE };
  }
  if (prepaymentMode === PrepaymentMode.FULL) {
    return { prepaymentMode: PrepaymentMode.FULL };
  }

  const depositAmount = computeServiceDepositAmount(price, {
    prepaymentMode: PrepaymentMode.DEPOSIT,
    allServices: false,
    depositPercent: parsed.depositPercent ?? undefined,
    depositAmount: parsed.depositAmount,
  });

  return {
    prepaymentMode: PrepaymentMode.DEPOSIT,
    ...(depositAmount != null ? { depositAmount } : {}),
  };
}

export function rescueCreateServicesPrepaymentIntent(
  prompt: string,
  action: string,
): { action: 'create_services'; rescueReason: string } | null {
  if (action === 'create_services') return null;
  if (!isCreateServicesPrepaymentPrompt(prompt)) return null;
  return {
    action: 'create_services',
    rescueReason: 'create_services_prepayment',
  };
}

export function rescueCreateServicePrepaymentIntent(
  prompt: string,
  action: string,
): {
  action: 'create_service' | 'create_services';
  rescueReason: string;
} | null {
  if (action === 'create_service' || action === 'create_services') return null;

  const bulk = rescueCreateServicesPrepaymentIntent(prompt, action);
  if (bulk) return bulk;

  if (!isCreateServicePrepaymentPrompt(prompt)) return null;
  return {
    action: 'create_service',
    rescueReason: 'create_service_prepayment',
  };
}
