export type GiftCardAssistantPrefill = {
  buyAsGift?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  deliveryMethod?: 'digital' | 'physical';
  amount?: string;
};

export function parseGiftCardAssistantPrefill(
  search: URLSearchParams,
): GiftCardAssistantPrefill {
  const prefill: GiftCardAssistantPrefill = {};
  if (search.get('buyAsGift') === '1') prefill.buyAsGift = true;
  const recipientName = search.get('recipientName')?.trim();
  if (recipientName) prefill.recipientName = recipientName;
  const recipientEmail = search.get('recipientEmail')?.trim();
  if (recipientEmail) prefill.recipientEmail = recipientEmail;
  const deliveryMethod = search.get('deliveryMethod')?.trim();
  if (deliveryMethod === 'digital' || deliveryMethod === 'physical') {
    prefill.deliveryMethod = deliveryMethod;
  }
  const amount = search.get('amount')?.trim();
  if (amount) prefill.amount = amount;
  return prefill;
}
