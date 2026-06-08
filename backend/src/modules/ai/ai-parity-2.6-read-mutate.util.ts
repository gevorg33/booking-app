import {
  AGENT_NON_UNDOABLE_ACTIONS,
  AGENT_UNDOABLE_ACTIONS,
} from '../../engine/agent/agent-task-undo.service.js';
import { buildBlastRadiusCapGateResult } from './ai-blast-radius-cap.util.js';
import type { CommandRegistryEntry } from './ai-command-registry.types.js';
import { isHighRiskConfirmAction } from './ai-high-risk-confirm-clarify.util.js';
import { buildExecutionVerificationGate } from './ai-execution-verification.util.js';
import { MEDIUM_RISK_PREVIEW_ACTIONS } from './ai-mutation-preview-diff.fixtures.js';
import { needsMutationPreviewDiff } from './ai-mutation-preview-diff.util.js';
import { POST_EXEC_ASSERTABLE_ACTIONS } from './ai-post-exec-assertion.fixtures.js';
import { shouldRunPostExecAssertion } from './ai-post-exec-assertion.util.js';
import {
  isCustomerPublicOnlySurface,
  PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT,
  PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS,
  PARITY_26_HANDLER_PREVIEW_CONFIRM_ACTIONS,
  PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS,
  PARITY_26_PROBE_SCENARIOS,
} from './ai-parity-2.6-read-mutate.fixtures.js';

export {
  PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT,
  PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS,
  PARITY_26_HANDLER_PREVIEW_CONFIRM_ACTIONS,
  PARITY_26_PROBE_SCENARIOS,
  PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS,
  isCustomerPublicOnlySurface,
} from './ai-parity-2.6-read-mutate.fixtures.js';

export interface ReadMutateParityStatus {
  complete: boolean;
  errors: string[];
  mutatingIntents: number;
  missingPreviewConfirm: number;
  missingUndoCoverage: number;
  missingPostExecRegistry: number;
  missingDestructiveBlast: number;
  registryConsistencyErrors: number;
}

function hasOpsSurface(entry: CommandRegistryEntry): boolean {
  return entry.surfaces.some(
    (surface) => surface === 'dashboard' || surface === 'provider',
  );
}

/** parity-2.6 — preview/confirm path for ops mutations (acc-5.3 + acc-4.6 + handler confirm). */
export function hasMutatingPreviewConfirmCoverage(
  entry: CommandRegistryEntry,
): boolean {
  if (!entry.mutating || entry.id === 'unknown') return true;
  if (isCustomerPublicOnlySurface(entry.surfaces)) return true;
  if (PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT.has(entry.id)) return true;
  if (PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS.has(entry.id)) return true;
  if (PARITY_26_HANDLER_PREVIEW_CONFIRM_ACTIONS.has(entry.id)) return true;
  if (entry.executionMode === 'orchestration') return true;
  if (isHighRiskConfirmAction(entry.id)) return true;
  if (MEDIUM_RISK_PREVIEW_ACTIONS.has(entry.id)) return true;
  if (needsMutationPreviewDiff(entry.id, false)) return true;
  return false;
}

/** parity-2.6 — undo via ai-d7 agent task or documented non-undoable exemption. */
export function hasMutatingUndoCoverage(entry: CommandRegistryEntry): boolean {
  if (!entry.mutating || entry.id === 'unknown') return true;
  if (isCustomerPublicOnlySurface(entry.surfaces)) return true;
  if (PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT.has(entry.id)) return true;
  if (PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS.has(entry.id)) return true;
  if (!hasOpsSurface(entry)) return true;
  if (AGENT_UNDOABLE_ACTIONS.has(entry.id)) return true;
  if (AGENT_NON_UNDOABLE_ACTIONS.has(entry.id)) return true;
  if (
    entry.executionMode === 'orchestration' ||
    entry.executionMode === 'compound'
  ) {
    return true;
  }
  // Simple ops mutates without explicit reverse handlers are documented irreversible.
  if (entry.executionMode === 'simple_mutate') return true;
  return false;
}

function resolveRegistryEntryForPostExec(
  action: string,
  registry: readonly CommandRegistryEntry[],
): CommandRegistryEntry | undefined {
  const direct = registry.find((row) => row.id === action);
  if (direct) return direct;
  if (action === 'cancel_booking') {
    return registry.find((row) => row.id === 'cancel_bookings');
  }
  return undefined;
}

export function requiresDestructiveBlastRadius(action: string): boolean {
  return PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS.has(action);
}

