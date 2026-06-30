import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CheckoutRecommendationsEvalAction = 'explain_checkout_recommendations';

export interface CheckoutRecommendationsEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  surface: 'customer' | 'public';
  expectedAction: CheckoutRecommendationsEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian checkout success product cards (ai-cmd-customer-4.16.1). */
export const CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian post-checkout success product cards (customer/public):
  - explain_checkout_recommendations: hy «ինչ են You might also like ապրանքները հաստատման էկրանում», «ինչու եմ տեսնում շամպունի առաջարկություններ ամրագրումից հետո», «ինչ է անում shop հղումը ապրանքի քարտում», «քանի ապրանք կարող է ցուցադրվել success screen-ում»; ru «что за You might also like на экране подтверждения», «почему вижу рекомендации шампуня после записи», «что делает shop ссылка на карточке товара», «сколько продуктов на success screen». READ product cards after booking — NOT explain_consumer_checkout_success (screen overview/dismiss) and NOT explain_recommendation_setup (dashboard admin).`;

export const MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS: CheckoutRecommendationsEvalScenario[] =
  [
    {
      id: 'hy-public-you-might-also-like',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ինչ են You might also like ապրանքները հաստատման էկրանում',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'products' },
      needsMultilingual: true,
    },
    {
      id: 'hy-public-why-shampoo',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ինչու եմ տեսնում շամպունի առաջարկություններ ամրագրումից հետո',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'whyShown' },
      needsMultilingual: true,
    },
    {
      id: 'hy-public-shop-link',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ինչ է անում shop հղումը ապրանքի քարտում success screen-ում',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'shopLink' },
      needsMultilingual: true,
    },
    {
      id: 'hy-public-max-count',
      locale: 'hy',
      surface: 'public',
      prompt: 'Քանի ապրանք կարող է ցուցադրվել checkout success էկրանում',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'maxCount' },
      needsMultilingual: true,
    },
    {
      id: 'hy-customer-app-products',
      locale: 'hy',
      surface: 'customer',
      prompt:
        'Ինչ ապրանքներ են ցուցադրվում consumer app success screen-ում ամրագրումից հետո',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'products' },
      needsMultilingual: true,
    },
    {
      id: 'hy-customer-from-service',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Արդյո՞ք այս առաջարկությունները գալիս են իմ ամրագրած ծառայությունից',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'whyShown' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-you-might-also-like',
      locale: 'ru',
      surface: 'public',
      prompt: 'Что за You might also like на экране подтверждения записи',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'products' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-why-shampoo',
      locale: 'ru',
      surface: 'public',
      prompt: 'Почему вижу рекомендации шампуня после записи на success screen',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'whyShown' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-shop-link',
      locale: 'ru',
      surface: 'public',
      prompt: 'Что делает shop ссылка на карточке товара после checkout',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'shopLink' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-max-count',
      locale: 'ru',
      surface: 'public',
      prompt: 'Сколько продуктов может быть на success screen после оплаты',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'maxCount' },
      needsMultilingual: true,
    },
    {
      id: 'ru-customer-app-products',
      locale: 'ru',
      surface: 'customer',
      prompt:
        'Какие товары показываются на success screen в consumer app после бронирования',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'products' },
      needsMultilingual: true,
    },
    {
      id: 'ru-customer-from-service',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Эти рекомендации из моей забронированной услуги на success screen',
      expectedAction: 'explain_checkout_recommendations',
      rescueReason: 'explain_checkout_recommendations',
      paramsPartial: { aspect: 'whyShown' },
      needsMultilingual: true,
    },
  ] as const;
