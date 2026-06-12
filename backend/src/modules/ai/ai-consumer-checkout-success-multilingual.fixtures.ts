import { EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS } from './ai-consumer-checkout-success-en.fixtures.js';
import { EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS } from './ai-consumer-checkout-success.fixtures.js';
import type { ConsumerCheckoutSuccessAspect } from './ai-consumer-checkout-success.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ConsumerCheckoutSuccessMultilingualScenario = {
  id: string;
  enScenarioId: string;
  source: 'rec-6' | 'rec-7';
  locale: AiEvalLocale;
  prompt: string;
  aspect: ConsumerCheckoutSuccessAspect;
  rescueReason: 'explain_consumer_checkout_success';
};

export const CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian consumer checkout success screen (logged-in app):
  - explain_consumer_checkout_success: hy «բացատրել booking success screen consumer app-ում»; ru «объясни экран успешной записи в приложении». Covers summary, View appointments / Book another service, You might also like, Dismiss recommendations. NOT explain_checkout_recommendations (product detail).`;

const REC6_I18N: Record<string, { hy: string; ru: string }> = {
  'explain-success-screen-all': {
    hy: 'Բացատրել booking success screen-ը consumer app-ում հաստատումից հետո',
    ru: 'Объясни экран успешной записи в consumer app после подтверждения',
  },
  'what-shown-confirmed': {
    hy: 'Ինչ է ցույց տրվում booking confirmed screen-ում salon app-ում',
    ru: 'Что показывается на экране подтверждения записи в salon app',
  },
  'confirmation-summary': {
    hy: 'Ինչ կա confirmation summary-ում app-ում ամրագրումից հետո',
    ru: 'Что на экране подтверждения после записи в приложении',
  },
  'green-checkmark': {
    hy: 'Ինչ է նշանակում green checkmark-ը consumer app-ում ամրագրումից հետո',
    ru: 'Что означает зелёная галочка после записи в consumer app',
  },
  'time-range-display': {
    hy: 'Ինչպես է ցույց տրվում appointment time-ը success screen-ում app-ում',
    ru: 'Как показывается время записи на экране успеха в приложении',
  },
  'manage-from-account-hint': {
    hy: 'Ինչ է նշանակում manage appointment from account hint-ը success screen-ում',
    ru: 'Что значит подсказка управления записью из аккаунта на экране успеха',
  },
  'view-appointments-button': {
    hy: 'Ինչ է անում View appointments-ը booking success screen-ում app-ում',
    ru: 'Что делает кнопка View appointments на экране успешной записи в app',
  },
  'book-another-button': {
    hy: 'Ինչ է անում Book another service-ը consumer app-ում հաստատումից հետո',
    ru: 'Что делает Book another service после подтверждения в consumer app',
  },
  'next-steps-success': {
    hy: 'Ինչ կարող եմ անել checkout success screen-ում salon app-ում',
    ru: 'Что я могу сделать дальше на экране успеха checkout в salon app',
  },
  'when-product-cards-appear': {
    hy: 'Երբ են ցուցադրվում product cards-ը checkout success-ում consumer app-ում',
    ru: 'Когда появляются карточки товаров на checkout success в consumer app',
  },
  'when-section-shown': {
    hy: 'Երբ է ցուցադրվում You might also like section-ը app-ում ամրագրումից հետո',
    ru: 'Когда показывается секция You might also like после записи в app',
  },
  'no-recommendations-section': {
    hy: 'Ինչու recommendations section չկա success screen-ում app-ում',
    ru: 'Почему нет секции рекомендаций на экране успеха в приложении',
  },
  'payment-summary-on-success': {
    hy: 'Կա՞ payment summary booking confirmed screen-ում consumer app-ում',
    ru: 'Есть ли сводка оплаты на экране подтверждения записи в consumer app',
  },
  'success-screen-walkthrough': {
    hy: 'Նկարագրիր consumer app success screen-ը ամրագրումից հետո',
    ru: 'Расскажи про экран consumer app после завершения записи',
  },
  'cards-before-buttons': {
    hy: 'Product cards-ը action buttons-ից առաջ են success screen-ում app-ում',
    ru: 'Карточки товаров появляются раньше кнопок на success screen в app',
  },
};

const REC7_I18N: Record<string, { hy: string; ru: string }> = {
  'en-after-confirm-what-see': {
    hy: 'Ինչ պետք է տեսնեմ salon app-ում հաստատումից անմիջապես հետո',
    ru: 'Что я должен увидеть сразу после подтверждения записи в salon app',
  },
  'en-confirmation-page-overview': {
    hy: 'Պատմիր confirmation page-ի մասին consumer app-ում',
    ru: 'Расскажи про страницу подтверждения в consumer app',
  },
  'en-success-to-appointments': {
    hy: 'Ինչպես success screen-ից անցնեմ appointments-ին app-ում',
    ru: 'Как перейти с экрана успеха к моим записям в приложении',
  },
  'en-start-another-booking': {
    hy: 'Ինչպես սկսել նոր ամրագրում success screen-ից app-ում',
    ru: 'Как начать новую запись с экрана успеха в приложении',
  },
  'en-dismiss-button-meaning': {
    hy: 'Ինչ է անում Dismiss recommendations-ը app success screen-ում',
    ru: 'Что делает Dismiss recommendations на экране успеха в app',
  },
  'en-hide-you-might-also-like': {
    hy: 'Ինչպես թաքցնել You might also like-ը consumer app-ում ամրագրումից հետո',
    ru: 'Как скрыть You might also like после записи в consumer app',
  },
  'en-dismiss-product-cards': {
    hy: 'Ինչ է լինում dismiss անելիս product cards-ը checkout success-ում app-ում',
    ru: 'Что происходит при закрытии карточек товаров на checkout success в app',
  },
  'en-close-recommendations-section': {
    hy: 'Կարո՞ղ եմ փակել recommendations section-ը app success screen-ում',
    ru: 'Можно ли закрыть секцию рекомендаций на экране успеха в app',
  },
  'en-x-button-recommendations': {
    hy: 'Ինչ է X button-ը You might also like-ում consumer app-ում',
    ru: 'Что делает кнопка X в секции You might also like в consumer app',
  },
  'en-dismiss-come-back': {
    hy: 'Dismiss անելուց հետո recommendations-ը կվերադառնա՞ app success screen-ում',
    ru: 'Вернутся ли рекомендации после dismiss на экране успеха в app',
  },
  'en-dismiss-cancel-booking': {
    hy: 'Dismiss recommendations-ը չեղարկո՞ւմ է ամրագրումը consumer app-ում',
    ru: 'Отменяет ли dismiss рекомендаций мою запись в consumer app',
  },
  'en-section-disappeared': {
    hy: 'Ինչու recommended products section-ը անհետացավ success screen-ում app-ում',
    ru: 'Почему секция recommended products исчезла на экране успеха в app',
  },
  'en-after-hide-what-stays': {
    hy: 'Ինչ է մնում էկran-ում recommendations թաքցնելուց հետo consumer app-ում',
    ru: 'Что остаётся на экране после скрытия рекомендаций в consumer app',
  },
  'en-explain-close-button': {
    hy: 'Բացատրիր close button-ը recommended products-ում app-ում ամրագրումից հետո',
    ru: 'Объясни кнопку закрытия recommended products после записи в app',
  },
  'en-you-might-also-like-hidden': {
    hy: 'Երբ է You might also like-ը թաքնված checkout success-ում salon app-ում',
    ru: 'Когда You might also like скрыта на checkout success в salon app',
  },
};

function buildRec6MultilingualScenarios(): ConsumerCheckoutSuccessMultilingualScenario[] {
  const rows: ConsumerCheckoutSuccessMultilingualScenario[] = [];
  for (const entry of EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS) {
    const i18n = REC6_I18N[entry.id];
    if (!i18n) {
      throw new Error(`Missing rec-6 HY/RU prompts for ${entry.id}`);
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        source: 'rec-6',
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        aspect: entry.aspect,
        rescueReason: 'explain_consumer_checkout_success',
      });
    }
  }
  return rows;
}

function buildRec7MultilingualScenarios(): ConsumerCheckoutSuccessMultilingualScenario[] {
  const rows: ConsumerCheckoutSuccessMultilingualScenario[] = [];
  for (const entry of EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS) {
    const i18n = REC7_I18N[entry.id];
    if (!i18n) {
      throw new Error(`Missing rec-7 HY/RU prompts for ${entry.id}`);
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        source: 'rec-7',
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        aspect: entry.aspect ?? 'all',
        rescueReason: 'explain_consumer_checkout_success',
      });
    }
  }
  return rows;
}

export const CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS: ConsumerCheckoutSuccessMultilingualScenario[] =
  [
    ...buildRec6MultilingualScenarios(),
    ...buildRec7MultilingualScenarios(),
  ];

export const CONSUMER_CHECKOUT_SUCCESS_EN_SCENARIO_IDS: string[] = [
  ...EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS.map((row) => row.id),
  ...EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS.map((row) => row.id),
];
