import type { AccessTier } from './access-control.matrix.js';
import type { CommandApiModule, CommandSurface } from './ai-command-registry.types.js';

export type AiFeatureActionKind = 'read' | 'mutate';

export type AiFeatureExtractionSource = 'registry' | 'nav' | 'route' | 'permission' | 'manual';

/** Single user-visible product action — source of truth for parity gates (parity-1.1). */
export interface AiFeatureCatalogEntry {
  id: string;
  surface: CommandSurface;
  module: CommandApiModule | string;
  actionKind: AiFeatureActionKind;
  /** Minimum access tier that can reach this action in the UI. */
  minTier: AccessTier;
  label: string;
  /** Registry intent ids that fulfill this UI action (empty = coverage gap). */
  intentIds: readonly string[];
  uiPath?: string;
  navRef?: string;
  extractionSource: AiFeatureExtractionSource;
  /** parity-1.3 — reviewer confirmed this row belongs in the catalog. */
  confirmed: boolean;
  /** parity-2 — UI shell with no AI counterpart (auth routes); counts as covered. */
  aiExempt?: boolean;
  aiExemptReason?: string;
}

export type AiParityCoverageStatus = 'covered' | 'gap' | 'scope_bug';

export interface AiFeatureCoverageCell {
  featureId: string;
  surface: CommandSurface;
  tier: AccessTier;
  status: AiParityCoverageStatus;
  uiAccessible: boolean;
  aiAllowed: boolean;
  intentIds: readonly string[];
  blockedIntents: readonly string[];
}

export type AiAllowDenyDivergenceKind = 'over_grant' | 'under_grant';

export interface AiAllowDenyDivergence {
  kind: AiAllowDenyDivergenceKind;
  featureId: string;
  surface: CommandSurface;
  tier: AccessTier;
  intentId: string;
  reason: string;
  /** parity-1.6 — catalog-linked vs AI capability orphan. */
  source?: 'catalog' | 'capability';
}

/** parity-1.6 — allow/deny parity export (target zero defects). */
export interface AllowDenyParityExport {
  generatedAt: string;
  overGrantCount: number;
  underGrantCount: number;
  totalDivergences: number;
  divergences: readonly AiAllowDenyDivergence[];
  byRoleSurface: readonly AllowDenyParityRoleSurfaceSummary[];
  targetZero: boolean;
}

export interface AllowDenyParityRoleSurfaceSummary {
  tier: AccessTier;
  surface: CommandSurface;
  overGrantCount: number;
  underGrantCount: number;
}

export interface AiParityRoleSurfaceSummary {
  surface: CommandSurface;
  tier: AccessTier;
  uiActionCount: number;
  coveredCount: number;
  gapCount: number;
  scopeBugCount: number;
  coveragePercent: number | null;
  gaps: readonly string[];
  scopeBugs: readonly string[];
  /** parity-1.5 — uncovered actions for this role/surface, highest usage first. */
  uncoveredRanked: readonly AiParityUncoveredAction[];
}

/** parity-1.5 — one uncovered catalog action with optional usage signals. */
export interface AiParityUncoveredAction {
  featureId: string;
  label: string;
  module: string;
  status: 'gap' | 'scope_bug';
  usageScore: number;
  traceIntentHits: number;
  analyticsScreenHits: number;
  blockedIntents: readonly string[];
}

/** parity-1.5 — optional app analytics screen/route counts (when ingest available). */
export interface AppAnalyticsUsageRow {
  appSurface: 'consumer_app' | 'provider_app' | 'public_web' | 'dashboard_web';
  screenOrRoute: string;
  eventCount: number;
}

/** parity-1.5 — Sprint 56 prioritized closure queue. */
export interface AiParitySprint56BacklogItem {
  featureId: string;
  label: string;
  module: string;
  minTier: AccessTier;
  surface: CommandSurface;
  kind: 'gap' | 'scope_bug' | 'unconfirmed';
  usageScore: number;
  traceIntentHits: number;
  analyticsScreenHits: number;
  intentIds: readonly string[];
}

export interface AiParityUsageAvailability {
  traceRows: number;
  analyticsRows: number;
}

export interface AiParityCoverageReport {
  generatedAt: string;
  catalogEntryCount: number;
  confirmedEntryCount: number;
  unconfirmedCandidateCount: number;
  byRoleSurface: AiParityRoleSurfaceSummary[];
  allowDenyDivergences: AiAllowDenyDivergence[];
  /** parity-1.6 — full allow/deny export including capability orphans. */
  allowDenyParity: AllowDenyParityExport;
  extractionBacklog: readonly string[];
  /** parity-1.5 — global Sprint 56 queue ranked by usage signals. */
  sprint56Backlog: readonly AiParitySprint56BacklogItem[];
  usageAvailability: AiParityUsageAvailability;
}

/** parity-1.3 — reconciliation between UI extraction seeds and reviewer-confirmed catalog. */
export interface AiFeatureExtractionReconciliation {
  seedCount: number;
  matchedCount: number;
  missingFromCatalog: readonly string[];
  unconfirmedCatalogIds: readonly string[];
  orphanCatalogIds: readonly string[];
}
