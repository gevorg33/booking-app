import {
  CLINIC_RESULT_MEASUREMENT_FLAGS,
  formatClinicResultMeasurementFlagLabel,
  type ClinicResultMeasurementFlag,
} from '../../common/utils/clinic-lab-state.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { extractTestNameFromResultsPrompt } from './ai-consumer-clinic-test-results.util.js';
import {
  isListAbnormalResultsPrompt,
  isExplainPatientResultsPrompt,
} from './ai-clinic-test-result-ext.util.js';
import { isTrackLabOrderStatusPrompt } from './ai-track-lab-order-status.util.js';
import {
  EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
  type ExplainAbnormalResultFlagAspect,
  type ExplainAbnormalResultFlagFixture,
} from './ai-explain-abnormal-result-flag.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS } from './ai-explain-abnormal-result-flag-multilingual.fixtures.js';

export const EXPLAIN_ABNORMAL_RESULT_FLAG_INTENTS = [
  'explain_abnormal_result_flag',
] as const;

export type ExplainAbnormalResultFlagIntent =
  (typeof EXPLAIN_ABNORMAL_RESULT_FLAG_INTENTS)[number];

export {
  CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES,
  EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
  EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS,
} from './ai-explain-abnormal-result-flag.fixtures.js';

export interface ParsedExplainAbnormalResultFlagRequest {
  aspect: ExplainAbnormalResultFlagAspect;
  flag?: ClinicResultMeasurementFlag;
  testName?: string;
}

const MEDICAL_DISCLAIMER =
  'This is general information about lab result flags in the app, not medical advice. Contact your clinic for interpretation of your results.';

const RESULT_STATUS_BLOCK = new RegExp(
  String.raw`\b(?:released|pending|reviewed|processing|not\s+received|waiting\s+completion|automatically\s+reviewed)\b.{0,20}\b(?:mean|status)\b|\bwhat\s+does\s+(?:released|pending|reviewed|processing)\s+mean\b|(?:թողարկված|սպասման|վերանայված).{0,20}(?:նշանակություն|ինչ)|(?:выпущен|ожидани|обработ).{0,20}(?:означает|статус)`,
  'iu',
);

const FLAG_CUE = new RegExp(
  String.raw`\b(?:high|low|abnormal|normal|inconclusive|indeterminate|out\s+of\s+range|reference\s+range|measurement\s+flag|flagged|red\s+flag|yellow\s+flag)\b|(?:բարձր|ցածր|աննորմալ|նորմալ|սահմաններ|դրոշ)|(?:выше\s+нормы|ниже\s+нормы|отклонени|вне\s+нормы|флаг|норма)`,
  'iu',
);

const SERIOUSNESS_CUE = new RegExp(
  String.raw`\b(?:serious|urgent|worried|worry|concern|dangerous|alarm|bad)\b|լուրջ|վտանգ|серьёзн|опасн|беспоко|страшн`,
  'iu',
);

const REFERENCE_RANGE_CUE = new RegExp(
  String.raw`\b(?:reference\s+range|out\s+of\s+range|normal\s+range)\b|սահմաններ|норм[аы]|диапазон`,
  'iu',
);

const EXPLAIN_QUERY = new RegExp(
  String.raw`\b(?:what\s+does|what\s+is|what\s+do|why\s+does|why\s+is|should\s+i|is\s+it|mean|means|explain)\b|ինչ|նշանակություն|բացատրիր|что\s+означает|объясни|почему`,
  'iu',
);

const STAFF_CHART_BLOCK = new RegExp(
  String.raw`\b(?:patient|for\s+maria|for\s+john)\b.{0,30}\b(?:abnormal|results?)\b|\b(?:list|show)\s+abnormal\b`,
  'iu',
);

const MEASUREMENT_FLAG_EXPLANATIONS: Record<
  ClinicResultMeasurementFlag,
  string
