import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  CLINIC_V2_SURFACE_SCENARIOS,
  type ClinicV2Surface,
  type ClinicV2SurfaceScenario,
} from './ai-clinic-v2-6.fixtures.js';

export type BilingualClinicV2Prompt = { hy: string; ru: string };

function tx(hy: string, ru: string): BilingualClinicV2Prompt {
  return { hy, ru };
}

/** HY/RU prompt variants keyed by ai-cmd-clinic-v2-6 scenario id (i18n-clinic-v2-ai-6). */
export const CLINIC_V2_MULTILINGUAL_TRANSLATIONS: Record<
  string,
  BilingualClinicV2Prompt
> = {
  'dashboard-create-cbc-lipid-maria-tomorrow': tx(
    'Պատվիրի՛ր CBC և lipid panel Մարիայի վաղը այցի համար',
    'Закажи CBC и lipid panel для визита Марии завтра',
  ),
  'dashboard-create-cbc-john-friday': tx(
    'Ավելացրի՛ր CBC պատվեր Ջոնի համար ուրբաթ',
    'Оформи заказ CBC для Джона в пятницу',
  ),
  'dashboard-create-bmp-and-cbc': tx(
    'Ստեղծի՛ր BMP և CBC թեստ Աննայի վաղը այցի համար',
    'Добавь BMP и CBC для пациента Анны завтра',
  ),
  'dashboard-create-lipid-panel-only': tx(
    'Պատվիրի՛ր lipid panel Մարիայի համար վաղը',
    'Закажи lipid panel для Марии завтра',
  ),
  'dashboard-list-maria-tomorrow': tx(
    'Ցույց տուր Մարիայի լաբորատոր պատվերները վաղը',
    'Покажи лабораторные заказы Марии на завтра',
  ),
  'dashboard-list-pending-queue': tx(
    'Ցուցակավորի՛ր սպասող լաբորատոր պատվերները այս շաբաթ',
    'Список ожидающих лабораторных заказов на этой неделе',
  ),
  'dashboard-list-patient-orders': tx(
    'Ինչ թեստի պատվերներ ունի Մարիան վաղը',
    'Какие тестовые заказы у Марии на завтра',
  ),
  'dashboard-enter-wbc-order-hash': tx(
    'Մուտքագրիր WBC 12.5 պատվերի համար #abc123',
    'Введи WBC 12.5 для заказа #abc123',
  ),
  'dashboard-enter-cbc-order': tx(
    'Գրանցիր CBC արդյունք 4.2 պատվեր abc123',
    'Запиши результат CBC 4.2 для заказа abc123',
  ),
  'dashboard-release-release-to-patient': tx(
    'Ազատիր արդյունքները հիվանդի համար',
    'Выпусти результаты пациенту',
  ),
  'dashboard-release-maria-lab-results': tx(
    'Հրապարակիր Մարիայի լաբորատոր արդյունքները',
    'Выпусти лабораторные результаты Марии',
  ),
  'dashboard-chart-maria': tx(
    'Բացատրիր Մարիայի հիվանդի քարտը',
    'Объясни карту пациента Марии',
  ),
  'dashboard-chart-allergies': tx(
    'Ցույց տուր ալերգիաները և վերջին այցերը Մարիայի համար',
    'Покажи аллергии и последние визиты для Марии',
  ),
  'dashboard-chart-pending': tx(
    'Ինչ սպասող լաբորատոր արդյունքներ ունի Մարիան իր քարտում',
    'Какие ожидающие лабораторные результаты есть у Марии в карте',
  ),
  'provider-list-my-collection-queue': tx(
    'Ցույց տուր իմ հավաքման հերթականությունը այսօր',
    'Покажи мою очередь на забор сегодня',
  ),
  'provider-list-specimen-queue-today': tx(
    'Ինչ կա իմ նմուշի հավաքման հերթականությունում այսօր',
    'Что в моей очереди забора образцов сегодня',
  ),
  'provider-list-list-collection-worklist': tx(
    'Ցուցակավորիր իմ collection queue-ն այսօր',
    'Список моей collection queue на сегодня',
  ),
  'provider-list-lab-collection-queue': tx(
    'Իմ լաբորատոր հավաքման հերթականությունը',
    'Моя лабораторная очередь на забор',
  ),
  'provider-list-draw-list-today': tx(
    'Ումից պետք է արյուն վերցնեմ այսօր',
    'У кого мне нужно взять кровь сегодня',
  ),
  'provider-list-collection-worklist': tx(
    'Ցույց տուր այսօրվա collection worklist-ը',
    'Покажи сегодняшний collection worklist',
  ),
  'provider-list-waiting-specimens': tx(
    'Կա՞ հավաքման սպասող նմուշներ իմ գրաֆիկում',
    'Есть ли образцы, ожидающие забора, в моём расписании',
  ),
  'provider-list-patients-to-collect': tx(
    'Հավաքման հերթականություն իմ հիվանդների համար այսօր',
    'Очередь на забор для моих пациентов сегодня',
  ),
  'provider-list-my-draw-queue': tx(
    'Ինչ նմուշներ կան իմ draw queue-ում',
    'Какие образцы в моей очереди на забор',
  ),
  'provider-list-collection-queue-question': tx(
    'Կա՞ հավաքման նմուշներ այսօր',
    'Есть ли у меня образцы на забор сегодня',
  ),
  'provider-mark-mark-maria-collected': tx(
    'Նշիր նմուշը հավաքված Մարիայի համար',
    'Отметь образец собранным для Марии',
  ),
  'provider-mark-maria-specimen-collected': tx(
    'Նշիր Մարիայի նմուշը որպես հավաքված',
    'Отметь образец Марии как собранный',
  ),
  'provider-mark-john-collected': tx(
    'Նմուշը հավաքված է հիվանդ Ջոնի համար',
    'Образец собран для пациента Джона',
  ),
  'provider-mark-cbc-maria': tx(
    'Նշիր հավաքված CBC նմուշը Մարիայի համար',
    'Отметь собранным CBC образец для Марии',
  ),
  'provider-mark-specimen-id-collected': tx(
    'Նշիր նմուշը #abc123 հավաքված',
    'Отметь образец #abc123 собранным',
  ),
  'provider-mark-sample-collected-maria': tx(
    'Հավաքեցի նմուշը Մարիա Լոպեզի համար',
    'Я собрал образец для Марии Лопез',
  ),
  'provider-mark-order-specimen-collected': tx(
    'Նշիր նմուշը հավաքված պատվեր abc123',
    'Отметь образец собранным заказ abc123',
  ),
  'provider-mark-visit-specimen-collected': tx(
    'Նմուշը հավաքված է Մարիայի այցի համար',
    'Образец собран для Марии после визита',
  ),
  'provider-mark-mark-collected-prompt': tx(
    'Նշիր հավաքված նմուշը Սոֆիայի համար',
    'Отметь собранным образец для Софии',
  ),
  'provider-mark-done-drawing-maria': tx(
    'Ավարտեցի արյան վերցումը Մարիայի հետ — նշիր նմուշը հավաքված',
    'Закончил забор у Марии — отметь образец собранным',
  ),
  'customer-list-app-lab-results': tx(
    'Ցույց տուր իմ լաբորատոր արդյունքները հավելվածում',
    'Покажи мои лабораторные результаты в приложении',
  ),
  'customer-list-open-my-results-tab': tx(
    'Բացիր My Results բաժինը',
    'Открой вкладку Мои результаты',
  ),
  'customer-list-released-to-account': tx(
    'Ցույց տուր կլինիկայի ազատած արդյունքները իմ հաշվում',
    'Покажи что клиника выпустила в мой аккаунт',
  ),
  'customer-list-app-cbc-ready': tx(
    'Կա՞ CBC արդյունքներ consumer հավելվածում',
    'Есть ли у меня результаты CBC в приложении',
  ),
  'customer-list-my-results-app': tx(
    'Իմ լաբ արդյունքները հավելվածում',
    'Мои лабораторные результаты в приложении',
  ),
  'customer-list-check-app-results': tx(
    'Ստուգիր իմ թեստի արդյունքները My Results-ում',
    'Проверь мои результаты тестов в Мои результаты',
  ),
  'customer-list-any-released-app': tx(
    'Կա՞ թողարկված լաբ արդյունքներ իմ հաշվում',
    'Есть ли выпущенные результаты в моём аккаунте',
  ),
  'customer-list-see-results-app': tx(
    'Կարո՞ղ եմ տեսնել լաբ արդյունքները հավելվածում հիմա',
    'Могу ли я увидеть результаты в приложении сейчас',
  ),
  'customer-list-account-lab-panel': tx(
    'Ցույց տուր lipid panel արդյունքներ իմ հաշվում',
    'Покажи результаты lipid panel в моём аккаунте',
  ),
  'customer-list-list-app-results': tx(
    'Ցուցակավորիր լաբ արդյունքները կլինիկայի այցերից',
    'Список результатов анализов с моих визитов',
  ),
  'customer-list-ready-in-app': tx(
    'Պատրա՞ստ են թեստի արդյունքները հավելվածում',
    'Готовы ли результаты тестов в приложении',
  ),
  'customer-list-view-my-results': tx(
    'Դիտիր իմ թողարկված թեստի արդյունքները',
    'Просмотри мои выпущенные результаты',
  ),
  'customer-explain-cbc-pending-app': tx(
    'Ինչու է իմ CBC-ն դեռ սպասման մեջ հավելվածում',
    'Почему мой CBC всё ещё в ожидании в приложении',
  ),
  'customer-explain-released-my-results': tx(
    'Ի՞նչ նշանակություն ունի թողարկվածը My Results-ում',
    'Что означает «выпущено» в Мои результаты',
  ),
  'customer-explain-app-not-showing': tx(
    'Ինչու չեմ տեսնում արդյունքներ consumer հավելվածում',
    'Почему я не вижу результаты в приложении',
  ),
  'customer-explain-processing-app': tx(
    'Ինչ նշանակում ունի մշակումը իմ լաբ արդյունքի համար հավելվածում',
    'Что означает обработка для моего результата в приложении',
  ),
  'customer-explain-when-app-ready': tx(
    'Երբ կհայտնվեն իմ լաբ արդյունքները հավելվածում',
    'Когда появятся мои лабораторные результаты в приложении',
  ),
  'customer-explain-reviewed-before-release': tx(
    'Ինչ նշանակում ունի վերանայվածը նախքան My Results',
    'Что означает проверено до появления в Мои результаты',
  ),
  'customer-explain-lipid-app-status': tx(
    'Ինչ է lipid panel արդյունքի կարգավիճակը հավելվածում',
    'Какой статус результата lipid panel в приложении',
  ),
  'customer-explain-waiting-app': tx(
    'Ինչու արդյունքները դեռ սպասում են հավելվածում',
    'Почему результаты всё ещё ожидают в приложении',
  ),
  'customer-explain-pending-meaning-app': tx(
    'Բացատրիր սպասման կարգավիճակը իմ լաբ թեստերի համար',
    'Объясни статус ожидания для моих анализов',
  ),
  'customer-explain-not-in-my-results': tx(
    'Ինչու թեստը դեռ չկա My Results-ում',
    'Почему тест ещё не в Мои результаты',
  ),
  'customer-explain-released-vs-ready': tx(
    'Երբ են արդյունքները նշվում թողարկված հավելվածում',
    'Когда результаты отмечаются как выпущенные в приложении',
  ),
  'customer-explain-explain-pipeline-app': tx(
    'Ինչպե՞ս են լաբ արդյունքները հասնում My Results',
    'Как лабораторные результаты попадают в Мои результаты',
  ),
  'public-list-where-on-page': tx(
    'Որտե՞ղ եմ տեսնում իմ լաբ արդյունքները այս էջում',
    'Где я вижу свои лабораторные результаты на этой странице',
  ),
  'public-list-booking-site-ready': tx(
    'Պատրա՞ստ են արդյունքներս գրանցման կայքում',
    'Готовы ли мои результаты на сайте записи',
  ),
  'public-list-after-clinic-visit': tx(
    'Ցույց տուր արդյունքները կլինիկայում այցելությունից հետո',
    'Покажи результаты после визита в клинику',
  ),
  'public-list-my-results-booking-page': tx(
    'Իմ լաբ արդյունքները գրանցման էջում',
    'Мои лабораторные результаты на странице записи',
  ),
  'public-list-signed-in-results': tx(
    'Կարո՞ղ եմ տեսնել թեստի արդյունքները այստեղ մուտք գործելուց հետո',
    'Могу ли я увидеть результаты здесь после входа',
  ),
  'public-list-check-booking-results': tx(
    'Ստուգիր իմ լաբ արդյունքները այս գրանցման կայքում',
    'Проверь мои лабораторные результаты на этом сайте записи',
  ),
  'public-list-released-booking-page': tx(
    'Ցույց տուր թողարկված արդյունքները այս էջում',
    'Покажи выпущенные результаты на этой странице',
  ),
  'public-list-visit-results-ready': tx(
    'Պատրա՞ստ են արդյունքները իմ այցից այստեղ',
    'Готовы ли результаты с моего визита здесь',
  ),
  'public-list-open-results-section': tx(
    'Բացիր իմ թեստի արդյունքների բաժինը',
    'Открой раздел моих результатов анализов',
  ),
  'public-list-see-cbc-booking': tx(
    'Կա՞ CBC արդյունքներ գրանցման էջում',
    'Есть ли у меня результаты CBC на странице записи',
  ),
  'public-list-list-portal-results': tx(
    'Ցուցակավորիր իմ լաբ արդյունքները հիվանդի պորտալում',
    'Список моих лабораторных результатов на портале пациента',
  ),
  'public-list-any-results-here': tx(
    'Կա՞ թեստի արդյունքներ հասանելի այստեղ',
    'Есть ли у меня результаты анализов здесь',
  ),
  'public-explain-released-faq': tx(
    'Ի՞նչ նշանակություն ունի թողարկվածը լաբ արդյունքների համար',
    'Что означает выпущено для лабораторных результатов',
  ),
  'public-explain-not-showing-after-visit': tx(
    'Ինչու չեմ տեսնում լաբ արդյունքները այցելությունից հետո',
    'Почему я не вижу лабораторные результаты после визита',
  ),
  'public-explain-when-on-page': tx(
    'Երբ կհայտնվեն արդյունքները այս էջում',
    'Когда результаты появятся на этой странице',
  ),
  'public-explain-pending-booking-faq': tx(
    'Ինչ նշանակում ունի սպասման կարգավիճակը լաբ թեստերի համար',
    'Что означает ожидание для лабораторных тестов',
  ),
  'public-explain-processing-booking-faq': tx(
    'Ինչու է իմ լաբ թեստը դեռ մշակման մեջ',
    'Почему мой анализ всё ещё обрабатывается',
  ),
  'public-explain-reviewed-booking-faq': tx(
    'Ինչ նշանակում ունի վերանայվածը նախքան արդյունքների հրապարակումը',
    'Что означает проверено до публикации результатов',
  ),
  'public-explain-cbc-not-here': tx(
    'Ինչու չեմ տեսնում CBC արդյունքները այստեղ',
    'Почему я не вижу результаты CBC здесь',
  ),
  'public-explain-status-booking-page': tx(
    'Բացատրիր լաբ արդյունքի կարգավիճակը գրանցման էջում',
    'Объясни статус лабораторного результата на странице записи',
  ),
  'public-explain-waiting-booking-site': tx(
    'Ինչու արդյունքները դեռ սպասում են գրանցման կայքում',
    'Почему результаты всё ещё ожидают на сайте записи',
  ),
  'public-explain-ready-vs-released-page': tx(
    'Երբ են թեստի արդյունքները նշվում թողարկված',
    'Когда результаты анализов отмечаются как выпущенные',
  ),
  'public-explain-lipid-status-page': tx(
    'Ինչ է lipid panel արդյունքի կարգավիճակը',
    'Какой статус результата lipid panel',
  ),
  'public-explain-pipeline-booking-faq': tx(
    'Քանի՞ ժամանակում կհայտնվեն լաբ արդյունքները այստեղ',
    'Сколько ждать появления лабораторных результатов здесь',
  ),
};

