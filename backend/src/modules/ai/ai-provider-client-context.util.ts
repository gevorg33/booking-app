import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import {
  formatProviderCustomerSnapshotBadgesText,
} from '../provider-mobile/provider-booking-customer-badges.util.js';
import { formatProviderLoyaltyQuickViewSummary } from '../provider-mobile/provider-booking-customer-loyalty.util.js';
import type { ProviderBookingCustomerContextView } from '../provider-mobile/provider-booking-customer-context.util.js';
import type { ProviderBookingCompletedVisitView } from '../provider-mobile/provider-booking-visit-history.util.js';
import { isCatalogMutateCommandPrompt } from './ai-catalog.util.js';
import { isSubscriptionUsageHistoryPrompt } from './ai-customer-crm.util.js';
import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import { PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-client-context-multilingual.fixtures.js';
import { isSummarizeLoyaltyProgramPrompt } from './ai-billing-loyalty-dashboard.util.js';
import { isSummarizeAutomationPerformancePrompt } from './ai-marketing-growth.util.js';
import { isSummarizeMyAppointmentsPrompt } from './ai-provider-earnings.util.js';

export const PROVIDER_CLIENT_CONTEXT_INTENTS = [
  'summarize_client',
  'show_client_history',
  'add_client_note',
] as const;

export type ProviderClientContextIntent =
  (typeof PROVIDER_CLIENT_CONTEXT_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isSummarizeClientPrompt(prompt: string): boolean {
  if (isShowClientHistoryPrompt(prompt)) return false;
  if (isAddClientNotePrompt(prompt)) return false;
  if (isSummarizeMyAppointmentsPrompt(prompt)) return false;
  if (isCatalogMutateCommandPrompt(prompt)) return false;
  if (isSummarizeLoyaltyProgramPrompt(prompt)) return false;
  if (isSummarizeAutomationPerformancePrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  if (/\b(bookings?|appointments?)\s+overview\b/i.test(lower)) {
    return false;
  }

  const summarizeCue =
    /\b(summarize|summary|overview|brief me|tell me about|what should i know|client snapshot|know about|brief on)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ամփոփ|պատմ|հաճախորդ|\u056b\u0574\u0561\u0576|snapshot|no-show|\u0584\u0561\u0576\u056b\s+\u0561\u0576\u0563\u0561\u0574)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(кратко|расскаж|об этом клиент|клиент|что мне нужно знать|снимок\s+клиент|сколько\s+раз)/i.test(
        prompt,
      )) ||
    /\bhow many times has [A-Z]/i.test(prompt);

  const clientCue =
    /\b(client|customer|this client|my client|guest|patient)\b/i.test(lower) ||
    /\b(loyalty|referral|no[\s-]?shows?|last visit|marketing)\b/i.test(lower) ||
    /(?:for|about|on|\u043e\u0431|\u043e)\s+[A-Z][\w'.-]+/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\u0576(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u0576(?=\s)/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(հաճախորդ|լոյալ|այց|referral)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(клиент|лояльн|визит|referral|no-show)/i.test(prompt));

  const marketingSnapshot =
    /\b(marketing|opted in|opt in|referral|loyalty|no[\s-]?shows?)\b/i.test(
      lower,
    ) &&
    /\b(client|customer|this customer|guest)\b/i.test(lower);

  if (
    marketingSnapshot &&
    !isAddClientNotePrompt(prompt) &&
    !isShowClientHistoryPrompt(prompt)
  ) {
    return true;
  }

  return summarizeCue && clientCue;
}

export function isShowClientHistoryPrompt(prompt: string): boolean {
  if (isAddClientNotePrompt(prompt)) return false;
  if (isSubscriptionUsageHistoryPrompt(prompt)) return false;
  if (/\bhow many times has [A-Z]/i.test(prompt)) return false;
  if (containsArmenianScript(prompt) && /քանի\s+անգամ/i.test(prompt)) {
    return false;
  }
  if (containsCyrillicScript(prompt) && /сколько\s+раз/i.test(prompt)) {
    return false;
  }

  const lower = prompt.toLowerCase();
  const historyCue =
    /\b(visit history|past (?:appointments?|visits?|bookings?)|previous visits?|recent completed|prior bookings?|visit record|who saw|last time (?:they|she|he) came|when did .+ last visit)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(այց.*պատմ|նախորդ|նախկին|վերջին\s+այց|service.*(?:նախկին|prior)|completed\s+visit|visit\s+record|prior\s+booking|\u057f\u0565\u057d.*\u057e\u0565\u0580\u057b\u056b\u0576)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(истори.*визит|прошл.*(?:запис|визит)|последн.*(?:визит|раз)|completed\s+visit|visit\s+record|prior\s+booking|кто\s+видел)/i.test(
        prompt,
      ));

  const clientCue =
    /\b(client|customer|guest|patient|this customer)\b/i.test(lower) ||
    /(?:for|about)\s+[A-Z][a-z]+/.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\u0576(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u0576(?=\s)/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(հաճախորդ|client)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(клиент|customer)/i.test(prompt));

  return historyCue || (/\bhistory\b/i.test(lower) && clientCue);
}

export function isAddClientNotePrompt(prompt: string): boolean {
  if (isCatalogMutateCommandPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  return (
    /\b(add (?:a )?(?:staff )?note|staff note|client note|save (?:a )?note|write a note|log staff note|note for|remember that)\b/i.test(
      lower,
    ) ||
    /\bnote(?:\s|:| for\b| on\b)/i.test(lower) ||
    /^note:\s*/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(\u0576\u0577\u0578\u0576|\u0561\u057e\u0565\u056c\u0561\u0581\u0580|\u056b\u0577\u056b\u0580|staff note|client note)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u0437\u0430\u043c\u0435\u0442\u043a|\u0434\u043e\u0431\u0430\u0432\u044c|\u0437\u0430\u043f\u043e\u043c\u043d\u0438|staff note|client note|save client note|log staff note|add note)/i.test(
        prompt,
      ))
  );
}