> = {
  Normal:
    'The value is within the reference range the lab uses for that test. It is informational only.',
  Abnormal:
    'The value is outside the expected reference range or needs clinician review. It highlights a number for your care team — not a diagnosis on its own.',
  High: 'The value is above the lab reference range. It draws attention for clinician review and does not by itself mean an emergency.',
  Low: 'The value is below the lab reference range. It draws attention for clinician review and does not by itself mean an emergency.',
  Inconclusive:
    'The lab could not determine a clear result for this measurement. Your clinic may recommend a repeat test or follow-up.',
  Indeterminate:
    'The result is unclear or borderline. Your clinician may interpret it with your other results and history.',
  TestNotComplete:
    'Testing for this measurement is still in progress or was not finished when the result was saved.',
  NotApplicable:
    'This flag is not used for this type of measurement on your result.',
  SeeDetails:
    'Open the result details or contact your clinic for more context on this measurement.',
};

function isClinicResultMeasurementFlag(
  value: string,
): value is ClinicResultMeasurementFlag {
  return (CLINIC_RESULT_MEASUREMENT_FLAGS as readonly string[]).includes(value);
}

function matchExplainAbnormalResultFlagScenario(
  prompt: string,
): ExplainAbnormalResultFlagFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractMeasurementFlagFromPrompt(
  prompt: string,
): ClinicResultMeasurementFlag | undefined {
  const scenario = matchExplainAbnormalResultFlagScenario(prompt);
  if (scenario?.flag) return scenario.flag;

  const explicit = prompt.match(
    /\b(Normal|Abnormal|High|Low|Inconclusive|Indeterminate|TestNotComplete|NotApplicable|SeeDetails)\b/,
  );
  if (explicit?.[1] && isClinicResultMeasurementFlag(explicit[1])) {
    return explicit[1];
  }

  if (/\bhigh\b|բարձր|выше\s+нормы/i.test(prompt)) return 'High';
  if (/\blow\b|ցածր|ниже\s+нормы/i.test(prompt)) return 'Low';
  if (/\babnormal\b|աննորմալ|отклонени/i.test(prompt)) return 'Abnormal';
  if (/\bnormal\b|նորմալ|норма/i.test(prompt) && FLAG_CUE.test(prompt)) {
    return 'Normal';
  }
  if (/\binconclusive\b|անորոշելի/i.test(prompt)) return 'Inconclusive';
  if (/\bindeterminate\b/i.test(prompt)) return 'Indeterminate';
  if (REFERENCE_RANGE_CUE.test(prompt) && !/\bhigh\b|\blow\b/i.test(prompt)) {
    return 'Abnormal';
  }

  return undefined;
}

export function resolveExplainAbnormalResultFlagAspect(
  prompt: string,
): ExplainAbnormalResultFlagAspect {
  const scenario = matchExplainAbnormalResultFlagScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;

  if (SERIOUSNESS_CUE.test(prompt)) return 'seriousness';
  if (REFERENCE_RANGE_CUE.test(prompt)) return 'reference_range';
  if (/\b(?:measurement\s+flags?|flags?\s+on\s+my\s+results)\b/i.test(prompt)) {
    return 'general';
  }
  return 'flag_meaning';
}