export interface ClinicV2MultilingualEvalScenario extends ClinicV2SurfaceScenario {
  sourceScenarioId: string;
  locale: AiEvalLocale;
  needsMultilingual: true;
}

/** Armenian/Russian classifier NL parity for every clinic v2 surface scenario (i18n-clinic-v2-ai-6). */
export const CLINIC_V2_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic v2 surface routing (dashboard | provider | customer | public):
  - dashboard: hy/ru create_test_order, list_test_orders, enter_test_result, release_test_result, explain_patient_chart — staff lab orders/results/chart only
  - provider: hy/ru list_my_collection_queue, mark_specimen_collected — own collection worklist
  - customer: hy/ru list_my_test_results, explain_result_status — My Results in consumer app phrasing
  - public: hy/ru list_my_test_results, explain_result_status — booking-page / portal phrasing
  - Keep Latin catalog codes (CBC, BMP, lipid panel, WBC) and ids (#abc123) inside hy/ru sentences; extract customerName exactly as written (Մարիա/Мария).`;

function buildClinicV2MultilingualEvalScenarios(): ClinicV2MultilingualEvalScenario[] {
  return CLINIC_V2_SURFACE_SCENARIOS.flatMap((scenario) => {
    const translation = CLINIC_V2_MULTILINGUAL_TRANSLATIONS[scenario.id];
    if (!translation) {
      throw new Error(`Missing clinic v2 HY/RU translation for ${scenario.id}`);
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

export const MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS: ClinicV2MultilingualEvalScenario[] =
  buildClinicV2MultilingualEvalScenarios();

export function assertClinicV2MultilingualParity(
  scenarios: ClinicV2SurfaceScenario[] = CLINIC_V2_SURFACE_SCENARIOS,
): Record<ClinicV2Surface, number> {
  const missing = scenarios
    .map((scenario) => scenario.id)
    .filter((id) => !CLINIC_V2_MULTILINGUAL_TRANSLATIONS[id]);
  if (missing.length > 0) {
    throw new Error(
      `Clinic v2 multilingual parity missing ${missing.length} scenario(s): ${missing.join(', ')}`,
    );
  }
  const counts = scenarios.reduce(
    (acc, scenario) => {
      acc[scenario.surface] += 2;
      return acc;
    },
    {
      dashboard: 0,
      provider: 0,
      customer: 0,
      public: 0,
    } satisfies Record<ClinicV2Surface, number>,
  );
  return counts;
}
