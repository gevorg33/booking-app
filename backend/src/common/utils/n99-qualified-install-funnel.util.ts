import type { AppAdoptionEventName } from '../../modules/analytics/entities/app-event.entity.js';
import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import {
  N99_DEAD_END_DROP_THRESHOLD,
  N99_QUALIFIED_FUNNEL_FIX_SUGGESTIONS,
} from './n99-qualified-install-funnel.fixtures.js';
import { isIntentQualifiedInstall } from './n99-qualified-activation.util.js';

export { N99_DEAD_END_DROP_THRESHOLD } from './n99-qualified-install-funnel.fixtures.js';

export type N99QualifiedInstallFunnelStepId =
  | 'qualified_install'
  | 'first_open'
  | 'salon_viewed'
  | 'booking_started'
  | 'slot_step'
  | 'confirm_step'
  | 'booking_completed';

export interface N99QualifiedInstallFunnelStepDef {
  id: N99QualifiedInstallFunnelStepId;
  label: string;
  event: AppAdoptionEventName;
  props?: Record<string, string>;
}

export const N99_QUALIFIED_INSTALL_FUNNEL_STEPS: readonly N99QualifiedInstallFunnelStepDef[] =
  [
    { id: 'qualified_install', label: 'Qualified install', event: 'app_installed' },
    { id: 'first_open', label: 'First open', event: 'app_opened' },
    { id: 'salon_viewed', label: 'Salon viewed', event: 'viewed_salon' },
    { id: 'booking_started', label: 'Booking started', event: 'started_booking' },
    {
      id: 'slot_step',
      label: 'Slot step',
      event: 'onboarding_step_viewed',
      props: { onboardingStep: 'slot' },
    },
    {
      id: 'confirm_step',
      label: 'Confirm step',
      event: 'onboarding_step_viewed',
      props: { onboardingStep: 'confirm' },
    },
    { id: 'booking_completed', label: 'Booking completed', event: 'completed_booking' },
  ];

export interface N99QualifiedInstallFunnelStep {
  id: N99QualifiedInstallFunnelStepId;
  label: string;
  event: AppAdoptionEventName;
  count: number;
  conversionFromPrevious: number | null;
  dropOffFromPrevious: number | null;
}

export interface N99QualifiedInstallFunnelExport {
  cohortSize: number;
  steps: N99QualifiedInstallFunnelStep[];
}

export interface N99QualifiedInstallDeadEndFixTicket {
  id: string;
  stepId: N99QualifiedInstallFunnelStepId;
  stepLabel: string;
  fromStepId: N99QualifiedInstallFunnelStepId;
  fromStepLabel: string;
  dropOffRate: number;
  usersDropped: number;
  usersEntered: number;
  title: string;
  suggestedFix: string;
}

export interface N99QualifiedInstallDeadEndAudit {
  funnel: N99QualifiedInstallFunnelExport;
  dropThreshold: number;
  fixTickets: N99QualifiedInstallDeadEndFixTicket[];
  passed: boolean;
}

function uniqueAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return [...new Set(rows.map((row) => row.anonId))];
}

function listQualifiedInstallAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return uniqueAnonIds(
    rows.filter(
      (row) => row.event === 'app_installed' && isIntentQualifiedInstall(row),
    ),
  );
}

function matchesFunnelStepEvent(
  row: AppEventAnalyticsRow,
  step: N99QualifiedInstallFunnelStepDef,
): boolean {
  if (row.event !== step.event) return false;
  if (!step.props) return true;
  for (const [key, value] of Object.entries(step.props)) {
    if (row.props?.[key]?.toString() !== value) return false;
  }
  return true;
}

function hasFunnelStepEvent(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  step: N99QualifiedInstallFunnelStepDef,
): boolean {
  return rows.some((row) => row.anonId === anonId && matchesFunnelStepEvent(row, step));
}

function reachedQualifiedFunnelStep(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  stepIndex: number,
): boolean {
  for (let index = 0; index <= stepIndex; index += 1) {
    const step = N99_QUALIFIED_INSTALL_FUNNEL_STEPS[index];
    if (index === 0) {
      const install = rows.find(
        (row) => row.anonId === anonId && row.event === 'app_installed',
      );
      if (!install || !isIntentQualifiedInstall(install)) return false;
      continue;
    }
    if (!hasFunnelStepEvent(rows, anonId, step)) return false;
  }
  return true;
}

