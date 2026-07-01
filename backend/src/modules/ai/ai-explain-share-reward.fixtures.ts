export type ExplainShareRewardAspect =
  | 'booking_reward'
  | 'salon_reward'
  | 'how_it_works'
  | 'cooldown'
  | 'claim_flow';

export type ExplainShareRewardFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_share_reward';
  rescueReason: 'share_reward';
  aspect?: ExplainShareRewardAspect;
};

export const CUSTOMER_EXPLAIN_SHARE_REWARD_CLASSIFIER_RULES = `- explain_share_reward: READ — signed-in customer asks how share rewards work (points/perks for sharing a booking or salon link via native share sheet). Triggers: do I get points for sharing, what happens when I share my booking, how do share rewards work, share reward cooldown. Explains shareBookingLinkWithReward / Account Growth card — NOT share_my_booking (how to share appointment link), NOT share_salon_link (how to share salon link), NOT refer_a_friend (invite code program), NOT claim_share_reward (mutate claim), NOT explain_rewards_wallet (loyalty wallet overview).`;

export const EXPLAIN_SHARE_REWARD_PROMPTS: readonly ExplainShareRewardFixture[] =
  [
    {
      id: 'points-for-sharing-customer',
      prompt: 'Do I get points for sharing?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
    {
      id: 'what-happens-share-booking-customer',
      prompt: 'What happens when I share my booking?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'booking_reward',
    },
    {
      id: 'share-reward-program-customer',
      prompt: 'How do share rewards work?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
    {
      id: 'reward-sharing-appointment-customer',
      prompt: 'Is there a reward for sharing my appointment?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'booking_reward',
    },
    {
      id: 'earn-sharing-salon-customer',
      prompt: 'Do I earn anything for sharing the salon link?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'salon_reward',
    },
    {
      id: 'share-reward-policy-customer',
      prompt: 'Explain the share reward program',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
    {
      id: 'points-when-share-booking-customer',
      prompt: 'What points do I get when I share a booking?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'booking_reward',
    },
    {
      id: 'share-reward-cooldown-customer',
      prompt: 'How often can I earn share rewards?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'cooldown',
    },
    {
      id: 'when-share-again-customer',
      prompt: 'When can I share again for a reward?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'cooldown',
    },
    {
      id: 'claim-after-share-customer',
      prompt: 'How do I claim my share reward?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'claim_flow',
    },
    {
      id: 'after-native-share-customer',
      prompt: 'What happens after I use the share sheet?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'claim_flow',
    },
    {
      id: 'growth-card-rewards-customer',
      prompt: 'What does the growth card reward mean?',
      surface: 'customer',
      expectedAction: 'explain_share_reward',
      rescueReason: 'share_reward',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_SHARE_REWARD_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-share-my-booking',
    prompt: 'Do I get points for sharing?',
    misclassifiedAction: 'share_my_booking',
    expectedAction: 'explain_share_reward' as const,
  },
  {
    id: 'misclassified-share-salon',
    prompt: 'What happens when I share my booking?',
    misclassifiedAction: 'share_salon_link',
    expectedAction: 'explain_share_reward' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'How do share rewards work?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_share_reward' as const,
  },
] as const;

export const EXPLAIN_SHARE_REWARD_BOUNDARY_PROMPTS = [
  {
    id: 'share-my-booking-action',
    prompt: 'Share my booking with my partner',
    surface: 'customer' as const,
  },
  {
    id: 'share-salon-link-action',
    prompt: 'Share salon link with my friend',
    surface: 'customer' as const,
  },
  {
    id: 'refer-a-friend-action',
    prompt: 'Refer a friend to this salon',
    surface: 'customer' as const,
  },
];
