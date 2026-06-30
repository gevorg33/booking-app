import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ClinicTestResultExtIntent } from './ai-clinic-test-result-ext.util.js';

export interface ClinicTestResultExtEvalScenario {
  id: string;
  /** EN fixture id in `ai-clinic-test-result-ext.fixtures.ts` (parity-2.4). */
  enScenarioId: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ClinicTestResultExtIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Representative EN ext rows that require HY + RU eval siblings (ai-cmd-clinic-6-gap-1.4). */
export const CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS = [
  'upload-order-hash',
  'attach-pdf-order',
  'upload-document-order',
  'attach-lab-report',
  'explain-maria',
  'interpret-cbc',
  'plain-language',
  'explain-order',
  'set-wbc-range',
  'configure-glucose',
  'update-hemoglobin',
  'define-sodium-range',
  'list-abnormal-en',
  'show-flagged',
  'out-of-range',
  'flagged-labs',
] as const;

const MULTILINGUAL_EN_SCENARIO_ID_BY_ROW_ID: Record<string, string> = {
  'hy-upload-order-hash': 'upload-order-hash',
  'ru-upload-order-hash': 'upload-order-hash',
  'hy-attach-pdf-order': 'attach-pdf-order',
  'ru-attach-pdf-order': 'attach-pdf-order',
  'hy-import-result-order': 'upload-document-order',
  'ru-import-result-order': 'upload-document-order',
  'hy-upload-scan-order': 'attach-lab-report',
  'ru-upload-report-order': 'attach-lab-report',
  'hy-explain-maria': 'explain-maria',
  'ru-explain-maria': 'explain-maria',
  'hy-summarize-cbc-anna': 'interpret-cbc',
  'ru-summarize-cbc-anna': 'interpret-cbc',
  'hy-glucose-maria': 'plain-language',
  'ru-glucose-maria': 'plain-language',
  'hy-explain-order': 'explain-order',
  'ru-explain-order': 'explain-order',
  'hy-set-wbc-range': 'set-wbc-range',
  'ru-set-wbc-range': 'set-wbc-range',
  'hy-configure-glucose': 'configure-glucose',
  'ru-configure-glucose': 'configure-glucose',
  'hy-update-hemoglobin': 'update-hemoglobin',
  'ru-update-hemoglobin': 'update-hemoglobin',
  'hy-define-sodium-range': 'define-sodium-range',
  'ru-define-sodium-range': 'define-sodium-range',
  'hy-list-abnormal': 'list-abnormal-en',
  'ru-list-abnormal': 'list-abnormal-en',
  'hy-show-flagged': 'show-flagged',
  'ru-show-flagged': 'show-flagged',
  'hy-out-of-range': 'out-of-range',
  'ru-out-of-range': 'out-of-range',
  'hy-which-flagged': 'flagged-labs',
  'ru-which-flagged': 'flagged-labs',
};

type ClinicTestResultExtEvalScenarioBase = Omit<
  ClinicTestResultExtEvalScenario,
  'enScenarioId'
>;

function attachEnScenarioIds(
  rows: ClinicTestResultExtEvalScenarioBase[],
): ClinicTestResultExtEvalScenario[] {
  return rows.map((row) => {
    const enScenarioId = MULTILINGUAL_EN_SCENARIO_ID_BY_ROW_ID[row.id];
    if (!enScenarioId) {
      throw new Error(`Missing enScenarioId mapping for ${row.id}`);
    }
    return { ...row, enScenarioId };
  });
}

/** Armenian/Russian dashboard clinic lab ext intents (ai-cmd-clinic-6-gap-1.1 / i18n-clinic-v2-ai-2 mirror). */
export const CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic lab ext intents (dashboard only):
  - upload_patient_result: hy «վերբեռնիր/կցիր/ներմուծիր» + PDF/ֆայլ/փաստաթուղթ + lab result + պատվեր/#id; ru «загрузи/прикрепи/импортируй» + PDF/файл + lab result + заказ/#id. Requires orderId. NOT enter_test_result (manual value entry).
  - explain_patient_results: hy «բացատրիր/ամփոփիր/ինչ են նշանակում» + lab/CBC/BMP/glucose/WBC results + optional Մարիա/Anna; ru «объясни/сделай summary/что означают» + lab/CBC/BMP/glucose/WBC results + optional Мария/Анна. NOT explain_patient_chart (allergies/visits chart).
  - configure_test_reference_range: hy «կարգավորիր/սահմանիր/թարմացրու» + WBC/glucose/hemoglobin/sodium/LDL + reference range/normal range + optional bounds; ru «установи/настрой/обнови/задай» + Latin measurement code + reference range/normal range + optional bounds.
  - list_abnormal_results: hy «ցուցակավորիր/ցույց տուր/որ» + abnormal/flagged/out of range + lab/results/measurements; ru «список/покажи/какие» + abnormal/flagged/out of range + lab/results/measurements. NOT list_test_orders (order queue).
  - Keep Latin measurement codes (WBC, CBC, BMP, glucose, hemoglobin, LDL, sodium) and order ids (#abc123) inside hy/ru sentences.`;

const MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS_BASE: ClinicTestResultExtEvalScenarioBase[] =
  [
    {
      id: 'hy-upload-order-hash',
      locale: 'hy',
      prompt: 'Վերբեռնիր lab result PDF-ը պատվերի համար #abc123',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'hy-attach-pdf-order',
      locale: 'hy',
      prompt: 'Կցիր PDF result file ord-42 պատվերին',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'ord-42' },
      needsMultilingual: true,
    },
    {
      id: 'hy-import-result-order',
      locale: 'hy',
      prompt: 'Ներմուծիր patient test result փաստաթուղթ order #lab-77',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'lab-77' },
      needsMultilingual: true,
    },
    {
      id: 'hy-upload-scan-order',
      locale: 'hy',
      prompt: 'Վերբեռնիր scanned lab report order abc123',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'ru-upload-order-hash',
      locale: 'ru',
      prompt: 'Загрузи PDF lab result для заказа #abc123',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'ru-attach-pdf-order',
      locale: 'ru',
      prompt: 'Прикрепи PDF result file к заказу ord-42',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'ord-42' },
      needsMultilingual: true,
    },
    {
      id: 'ru-import-result-order',
      locale: 'ru',
      prompt: 'Импортируй patient test result для order #lab-77',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'lab-77' },
      needsMultilingual: true,
    },
    {
      id: 'ru-upload-report-order',
      locale: 'ru',
      prompt: 'Загрузи lab report для заказа abc123',
      expectedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-maria',
      locale: 'hy',
      prompt: 'Բացատրիր Մարիայի lab results-ը պարզ լեզվով',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-summarize-cbc-anna',
      locale: 'hy',
      prompt: 'Ամփոփիր CBC test results Anna-ի համար',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Anna' },
      needsMultilingual: true,
    },
    {
      id: 'hy-glucose-maria',
      locale: 'hy',
      prompt: 'Ինչ են նշանակում glucose results-ը Մարիայի համար',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-order',
      locale: 'hy',
      prompt: 'Բացատրիր lab results պատվերի #abc123 համար',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-maria',
      locale: 'ru',
      prompt: 'Объясни lab results Марии простым языком',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-summarize-cbc-anna',
      locale: 'ru',
      prompt: 'Сделай summary CBC test results для Анны',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Анна' },
      needsMultilingual: true,
    },
    {
      id: 'ru-glucose-maria',
      locale: 'ru',
      prompt: 'Что означают glucose results для Марии',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-order',
      locale: 'ru',
      prompt: 'Объясни lab results для заказа #abc123',
      expectedAction: 'explain_patient_results',
      rescueReason: 'explain_patient_results',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'hy-set-wbc-range',
      locale: 'hy',
      prompt: 'Կարգավորիր WBC reference range 4.0-ից 11.0',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'WBC',
        normalLow: '4.0',
        normalHigh: '11.0',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-glucose',
      locale: 'hy',
      prompt: 'Սահմանիր glucose normal range 70-ից 99',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'glucose',
        normalLow: '70',
        normalHigh: '99',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-update-hemoglobin',
      locale: 'hy',
      prompt: 'Թարմացրու hemoglobin reference range low 12 high 16',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'hemoglobin',
        normalLow: '12',
        normalHigh: '16',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-define-sodium-range',
      locale: 'hy',
      prompt: 'Սահմանիր sodium reference range 135-145',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'sodium',
        normalLow: '135',
        normalHigh: '145',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-set-wbc-range',
      locale: 'ru',
      prompt: 'Установи WBC reference range от 4.0 до 11.0',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'WBC',
        normalLow: '4.0',
        normalHigh: '11.0',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-glucose',
      locale: 'ru',
      prompt: 'Настрой glucose normal range 70-99',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'glucose',
        normalLow: '70',
        normalHigh: '99',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-update-hemoglobin',
      locale: 'ru',
      prompt: 'Обнови hemoglobin reference range low 12 high 16',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'hemoglobin',
        normalLow: '12',
        normalHigh: '16',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-define-sodium-range',
      locale: 'ru',
      prompt: 'Задай sodium reference range 135-145',
      expectedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: 'sodium',
        normalLow: '135',
        normalHigh: '145',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-list-abnormal',
      locale: 'hy',
      prompt: 'Ցուցակավորիր abnormal lab results-ը',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'hy-show-flagged',
      locale: 'hy',
      prompt: 'Ցույց տուր flagged WBC measurements review-ի համար',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'hy-out-of-range',
      locale: 'hy',
      prompt: 'Ցուցակավորիր out of range CBC test results',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'hy-which-flagged',
      locale: 'hy',
      prompt: 'Ո՞ր lab measurements-ն են flagged review-ի համար',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'ru-list-abnormal',
      locale: 'ru',
      prompt: 'Список abnormal lab results',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'ru-show-flagged',
      locale: 'ru',
      prompt: 'Покажи flagged glucose measurements на проверку',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'ru-out-of-range',
      locale: 'ru',
      prompt: 'Покажи out of range BMP test results',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
    {
      id: 'ru-which-flagged',
      locale: 'ru',
      prompt: 'Какие lab measurements помечены flagged',
      expectedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
      needsMultilingual: true,
    },
  ];