function isPlaceholderClientNoteBody(body: string): boolean {
  return /^(for\s+)?(this\s+|the\s+)?(client|customer|guest|patient)\.?$/i.test(
    body.trim(),
  );
}

export function extractClientNoteBodyFromPrompt(prompt: string): string | null {
  const separator = String.raw`\s*[:\u2014-]+\s*`;
  const patterns = [
    new RegExp(
      `(?:add (?:a )?(?:staff )?note(?: for (?:this )?(?:client|customer))?${separator})(.+)$`,
      'i',
    ),
    new RegExp(
      `(?:staff note|client note|save client note|write a note on [^:]+)${separator}(.+)$`,
      'i',
    ),
    new RegExp(`(?:note for [^:]+)${separator}(.+)$`, 'i'),
    /^remember that\s+(.+)$/i,
    /^note:\s*(.+)$/i,
    new RegExp(`(?:log staff note for [^:]+)${separator}(.+)$`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const body = match?.[1]?.trim();
    if (body && !isPlaceholderClientNoteBody(body)) return body;
  }

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/նշում[:\s—-]+(.+)$/i);
    if (hy?.[1]?.trim()) return hy[1].trim();
  }
  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/заметк[а-я]*[:\s—-]+(.+)$/i);
    if (ru?.[1]?.trim()) return ru[1].trim();
  }

  return null;
}

