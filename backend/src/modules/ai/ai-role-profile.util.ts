import type { AiRoleProfile } from './ai-settings.types.js';

/** Mirrors AccessTier — local union so this leaf never imports access-control.matrix (e2e-bug.1). */
type AccessTierLike = 'client' | 'staff' | 'manager' | 'owner';

/**
 * Leaf helper — kept out of ai-platform.util so guide/session code can map
 * tiers without pulling the command-registry cycle (e2e-bug.1).
 */
export function mapAccessTierToRoleProfile(
  tier: AccessTierLike,
): AiRoleProfile {
  if (tier === 'owner') return 'owner';
  if (tier === 'manager') return 'manager';
  if (tier === 'staff') return 'receptionist';
  return 'provider';
}