export const MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS: ClinicTestResultExtEvalScenario[] =
  attachEnScenarioIds(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS_BASE);

const EXT_INTENTS: ClinicTestResultExtIntent[] = [
  'upload_patient_result',
  'explain_patient_results',
  'configure_test_reference_range',
  'list_abnormal_results',
];

export function assertClinicTestResultExtMultilingualCoverage(
  scenarios: ClinicTestResultExtEvalScenario[] = MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS,
  minimumPerLocale = 4,
): Record<ClinicTestResultExtIntent, Record<AiEvalLocale, number>> {
  const counts = Object.fromEntries(
    EXT_INTENTS.map((intent) => [
      intent,
      { hy: 0, ru: 0, en: 0, translit: 0 } satisfies Record<AiEvalLocale, number>,
    ]),
  ) as Record<ClinicTestResultExtIntent, Record<AiEvalLocale, number>>;

  for (const row of scenarios) {
    counts[row.expectedAction][row.locale] += 1;
    if (!row.needsMultilingual) {
      throw new Error(`Expected needsMultilingual for ${row.id}`);
    }
  }

  for (const intent of EXT_INTENTS) {
    if (counts[intent].hy < minimumPerLocale) {
      throw new Error(
        `Clinic ext multilingual HY coverage for ${intent}: ${counts[intent].hy} < ${minimumPerLocale}`,
      );
    }
    if (counts[intent].ru < minimumPerLocale) {
      throw new Error(
        `Clinic ext multilingual RU coverage for ${intent}: ${counts[intent].ru} < ${minimumPerLocale}`,
      );
    }
  }

  return counts;
}
