import type { GuideResponse } from '../command-completion.types.js';
import type {
  GuideSupportHandoff,
  GuideSupportHandoffContext,
  GuideSupportSnapshot,
  GuideSupportTicketPayload,
} from './guide-support-handoff.types.js';
import { GUIDE_SUPPORT_SNAPSHOT_PII_KEYS } from './guide-support-handoff.fixtures.js';

const GUIDE_SUPPORT_HANDOFF_LABEL = 'Still stuck?';

const VALID_SURFACES = new Set(['dashboard', 'provider', 'customer', 'public']);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sanitizeRoute(route?: string): string | undefined {
  if (!route?.trim()) return undefined;
  const trimmed = route.trim();
  if (trimmed.length > 240) return trimmed.slice(0, 240);
  return trimmed;
}

function sanitizeTopicId(topicId?: string): string | undefined {
  if (!topicId?.trim()) return undefined;
  const trimmed = topicId.trim();
  if (trimmed.length > 120) return trimmed.slice(0, 120);
  return trimmed;
}

function sanitizeLocale(locale: string): string {
  const trimmed = locale.trim().toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2})?$/.test(trimmed)) return trimmed;
  return 'en';
}

/** Build a non-PII guide support snapshot (ai-guide-1.7.2). */
export function buildGuideSupportSnapshot(
  context: GuideSupportHandoffContext,
): GuideSupportSnapshot {
  return {
    surface: context.surface,
    locale: sanitizeLocale(context.locale),
    ...(sanitizeRoute(context.route)
      ? { route: sanitizeRoute(context.route) }
      : {}),
    ...(sanitizeTopicId(context.topicId)
      ? { topicId: sanitizeTopicId(context.topicId) }
      : {}),
  };
}

export function buildGuideSupportTicketSubject(
  snapshot: GuideSupportSnapshot,
): string {
  const topic = snapshot.topicId ? ` — ${snapshot.topicId}` : '';
  return `Product guide help${topic} (${snapshot.surface})`;
}

/** Ticket body with structured snapshot only — no user prompt or PII (ai-guide-1.7.2). */
export function formatGuideSupportTicketBody(
  snapshot: GuideSupportSnapshot,
): string {
  const lines = [
    'Product guide support handoff (no PII)',
    '',
    `Surface: ${snapshot.surface}`,
    `Locale: ${snapshot.locale}`,
  ];
  if (snapshot.route) lines.push(`Route: ${snapshot.route}`);
  if (snapshot.topicId) lines.push(`Topic: ${snapshot.topicId}`);
  lines.push('', 'The user finished the in-app guide and still needs help.');
  return lines.join('\n');
}

export function buildGuideSupportTicketTags(
  snapshot: GuideSupportSnapshot,
): readonly string[] {
  return [
    'optischedule',
    'product-guide',
    `guide-${snapshot.surface}`,
    ...(snapshot.topicId ? [`guide-topic-${snapshot.topicId}`] : []),
  ];
}

export function buildGuideSupportTicketPayload(
  snapshot: GuideSupportSnapshot,
): GuideSupportTicketPayload {
  return {
    subject: buildGuideSupportTicketSubject(snapshot),
    body: formatGuideSupportTicketBody(snapshot),
    tags: buildGuideSupportTicketTags(snapshot),
  };
}

export function buildGuideSupportHandoff(
  context: GuideSupportHandoffContext,
): GuideSupportHandoff {
  const snapshot = buildGuideSupportSnapshot(context);
  return {
    action: 'create_support_ticket',
    label: GUIDE_SUPPORT_HANDOFF_LABEL,
    snapshot,
    ticket: buildGuideSupportTicketPayload(snapshot),
  };
}

/** Parse params.guideSnapshot from create_support_ticket — rejects unknown/PII keys. */
export function parseGuideSupportSnapshot(
  value: unknown,
): GuideSupportSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  for (const key of GUIDE_SUPPORT_SNAPSHOT_PII_KEYS) {
    if (key in row) return null;
  }
  const surface = readString(row.surface);
  if (!surface || !VALID_SURFACES.has(surface)) return null;
  const locale = readString(row.locale);
  if (!locale) return null;
  return buildGuideSupportSnapshot({
    surface: surface as GuideSupportSnapshot['surface'],
    locale,
    route: readString(row.route),
    topicId: readString(row.topicId),
  });
}

export function guideSupportHandoffsEqual(
  left: GuideSupportHandoff | undefined,
  right: GuideSupportHandoff | undefined,
): boolean {
  if (!left || !right) return false;
  return (
    left.action === right.action &&
    left.label === right.label &&
    left.snapshot.surface === right.snapshot.surface &&
    left.snapshot.locale === right.snapshot.locale &&
    left.snapshot.route === right.snapshot.route &&
    left.snapshot.topicId === right.snapshot.topicId &&
    left.ticket.subject === right.ticket.subject &&
    left.ticket.body === right.ticket.body &&
    left.ticket.tags.join('|') === right.ticket.tags.join('|')
  );
}

/** Attach Still stuck? support handoff to guide responses (ai-guide-1.7.2). */
export function enrichGuideResponseSupportHandoff(
  guide: GuideResponse,
  context: GuideSupportHandoffContext,
): GuideResponse {
  const handoff = buildGuideSupportHandoff({
    ...context,
    topicId: context.topicId ?? guide.topicId,
  });
  if (guideSupportHandoffsEqual(guide.supportHandoff, handoff)) {
    return guide;
  }
  return { ...guide, supportHandoff: handoff };
}
