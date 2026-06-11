import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  PROVIDER_ONBOARDING_COMPOUND_PROMPTS,
  PROVIDER_ONBOARDING_EN_SCENARIO_IDS,
} from './ai-provider-onboarding-compound.fixtures.js';
import type { ProviderOnboardingCompoundStepAction } from './ai-provider-onboarding-compound.util.js';

export type ProviderOnboardingMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  orderedActions: ProviderOnboardingCompoundStepAction[];
  paramsPartial?: Record<string, unknown>;
};

const I18N: Record<string, { hy: string; ru: string }> = {
  'onboard-stylist-anna-e2e-en': {
    hy: 'Onboard արա stylist Anna end-to-end: create employee, assign haircut and color services, set up first week weekday template-ից, enable online booking',
    ru: 'Onboard нового stylist Anna end-to-end: create employee, assign haircut and color services, set up first week from weekday template, enable online booking',
  },
  'onboard-therapist-maria-scratch-en': {
    hy: 'Set up արա therapist Maria from scratch — add to team, assign massage services, schedule first week weekday template-ից, turn on public booking',
    ru: 'Set up нового therapist Maria from scratch — add to team, assign massage services, schedule first week from weekday template, turn on public booking',
  },
  'onboard-barber-jake-full-en': {
    hy: 'Full provider setup barber Jake-ի համար: hire employee; assign beard trim services; onboard first week weekday template-ով; enable online booking page',
    ru: 'Full provider setup для barber Jake: hire employee; assign beard trim services; onboard first week with weekday template; enable online booking page',
  },
  'onboard-provider-sofia-e2e-en': {
    hy: 'Provider onboarding end-to-end Sofia-ի համար — create employee, assign facial services, set up first week schedule weekday template-ից, enable public booking website',
    ru: 'Provider onboarding end-to-end для Sofia — create employee, assign facial services, set up first week schedule from weekday template, enable public booking website',
  },
  'onboard-colorist-emma-en': {
    hy: 'Onboard արա color specialist Emma: add employee and assign color services; then set up first week weekday template-ից and enable online booking',
    ru: 'Onboard нового color specialist Emma: add employee and assign color services; then set up first week from weekday template and enable online booking',
  },
  'onboard-nail-tech-nina-en': {
    hy: 'Get new nail tech Nina ready end-to-end — create provider, assign nails services, onboard schedule first week, turn on booking page',
    ru: 'Get new nail tech Nina ready end-to-end — create provider, assign nails services, onboard schedule first week, turn on booking page',
  },
  'onboard-massage-leo-en': {
    hy: 'Set up արա massage therapist Leo from scratch; hire employee; assign deep tissue and sports massage services; schedule first week; enable online booking',
    ru: 'Set up нового massage therapist Leo from scratch; hire employee; assign deep tissue and sports massage services; schedule first week; enable online booking',
  },
  'onboard-esthetician-olivia-en': {
    hy: 'Full setup new esthetician Olivia: create employee, assign skincare services, onboard provider schedule first week weekday template-ից, configure online booking',
    ru: 'Full setup нового esthetician Olivia: create employee, assign skincare services, onboard provider schedule first week from weekday template, configure online booking',
  },
  'onboard-provider-david-en': {
    hy: 'Onboard provider David end-to-end — add to roster, assign haircut services, set up first week weekday template-ից, enable public booking',
    ru: 'Onboard provider David end-to-end — add to roster, assign haircut services, set up first week from weekday template, enable public booking',
  },
  'onboard-team-member-chris-en': {
    hy: 'Նոր hire team member Chris full setup: create employee; assign barber services; onboard first week schedule; turn on online booking',
    ru: 'New hire нового team member Chris full setup: create employee; assign barber services; onboard first week schedule; turn on online booking',
  },
  'onboard-specialist-maya-en': {
    hy: 'Onboard արա specialist Maya from scratch and then assign waxing services, schedule first week weekday template-ով, and enable booking website',
    ru: 'Onboard нового specialist Maya from scratch and then assign waxing services, schedule first week with weekday template, and enable booking website',
  },
};

const EN_BY_ID = new Map(
  PROVIDER_ONBOARDING_COMPOUND_PROMPTS.map((row) => [row.id, row]),
);

function buildProviderOnboardingMultilingualScenarios(): ProviderOnboardingMultilingualScenario[] {
  const rows: ProviderOnboardingMultilingualScenario[] = [];
  for (const enScenarioId of PROVIDER_ONBOARDING_EN_SCENARIO_IDS) {
    const i18n = I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        orderedActions: [...enRow.orderedActions],
        ...(enRow.expectedParams ? { paramsPartial: enRow.expectedParams } : {}),
      });
    }
  }
  return rows;
}

export const PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS =
  buildProviderOnboardingMultilingualScenarios();
