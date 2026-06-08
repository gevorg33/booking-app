import type { CommandSurface } from './ai-command-registry.types.js';
import { extractSharedEntityParamsFromPrompt } from './ai-command-entity-params.util.js';
import {
  filterDecomposedStepsToAllowedIntents,
  resolvePlannerAllowedIntents,
  type CapabilityPlannerBounds,
} from './ai-capability-bounded-planner.util.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import {
  GOAL_EXECUTION_PROBE_BOUNDS,
  GOAL_EXECUTION_SCENARIOS,
  GOAL_STEP_INTENT_LABELS,
  type GoalPlannerBounds,
} from './ai-goal-execution.fixtures.js';
import { buildPlanStepPreviewRows } from './ai-plan-preview-rollback.util.js';

export {
  GOAL_EXECUTION_SCENARIOS,
  GOAL_EXECUTION_PROBE_BOUNDS,
  GOAL_STEP_INTENT_LABELS,
  type GoalPlannerBounds,
} from './ai-goal-execution.fixtures.js';

export type GoalDecompositionSource = 'recipe';

export interface GoalExecutionRecipe {
  id: string;
  surface: CommandSurface;
  matches: (prompt: string) => boolean;
  buildSteps: (prompt: string) => DecomposedIntentStep[];
}

export interface GoalDecompositionResult {
  recipeId: string;
  surface: CommandSurface;
  source: GoalDecompositionSource;
  steps: DecomposedIntentStep[];
}

export interface GoalExecutionValidation {
  ok: boolean;
  outOfScope: string[];
  allowedCount: number;
  steps: DecomposedIntentStep[];
}

export interface GoalExecutionStatus {
  complete: boolean;
  errors: string[];
  scenariosChecked: number;
}

const NEW_PROVIDER_GOAL_RE =
  /(?:set\s+up|onboard|get|configure)\s+(?:my\s+)?(?:new|another)\s+(?:stylist|provider|employee|hire|team\s+member)\b/i;

const END_TO_END_GOAL_RE =
  /(?:end[\s-]?to[\s-]?end|fully|completely|from\s+scratch|whole\s+setup|everything|ամբողջությամբ)/i;

const ONBOARD_COMPLETE_RE =
  /\bonboard\s+(?:new\s+)?(?:provider|stylist|employee).+(?:completely|fully|end[\s-]?to[\s-]?end)/i;

export const GOAL_EXECUTION_RECIPES: GoalExecutionRecipe[] = [
  {
    id: 'dashboard_new_stylist_setup',
    surface: 'dashboard',
    matches: (prompt) => {
      const trimmed = prompt.trim();
      if (!trimmed) return false;
      if (ONBOARD_COMPLETE_RE.test(trimmed)) return true;
      if (NEW_PROVIDER_GOAL_RE.test(trimmed) && END_TO_END_GOAL_RE.test(trimmed)) {
        return true;
      }
      if (/set\s+up\s+my\s+new\s+stylist\b/i.test(trimmed)) return true;
      if (
        /(?:նոր|nor)\s+stylist/i.test(trimmed) &&
        END_TO_END_GOAL_RE.test(trimmed)
      ) {
        return true;
      }
      return /կարգավորիր.+stylist/i.test(trimmed);
    },
    buildSteps: (prompt) => buildNewStylistSetupSteps(prompt),
  },
];

export function matchGoalRecipe(
  prompt: string,
  surface: CommandSurface,
): GoalExecutionRecipe | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;
  for (const recipe of GOAL_EXECUTION_RECIPES) {
    if (recipe.surface === surface && recipe.matches(trimmed)) {
      return recipe;
    }
  }
  return null;
}

/** parity-3.2 — holistic goals (not and/then compound markers). */
export function isGoalExecutionPrompt(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): boolean {
  return matchGoalRecipe(prompt, surface) != null;
}

