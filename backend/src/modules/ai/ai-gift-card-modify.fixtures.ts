export type GiftCardModifyPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'request_gift_card_modify';
  rescueReason: 'gift_card_modify';
  giftCardId?: string;
};

export const GIFT_CARD_MODIFY_PROMPTS: readonly GiftCardModifyPromptFixture[] =
  [
    {
      id: 'modify-my-gift-card-order-customer',
      prompt: 'Modify my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'change-my-gift-card-order-customer',
      prompt: 'Change my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'update-address-gift-card-delivery-customer',
      prompt: 'Update the address for my gift card delivery',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'edit-my-gift-card-order-customer',
      prompt: 'Edit my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'modify-gift-card-purchase-customer',
      prompt: 'I want to modify my gift card purchase',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'change-recipient-gift-card-order-customer',
      prompt: 'Change the recipient on my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'update-delivery-method-gift-card-customer',
      prompt: 'Update the delivery method on my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'request-modify-gift-card-order-customer',
      prompt: 'Request to modify gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'change-gift-card-order-please-customer',
      prompt: 'Change my gift card order please',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'modify-gift-card-purchase-plain-customer',
      prompt: 'Modify my gift card purchase',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'update-message-gift-card-order-customer',
      prompt: 'Update the message on my gift card order',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    },
    {
      id: 'edit-gift-card-order-id-customer',
      prompt: 'Edit my gift card order 550e8400-e29b-41d4-a716-446655440000',
      surface: 'customer',
      expectedAction: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
      giftCardId: '550e8400-e29b-41d4-a716-446655440000',
    },
  ];
