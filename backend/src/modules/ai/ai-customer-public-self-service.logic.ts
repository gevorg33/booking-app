import type { CommandResult } from './command-completion.types.js';
import type { AiCustomerCrmService } from './ai-customer-crm.service.js';
import type { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import type { AiPaymentsService } from './ai-payments.service.js';
import { isPublicSelfServiceHandlerAction } from './ai-customer-public-self-service.util.js';

export type PublicSelfServiceLogicDeps = {
  payments: Pick<AiPaymentsService, 'handleBuyGiftCard'>;
  crm: Pick<
    AiCustomerCrmService,
    | 'handleMyProfile'
    | 'handleMyAppointments'
    | 'handleMySubscriptions'
    | 'handleSubscriptionUsage'
    | 'handleMyGiftCards'
    | 'handleGiftCardBalance'
    | 'handleDiscoverPackages'
    | 'handleDiscoverSubscriptionPlans'
    | 'handleDiscoverGiftCardProducts'
  >;
  marketing: Pick<AiMarketingGrowthService, 'handleLoyaltyPointsBalance'>;
};

export function mergePublicSessionCustomerId(
  params: Record<string, unknown>,
  sessionCustomerId?: string,
): Record<string, unknown> {
  if (!sessionCustomerId) return params;
  return { ...params, sessionCustomerId };
}

export async function dispatchPublicSelfServiceIntent(
  deps: PublicSelfServiceLogicDeps,
  businessId: string,
  action: string,
  params: Record<string, unknown>,
): Promise<CommandResult | null> {
  if (!isPublicSelfServiceHandlerAction(action)) return null;

  switch (action) {
    case 'buy_gift_card':
      return deps.payments.handleBuyGiftCard(businessId, params, false);
    case 'buy_gift_card_physical':
      return deps.payments.handleBuyGiftCard(businessId, params, true);
    case 'my_profile':
      return deps.crm.handleMyProfile(businessId, params);
    case 'my_appointments':
      return deps.crm.handleMyAppointments(businessId, params);
    case 'my_subscriptions':
      return deps.crm.handleMySubscriptions(businessId, params);
    case 'subscription_usage':
      return deps.crm.handleSubscriptionUsage(businessId, params);
    case 'my_gift_cards':
      return deps.crm.handleMyGiftCards(businessId, params);
    case 'gift_card_balance':
      return deps.crm.handleGiftCardBalance(businessId, params);
    case 'discover_packages':
      return deps.crm.handleDiscoverPackages(businessId);
    case 'discover_subscription_plans':
      return deps.crm.handleDiscoverSubscriptionPlans(businessId, params);
    case 'discover_gift_card_products':
      return deps.crm.handleDiscoverGiftCardProducts(businessId);
    case 'loyalty_points_balance':
      return deps.marketing.handleLoyaltyPointsBalance(businessId, params);
    default:
      return null;
  }
}
