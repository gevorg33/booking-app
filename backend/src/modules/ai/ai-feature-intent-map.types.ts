import type { AccessTier } from './access-control.matrix.js';
import type { CommandRegistryEntry, CommandSurface } from './ai-command-registry.types.js';
import type { AiParityCoverageStatus } from './ai-feature-catalog.types.js';

/** parity-1.4 — one catalog intent id resolved against ai-command-registry.build. */
export interface FeatureIntentLink {
  intentId: string;
  registryEntry?: CommandRegistryEntry;
  /** Intent is registered for the feature surface. */
  surfaceMatch: boolean;
  /** Intent passes access-control.matrix for the feature minTier on its surface. */
  allowedAtMinTier: boolean;
}

/** parity-1.4 — catalog UI action linked to registry intent(s) with gap/scope classification. */
export interface FeatureIntentMapEntry {
  featureId: string;
  surface: CommandSurface;
  minTier: AccessTier;
  label: string;
  intentIds: readonly string[];
  links: readonly FeatureIntentLink[];
  /** Classification at minTier — the role that can reach this UI action. */
  status: AiParityCoverageStatus;
  gap: boolean;
  scopeBug: boolean;
  unknownIntentIds: readonly string[];
  wrongSurfaceIntentIds: readonly string[];
  blockedIntentIds: readonly string[];
}

export interface FeatureIntentUnknownRef {
  featureId: string;
  intentId: string;
}

export interface FeatureIntentMapExport {
  generatedAt: string;
  uiFeatureCount: number;
  entries: readonly FeatureIntentMapEntry[];
  gapFeatureIds: readonly string[];
  scopeBugFeatureIds: readonly string[];
  unknownIntentRefs: readonly FeatureIntentUnknownRef[];
}
