import type { AccessTier } from './access-control.matrix.js';

/** Where the command is exposed (`public` = anonymous booking; `customer` = logged-in self-service). */
export type CommandSurface = 'dashboard' | 'provider' | 'customer' | 'public';

/**
 * How the runtime executes the command — aligns with CommandComplexityRouterService tiers.
 * - read_only: queries, summaries, policy explain
 * - simple_mutate: single-step create/update/cancel
 * - orchestration: multi-entity plans, conditional booking, optimize/replan
 * - compound: deterministic multi-intent split (and / then / ;)
 */
export type CommandExecutionMode =
  | 'read_only'
  | 'simple_mutate'
  | 'orchestration'
  | 'compound';

/** Backend module / service that implements the intent handler. */
export type CommandApiModule =
  | 'ai-command'
  | 'booking'
  | 'schedule'
  | 'catalog'
  | 'customer-crm'
  | 'schedule-resources'
  | 'payments'
  | 'gift-fulfillment'
  | 'integrations'
  | 'retail-finance'
  | 'marketing-growth'
  | 'push-notifications'
  | 'public-booking'
  | 'provider-mobile'
  | 'clinic-test-results'
  | 'patient-clinical-profiles'
  | 'reviews'
  | 'business';

export interface CommandRegistryEntry {
  /** Stable intent id (classifier action). */
  id: string;
  /** Surfaces where this intent may be invoked. */
  surfaces: CommandSurface[];
  /** Access tiers allowed per surface (empty = none). */
  tiers: AccessTier[];
  /** Whether the intent mutates persisted state. */
  mutating: boolean;
  executionMode: CommandExecutionMode;
  /** Owning API area. */
  apiModule: CommandApiModule;
  /** Default Nest handler class or service method path. */
  handler: string;
  /** Per-surface handler override when routing differs (e.g. dashboard vs provider `mark_paid`). */
  surfaceHandlers?: Partial<Record<CommandSurface, string>>;
  /** True when intent may appear as a step in a compound prompt for its surface. */
  compoundStep: boolean;
  /** Sprint / feature tag for traceability. */
  sprint?: string;
  /** Human label for docs and eval fixtures (ai-cmd-0.4). */
  label?: string;
}

/**
 * Recipe for deterministic multi-command decomposition on a surface.
 * Covers "book package + apply promo", "list visits + mark paid", dashboard day-reset chains, etc.
 */
export interface CompoundCommandRecipe {
  id: string;
  surfaces: CommandSurface[];
  /** Handler that runs the compound orchestration loop. */
  handler: string;
  /** Util used to split NL into ordered steps (when not using LLM decomposition). */
  decomposeUtil?: string;
  /** LLM-based split (dashboard operational compounds). */
  llmDecompose?: boolean;
  maxSteps: number;
  /** Intents allowed as compound steps (subset of registry). */
  allowedStepIntentIds: readonly string[];
  /** Example NL patterns documented for eval (ai-cmd-0.4). */
  examplePrompts: readonly string[];
  sprint?: string;
}

export interface CommandRegistryView {
  intentId: string;
  entry: CommandRegistryEntry;
  compoundRecipes: CompoundCommandRecipe[];
}
