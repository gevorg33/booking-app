import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  CLINIC_COMPOUND_SCENARIOS,
  type ClinicCompoundScenario,
  type ClinicCompoundSurface,
} from './ai-clinic-compound.fixtures.js';

export type BilingualClinicCompoundPrompt = { hy: string; ru: string };

function tx(hy: string, ru: string): BilingualClinicCompoundPrompt {
  return { hy, ru };
}

/** HY/RU compound prompts keyed by ai-cmd-clinic-v2-7 scenario id (i18n-clinic-v2-ai-7). */
export const CLINIC_COMPOUND_MULTILINGUAL_TRANSLATIONS: Record<
  string,
  BilingualClinicCompoundPrompt
> = {
  'order-lipid-notify-maria': tx(
    'Պատվիրի՛ր lipid panel Մարիայի այցի համար և տեղեկացրիր նրան, երբ արդյունքները պատրաստ լինեն',
    'Закажи lipid panel для визита Марии и уведоми её, когда результаты будут готовы',
  ),
  'place-cbc-then-notify-john': tx(
    'Պատվիր CBC Ջոնի համար ուրբաթ և ուղարկ արդյունքներ պատրաստ է նամակ, երբ հասանելի լինի',
    'Оформи CBC для Джона в пятницу и отправь email о готовности результатов, когда будут доступны',
  ),
  'book-lipid-notify-patient': tx(
    'Պատվիր lipid panel Աննայի համար և տեղեկացրիր հիվանդին, երբ լաբորատոր արդյունքները պատրաստ լինեն',
    'Закажи lipid panel для Анны и уведоми пациента, когда лабораторные результаты будут готовы',
  ),
  'request-bmp-notify': tx(
    'Պատվիր BMP և CBC Ջեյմսի այցի համար վաղը; ապա տեղեկացրիր նրան, երբ արդյունքները պատրաստ լինեն',
    'Закажи BMP и CBC для визита Джеймса завтра; затем уведоми его, когда результаты будут готовы',
  ),
  'create-order-notify-whatsapp': tx(
    'Ստեղծիր լաբորատոր պատվեր CBC Սոֆիայի համար և ուղարկ WhatsApp, երբ թեստի արդյունքները պատրաստ լինեն',
    'Создай лабораторный заказ CBC для Софии и отправь WhatsApp, когда результаты анализа будут готовы',
  ),
  'order-panel-alert-ready': tx(
    'Պատվիր metabolic panel Ալեքսի համար և ծանուցիր հիվանդին, որ արդյունքները հասանելի են',
    'Закажи metabolic panel для Алекса и уведоми пациента, что результаты доступны',
  ),
  'blood-work-notify': tx(
    'Պատվիր արյան աշխատանք CBC Մարիայի համար և տեղեկացրիր, երբ արդյունքները պատրաստ լինեն',
    'Оформи забор крови CBC для Марии и уведоми, когда результаты будут готовы',
  ),
  'lipid-then-result-ready': tx(
    'Ավելացրիր lipid panel հիվանդ Ելենայի համար և հետո տեղեկացրիր նրան, երբ արդյունքները պատրաստ լինեն',
    'Добавь lipid panel для пациента Елены и затем уведоми её, когда результаты будут готовы',
  ),
  'cbc-notify-after-order': tx(
    'Պատվիր CBC Մարիայի այցի համար և նաև տեղեկացրիր նրան, երբ լաբորատոր արդյունքները պատրաստ լինեն',
    'Закажи CBC для приёма Марии и также уведоми её, когда лабораторные результаты будут готовы',
  ),
  'panel-order-message-ready': tx(
    'Պատվիր lipid panel Ջոնի համար և հաղորդագրություն ուղարկիր հիվանդին, երբ արդյունքները պատրաստ լինեն',
    'Закажи lipid panel для Джона и отправь сообщение пациенту, когда результаты будут готовы',
  ),
  'semicolon-order-notify': tx(
    'Պատվիր CBC Աննայի համար վաղը; տեղեկացրիր նրան, երբ արդյունքները պատրաստ լինեն',
    'Закажи CBC для Анны завтра; уведоми её, когда результаты будут готовы',
  ),
  'book-panel-staff-notify': tx(
    'Պատվիր lipid panel Մարիայի այցի համար և տեղեկացրիր նրան, երբ արդյունքները պատրաստ լինեն',
    'Закажи lipid panel для визита Марии и уведоми её, когда результаты будут готовы',
  ),
  'book-lipid-notify-me': tx(
    'Ամրագրիր lipid panel և տեղեկացրիր ինձ, երբ արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel и уведоми меня, когда результаты будут готовы',
  ),
  'schedule-cbc-explain-ready': tx(
    'Ամրագրիր CBC և բացատրիր, երբ իմ արդյունքները պատրաստ կլինեն',
    'Запиши CBC и объясни, когда мои результаты будут готовы',
  ),
  'reserve-panel-tell-me': tx(
    'Ամրագրիր lipid panel և ասա ինձ, երբ լաբորատոր արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel и скажи мне, когда лабораторные результаты будут готовы',
  ),
  'book-blood-work-alert': tx(
    'Ամրագրիր արյան աշխատանք CBC և ծանուցիր ինձ, երբ արդյունքները հասանելի լինեն',
    'Забронируй забор крови CBC и уведоми меня, когда результаты будут доступны',
  ),
  'book-panel-then-when-ready': tx(
    'Ամրագրիր lipid panel հետո տեղեկացրիր ինձ, երբ արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel потом уведоми меня, когда результаты будут готовы',
  ),
  'book-cbc-and-when-ready': tx(
    'Ամրագրիր CBC և երբ կլինեն պատրաստ իմ արդյունքները',
    'Забронируй CBC и когда будут готовы мои результаты?',
  ),
  'schedule-panel-explain-status': tx(
    'Ամրագրիր lipid panel և բացատրիր արդյունքների կարգավիճակը, երբ պատրաստ լինեն',
    'Запиши lipid panel и объясни статус результатов, когда они будут готовы',
  ),
  'book-metabolic-notify-me': tx(
    'Ամրագրիր metabolic panel և տեղեկացրիր ինձ, երբ թեստի արդյունքները պատրաստ լինեն',
    'Забронируй metabolic panel и уведоми меня, когда результаты анализа будут готовы',
  ),
  'reserve-lipid-results-ready': tx(
    'Ամրագրիր lipid panel; տեղեկացրիր ինձ, երբ արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel; уведоми меня, когда результаты будут готовы',
  ),
  'book-cbc-also-explain': tx(
    'Ամրագրիր CBC և նաև բացատրիր, երբ արդյունքները կհայտնվեն My Results-ում',
    'Забронируй CBC и также объясни, когда результаты появятся в Мои результаты',
  ),
  'book-panel-my-results': tx(
    'Ամրագրիր lipid panel և ասա ինձ, երբ իմ լաբորատոր արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel и скажи мне, когда мои лабораторные результаты будут готовы',
  ),
  'schedule-bmp-ready-faq': tx(
    'Ամրագրիր BMP և երբ են պատրաստ իմ արդյունքները',
    'Запиши BMP и когда будут готовы мои результаты?',
  ),
  'book-lipid-tell-me-ready': tx(
    'Ամրագրիր lipid panel և ասա ինձ, երբ արդյունքները պատրաստ լինեն այս էջում',
    'Забронируй lipid panel и скажи мне, когда результаты будут готовы на этой странице',
  ),
  'schedule-cbc-explain-ready-public': tx(
    'Ամրագրիր CBC և բացատրիր, երբ արդյունքները պատրաստ կլինեն',
    'Запиши CBC и объясни, когда результаты будут готовы',
  ),
  'book-panel-notify-me-public': tx(
    'Ամրագրիր lipid panel և տեղեկացրիր ինձ, երբ լաբորատոր արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel и уведоми меня, когда лабораторные результаты будут готовы',
  ),
  'reserve-cbc-when-ready': tx(
    'Ամրագրիր CBC և երբ կլինեն պատրաստ իմ արդյունքները',
    'Забронируй CBC и когда будут готовы мои результаты?',
  ),
  'book-blood-work-ready-faq': tx(
    'Ամրագրիր արյան աշխատանք և բացատրիր, երբ թեստի արդյունքները պատրաստ կլինեն',
    'Забронируй забор крови и объясни, когда результаты анализа будут готовы',
  ),
  'book-lipid-then-ready': tx(
    'Ամրագրիր lipid panel հետո ասա ինձ, երբ արդյունքները պատրաստ լինեն',
    'Забронируй lipid panel потом скажи мне, когда результаты будут готовы',
  ),
  'schedule-panel-results-page': tx(
    'Ամրագրիր lipid panel և բացատրիր արդյունքների կարգավիճակը, երբ կհայտնվեն այս էջում',
    'Запиши lipid panel и объясни статус результатов, когда они появятся на этой странице',
  ),
  'book-cbc-alert-ready': tx(
    'Ամրագրիր CBC և ծանուցիր ինձ, երբ արդյունքները հասանելի լինեն',
    'Забронируй CBC и уведоми меня, когда результаты будут доступны',
  ),
  'book-metabolic-notify-public': tx(
    'Ամրագրիր metabolic panel և տեղեկացրիր ինձ, երբ արդյունքները պատրաստ լինեն',
    'Забронируй metabolic panel и уведоми меня, когда результаты будут готовы',
  ),
  'semicolon-book-explain': tx(
    'Ամրագրիր lipid panel; բացատրիր, երբ արդյունքները պատրաստ կլինեն',
    'Забронируй lipid panel; объясни, когда результаты будут готовы',
  ),
  'book-panel-my-lab-results': tx(
    'Ամրագրիր lipid panel և երբ են պատրաստ իմ լաբորատոր արդյունքները',
    'Забронируй lipid panel и когда будут готовы мои лабораторные результаты?',
  ),
  'schedule-cbc-ready-public': tx(
    'Ամրագրիր CBC և ասա ինձ, երբ արդյունքները պատրաստ լինեն այցից հետո',
    'Запиши CBC и скажи мне, когда результаты будут готовы после визита',
  ),
};

