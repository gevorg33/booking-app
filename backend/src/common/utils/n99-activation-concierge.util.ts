import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import { buildConsumerBookServicePushUrl } from './consumer-booking-push-link.util.js';
import {
  isIntentQualifiedInstall,
  isQualifiedActivatedUser,
} from './n99-qualified-activation.util.js';

export const ACTIVATION_CONCIERGE_MILESTONES = ['24h', '72h'] as const;
export type ActivationConciergeMilestone =
  (typeof ACTIVATION_CONCIERGE_MILESTONES)[number];

const MILESTONE_MIN_HOURS: Record<ActivationConciergeMilestone, number> = {
  '24h': 24,
  '72h': 72,
};

export interface ActivationConciergeResumeTarget {
  serviceId: string;
  date?: string;
  slot?: string;
  employeeId?: string;
  abandonedStep?: string;
}

export interface ActivationConciergeCandidateInput {
  anonId: string;
  installAt: Date;
  milestone: ActivationConciergeMilestone;
  resume: ActivationConciergeResumeTarget | null;
}

function firstEventAt(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  event: AppEventAnalyticsRow['event'],
): AppEventAnalyticsRow | null {
  const matches = rows
    .filter((row) => row.anonId === anonId && row.event === event)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return matches[0] ?? null;
}

function latestEventAt(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  event: AppEventAnalyticsRow['event'],
): AppEventAnalyticsRow | null {
  const matches = rows
    .filter((row) => row.anonId === anonId && row.event === event)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return matches[0] ?? null;
}

export function resolveActivationConciergeMilestone(
  installAt: Date,
  now: Date,
  sentMilestones: ReadonlySet<ActivationConciergeMilestone>,
): ActivationConciergeMilestone | null {
  const hours = (now.getTime() - installAt.getTime()) / (60 * 60 * 1000);
  if (hours >= MILESTONE_MIN_HOURS['72h'] && !sentMilestones.has('72h')) {
    return '72h';
  }
  if (
    hours >= MILESTONE_MIN_HOURS['24h'] &&
    hours < MILESTONE_MIN_HOURS['72h'] &&
    !sentMilestones.has('24h')
  ) {
    return '24h';
  }
  return null;
}

export function resolveActivationConciergeResumeTarget(
  rows: AppEventAnalyticsRow[],
  anonId: string,
): ActivationConciergeResumeTarget | null {
  const source =
    latestEventAt(rows, anonId, 'booking_abandoned') ??
    latestEventAt(rows, anonId, 'started_booking');
  if (!source) return null;

  const serviceId = source.props?.serviceId?.toString().trim();
  if (!serviceId) return null;

  const date = source.props?.date?.toString().trim().slice(0, 10);
  const slot = source.props?.slot?.toString().trim();
  const employeeId = source.props?.employeeId?.toString().trim();
  const abandonedStep = source.props?.abandonedStep?.toString().trim();

  return {
    serviceId,
    ...(date ? { date } : {}),
    ...(slot ? { slot } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(abandonedStep ? { abandonedStep } : {}),
  };
}

export function buildActivationConciergeResumePushUrl(input: {
  slug: string;
  serviceId: string;
  date?: string;
  slot?: string;
  employeeId?: string;
}): string {
  const base = buildConsumerBookServicePushUrl(input.slug, input.serviceId);
  const url = new URL(base);
  url.searchParams.set('resume', '1');
  if (input.date?.trim()) url.searchParams.set('date', input.date.trim().slice(0, 10));
  if (input.slot?.trim()) url.searchParams.set('slot', input.slot.trim());
  if (input.employeeId?.trim()) url.searchParams.set('employeeId', input.employeeId.trim());
  return url.toString();
}

export function buildActivationConciergeResumeWebUrl(input: {
  frontendBaseUrl: string;
  slug: string;
  serviceId: string;
  date?: string;
  slot?: string;
  employeeId?: string;
}): string {
  const base = `${input.frontendBaseUrl.replace(/\/$/, '')}/book/${input.slug}`;
  const params = new URLSearchParams({
    serviceId: input.serviceId,
    resume: '1',
  });
  if (input.date) params.set('date', input.date);
  if (input.slot) params.set('slot', input.slot);
  if (input.employeeId) params.set('employeeId', input.employeeId);
  return `${base}?${params.toString()}`;
}

export function listActivationConciergeCandidateInputs(
  rows: AppEventAnalyticsRow[],
  now: Date = new Date(),
  sentByAnon: Readonly<
    Record<string, ReadonlySet<ActivationConciergeMilestone>>
  > = {},
): ActivationConciergeCandidateInput[] {
  const anonIds = [...new Set(rows.map((row) => row.anonId))];
  const candidates: ActivationConciergeCandidateInput[] = [];

  for (const anonId of anonIds) {
    const install = firstEventAt(rows, anonId, 'app_installed');
    if (!install) continue;
    if (
      !isIntentQualifiedInstall({
        tenantSlug: install.tenantSlug,
        props: install.props,
      })
    ) {
      continue;
    }
    if (isQualifiedActivatedUser(rows, anonId)) continue;

    const milestone = resolveActivationConciergeMilestone(
      install.createdAt,
      now,
      sentByAnon[anonId] ?? new Set(),
    );
    if (!milestone) continue;

    candidates.push({
      anonId,
      installAt: install.createdAt,
      milestone,
      resume: resolveActivationConciergeResumeTarget(rows, anonId),
    });
  }

  return candidates;
}