export function isExplainAbnormalResultFlagIntent(
  action: string,
): action is ExplainAbnormalResultFlagIntent {
  return (EXPLAIN_ABNORMAL_RESULT_FLAG_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isExplainAbnormalResultFlagPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (matchExplainAbnormalResultFlagScenario(text)) return true;

  if (STAFF_CHART_BLOCK.test(text)) return false;
  if (isListAbnormalResultsPrompt(text)) return false;
  if (isExplainPatientResultsPrompt(text)) return false;
  if (isTrackLabOrderStatusPrompt(text)) return false;
  if (RESULT_STATUS_BLOCK.test(text) && !FLAG_CUE.test(text)) return false;

  if (!FLAG_CUE.test(text)) return false;
  if (!EXPLAIN_QUERY.test(text) && !SERIOUSNESS_CUE.test(text)) {
    return false;
  }

  return true;
}

export function parseExplainAbnormalResultFlagFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainAbnormalResultFlagRequest | null {
  if (!isExplainAbnormalResultFlagPrompt(prompt)) return null;

  const scenario = matchExplainAbnormalResultFlagScenario(prompt);
  const flagFromParams =
    typeof params.flag === 'string' &&
    isClinicResultMeasurementFlag(params.flag)
      ? params.flag
      : undefined;
  const testNameFromParams =
    typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined;

  return {
    aspect:
      (typeof params.aspect === 'string'
        ? (params.aspect as ExplainAbnormalResultFlagAspect)
        : undefined) ??
      scenario?.aspect ??
      resolveExplainAbnormalResultFlagAspect(prompt),
    flag:
      flagFromParams ??
      scenario?.flag ??
      extractMeasurementFlagFromPrompt(prompt),
    testName:
      testNameFromParams ??
      scenario?.testName ??
      extractTestNameFromResultsPrompt(prompt) ??
      undefined,
  };
}

export function rescueExplainAbnormalResultFlagIntent(
  prompt: string,
  action: string,
): { action: ExplainAbnormalResultFlagIntent; rescueReason: string } | null {
  if (isExplainAbnormalResultFlagIntent(action)) return null;
  if (!parseExplainAbnormalResultFlagFromPrompt(prompt)) return null;
  return {
    action: 'explain_abnormal_result_flag',
    rescueReason: 'abnormal_result_flag',
  };
}

export function enrichExplainAbnormalResultFlagParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainAbnormalResultFlagFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    aspect: parsed.aspect,
    ...(parsed.flag ? { flag: parsed.flag } : {}),
    ...(parsed.testName ? { testName: parsed.testName } : {}),
  };
}

export function formatMeasurementFlagExplanation(
  flag: ClinicResultMeasurementFlag,
  locale: AppLocale = 'en',
  testName?: string,
): string {
  const label = formatClinicResultMeasurementFlagLabel(flag, locale);
  const scope = testName ? ` on your ${testName}` : '';
  return `${label}${scope}: ${MEASUREMENT_FLAG_EXPLANATIONS[flag]}`;
}

export function assembleAbnormalResultFlagSummary(
  parsed: ParsedExplainAbnormalResultFlagRequest,
  locale: AppLocale = 'en',
): string {
  const parts: string[] = [];

  if (parsed.aspect === 'seriousness') {
    parts.push(
      'Abnormal, High, or Low flags highlight values your care team should review. They do not automatically mean something is urgent or an emergency.',
      'Only your clinician can interpret what a flagged value means for you.',
    );
  } else if (parsed.aspect === 'reference_range') {
    parts.push(
      'Reference ranges are the expected values a lab uses for comparison. Out-of-range or flagged values fall outside that range or need review.',
      'Ranges can vary by lab, age, and test method.',
    );
  } else if (parsed.aspect === 'general') {
    parts.push(
      'My Results shows measurement flags such as Normal, High, Low, Abnormal, and Inconclusive next to individual lab values.',
      'Flags help you and your clinician spot values that may need follow-up.',
    );
  }

  if (parsed.flag) {
    parts.push(
      formatMeasurementFlagExplanation(parsed.flag, locale, parsed.testName),
    );
  } else if (parsed.testName && parsed.aspect === 'flag_meaning') {
    parts.push(
      `Open your ${parsed.testName} result in My Results to see which measurements are flagged.`,
    );
  }

  if (parts.length === 0) {
    parts.push(
      'Measurement flags on lab results describe how a value compares to the lab reference range.',
    );
  }

  parts.push(MEDICAL_DISCLAIMER);
  return parts.join(' ');
}

export function buildExplainAbnormalResultFlagNavigate(
  testName?: string,
): { path: string; query: Record<string, string> } | null {
  if (!testName) return { path: '/results', query: {} };
  return { path: '/results', query: { section: 'my-results' } };
}
