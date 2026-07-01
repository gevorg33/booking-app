export type DismissRecommendationsMultilingualScenario = {
  id: string;
  prompt: string;
  locale: 'hy' | 'ru';
  surface: 'customer';
  expectedAction: 'dismiss_recommendations';
  rescueReason: 'dismiss_recommendations';
};

export const DISMISS_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES = `- dismiss_recommendations: hy «Թաքցրու You might also like», «Փակիր առաջարկությունները», «Չցուցադրես ապրանքի քարտերը»; ru «Скрой You might also like», «Убери рекомендации», «Не показывай карточки товаров». MUTATE hide product cards on success screen — NOT explain_checkout_recommendations and NOT explain_consumer_checkout_success.`;

export const DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS: readonly DismissRecommendationsMultilingualScenario[] =
  [
    {
      id: 'hy-hide-you-might-also-like',
      prompt: 'Թաքցրու You might also like',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'hy-close-recommendations',
      prompt: 'Փակիր առաջարկությունները',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'hy-stop-product-cards',
      prompt: 'Չցուցադրես ապրանքի քարտերը',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'ru-hide-you-might-also-like',
      prompt: 'Скрой You might also like',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'ru-remove-recommendations',
      prompt: 'Убери рекомендации',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'ru-stop-product-cards',
      prompt: 'Не показывай карточки товаров',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
  ];
