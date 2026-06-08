import type { CommandSurface } from './ai-command-registry.types.js';
import type { AccessTier } from './access-control.matrix.js';

/** parity-4.5 — labeled multi-step role tasks (parity-3.2 goal execution). */
export const PARITY_AGENT_TASK_MIN_PASS_RATE = 0.95;

/** parity-4.5 — feature→intent coverage target per role/surface. */
export const PARITY_FEATURE_COVERAGE_TARGET = 1;

/** parity-4.5 — allow/deny divergence target. */
export const PARITY_ALLOW_DENY_DIVERGENCE_TARGET = 0;

export const PARITY_EXIT_GATE_ROLE_SURFACE_PAIRS: ReadonlyArray<{
  tier: AccessTier;
  surface: CommandSurface;
}> = [
  { tier: 'owner', surface: 'dashboard' },
  { tier: 'manager', surface: 'dashboard' },
  { tier: 'staff', surface: 'dashboard' },
  { tier: 'staff', surface: 'provider' },
  { tier: 'client', surface: 'customer' },
  { tier: 'client', surface: 'public' },
];
