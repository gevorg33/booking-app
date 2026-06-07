import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ClinicTestResultIntent } from './ai-clinic-test-result.util.js';

export interface ClinicTestResultEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ClinicTestResultIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian dashboard clinic lab result entry and release (i18n-clinic-v2-ai-2). */
export const CLINIC_TEST_RESULT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic lab result entry and release (dashboard only):
  - enter_test_result: hy «մուտքագրիր WBC 12.5», «գրանցիր արդյունք CBC», «նշիր glucose» + պատվեր/արդյունք + optional #id; ru «введи WBC 12.5», «запиши результат CBC», «укажи glucose» + для заказа/результата + optional #id. Requires measurementCode, value, orderId or resultId. NOT create_test_order and NOT release_test_result.
  - release_test_result: hy «ազատիր արդյունքները», «հրապարակիր լաբորատոր արդյունքները», «տար հասանելի արդյունքները» + optional հիվանդ/պատվեր; ru «выпусти результаты», «опубликуй лабораторные результаты», «сделай доступными результаты» + optional пациент/заказ. Chart release — NOT notify_patient_result_ready (notification).
  - Keep Latin measurement codes (WBC, CBC, glucose, hemoglobin) inside hy/ru sentences.`;

export const MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS: ClinicTestResultEvalScenario[] =
  [
    {
      id: 'hy-wbc-order-hash',
      locale: 'hy',
      prompt: 'Մուտքագրիր WBC 12.5 պատվերի համար #abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'WBC',
        value: '12.5',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-cbc-order',
      locale: 'hy',
      prompt: 'Գրանցիր CBC արդյունք 4.2 պատվեր abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'CBC',
        value: '4.2',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-hemoglobin-maria',
      locale: 'hy',
      prompt: 'Նշիր hemoglobin 13.1 Մարիայի պատվեր abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'hemoglobin',
        value: '13.1',
        orderId: 'abc123',
        customerName: 'Մարիա',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-glucose-order',
      locale: 'hy',
      prompt: 'Ավելացրի՛ր glucose 95 պատվեր #ord-42',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'glucose',
        value: '95',
        orderId: 'ord-42',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-wbc-result-id',
      locale: 'hy',
      prompt: 'Մուտքագրիր WBC 12.5 արդյունք #res-99',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'WBC',
        value: '12.5',
        resultId: 'res-99',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-sodium-order',
      locale: 'hy',
      prompt: 'Գրանցիր sodium 140 պատվեր abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'sodium',
        value: '140',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-release-to-patient',
      locale: 'hy',
      prompt: 'Ազատիր արդյունքները հիվանդի համար',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      needsMultilingual: true,
    },
    {
      id: 'hy-maria-lab-results',
      locale: 'hy',
      prompt: 'Հրապարակիր Մարիայի լաբորատոր արդյունքները',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-order-release',
      locale: 'hy',
      prompt: 'Տար հասանելի թեստի արդյունքները պատվերի abc123 համար',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'hy-visible-maria',
      locale: 'hy',
      prompt: 'Դարձրու տեսանելի Մարիային լաբորատոր արդյունքները',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-result-id-release',
      locale: 'hy',
      prompt: 'Ազատիր արդյունքը #res-99 հիվանդի համար',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { resultId: 'res-99' },
      needsMultilingual: true,
    },
    {
      id: 'hy-reviewed-maria',
      locale: 'hy',
      prompt: 'Հրապարակիր վերանայված արդյունքները Մարիայի համար',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'ru-wbc-order-hash',
      locale: 'ru',
      prompt: 'Введи WBC 12.5 для заказа #abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'WBC',
        value: '12.5',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-cbc-order',
      locale: 'ru',
      prompt: 'Запиши результат CBC 4.2 для заказа abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'CBC',
        value: '4.2',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-hemoglobin-order',
      locale: 'ru',
      prompt: 'Укажи hemoglobin 13.1 для заказа abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'hemoglobin',
        value: '13.1',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-glucose-order',
      locale: 'ru',
      prompt: 'Введи glucose 95 для заказа #ord-42',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'glucose',
        value: '95',
        orderId: 'ord-42',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-wbc-result-id',
      locale: 'ru',
      prompt: 'Введи WBC 12.5 для результата #res-99',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'WBC',
        value: '12.5',
        resultId: 'res-99',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-sodium-order',
      locale: 'ru',
      prompt: 'Запиши sodium 140 для заказа abc123',
      expectedAction: 'enter_test_result',
      rescueReason: 'enter_test_result',
      paramsPartial: {
        measurementCode: 'sodium',
        value: '140',
        orderId: 'abc123',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-release-to-patient',
      locale: 'ru',
      prompt: 'Выпусти результаты пациенту',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      needsMultilingual: true,
    },
    {
      id: 'ru-maria-lab-results',
      locale: 'ru',
      prompt: 'Опубликуй лабораторные результаты Марии',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-order-release',
      locale: 'ru',
      prompt: 'Сделай доступными результаты анализа для заказа abc123',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { orderId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'ru-visible-maria',
      locale: 'ru',
      prompt: 'Сделай видимыми лабораторные результаты для Марии',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-result-id-release',
      locale: 'ru',
      prompt: 'Выпусти результат #res-99 пациенту',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { resultId: 'res-99' },
      needsMultilingual: true,
    },
    {
      id: 'ru-reviewed-maria',
      locale: 'ru',
      prompt: 'Опубликуй проверенные результаты для Марии',
      expectedAction: 'release_test_result',
      rescueReason: 'release_test_result',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
  ];