export const CLINIC_COMPOUND_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic lab compounds (book/order + result notify):
  - dashboard hy/ru: "պատվիր lipid panel … և տեղեկացրիր" / "закажи CBC … и уведоми" → compound: create_test_order then notify_patient_result_ready
  - customer hy/ru: "ամրագրիր lipid panel և տեղեկացրիր ինձ" / "забронируй CBC и уведоми меня" → compound: book_nearest_slot then explain_result_status (patient FAQ — NOT notify_patient_result_ready)
  - public hy/ru: "ամրագրիր CBC և բացատրիր արդյունքները" / "забронируй lipid panel и скажи когда результаты готовы" → compound: book_appointment then explain_result_status
  - Split on և/հետո/ապա/նաև/; and и/затем/потом/а также/; — NOT single intent when both lab book/order and result-ready follow-up appear.`;

export interface ClinicCompoundMultilingualEvalScenario extends ClinicCompoundScenario {
  sourceScenarioId: string;
  locale: AiEvalLocale;
  needsMultilingual: true;
}

function buildClinicCompoundMultilingualEvalScenarios(): ClinicCompoundMultilingualEvalScenario[] {
  return CLINIC_COMPOUND_SCENARIOS.flatMap((scenario) => {
    const translation = CLINIC_COMPOUND_MULTILINGUAL_TRANSLATIONS[scenario.id];
    if (!translation) {
      throw new Error(
        `Missing clinic compound HY/RU translation for ${scenario.id}`,
      );
    }
    return (['hy', 'ru'] as const).map((locale) => ({
      ...scenario,
      sourceScenarioId: scenario.id,
      id: `${scenario.id}-${locale}`,
      locale,
      prompt: translation[locale],
      needsMultilingual: true as const,
    }));
  });
}

export const MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS: ClinicCompoundMultilingualEvalScenario[] =
  buildClinicCompoundMultilingualEvalScenarios();

export const MULTILINGUAL_CLINIC_COMPOUND_RESCUE_EVAL_SCENARIOS =
  MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS.filter(
    (scenario) => scenario.misclassifiedAction,
  );

export function assertClinicCompoundMultilingualParity(
  scenarios: ClinicCompoundScenario[] = CLINIC_COMPOUND_SCENARIOS,
): Record<ClinicCompoundSurface, number> {
  const missing = scenarios
    .map((scenario) => scenario.id)
    .filter((id) => !CLINIC_COMPOUND_MULTILINGUAL_TRANSLATIONS[id]);
  if (missing.length > 0) {
    throw new Error(
      `Clinic compound multilingual parity missing ${missing.length} scenario(s): ${missing.join(', ')}`,
    );
  }
  const counts = scenarios.reduce(
    (acc, scenario) => {
      acc[scenario.surface] += 2;
      return acc;
    },
    {
      dashboard: 0,
      customer: 0,
      public: 0,
    } satisfies Record<ClinicCompoundSurface, number>,
  );
  return counts;
}