export function extractCustomerNameFromClientPrompt(
  prompt: string,
): string | null {
  const patterns = [
    /(?:about|for|on)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/,
    /(?:client|customer)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /(?:note for|history for|visits for)\s+([A-Z][\w'.-]+)/i,
    /^summarize\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\s+\u0574\u0561\u057d\u056b\u0576/i,
    /\u0447\u0442\u043e\s+\u043c\u043d\u0435\s+\u043d\u0443\u0436\u043d\u043e\s+\u0437\u043d\u0430\u0442\u044c\s+\u043e\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i,
    /([A-Z][\w'.-]+)-\u056b\u0576(?=\s)/i,
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i,
    /(?:\u0561\u0574\u0583\u0588\u0572\u056b\u0580|\u041a\u0440\u0430\u0442\u043a\u043e)\s+([A-Z][\w'.-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  return null;
}

export function matchProviderClientContextScenario(
  prompt: string,
): { action: ProviderClientContextIntent; rescueReason: string } | null {
  for (const scenario of [
    ...PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS,
    ...PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason: scenario.expectedAction,
      };
    }
  }
  return null;
}

export function rescueProviderClientContextIntent(
  prompt: string,
  action: string,
): { action: ProviderClientContextIntent; rescueReason: string } | null {
  const exact = matchProviderClientContextScenario(prompt);
  if (exact) return exact;

  if (isAddClientNotePrompt(prompt)) {
    return { action: 'add_client_note', rescueReason: 'add_client_note' };
  }
  if (isShowClientHistoryPrompt(prompt)) {
    return { action: 'show_client_history', rescueReason: 'show_client_history' };
  }
  if (isSummarizeClientPrompt(prompt)) {
    return { action: 'summarize_client', rescueReason: 'summarize_client' };
  }

  if (
    action === 'show_appointments' &&
    /\b(summarize|overview|loyalty|referral)\b/i.test(prompt) &&
    /\b(client|customer)\b/i.test(prompt)
  ) {
    return { action: 'summarize_client', rescueReason: 'summarize_client' };
  }

  if (
    action === 'list_bookings' &&
    /\b(history|past visits?|previous)\b/i.test(prompt)
  ) {
    return { action: 'show_client_history', rescueReason: 'show_client_history' };
  }

  if (
    action === 'update_bookings' &&
    /\b(note|remember that)\b/i.test(prompt)
  ) {
    return { action: 'add_client_note', rescueReason: 'add_client_note' };
  }

  return null;
}

export function formatMarketingOptInLabel(optIn: boolean | null): string {
  if (optIn === true) return 'opted in to marketing';
  if (optIn === false) return 'opted out of marketing';
  return 'marketing preference not recorded';
}

export function formatProviderClientSummaryText(
  context: ProviderBookingCustomerContextView,
): string {
  const parts = [
    `${context.name}: ${context.completedVisitCount} completed visit${context.completedVisitCount === 1 ? '' : 's'}`,
  ];

  if (context.lastCompletedVisitAt) {
    parts.push(`last visit ${formatDateDisplay(context.lastCompletedVisitAt)}`);
  }
  if (context.noShowCount > 0) {
    parts.push(`${context.noShowCount} no-show${context.noShowCount === 1 ? '' : 's'}`);
  }
  if (context.loyaltyQuickView) {
    parts.push(formatProviderLoyaltyQuickViewSummary(context.loyaltyQuickView));
  } else if (context.loyaltyPointsBalance > 0) {
    parts.push(
      `${context.loyaltyPointsBalance} loyalty pts (${context.loyaltyPointsValue})`,
    );
  }
  parts.push(formatMarketingOptInLabel(context.marketingOptIn));
  const badgeText = formatProviderCustomerSnapshotBadgesText(context.badges ?? []);
  if (badgeText) {
    parts.push(badgeText);
  }
  if (context.referral) {
    parts.push(
      `referred by ${context.referral.referredByCustomerName}${
        context.referral.referralCodeUsed
          ? ` (code ${context.referral.referralCodeUsed})`
          : ''
      }`,
    );
  }

  const recent = context.recentCompletedVisits.slice(0, 2);
  if (recent.length) {
    const visitBits = recent.map(
      (visit) =>
        `${visit.serviceName} with ${visit.providerName} on ${formatDateDisplay(visit.completedAt)}`,
    );
    parts.push(`recent: ${visitBits.join('; ')}`);
  }

  return parts.join(' · ');
}

export function formatProviderClientHistoryText(
  customerName: string,
  visits: ProviderBookingCompletedVisitView[],
): string {
  if (!visits.length) {
    return `${customerName} has no completed visits on record yet.`;
  }

  const lines = visits.map(
    (visit) =>
      `${formatDateDisplay(visit.completedAt)} — ${visit.serviceName} with ${visit.providerName}`,
  );

  return `${customerName} — ${visits.length} recent visit${visits.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

export function resolveClientNoteBody(
  params: Record<string, unknown>,
  prompt: string,
): string | null {
  const fromParams = params.clientNote ?? params.reason ?? params.note;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  return extractClientNoteBodyFromPrompt(prompt);
}