export function extractGoalSharedParams(
  prompt: string,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    ...extractSharedEntityParamsFromPrompt(prompt),
  };

  const namePatterns = [
    /\bnew\s+stylist\s+([A-Za-z][\w]+)(?=\s+(?:end[\s-]?to[\s-]?end|from|and|completely)|\s*$)/i,
    /\bnew\s+(?:provider|employee)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bstylist\s+([A-Za-z][\w]+)(?=\s+(?:end[\s-]?to[\s-]?end|from|and|completely)|\s*$)/i,
    /\b(?:provider|employee)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bonboard\s+(?:new\s+)?(?:provider|stylist)\s+([A-Za-z][\w]+)/i,
  ];
  for (const re of namePatterns) {
    const match = prompt.match(re);
    const name = match?.[1]?.trim();
    if (name && !/^(new|my|the|from|with)$/i.test(name)) {
      params.employeeName = name;
      break;
    }
  }

  const templateMatch = prompt.match(
    /\b(?:from\s+)?([A-Za-z][\w\s-]+?)\s+template\b/i,
  );
  if (templateMatch?.[1]) {
    params.templateName = templateMatch[1].trim();
  } else if (/weekday/i.test(prompt)) {
    params.templateName = 'weekday';
  }

  const servicePatterns = [
    /\bassign\s+(.+?)(?:\s+and\s+(?:apply|set|enable|from)\b|$)/i,
    /\bservices?\s+(.+?)(?:\s+and\s+(?:apply|set|enable|from)\b|$)/i,
  ];
  for (const re of servicePatterns) {
    const match = prompt.match(re);
    const chunk = match?.[1]?.trim();
    if (!chunk) continue;
    const names = chunk
      .split(/\s+and\s+|\s*,\s*/i)
      .map((part) =>
        part
          .replace(/\b(haircut|color|massage|facial)\b/gi, (m) => m.toLowerCase())
          .trim(),
      )
      .filter(
        (part) =>
          part.length > 1 &&
          !/^(assign|services?|from|template|weekday|enable|online|booking)$/i.test(
            part,
          ),
      );
    if (names.length) {
      params.serviceNames = names;
      break;
    }
  }

  if (/haircut/i.test(prompt) && !params.serviceNames) {
    params.serviceNames = ['haircut'];
  }
  if (/color/i.test(prompt)) {
    const existing = (params.serviceNames as string[] | undefined) ?? [];
    if (!existing.some((n) => /color/i.test(n))) {
      params.serviceNames = [...existing, 'color'];
    }
  }
  if (/massage/i.test(prompt)) {
    const existing = (params.serviceNames as string[] | undefined) ?? [];
    if (!existing.some((n) => /massage/i.test(n))) {
      params.serviceNames = [...existing, 'massage'];
    }
  }
  if (/facial/i.test(prompt)) {
    const existing = (params.serviceNames as string[] | undefined) ?? [];
    if (!existing.some((n) => /facial/i.test(n))) {
      params.serviceNames = [...existing, 'facial'];
    }
  }

  if (/online\s+booking|bookable|enable\s+online/i.test(prompt)) {
    params.enableOnlineBooking = true;
  }

  return params;
}

function buildNewStylistSetupSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const shared = extractGoalSharedParams(prompt);
  const employeeName = shared.employeeName as string | undefined;
  const templateName = shared.templateName as string | undefined;
  const serviceNames = shared.serviceNames as string[] | undefined;

  const steps: DecomposedIntentStep[] = [
    {
      action: 'assign_employee_services',
      params: {
        ...(employeeName ? { employeeName } : {}),
        ...(serviceNames?.length ? { serviceNames } : {}),
      },
      reasoning: 'Goal step 1 — assign catalog services to the new stylist',
      segment: prompt,
    },
    {
      action: 'apply_schedule',
      params: {
        ...(employeeName ? { employeeName } : {}),
        ...(templateName ? { templateName } : {}),
      },
      reasoning: 'Goal step 2 — apply schedule template for the new stylist',
      segment: prompt,
    },
    {
      action: 'create_direct_schedule',
      params: {
        ...(employeeName ? { employeeName } : {}),
      },
      reasoning: 'Goal step 3 — set direct bookable hours',
      segment: prompt,
    },
    {
      action: 'fill_unused_slots',
      params: {
        ...(employeeName ? { employeeName } : {}),
        ...(shared.enableOnlineBooking ? { enableOnlineBooking: true } : {}),
      },
      reasoning: 'Goal step 4 — open unused slots for online booking',
      segment: prompt,
    },
  ];

  return steps;
}

export function decomposeGoalPrompt(
  prompt: string,
  surface: CommandSurface,
  allowedIntents?: readonly string[],
): GoalDecompositionResult | null {
  const recipe = matchGoalRecipe(prompt, surface);
  if (!recipe) return null;

  let steps = recipe.buildSteps(prompt);
  if (allowedIntents?.length) {
    steps = filterDecomposedStepsToAllowedIntents(steps, allowedIntents);
  }
  if (steps.length < 2) return null;

  return {
    recipeId: recipe.id,
    surface,
    source: 'recipe',
    steps,
  };
}

