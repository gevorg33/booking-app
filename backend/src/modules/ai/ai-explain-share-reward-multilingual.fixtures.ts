import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainShareRewardAspect } from './ai-explain-share-reward.fixtures.js';

export type ExplainShareRewardMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_share_reward';
  rescueReason: 'share_reward';
  aspect?: ExplainShareRewardAspect;
};

export const EXPLAIN_SHARE_REWARD_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian share reward explain (customer mobile):
  - explain_share_reward: hy «կիսվելու համար միավորներ ստանո՞ւմ եմ», «ինչ է տեղի ունենում, երբ կիսում եմ ամրագրումը»; ru «получу ли я баллы за публикацию», «что происходит когда делюсь записью». READ reward policy — NOT share_my_booking, NOT share_salon_link, NOT refer_a_friend.`;

export const EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS: readonly ExplainShareRewardMultilingualScenario[] =
  [
    {
      id: 'points-sharing-hy-customer',
      locale: 'hy',
      prompt: 'Կիսվելու համար միավորներ ստանում եմ՞',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
    {
      id: 'share-booking-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է տեղի ունենում, երբ կիսում եմ ամրագրումը',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'booking_reward',
    },
    {
      id: 'salon-reward-hy-customer',
      locale: 'hy',
      prompt: 'Սրահի հղումը կիսելու համար պարգև կա՞',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'salon_reward',
    },
    {
      id: 'points-sharing-ru-customer',
      locale: 'ru',
      prompt: 'Получу ли я баллы за публикацию?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
    {
      id: 'share-booking-ru-customer',
      locale: 'ru',
      prompt: 'Что происходит, когда делюсь записью?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'booking_reward',
    },
    {
      id: 'cooldown-ru-customer',
      locale: 'ru',
      prompt: 'Как часто можно получать награду за публикацию?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'cooldown',
    },
  ];