export function assertDestructiveBlastRadiusGate(action: string): boolean {
  if (!requiresDestructiveBlastRadius(action)) return true;
  const gate = buildBlastRadiusCapGateResult({
    prompt: `parity-2.6 blast probe for ${action}`,
    action,
    params: {
      bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`),
      employeeIds: ['1', '2', '3', '4', '5', '6'],
      dateFrom: '2026-01-01',
      dateTo: '2026-03-15',
    },
    confirmed: false,
  });
  return (
    gate != null &&
    gate.details?.clarifySource === 'blast_radius_cap' &&
    gate.details?.requiresExecutionConfirmation === true
  );
}

export function assertOpsMutatingPreviewGate(action: string): boolean {
  const gate = buildExecutionVerificationGate({
    prompt: `parity-2.6 preview probe for ${action}`,
    action,
    params: {
      employeeName: 'Gevorg',
      serviceName: 'Massage',
      customerName: 'Maria',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    enrichedParams: {
      employeeName: 'Gevorg',
      serviceName: 'Massage',
      customerName: 'Maria',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    confirmed: false,
  });
  return (
    gate != null &&
    (gate.details?.requiresExecutionConfirmation === true ||
      gate.details?.requiresPreviewDiff === true)
  );
}

function findRegistryConsistencyErrors(
  registry: readonly CommandRegistryEntry[],
): string[] {
  const errors: string[] = [];
  for (const entry of registry) {
    if (entry.id === 'unknown') continue;
    if (entry.mutating && entry.executionMode === 'read_only') {
      errors.push(`${entry.id}: mutating=true but executionMode=read_only`);
    }
    if (!entry.mutating && entry.executionMode === 'simple_mutate') {
      errors.push(`${entry.id}: mutating=false but executionMode=simple_mutate`);
    }
    if (
      POST_EXEC_ASSERTABLE_ACTIONS.has(entry.id) &&
      !entry.mutating
    ) {
      errors.push(`${entry.id}: post-exec assertable but registry mutating=false`);
    }
    if (isHighRiskConfirmAction(entry.id) && !entry.mutating) {
      errors.push(`${entry.id}: high-risk confirm but registry mutating=false`);
    }
    if (AGENT_UNDOABLE_ACTIONS.has(entry.id) && !entry.mutating) {
      errors.push(`${entry.id}: undoable but registry mutating=false`);
    }
  }
  return errors;
}

/** parity-2.6 gate — read vs mutate correctness across registry + acc-5.4/5.7. */
export function assertReadMutateParity(
  registry: readonly CommandRegistryEntry[],
): ReadMutateParityStatus {
  const errors: string[] = [];
  let missingPreviewConfirm = 0;
  let missingUndoCoverage = 0;
  let missingPostExecRegistry = 0;
  let missingDestructiveBlast = 0;

  errors.push(...findRegistryConsistencyErrors(registry));

  const mutating = registry.filter((entry) => entry.mutating && entry.id !== 'unknown');

  for (const entry of mutating) {
    if (!hasMutatingPreviewConfirmCoverage(entry)) {
      missingPreviewConfirm += 1;
      errors.push(`${entry.id}: missing preview/confirm coverage`);
    }
    if (!hasMutatingUndoCoverage(entry)) {
      missingUndoCoverage += 1;
      errors.push(`${entry.id}: missing undo coverage (ai-d7)`);
    }
    if (
      requiresDestructiveBlastRadius(entry.id) &&
      !assertDestructiveBlastRadiusGate(entry.id)
    ) {
      missingDestructiveBlast += 1;
      errors.push(`${entry.id}: destructive action missing blast-radius gate`);
    }
    if (
      hasOpsSurface(entry) &&
      !isHighRiskConfirmAction(entry.id) &&
      !PARITY_26_HANDLER_PREVIEW_CONFIRM_ACTIONS.has(entry.id) &&
      !PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS.has(entry.id) &&
      !assertOpsMutatingPreviewGate(entry.id) &&
      entry.executionMode !== 'orchestration'
    ) {
      errors.push(`${entry.id}: ops mutation missing execution verification preview gate`);
    }
  }

  for (const action of POST_EXEC_ASSERTABLE_ACTIONS) {
    const entry = resolveRegistryEntryForPostExec(action, registry);
    if (!entry?.mutating) {
      missingPostExecRegistry += 1;
      errors.push(
        `${action}: POST_EXEC_ASSERTABLE_ACTIONS entry not mutating in registry`,
      );
    }
  }

  const undoableRegistryAliases: Record<string, string> = {
    create_block_schedule: 'block_schedule',
  };
  for (const action of AGENT_UNDOABLE_ACTIONS) {
    const resolved = undoableRegistryAliases[action] ?? action;
    const entry = registry.find((row) => row.id === resolved);
    if (!entry) continue;
    if (!entry.mutating) {
      errors.push(`${action}: AGENT_UNDOABLE_ACTIONS entry not mutating in registry`);
    }
  }

  return {
    complete: errors.length === 0,
    errors,
    mutatingIntents: mutating.length,
    missingPreviewConfirm,
    missingUndoCoverage,
    missingPostExecRegistry,
    missingDestructiveBlast,
    registryConsistencyErrors: findRegistryConsistencyErrors(registry).length,
  };
}

export function formatReadMutateParityReport(status: ReadMutateParityStatus): string {
  const lines = [
    'AI Read/Mutate Parity (parity-2.6)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Mutating intents: ${status.mutatingIntents}`,
    `Missing preview/confirm: ${status.missingPreviewConfirm}`,
    `Missing undo coverage: ${status.missingUndoCoverage}`,
    `Post-exec registry gaps: ${status.missingPostExecRegistry}`,
    `Destructive blast-radius gaps: ${status.missingDestructiveBlast}`,
    `Registry consistency errors: ${status.registryConsistencyErrors}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors.slice(0, 24)) {
      lines.push(`  - ${error}`);
    }
    if (status.errors.length > 24) {
      lines.push(`  ... and ${status.errors.length - 24} more`);
    }
  }
  return lines.join('\n');
}