export function validateGoalStepsAgainstCapabilities(
  steps: readonly DecomposedIntentStep[],
  bounds: CapabilityPlannerBounds | GoalPlannerBounds,
): GoalExecutionValidation {
  const allowed = resolvePlannerAllowedIntents(bounds);
  const filtered = filterDecomposedStepsToAllowedIntents(steps, allowed);
  const outOfScope = steps
    .map((step) => step.action)
    .filter((action) => !allowed.includes(action));
  return {
    ok: filtered.length >= 2 && outOfScope.length === 0,
    outOfScope: [...new Set(outOfScope)],
    allowedCount: allowed.length,
    steps: filtered,
  };
}

export function buildGoalExecutionPreviewDetails(
  result: GoalDecompositionResult,
): Record<string, unknown> {
  const stepRows = buildPlanStepPreviewRows(result.steps);
  return {
    goalExecution: true,
    goalRecipeId: result.recipeId,
    unifiedPreview: true,
    planStepPreview: stepRows,
    permissionCheckedSteps: result.steps.map((step) => step.action),
    stepLabels: stepRows.map((row) => row.label),
    requiresExecutionConfirmation: true,
    decomposed: true,
    goalSource: result.source,
    atomicRollback: true,
    workflowLogUndo: true,
  };
}

export function buildGoalCapabilityDeniedSummary(
  outOfScope: readonly string[],
): string {
  const listed = outOfScope.map((action) => action.replace(/_/g, ' ')).join(', ');
  return `This setup goal needs steps outside your role (${listed}). Ask an owner/manager or upgrade your plan.`;
}

export function assertGoalExecutionProbes(): GoalExecutionStatus {
  const errors: string[] = [];

  for (const scenario of GOAL_EXECUTION_SCENARIOS) {
    const result = decomposeGoalPrompt(scenario.prompt, scenario.surface);
    if (!result) {
      errors.push(`${scenario.id}: expected goal decomposition`);
      continue;
    }
    if (result.recipeId !== scenario.recipeId) {
      errors.push(
        `${scenario.id}: expected recipe ${scenario.recipeId}, got ${result.recipeId}`,
      );
    }
    if ('orderedActions' in scenario && scenario.orderedActions) {
      const actions = result.steps.map((step) => step.action);
      if (actions.join(',') !== scenario.orderedActions.join(',')) {
        errors.push(
          `${scenario.id}: expected actions [${scenario.orderedActions.join(', ')}], got [${actions.join(', ')}]`,
        );
      }
    }
    if ('minSteps' in scenario && scenario.minSteps != null) {
      if (result.steps.length < scenario.minSteps) {
        errors.push(
          `${scenario.id}: expected >= ${scenario.minSteps} steps, got ${result.steps.length}`,
        );
      }
    }
    if ('actions' in scenario && scenario.actions) {
      for (const action of scenario.actions) {
        if (!result.steps.some((step) => step.action === action)) {
          errors.push(`${scenario.id}: missing action ${action}`);
        }
      }
    }
    if ('paramChecks' in scenario && scenario.paramChecks) {
      for (const check of scenario.paramChecks) {
        const step = result.steps[check.stepIndex];
        if (!step) {
          errors.push(`${scenario.id}: missing step index ${check.stepIndex}`);
          continue;
        }
        if (check.value !== undefined && step.params[check.key] !== check.value) {
          errors.push(
            `${scenario.id}: step ${check.stepIndex} param ${check.key} expected ${String(check.value)}`,
          );
        }
      }
    }
  }

  const ownerResult = decomposeGoalPrompt(
    GOAL_EXECUTION_SCENARIOS[0].prompt,
    'dashboard',
    resolvePlannerAllowedIntents(GOAL_EXECUTION_PROBE_BOUNDS.ownerBusiness),
  );
  if (!ownerResult || ownerResult.steps.length < 3) {
    errors.push('owner/business bounds should retain >= 3 goal steps');
  }

  const staffValidation = validateGoalStepsAgainstCapabilities(
    ownerResult?.steps ?? [],
    GOAL_EXECUTION_PROBE_BOUNDS.staffBusiness,
  );
  if (staffValidation.ok) {
    errors.push('staff should not pass full stylist setup goal validation');
  }

  return {
    complete: errors.length === 0,
    errors,
    scenariosChecked: GOAL_EXECUTION_SCENARIOS.length + 2,
  };
}
