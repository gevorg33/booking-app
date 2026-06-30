import { extractGiftCardIdFromPrompt } from './ai-integrations.util.js';
import {
  extractGiftCardCode,
  isRequestGiftCardCancelPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';

export const CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES = `- request_gift_card_cancel: MUTATE — logged-in customer submits a post-purchase cancel/refund request for a gift card order they bought (buyer's remorse). Triggers: cancel|refund|return|undo|void + my gift card/order/purchase; request cancel gift card order; I regret buying this gift card. Sets giftCardId when mentioned. NOT cancel_gift_card_order (dashboard staff cancels without "my"), NOT cancel_my_booking (appointment cancel), NOT my_gift_cards (list cards), NOT open_ticket_for_order (support ticket unless only asking to contact support), NOT request_gift_card_modify (change order details).`;

export type GiftCardCancelCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'request_gift_card_cancel';
  rescueReason: 'gift_card_cancel';
  giftCardId?: string;
};

export const GIFT_CARD_CANCEL_CUSTOMER_PROMPTS: readonly GiftCardCancelCustomerPromptFixture[] =
  [
    {
      id: 'cancel-my-gift-card-order-customer',
      prompt: 'Cancel my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'request-cancel-gift-card-order-customer',
      prompt: 'request cancel gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'refund-gift-card-purchase-customer',
      prompt: 'Refund my gift card purchase',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'cancel-gift-card-bought-customer',
      prompt: 'I want to cancel the gift card I bought',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'return-gift-card-order-customer',
      prompt: 'Return my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'undo-gift-card-purchase-customer',
      prompt: 'Undo my gift card purchase',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'stop-gift-card-order-customer',
      prompt: 'Stop my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'cancel-gift-card-please-customer',
      prompt: 'Cancel my gift card please',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'regret-gift-card-purchase-customer',
      prompt: 'I regret buying this gift card — cancel it',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'request-refund-gift-card-order-customer',
      prompt: 'Request refund on my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'void-gift-card-purchase-customer',
      prompt: 'Void my gift card purchase',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    },
    {
      id: 'cancel-gift-card-order-id-customer',
      prompt:
        'Cancel my gift card order 550e8400-e29b-41d4-a716-446655440000',
      surface: 'customer',
      expectedAction: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
      giftCardId: '550e8400-e29b-41d4-a716-446655440000',
    },
  ];

export function rescueGiftCardCancelCustomerIntent(
  prompt: string,
  action: string,
): { action: 'request_gift_card_cancel'; rescueReason: string } | null {
  const rescued = rescueCustomerCrmIntent(prompt, action);
  if (rescued?.action === 'request_gift_card_cancel') {
    return {
      action: 'request_gift_card_cancel',
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectGiftCardCancelCustomerAction(
  prompt: string,
): 'request_gift_card_cancel' | null {
  return isRequestGiftCardCancelPrompt(prompt)
    ? 'request_gift_card_cancel'
    : null;
}

export function enrichRequestGiftCardCancelParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (!next.giftCardId) {
    const giftCardId = extractGiftCardIdFromPrompt(prompt);
    if (giftCardId) next.giftCardId = giftCardId;
  }
  if (!next.giftCardCode) {
    const giftCardCode = extractGiftCardCode(prompt);
    if (giftCardCode) next.giftCardCode = giftCardCode;
  }
  return next;
}