function countQualifiedFunnelStep(
  rows: AppEventAnalyticsRow[],
  anonIds: string[],
  stepIndex: number,
): number {
  let count = 0;
  for (const anonId of anonIds) {
    if (reachedQualifiedFunnelStep(rows, anonId, stepIndex)) count += 1;
  }
  return count;
}

export function buildQualifiedInstallFunnel(
  rows: AppEventAnalyticsRow[],
): N99QualifiedInstallFunnelExport {
  const cohort = listQualifiedInstallAnonIds(rows);
  const steps: N99QualifiedInstallFunnelStep[] = [];
  let previousCount = 0;

  for (let index = 0; index < N99_QUALIFIED_INSTALL_FUNNEL_STEPS.length; index += 1) {
    const def = N99_QUALIFIED_INSTALL_FUNNEL_STEPS[index];
    const count = countQualifiedFunnelStep(rows, cohort, index);
    const conversionFromPrevious =
      index === 0 || previousCount === 0 ? (index === 0 ? 1 : null) : count / previousCount;
    const dropOffFromPrevious =
      index === 0 || previousCount === 0
        ? null
        : (previousCount - count) / previousCount;

    steps.push({
      id: def.id,
      label: def.label,
      event: def.event,
      count,
      conversionFromPrevious,
      dropOffFromPrevious,
    });
    previousCount = count;
  }

  return { cohortSize: cohort.length, steps };
}

function buildFixTicket(
  step: N99QualifiedInstallFunnelStep,
  previous: N99QualifiedInstallFunnelStep,
): N99QualifiedInstallDeadEndFixTicket {
  const dropOffRate = step.dropOffFromPrevious ?? 0;
  const usersEntered = previous.count;
  const usersDropped = Math.max(0, usersEntered - step.count);

  return {
    id: `n99-dead-end-${step.id}`,
    stepId: step.id,
    stepLabel: step.label,
    fromStepId: previous.id,
    fromStepLabel: previous.label,
    dropOffRate,
    usersDropped,
    usersEntered,
    title: `Fix ${step.label} dead-end (${(dropOffRate * 100).toFixed(1)}% drop from ${previous.label})`,
    suggestedFix: N99_QUALIFIED_FUNNEL_FIX_SUGGESTIONS[step.id],
  };
}

export function auditQualifiedInstallDeadEnds(
  rows: AppEventAnalyticsRow[],
  threshold = N99_DEAD_END_DROP_THRESHOLD,
): N99QualifiedInstallDeadEndAudit {
  const funnel = buildQualifiedInstallFunnel(rows);
  const fixTickets: N99QualifiedInstallDeadEndFixTicket[] = [];

  for (let index = 1; index < funnel.steps.length; index += 1) {
    const step = funnel.steps[index]!;
    const previous = funnel.steps[index - 1]!;
    const drop = step.dropOffFromPrevious;
    if (drop == null || drop <= threshold + 1e-9) continue;
    fixTickets.push(buildFixTicket(step, previous));
  }

  return {
    funnel,
    dropThreshold: threshold,
    fixTickets,
    passed: fixTickets.length === 0,
  };
}

export function assertN99QualifiedInstallDeadEndAudit(
  audit: N99QualifiedInstallDeadEndAudit,
): void {
  if (audit.passed) return;
  const lines = audit.fixTickets.map(
    (ticket) =>
      `  - ${ticket.title}: ${ticket.usersDropped}/${ticket.usersEntered} dropped — ${ticket.suggestedFix}`,
  );
  throw new Error(
    `n99-3.6 — qualified-install dead-end audit failed (> ${(audit.dropThreshold * 100).toFixed(0)}% drop):\n${lines.join('\n')}`,
  );
}

export function formatN99QualifiedInstallDeadEndAudit(
  audit: N99QualifiedInstallDeadEndAudit,
): string {
  const header = `qualified funnel cohort: ${audit.funnel.cohortSize} installs · gate: ${audit.passed ? 'PASS' : 'FAIL'}`;
  if (audit.fixTickets.length === 0) return header;
  const tickets = audit.fixTickets
    .map((ticket) => `${ticket.id}: ${ticket.title}`)
    .join('\n');
  return `${header}\n${tickets}`;
}
