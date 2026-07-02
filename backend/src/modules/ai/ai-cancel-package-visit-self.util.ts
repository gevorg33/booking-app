import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { hasDashboardCustomerReference } from './ai-customer-crm.util.js';
import { isCancelPackageRebookSingleCompoundCandidate } from './ai-cancel-package-rebook-single-cue.util.js';
import {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  type CancelPackageVisitSelfPromptFixture,
} from './ai-cancel-package-visit-self.fixtures.js';
import { CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-visit-self-multilingual.fixtures.js';

export const CANCEL_PACKAGE_VISIT_SELF_INTENTS = [
  'cancel_package_visit_self',
] as const;

export type CancelPackageVisitSelfIntent =
  (typeof CANCEL_PACKAGE_VISIT_SELF_INTENTS)[number];

export {
  CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CANCEL_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
} from './ai-cancel-package-visit-self.fixtures.js';

export interface ParsedCancelPackageVisitSelfRequest {
  packageName?: string;
  visitIndex?: number;
  bookingId?: string;
}

const TERMINAL_PACKAGE_VISIT_STATUSES = new Set([
  'cancelled',
  'completed',
  'no_show',
]);

function matchCancelPackageVisitSelfScenario(
  prompt: string,
): CancelPackageVisitSelfPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of CANCEL_PACKAGE_VISIT_SELF_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

function extractPackageNameFromPrompt(prompt: string): string | undefined {
  if (/\bspa\s+day\b/i.test(prompt)) return 'Spa Day';
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  const named = prompt.match(
    /\b(?:book|reserve|schedule|check)\s+(?:the\s+)?([a-z][\w\s-]{2,30}?)\s+package\b/i,
  );
  if (named?.[1]) return named[1].trim();
  return undefined;
}

export function extractPackageVisitIndexFromPrompt(
  prompt: string,
): number | undefined {
  const visitOf = prompt.match(/\bvisit\s+(\d+)\s+of\s+my\b/i);
  if (visitOf) return parseInt(visitOf[1], 10);
  const packageVisitN = prompt.match(/\bpackage\s+visit\s+(\d+)\b/i);
  if (packageVisitN) return parseInt(packageVisitN[1], 10);
  const visitOn = prompt.match(/\bvisit\s+(\d+)\s+on\s+my\b/i);
  if (visitOn) return parseInt(visitOn[1], 10);
  const changeVisitN = prompt.match(/\bchange\s+package\s+visit\s+(\d+)\b/i);
  if (changeVisitN) return parseInt(changeVisitN[1], 10);
  const ruVisit = prompt.match(/(?:пакетн(?:ый|ого)?\s+)?визит\s+(\d+)/i);
  if (ruVisit) return parseInt(ruVisit[1], 10);
  return undefined;
}

export function isCancelPackageVisitSelfIntent(
  action: string,
): action is CancelPackageVisitSelfIntent {
  return (CANCEL_PACKAGE_VISIT_SELF_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isCancelPackageVisitSelfPrompt(prompt: string): boolean {
  if (isCancelPackageRebookSingleCompoundCandidate(prompt)) return false;
  if (matchCancelPackageVisitSelfScenario(prompt)) return true;

  const packageContext =
    /\b(package\s+visit|spa\s+day|package\s+appointment|package\s+bundle)\b/i.test(
      prompt,
    ) ||
    (/\bpackage\b/i.test(prompt) && /\b(visit|appointment)\b/i.test(prompt)) ||
    /\bmy\s+package\b/i.test(prompt) ||
    /(spa day|package visit|package appointment)/i.test(prompt);

  const selfScope =
    /\bmy\b/i.test(prompt) ||
    /\bthis\b/i.test(prompt) ||
    /\b(next|upcoming)\s+package\b/i.test(prompt) ||
    /\bvisit\s+\d+\s+of\s+my\b/i.test(prompt) ||
    /\bvisit\s+\d+\s+on\s+my\b/i.test(prompt) ||
    /\bpackage\s+visit\s+\d+\b/i.test(prompt) ||
    /(?:իմ|այս)/i.test(prompt) ||
    /(?:мою|моя|мой|эту|это)/i.test(prompt);

  const cancelIntent =
    (/\b(cancel|skip)\b/i.test(prompt) &&
      !/\b(cancel\s+policy|cancellation\s+policy)\b/i.test(prompt) &&
      !/\b(can\s+i|am\s+i|will\s+i|do\s+i|what\s+(?:are|is|happens)|explain|rules?|policy|terms?|keep\s+the\s+package|lose)\b/i.test(
        prompt,
      )) ||
    (/(չեղարկ|չեղարկել)/i.test(prompt) && /(իմ|այս)/i.test(prompt)) ||
    (/(отмен|отменить|отмени|пропуст)/i.test(prompt) &&
      /(мою|моя|мой|эту|это|следующ)/i.test(prompt)) ||
    (/բաց\s+թող/i.test(prompt) && /(իմ|package|visit)/i.test(prompt));

  return (
    packageContext &&
    selfScope &&
    cancelIntent &&
    (!hasDashboardCustomerReference(prompt) ||
      /\b(my|I\s+booked)\b/i.test(prompt))
  );
}

export function parseCancelPackageVisitSelfFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedCancelPackageVisitSelfRequest | null {
  if (!isCancelPackageVisitSelfPrompt(prompt)) return null;

  const scenario = matchCancelPackageVisitSelfScenario(prompt);
  const enriched = enrichCancelPackageVisitSelfParamsFromPrompt(params, prompt);

  return {
    packageName:
      (typeof enriched.packageName === 'string'
        ? enriched.packageName
        : undefined) ?? scenario?.packageName,
    visitIndex:
      typeof enriched.visitIndex === 'number'
        ? enriched.visitIndex
        : scenario?.visitIndex,
    bookingId:
      typeof enriched.bookingId === 'string' ? enriched.bookingId : undefined,
  };
}

export function enrichCancelPackageVisitSelfParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = enrichCancelMyBookingParamsFromPrompt(params, prompt);
  if (!next.packageName) {
    const packageName = extractPackageNameFromPrompt(prompt);
    if (packageName) next.packageName = packageName;
  }
  if (!next.bookingId) {
    const bookingId = extractBookingIdFromPrompt(prompt);
    if (bookingId) next.bookingId = bookingId;
  }
  if (next.visitIndex == null) {
    const visitIndex = extractPackageVisitIndexFromPrompt(prompt);
    if (visitIndex != null) next.visitIndex = visitIndex;
  }
  return next;
}

export type CustomerOwnedPackageVisitMatchInput = {
  id: string;
  status: string;
  startTime: string;
  packagePurchaseId?: string | null;
  packageName?: string | null;
  serviceName: string;
};

export function matchCustomerOwnedPackageVisit<
  T extends CustomerOwnedPackageVisitMatchInput,
>(
  bookings: T[],
  params: Record<string, unknown>,
): { booking: T | null; ambiguous: T[] } {
  const now = new Date();
  let candidates = bookings.filter(
    (row) =>
      row.packagePurchaseId &&
      !TERMINAL_PACKAGE_VISIT_STATUSES.has(row.status.toLowerCase()) &&
      new Date(row.startTime) >= now,
  );

  if (params.bookingId) {
    const bookingId = String(params.bookingId);
    const found =
      candidates.find((row) => row.id === bookingId) ??
      candidates.find((row) => row.id.startsWith(bookingId));
    return { booking: found ?? null, ambiguous: [] };
  }

  const packageName = (params.packageName as string | undefined)?.trim();
  if (packageName) {
    const needle = packageName.toLowerCase();
    candidates = candidates.filter((row) =>
      (row.packageName ?? row.serviceName ?? '').toLowerCase().includes(needle),
    );
  }

  if (params.visitIndex != null) {
    const visitIndex = Number(params.visitIndex);
    const byPurchase = new Map<string, T[]>();
    for (const row of candidates) {
      const key = row.packagePurchaseId!;
      const rows = byPurchase.get(key) ?? [];
      rows.push(row);
      byPurchase.set(key, rows);
    }
    const indexed: T[] = [];
    for (const rows of byPurchase.values()) {
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      const pick = sorted[visitIndex - 1];
      if (pick) indexed.push(pick);
    }
    if (indexed.length) {
      candidates = indexed;
    }
  }

  if (candidates.length === 1) {
    return { booking: candidates[0], ambiguous: [] };
  }
  if (candidates.length > 1) {
    return { booking: null, ambiguous: candidates };
  }
  return { booking: null, ambiguous: [] };
}

export function buildCancelPackageVisitSelfAmbiguousSummary(
  bookings: CustomerOwnedPackageVisitMatchInput[],
): string {
  const lines = bookings.slice(0, 3).map((row) => {
    const when = row.startTime.slice(0, 16).replace('T', ' ');
    const label = row.packageName ?? row.serviceName ?? 'Package visit';
    return `${label} — ${when}`;
  });
  return `You have several upcoming package visits — specify which one to cancel: ${lines.join('; ')}.`;
}

export function rescueCancelPackageVisitSelfIntent(
  prompt: string,
  action: string,
): { action: CancelPackageVisitSelfIntent; rescueReason: string } | null {
  if (isCancelPackageVisitSelfIntent(action)) return null;
  if (!parseCancelPackageVisitSelfFromPrompt(prompt)) return null;
  return {
    action: 'cancel_package_visit_self',
    rescueReason: 'cancel_package_self',
  };
}

export function buildCancelPackageVisitSelfNavigate(bookingId?: string): {
  path: string;
  query: Record<string, string>;
} {
  return {
    path: '/account',
    query: bookingId
      ? { tab: 'bookings', cancelPackageVisit: bookingId }
      : { tab: 'bookings' },
  };
}
