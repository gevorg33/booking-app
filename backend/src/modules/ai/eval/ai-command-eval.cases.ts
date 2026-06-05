import { AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES } from '../ai-cmd-eval.fixtures.js';
import { ALL_DASHBOARD_OPS_SCENARIOS } from '../ai-dashboard-ops.fixtures.js';
import { COMPOUND_COMMAND_RECIPES } from '../ai-command-registry.js';
import {
  COMPOUND_DECOMPOSITION_SCENARIOS,
  type CompoundScenarioExpectation,
} from '../intent-decomposition.fixtures.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './ai-command-eval.types.js';

export { AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES };

/** Map shared compound scenarios (ai-cmd-0.3) to eval golden cases (ai-cmd-0.4). */
export function compoundScenarioToEvalCase(
  scenario: CompoundScenarioExpectation,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    compoundSurface: scenario.surface,
  };

  if (scenario.expectEmpty) {
    expect.compoundExpectEmpty = true;
  } else {
    if (isCompoundPrompt(scenario.prompt)) {
      expect.routeTier = 'compound';
    }
    if (scenario.orderedActions) {
      expect.compoundSteps = scenario.orderedActions;
    }
    if (scenario.actions) {
      expect.compoundActionsContains = scenario.actions;
    }
    if (scenario.minSteps) {
      expect.compoundMinSteps = scenario.minSteps;
    }
    if (scenario.paramChecks?.length) {
      expect.compoundStepParams = scenario.paramChecks.map((check) => ({
        stepIndex: check.stepIndex,
        paramsPartial:
          check.value !== undefined ? { [check.key]: check.value } : undefined,
      }));
    }
    if (scenario.id.includes('golden')) {
      expect.compoundSource = 'golden';
      expect.compoundRecipeId =
        scenario.surface === 'customer'
          ? 'customer_self_service_compound'
          : 'dashboard_operational_compound';
    }
  }

  return {
    id: `compound-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    expect,
  };
}

/** Golden compound NL prompts — multi-command decomposition (ai-cmd-0.4). */
export const AI_COMMAND_EVAL_COMPOUND_CASES: AiCommandEvalCase[] =
  COMPOUND_DECOMPOSITION_SCENARIOS.map(compoundScenarioToEvalCase);

/** Per-recipe NL fixtures from registry example prompts that decompose deterministically. */
export const AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES: AiCommandEvalCase[] =
  COMPOUND_COMMAND_RECIPES.filter(
    (recipe) => recipe.decomposeUtil && !recipe.llmDecompose,
  ).flatMap((recipe) => {
    const cases: AiCommandEvalCase[] = [];
    for (const [index, prompt] of recipe.examplePrompts.entries()) {
      if (!isCompoundPrompt(prompt)) continue;
      const surface = recipe.surfaces[0];
      const decomposition = decomposeDeterministicForSurface(surface, prompt);
      if ((decomposition?.steps.length ?? 0) < 2) continue;
      cases.push({
        id: `registry-compound-${recipe.id}-${index + 1}`,
        prompt,
        locale: 'en',
        expect: {
          routeTier: 'compound',
          compoundSurface: surface,
          compoundMinSteps: 2,
        },
      });
    }
    return cases;
  });

/** Golden NL prompts — deterministic expectations (no live OpenAI in CI). */
export const AI_COMMAND_EVAL_CASES: AiCommandEvalCase[] = [
  {
    id: 'en-show-today',
    prompt: 'Show all appointments today',
    locale: 'en',
    expect: { routeTier: 'read_only', needsMultilingual: false },
  },
  {
    id: 'en-simple-book',
    prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    locale: 'en',
    expect: { routeTier: 'simple_mutate', needsMultilingual: false },
  },
  {
    id: 'en-fallback-orchestration',
    prompt:
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9; if not whoever is free',
    locale: 'en',
    expect: { routeTier: 'orchestration' },
  },
  {
    id: 'en-compound-cancel-clear',
    prompt: 'Cancel all appointments and then clear schedule for Gevorg',
    locale: 'en',
    expect: { routeTier: 'compound' },
  },
  {
    id: 'en-reschedule-am',
    prompt: "Move Maria's appointment to tomorrow at 9 AM",
    locale: 'en',
    expect: { rescheduleTimeSlot: '09:00' },
  },
  {
    id: 'en-reschedule-pm',
    prompt: 'Reschedule Jujo to Friday at 2:30 pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '14:30' },
  },
  {
    id: 'en-reschedule-to-at-pm',
    prompt: 'Move the 16:00 appointment to tomorrow at 3pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '15:00' },
  },
  {
    id: 'hy-show-today',
    prompt: 'Ցույց տուր բոլոր ամրագրումները այսօր',
    locale: 'hy',
    expect: { needsMultilingual: true },
  },
  {
    id: 'ru-book-tomorrow',
    prompt: 'Запиши массаж на Геворга завтра в 10:00',
    locale: 'ru',
    expect: { needsMultilingual: true, routeTier: 'simple_mutate' },
  },
  {
    id: 'translit-show',
    prompt: 'pokazhi vse zapisi gevorg na vagh@',
    locale: 'translit',
    expect: { needsMultilingual: true },
  },
  {
    id: 'en-clear-schedule-rescue',
    prompt: 'Clear Gevorg schedule for tomorrow',
    locale: 'en',
    expect: { rescuedAction: 'clear_schedule' },
  },
  {
    id: 'en-payment-sweep-rescue',
    prompt: 'Run payment sweep for today',
    locale: 'en',
    expect: { rescuedAction: 'payment_sweep' },
  },
  // Per-intent compound golden cases (ai-cmd-0.4)
  {
    id: 'compound-dashboard-cancel_visit-fill_waitlist',
    prompt: 'Cancel package visit for Anna and notify waitlist customers',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
      compoundSource: 'golden',
      compoundRecipeId: 'dashboard_operational_compound',
    },
  },
  {
    id: 'compound-dashboard-coordinate_waitlist',
    prompt: 'Cancel package visit and coordinate waitlist offer',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundSteps: ['cancel_package_visit', 'coordinate_waitlist_offer'],
      compoundSource: 'golden',
      compoundRecipeId: 'dashboard_operational_compound',
    },
  },
  {
    id: 'compound-customer-book_package-promo',
    prompt: 'Book spa day package and apply promo code WELCOME',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['book_package', 'promo_code_help'],
      compoundSource: 'golden',
      compoundRecipeId: 'customer_self_service_compound',
      compoundStepParams: [
        { stepIndex: 1, paramsPartial: { promoCode: 'WELCOME' } },
      ],
    },
  },
  {
    id: 'compound-customer-availability-book',
    prompt:
      'Check package availability and book spa day package with cash at visit',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundMinSteps: 2,
      compoundActionsContains: ['check_package_availability', 'book_with_cash'],
      compoundRecipeId: 'customer_self_service_compound',
    },
  },
  {
    id: 'compound-provider-mark-paid',
    prompt: 'Show my package appointments today and mark booking paid',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'provider',
      compoundMinSteps: 2,
      compoundActionsContains: ['mark_paid'],
      compoundRecipeId: 'provider_booking_compound',
    },
  },
  {
    id: 'compound-dashboard-payments-export',
    prompt: 'Summarize unpaid bookings and export accounting',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundActionsContains: ['summarize_unpaid', 'export_accounting'],
      compoundMinSteps: 2,
    },
  },
  {
    id: 'compound-dashboard-marketing-reengagement',
    prompt: 'Trigger reengagement and list inactive customers',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundMinSteps: 2,
    },
  },
  {
    id: 'compound-customer-cart-duration',
    prompt: 'Add massage to cart and show cart total duration',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundActionsContains: [
        'add_services_to_cart',
        'show_cart_total_duration',
      ],
      compoundMinSteps: 2,
    },
  },
];

/** Dashboard revenue / earnings analytics golden cases. */
export const AI_COMMAND_EVAL_REVENUE_ANALYTICS_CASES: AiCommandEvalCase[] = [
  {
    id: 'revenue-total-earnings-today',
    prompt: 'Calculate total earnings for today',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
  {
    id: 'revenue-total-earnings-last-month',
    prompt: 'How much did we earn last month?',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
  {
    id: 'revenue-top-specialists-last-week',
    prompt: 'Top 3 specialists by revenue last week',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_staff',
      paramsPartial: { staffMetric: 'most_revenue', limit: 3 },
    },
  },
  {
    id: 'revenue-which-specialist-today',
    prompt: 'Which specialist earned the most today?',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_staff',
      paramsPartial: { staffMetric: 'most_revenue' },
    },
  },
  {
    id: 'revenue-all-time-total',
    prompt: 'Tell me total earnings all time',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
];

/** Dashboard ops golden cases (catalog bulk, customer context, provider revenue, upcoming). */
export const AI_COMMAND_EVAL_DASHBOARD_OPS_CASES: AiCommandEvalCase[] =
  ALL_DASHBOARD_OPS_SCENARIOS.map((scenario) => ({
    id: `dashboard-ops-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: scenario.expectedAction,
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  }));

/** Full deterministic CI suite: routing/rescue + compound decomposition. */
export const AI_COMMAND_EVAL_DETERMINISTIC_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_CASES,
  ...AI_COMMAND_EVAL_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_REVENUE_ANALYTICS_CASES,
  ...AI_COMMAND_EVAL_DASHBOARD_OPS_CASES,
  ...AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES,
];

/** Documented LLM-only cases (skipped in CI regression). */
export const AI_COMMAND_EVAL_LLM_CASES: AiCommandEvalCase[] = [
  {
    id: 'llm-hy-conditional-book',
    prompt:
      'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00',
    locale: 'hy',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-en-bulk-cancel',
    prompt:
      'Cancel all of Maria appointments next Friday between 16:30 and 17:30',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'cancel_bookings' },
  },
];
