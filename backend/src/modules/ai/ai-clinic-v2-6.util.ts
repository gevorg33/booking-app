import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';
import type { ClinicV2MultilingualEvalScenario } from './ai-clinic-v2-6-multilingual.fixtures.js';
import {
  CLINIC_V2_CONSUMER_CLASSIFIER_RULES,
  CLINIC_V2_CROSS_SURFACE_CLASSIFIER_RULES,
  CLINIC_V2_DASHBOARD_CLASSIFIER_RULES,
  CLINIC_V2_DASHBOARD_SCENARIOS,
  CLINIC_V2_CUSTOMER_SCENARIOS,
  CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
  CLINIC_V2_PROVIDER_CLASSIFIER_RULES,
  CLINIC_V2_PROVIDER_SCENARIOS,
  CLINIC_V2_PUBLIC_SCENARIOS,
  CLINIC_V2_SURFACE_SCENARIOS,
  CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX,
  PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX,
  type ClinicV2Surface,
  type ClinicV2SurfaceScenario,
} from './ai-clinic-v2-6.fixtures.js';

const EN_TO_LOCALIZED_CUSTOMER_NAME: Record<
  string,
  Record<'hy' | 'ru', string>
> = {
  Maria: { hy: 'Մարիա', ru: 'Мария' },
  John: { hy: 'Ջոն', ru: 'Джон' },
  Anna: { hy: 'Աննա', ru: 'Анна' },
  Sofia: { hy: 'Սոֆիա', ru: 'София' },
  James: { hy: 'Ջեյմս', ru: 'Джеймс' },
  Alex: { hy: 'Ալեքս', ru: 'Алекс' },
  'Maria Lopez': { hy: 'Մարիա Լոպեզ', ru: 'Мария Лопез' },
};

function localizeClinicV2ParamsPartial(
  paramsPartial: Record<string, unknown> | undefined,
  locale: AiEvalLocale,
): Record<string, unknown> | undefined {
  if (!paramsPartial || locale === 'en') return paramsPartial;
  const localized = { ...paramsPartial };
  if (typeof localized.customerName === 'string') {
    const mapped = EN_TO_LOCALIZED_CUSTOMER_NAME[localized.customerName];
    if (mapped) {
      localized.customerName = mapped[locale];
    }
  }
  return localized;
}

export function getClinicV2ClassifierRulesForSurface(
  surface: ClinicV2Surface,
): string {
  switch (surface) {
    case 'dashboard':
      return CLINIC_V2_DASHBOARD_CLASSIFIER_RULES;
    case 'provider':
      return CLINIC_V2_PROVIDER_CLASSIFIER_RULES;
    case 'customer':
      return `${CLINIC_V2_CONSUMER_CLASSIFIER_RULES}\n${CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}`;
    case 'public':
      return `${CLINIC_V2_CONSUMER_CLASSIFIER_RULES}\n${PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}`;
    default:
      return CLINIC_V2_CROSS_SURFACE_CLASSIFIER_RULES;
  }
}

export function getClinicV2ScenariosForSurface(
  surface: ClinicV2Surface,
): ClinicV2SurfaceScenario[] {
  switch (surface) {
    case 'dashboard':
      return CLINIC_V2_DASHBOARD_SCENARIOS;
    case 'provider':
      return CLINIC_V2_PROVIDER_SCENARIOS;
    case 'customer':
      return CLINIC_V2_CUSTOMER_SCENARIOS;
    case 'public':
      return CLINIC_V2_PUBLIC_SCENARIOS;
    default:
      return CLINIC_V2_SURFACE_SCENARIOS.filter(
        (scenario) => scenario.surface === surface,
      );
  }
}

export function countClinicV2ScenariosBySurface(
  scenarios: ClinicV2SurfaceScenario[] = CLINIC_V2_SURFACE_SCENARIOS,
): Record<ClinicV2Surface, number> {
  return scenarios.reduce(
    (counts, scenario) => {
      counts[scenario.surface] += 1;
      return counts;
    },
    {
      dashboard: 0,
      provider: 0,
      customer: 0,
      public: 0,
    } satisfies Record<ClinicV2Surface, number>,
  );
}

export function assertClinicV2SurfaceCoverage(
  scenarios: ClinicV2SurfaceScenario[] = CLINIC_V2_SURFACE_SCENARIOS,
  minimum = CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
): Record<ClinicV2Surface, number> {
  const counts = countClinicV2ScenariosBySurface(scenarios);
  for (const surface of Object.keys(counts) as ClinicV2Surface[]) {
    if (counts[surface] < minimum) {
      throw new Error(
        `Clinic v2 surface ${surface} has ${counts[surface]} prompts; need at least ${minimum}`,
      );
    }
  }
  return counts;
}

export function clinicV2ScenarioToEvalCase(
  scenario: ClinicV2SurfaceScenario,
): AiCommandEvalCase {
  return {
    id: `clinic-v2-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? scenario.expectedAction,
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  };
}

export function clinicV2MultilingualScenarioToEvalCase(
  scenario: ClinicV2MultilingualEvalScenario,
): AiCommandEvalCase {
  const paramsPartial = localizeClinicV2ParamsPartial(
    scenario.paramsPartial,
    scenario.locale,
  );
  return {
    id: `clinic-v2-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? scenario.expectedAction,
      ...(paramsPartial ? { paramsPartial } : {}),
      needsMultilingual: true,
    },
  };
}

export function buildClinicV2SurfaceEvalCases(
  scenarios: ClinicV2SurfaceScenario[] = CLINIC_V2_SURFACE_SCENARIOS,
): AiCommandEvalCase[] {
  return scenarios.map(clinicV2ScenarioToEvalCase);
}
