import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { COMPOUND_COMMAND_RECIPES } from './ai-command-registry.js';
import { getCompoundRecipesForSurface } from './ai-command-registry.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { buildSharedEntityParamsPromptBlock } from './ai-command-entity-params.util.js';
import {
  intersectAllowedActions,
  resolvePlannerAllowedIntents,
  type CapabilityPlannerBounds,
} from './ai-capability-bounded-planner.util.js';
import { GOLDEN_COMPOUND_PATTERNS } from './intent-decomposition.util.js';
import type { DecompositionSchemaView } from './intent-decomposition.types.js';

const SURFACE_INTENT_LISTS: Record<CommandSurface, readonly string[]> = {
  dashboard: DASHBOARD_INTENTS,
  provider: PROVIDER_INTENTS,
  customer: CUSTOMER_INTENTS,
  public: PUBLIC_INTENTS,
};

const DASHBOARD_COMPOUND_RULES = `Rules:
- Preserve order of operations.
- Inherit shared params (date, employeeName, templateName, timeFrom, timeTo) across sub-intents when implied.
- ${buildSharedEntityParamsPromptBlock()}
- Use bulk_smart_cancel when cancel + notify/waitlist/rebook customers in one sweep.
- cancel_package_visit + fill_slot_from_waitlist: cancel a package visit then notify/fill waitlist for the freed slot.
- cancel_package_visit + coordinate_waitlist_offer: cancel visit then coordinate waitlist outreach.
- Use setup_week_schedule for apply template + fill gaps combo.
- create_direct_schedule: team-wide "all employees" → allProviders=true; hours like 9-19 with 12-13 unavailable → periods or timeFrom/timeTo; "their services" → leave serviceNames null.
- clear_schedule: cleanup/wipe a provider's applied schedule (not appointments). Named provider only — do NOT set allProviders when user says "clear all schedules for Karo".
- cancel_bookings + clear_schedule + hide_appointments_from_calendar: typical day reset — cancel appointments, clear schedule, hide cancelled from calendar (statusFilter cancelled on hide step).
- Max 4 sub-intents.`;

const CUSTOMER_COMPOUND_RULES = `Rules:
- Preserve order of operations for logged-in customer self-service.
- ${buildSharedEntityParamsPromptBlock()}
- book_package + promo_code_help: book package then apply/validate promo code (promoCode param when mentioned).
- book_package + book_with_cash / book_with_gift_card: checkout payment preference after booking.
- check_package_availability + book_package: availability check then book.
- list_my_appointments + get_manage_link: list visits then share manage link.
- Max 4 sub-intents.`;

const PROVIDER_COMPOUND_RULES = `Rules:
- Preserve order for provider mobile compound commands.
- ${buildSharedEntityParamsPromptBlock()}
- list_my_package_visits + mark_paid: review visits then mark booking paid.
- list_package_appointments_today + mark_paid: today's package appointments then collect payment.
- Max 4 sub-intents.`;

const PUBLIC_COMPOUND_RULES = `Rules:
- Preserve order for anonymous public booking assistant.
- list_providers + check_availability + book_appointment: discovery then book.
- discover_packages + book_appointment: browse packages then book.
- Max 4 sub-intents.`;

function rulesForSurface(surface: CommandSurface): string {
  switch (surface) {
    case 'customer':
      return CUSTOMER_COMPOUND_RULES;
    case 'provider':
      return PROVIDER_COMPOUND_RULES;
    case 'public':
      return PUBLIC_COMPOUND_RULES;
    default:
      return DASHBOARD_COMPOUND_RULES;
  }
}

export function resolveMaxStepsFromRecipes(
  recipes: Array<{ maxSteps: number }>,
): number {
  if (!recipes.length) return 4;
  return Math.max(...recipes.map((recipe) => recipe.maxSteps));
}

export function resolveAllowedActionsFromRecipes(
  allowedFromRecipes: string[],
  surface: CommandSurface,
): string[] {
  return allowedFromRecipes.length > 0
    ? allowedFromRecipes
    : [...SURFACE_INTENT_LISTS[surface]].filter((id) => id !== 'unknown');
}

function buildDecompositionSchemaViewFromAllowed(
  surface: CommandSurface,
  allowedActions: readonly string[],
): DecompositionSchemaView {
  const recipes = getCompoundRecipesForSurface(surface);
  const promptBlock = `Split a compound ${surface} command into ordered sub-intents.
Return JSON:
{
  "intents": [
    { "action": "<allowed action id>", "params": { ... }, "reasoning": "..." }
  ]
}

Allowed actions: ${allowedActions.join(', ')}.

${rulesForSurface(surface)}`;

  return {
    surface,
    allowedActions,
    maxSteps: resolveMaxStepsFromRecipes(recipes),
    sharedEntityBlock: buildSharedEntityParamsPromptBlock(),
    recipeIds: recipes.map((recipe) => recipe.id),
    goldenPatternIds: GOLDEN_COMPOUND_PATTERNS.filter(
      (pattern) => pattern.surface === surface,
    ).map((pattern) => pattern.id),
    promptBlock,
  };
}

/** Registry-driven LLM decomposition schema for a surface (ai-cmd-0.3). */
export function buildDecompositionSchemaView(
  surface: CommandSurface,
): DecompositionSchemaView {
  const recipes = getCompoundRecipesForSurface(surface);
  const allowedFromRecipes = [
    ...new Set(recipes.flatMap((recipe) => recipe.allowedStepIntentIds)),
  ].sort();
  const allowedActions = resolveAllowedActionsFromRecipes(
    allowedFromRecipes,
    surface,
  );
  return buildDecompositionSchemaViewFromAllowed(surface, allowedActions);
}

/** parity-3.1 — decomposition schema limited to role-effective allowed intents. */
export function buildCapabilityBoundedDecompositionSchemaView(
  bounds: CapabilityPlannerBounds,
): DecompositionSchemaView {
  const surface = bounds.surface;
  const base = buildDecompositionSchemaView(surface);
  const capabilityAllowed = resolvePlannerAllowedIntents(bounds);
  const allowedActions = intersectAllowedActions(
    base.allowedActions,
    capabilityAllowed,
  );
  return buildDecompositionSchemaViewFromAllowed(surface, allowedActions);
}

/** All compound recipe ids registered in the command registry. */
export function listCompoundRecipeIds(): string[] {
  return COMPOUND_COMMAND_RECIPES.map((recipe) => recipe.id);
}
