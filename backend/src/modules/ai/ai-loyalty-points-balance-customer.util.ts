import {
  isLoyaltyPointsBalancePrompt,
  rescueMarketingGrowthIntent,
} from './ai-marketing-growth.util.js';

export const CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES = `- loyalty_points_balance: READ — show the signed-in customer's loyalty/reward points balance and approximate dollar value. Triggers: how many points do I have, what's my loyalty points balance, check my reward points, show my bonus points. Requires session customerId. NOT explain_loyalty_points (how earning works / what points are worth — future), NOT apply_loyalty_at_checkout (spend points on booking), NOT summarize_loyalty_program (salon admin overview), NOT configure_loyalty_settings (admin mutate).`;

export type LoyaltyPointsBalancePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'loyalty_points_balance';
  rescueReason: 'loyalty_balance';
};

export const LOYALTY_POINTS_BALANCE_PROMPTS: readonly LoyaltyPointsBalancePromptFixture[] =
  [
    {
      id: 'how-many-points-customer',
      prompt: 'How many points do I have?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-balance-customer',
      prompt: 'What is my loyalty points balance?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'check-loyalty-points-customer',
      prompt: 'Check my loyalty points',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'show-reward-points-customer',
      prompt: 'Show my reward points',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'bonus-points-customer',
      prompt: 'What are my bonus points?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'how-many-loyalty-points-customer',
      prompt: 'How many loyalty points do I have?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-balance-short-customer',
      prompt: 'Loyalty balance please',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'points-balance-customer',
      prompt: "What's my points balance?",
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'rewards-balance-customer',
      prompt: 'Show me my loyalty rewards balance',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'reward-points-account-customer',
      prompt: 'How many reward points are on my account?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'loyalty-total-customer',
      prompt: 'What is my loyalty points total?',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
    {
      id: 'check-points-balance-customer',
      prompt: 'Check my points balance',
      surface: 'customer',
      expectedAction: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    },
  ];

export function rescueLoyaltyPointsBalanceCustomerIntent(
  prompt: string,
  action: string,
): { action: 'loyalty_points_balance'; rescueReason: string } | null {
  const rescued = rescueMarketingGrowthIntent(prompt, action);
  if (rescued?.action === 'loyalty_points_balance') {
    return {
      action: 'loyalty_points_balance',
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectLoyaltyPointsBalanceCustomerAction(
  prompt: string,
): 'loyalty_points_balance' | null {
  return rescueLoyaltyPointsBalanceCustomerIntent(prompt, 'unknown')?.action ?? null;
}

export { isLoyaltyPointsBalancePrompt };
