import type { ClinicResultMeasurementFlag } from '../../common/utils/clinic-lab-state.util.js';

export type ExplainAbnormalResultFlagAspect =
  | 'flag_meaning'
  | 'seriousness'
  | 'reference_range'
  | 'general';

export type ExplainAbnormalResultFlagFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_abnormal_result_flag';
  rescueReason: 'abnormal_result_flag';
  aspect?: ExplainAbnormalResultFlagAspect;
  flag?: ClinicResultMeasurementFlag;
  testName?: string;
};

export const CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES = `- explain_abnormal_result_flag: READ — customer app only: explain lab measurement flags (High, Low, Abnormal, Normal, Inconclusive, etc.) shown on My Results — general FAQ, not medical advice. Triggers: what does high mean on my CBC, is abnormal serious, out of range flag, reference range on lab results, what does the red flag mean. Optional flag and testName. Set aspect when clear (flag_meaning|seriousness|reference_range|general). NOT explain_result_status (Released/pending/processing pipeline FAQ), NOT list_abnormal_results (staff dashboard list), NOT explain_patient_results (staff chart), NOT list_my_test_results (open results list).`;

export const EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS: readonly ExplainAbnormalResultFlagFixture[] =
  [
    {
      id: 'high-on-cbc',
      prompt: 'What does high mean on my CBC?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'High',
      testName: 'CBC',
    },
    {
      id: 'is-abnormal-serious',
      prompt: 'Is abnormal serious?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'seriousness',
      flag: 'Abnormal',
    },
    {
      id: 'low-flag-meaning',
      prompt: 'What does the Low flag mean on my lab result?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'Low',
    },
    {
      id: 'out-of-range',
      prompt: 'What does out of range mean on my results?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'reference_range',
    },
    {
      id: 'red-flag-chip',
      prompt: 'What does the red flag on my test mean?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'Abnormal',
    },
    {
      id: 'reference-range',
      prompt: 'What is the reference range on my lab results?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'reference_range',
    },
    {
      id: 'abnormal-chip',
      prompt: 'Why does my result say Abnormal?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'Abnormal',
    },
    {
      id: 'high-worried',
      prompt: 'Should I be worried about a High flag?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'seriousness',
      flag: 'High',
    },
    {
      id: 'measurement-flags-general',
      prompt: 'What do the measurement flags on My Results mean?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'general',
    },
    {
      id: 'inconclusive-meaning',
      prompt: 'What does Inconclusive mean on a lab value?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'Inconclusive',
    },
    {
      id: 'lipid-high',
      prompt: 'What does High mean on my lipid panel?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'High',
      testName: 'lipid panel',
    },
    {
      id: 'flagged-value',
      prompt: 'My glucose was flagged — what does that mean?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      testName: 'glucose',
    },
    {
      id: 'normal-flag',
      prompt: 'What does Normal mean on a lab measurement?',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'Normal',
    },
  ];

/** Blocks explain_result_status when the user asks about measurement flags. */
export const EXPLAIN_ABNORMAL_RESULT_FLAG_BLOCK = new RegExp(
  String.raw`\b(?:what\s+does|what\s+is|why\s+does|should\s+i\s+be\s+worried|is)\b.{0,40}\b(?:high|low|abnormal|normal|inconclusive|indeterminate|out\s+of\s+range|reference\s+range|measurement\s+flag|flagged)\b|\b(?:high|low|abnormal)\s+(?:flag|mean|serious)\b|\bmeasurement\s+flags?\b|\b(?:red|yellow)\s+flag\b.{0,20}\b(?:test|result|lab|measurement)\b|(?:բարձր|ցածր|աննորմալ|նորմալ|սահմաններ|դրոշ)|(?:выше\s+нормы|ниже\s+нормы|отклонени|вне\s+нормы|флаг|серьёзн)`,
  'iu',
);

export const EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS = [
  {
    id: 'status-to-flag-high',
    prompt: 'What does high mean on my CBC?',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'explain_abnormal_result_flag' as const,
  },
  {
    id: 'list-results-to-flag-serious',
    prompt: 'Is abnormal serious?',
    misclassifiedAction: 'list_my_test_results',
    expectedAction: 'explain_abnormal_result_flag' as const,
  },
  {
    id: 'unknown-to-flag-low',
    prompt: 'What does the Low flag mean on my lab result?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_abnormal_result_flag' as const,
  },
  {
    id: 'staff-list-to-flag-reference',
    prompt: 'What does out of range mean on my results?',
    misclassifiedAction: 'list_abnormal_results',
    expectedAction: 'explain_abnormal_result_flag' as const,
  },
];
