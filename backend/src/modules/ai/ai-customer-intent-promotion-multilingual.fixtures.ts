import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';

export type CustomerIntentPromotionMultilingualIntent =
  | 'pay_online'
  | 'explain_why_stripe_required'
  | 'my_subscriptions'
  | 'privacy_export'
  | 'privacy_delete'
  | 'request_gift_card_cancel'
  | 'list_my_package_visits';

export type CustomerIntentPromotionMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  expectedAction: CustomerIntentPromotionMultilingualIntent;
  rescueReason: string;
  surface?: 'customer' | 'public';
};

/** HY/RU fixtures for promoted customer intents missing locale parity (ai-cmd-customer-4.0.2). */
export const CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian promoted customer intents (logged-in consumer + public checkout where noted):
  - pay_online: hy «վճարել օնլայն», «շարունակել քարտով վճարումը»; ru «оплатить онлайн», «продолжить оплату картой». NOT explain_why_stripe_required.
  - explain_why_stripe_required: hy «ինչու պետք է վճարել օնլայն», «ինչու է պահանջվում քարտով վճարում»; ru «почему нужно платить онлайн», «зачем требуется оплата картой». NOT pay_online.
  - my_subscriptions: hy «ցույց տալ իմ բաժանորդագրությունները», «ինչ պլաններ ունեմ»; ru «показать мои подписки», «какие у меня планы». NOT use_subscription_credit.
  - privacy_export: hy «արտահանել իմ տվյալները», «ներբեռնել իմ տվյալների պատճենը»; ru «экспортировать мои данные», «скачать копию моих данных». NOT privacy_delete.
  - privacy_delete: hy «ջնջել իմ հաշիվը», «մոռանալ իմ տվյալները»; ru «удалить мой аккаунт», «забыть мои данные». NOT privacy_export.
  - request_gift_card_cancel: hy «չեղարկել իմ gift card պատվերը», «վերադարձ gift card-ի գումարը»; ru «отменить мой заказ подарочной карты», «вернуть деньги за gift card». NOT cancel_my_booking.
  - list_my_package_visits: hy «քանի package visit է մնաց», «ցույց տալ package visits-ը»; ru «сколько визитов по пакету осталось», «показать мои пакетные визиты». NOT list_my_appointments.`;

export const CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_SCENARIOS: readonly CustomerIntentPromotionMultilingualScenario[] =
  [
    {
      id: 'pay-online-hy',
      locale: 'hy',
      prompt: 'Վճարել օնլայն',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'pay-online-hy-card',
      locale: 'hy',
      prompt: 'Շարունակել քարտով վճարումը',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'pay-online-hy-stripe',
      locale: 'hy',
      prompt: 'Ավարտել checkout-ը քարտով',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'pay-online-ru',
      locale: 'ru',
      prompt: 'Оплатить онлайн',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'pay-online-ru-card',
      locale: 'ru',
      prompt: 'Продолжить оплату картой',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'pay-online-ru-stripe',
      locale: 'ru',
      prompt: 'Завершить checkout картой',
      expectedAction: 'pay_online',
      rescueReason: 'pay_online',
      surface: 'customer',
    },
    {
      id: 'explain-why-stripe-hy',
      locale: 'hy',
      prompt: 'Ինչու պետք է վճարել օնլայն',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'customer',
    },
    {
      id: 'explain-why-stripe-hy-card',
      locale: 'hy',
      prompt: 'Ինչու է պահանջվում քարտով վճարում checkout-ում',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'customer',
    },
    {
      id: 'explain-why-stripe-hy-deposit',
      locale: 'hy',
      prompt: 'Ինչու պետք է deposit վճարել հիմա',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'customer',
    },
    {
      id: 'explain-why-stripe-ru',
      locale: 'ru',
      prompt: 'Почему нужно платить онлайн',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'public',
    },
    {
      id: 'explain-why-stripe-ru-card',
      locale: 'ru',
      prompt: 'Зачем требуется оплата картой при checkout',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'public',
    },
    {
      id: 'explain-why-stripe-ru-deposit',
      locale: 'ru',
      prompt: 'Почему нужно внести депозит сейчас',
      expectedAction: 'explain_why_stripe_required',
      rescueReason: 'explain_prepayment',
      surface: 'public',
    },
    {
      id: 'my-subscriptions-hy',
      locale: 'hy',
      prompt: 'Ցույց տալ իմ բաժանորդագրությունները',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscriptions-hy-plans',
      locale: 'hy',
      prompt: 'Ինչ պլաններ ունեմ',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscriptions-hy-active',
      locale: 'hy',
      prompt: 'Ցույց տալ ակտիվ subscription-ները',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscriptions-ru',
      locale: 'ru',
      prompt: 'Показать мои подписки',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscriptions-ru-plans',
      locale: 'ru',
      prompt: 'Какие у меня планы',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    {
      id: 'my-subscriptions-ru-active',
      locale: 'ru',
      prompt: 'Показать активные подписки',
      expectedAction: 'my_subscriptions',
      rescueReason: 'my_subscriptions',
    },
    ...PRIVACY_GDPR_MULTILINGUAL_SCENARIOS.map((row) => ({
      id: row.id,
      locale: row.locale,
      prompt: row.prompt,
      expectedAction: row.expectedAction,
      rescueReason: row.rescueReason,
    })),
    {
      id: 'gift-card-cancel-hy',
      locale: 'hy',
      prompt: 'Չեղարկել իմ gift card պատվերը',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'gift-card-cancel-hy-refund',
      locale: 'hy',
      prompt: 'Վերադարձ gift card-ի գումարը',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'gift-card-cancel-hy-return',
      locale: 'hy',
      prompt: 'Վերադարձնել գնված gift card-ը',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'gift-card-cancel-ru',
      locale: 'ru',
      prompt: 'Отменить мой заказ подарочной карты',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'gift-card-cancel-ru-refund',
      locale: 'ru',
      prompt: 'Вернуть деньги за gift card',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'gift-card-cancel-ru-return',
      locale: 'ru',
      prompt: 'Вернуть купленную подарочную карту',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'list-package-visits-hy',
      locale: 'hy',
      prompt: 'Քանի package visit է մնաց',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-package-visits-hy-show',
      locale: 'hy',
      prompt: 'Ցույց տալ package visits-ը',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-package-visits-hy-left',
      locale: 'hy',
      prompt: 'Քանի այց է մնաց bundle-ում',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-package-visits-ru',
      locale: 'ru',
      prompt: 'Сколько визитов по пакету осталось',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-package-visits-ru-show',
      locale: 'ru',
      prompt: 'Показать мои пакетные визиты',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-package-visits-ru-left',
      locale: 'ru',
      prompt: 'Сколько визитов осталось в bundle',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
  ];
