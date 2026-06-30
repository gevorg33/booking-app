import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type GrowthLoopsCustomerAction = 'refer_a_friend' | 'share_salon_link';

export interface GrowthLoopsCustomerPromptFixture {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: GrowthLoopsCustomerAction;
  rescueReason: GrowthLoopsCustomerAction;
}

export const CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES = `- refer_a_friend: READ — signed-in customer: explain referral program and return personal referral code + share link when enabled. Triggers: refer a friend, invite code, referral bonus, my referral link, referral rewards. NOT promo_code_help (checkout promo), NOT share_salon_link (salon deep link), NOT trigger_reengagement (dashboard admin).
- share_salon_link: READ — signed-in customer: explain how to share the salon/business deep link from Account → Growth (native share sheet). Include share reward summary when enabled. Triggers: share salon, share business link, share this place, copy salon booking link. NOT refer_a_friend (friend invite code), NOT share_my_booking (appointment link), NOT explain_share_reward (points policy overview only).`;

export const REFER_A_FRIEND_CUSTOMER_PROMPTS: readonly GrowthLoopsCustomerPromptFixture[] =
  [
    {
      id: 'refer-how-friend-en',
      prompt: 'How do I refer a friend?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-code-en',
      prompt: "What's my referral code?",
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-link-en',
      prompt: 'Share my referral link',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-invite-rewards-en',
      prompt: 'Invite a friend and earn rewards',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-program-en',
      prompt: 'How does the referral program work?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-invite-code-en',
      prompt: 'How do I get my invite code?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-bonus-en',
      prompt: 'Is there a referral bonus?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-friend-invite-en',
      prompt: 'Send a friend invite link',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-rewards-en',
      prompt: 'Tell me about my referral rewards',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-someone-en',
      prompt: 'How can I refer someone to this salon?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-where-code-en',
      prompt: 'Where is my referral code in the app?',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
    {
      id: 'refer-buddy-en',
      prompt: 'I want to invite a buddy and get points',
      surface: 'customer',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
    },
  ];

export const SHARE_SALON_LINK_CUSTOMER_PROMPTS: readonly GrowthLoopsCustomerPromptFixture[] =
  [
    {
      id: 'share-salon-link-en',
      prompt: 'Share this salon link',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-business-en',
      prompt: 'How do I share this business?',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-salon-friend-en',
      prompt: 'Send the salon link to a friend',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-place-en',
      prompt: 'Share this place with someone',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-copy-link-en',
      prompt: 'Copy the salon booking link',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-from-app-en',
      prompt: 'How to share this salon from the app?',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-deep-link-en',
      prompt: 'Share the business deep link',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-want-salon-en',
      prompt: 'I want to share this salon',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-growth-en',
      prompt: 'Share link from Account Growth section',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-favorite-salon-en',
      prompt: 'Share my favorite salon booking page',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-booking-page-en',
      prompt: 'Post the salon booking page link',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
    {
      id: 'share-this-business-en',
      prompt: 'How do I share this business link?',
      surface: 'customer',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
    },
  ];

export interface GrowthLoopsMultilingualEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  surface: 'customer';
  expectedAction: GrowthLoopsCustomerAction;
  rescueReason: GrowthLoopsCustomerAction;
  needsMultilingual?: boolean;
}

export const GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian growth loops (customer):
  - refer_a_friend: hy «ինչպես հրավիրել ընկերոջը», «իմ referral code-ը», «հրավիր ընկեր և ստացիր բոնուս»; ru «как пригласить друга», «мой реферальный код», «пригласи друга и получи бонус». NOT promo_code_help.
  - share_salon_link: hy «կիսվել այս սրահի հղումով», «ուղարկել salon link ընկերոջը»; ru «поделиться ссылкой на салон», «отправить ссылку на салон другу». NOT share_my_booking.`;

export const MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS: GrowthLoopsMultilingualEvalScenario[] =
  [
    {
      id: 'hy-refer-friend',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ինչպե՞ս հրավիրել ընկերոջը',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'hy-refer-code',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ցույց տուր իմ referral code-ը',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'hy-refer-bonus',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Կա՞ referral bonus այս salon-ում',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'ru-refer-friend',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Как пригласить друга?',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'ru-refer-code',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Где мой реферальный код?',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'ru-refer-bonus',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Есть ли бонус за приглашение друга?',
      expectedAction: 'refer_a_friend',
      rescueReason: 'refer_a_friend',
      needsMultilingual: true,
    },
    {
      id: 'hy-share-salon',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Կիսվել այս սրահի հղումով',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
    {
      id: 'hy-share-salon-friend',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ուղարկել salon link-ը ընկերոջը',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
    {
      id: 'hy-share-business',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ինչպե՞ս կիսվել այս բիզնեսի հղումով',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
    {
      id: 'ru-share-salon',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Поделиться ссылкой на салон',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
    {
      id: 'ru-share-salon-friend',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Отправить ссылку на салон другу',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
    {
      id: 'ru-share-business',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Как поделиться ссылкой на этот бизнес?',
      expectedAction: 'share_salon_link',
      rescueReason: 'share_salon_link',
      needsMultilingual: true,
    },
  ];

export const GROWTH_LOOPS_CUSTOMER_PROMPTS: readonly GrowthLoopsCustomerPromptFixture[] =
  [...REFER_A_FRIEND_CUSTOMER_PROMPTS, ...SHARE_SALON_LINK_CUSTOMER_PROMPTS];
