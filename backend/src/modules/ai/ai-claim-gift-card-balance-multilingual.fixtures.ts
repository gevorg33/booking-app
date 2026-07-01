export type ClaimGiftCardBalanceMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'claim_gift_card_balance';
  rescueReason: 'claim_gift_card_balance';
  giftCardCode?: string;
};

export const CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_CLASSIFIER_RULES = `- claim_gift_card_balance HY/RU: hy «Ավելացնել նվեր քարտը իմ հաշվին», «Կլэйմ արեք նվեր քարտի կոդը GCM-ABCD1234»; ru «Добавить подарочную карту в аккаунт», «Активировать код подарочной карты GCM-ABCD1234». MUTATE account gift-card claim — NOT apply_gift_card_code and NOT check_gift_card_balance.`;

export const CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS: readonly ClaimGiftCardBalanceMultilingualScenario[] =
  [
    {
      id: 'add-gift-card-account-hy-customer',
      prompt: 'Ավելացնել նվեր քարտը իմ հաշվին',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'claim-code-hy-customer',
      prompt: 'Կլэйմ արեք նվեր քարտի կոդը GCM-ABCD1234',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCM-ABCD1234',
    },
    {
      id: 'redeem-gift-card-hy-customer',
      prompt: 'Կլայմ արեք նվեր քարտ GCB-HY1234',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCB-HY1234',
    },
    {
      id: 'add-gift-card-account-ru-customer',
      prompt: 'Добавить подарочную карту в аккаунт',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
    },
    {
      id: 'activate-code-ru-customer',
      prompt: 'Активировать код подарочной карты GCM-ABCD1234',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCM-ABCD1234',
    },
    {
      id: 'link-gift-card-ru-customer',
      prompt: 'Привязать подарочную карту GCS-RU5678 к моему аккаунту',
      surface: 'customer',
      expectedAction: 'claim_gift_card_balance',
      rescueReason: 'claim_gift_card_balance',
      giftCardCode: 'GCS-RU5678',
    },
  ];
