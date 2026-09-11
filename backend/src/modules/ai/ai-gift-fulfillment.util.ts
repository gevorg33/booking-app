import { isTrackPhysicalGiftCardPrompt } from './ai-customer-crm.util.js';
import {
  isBuyGiftCardPhysicalPrompt,
  isBuyGiftCardPrompt,
} from './ai-payments.util.js';

export const DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS = [
  'assign_card_creator',
  'assign_delivery_staff',
  'mark_shipped',
  'mark_delivered',
  'cancel_gift_card_order',
  'extend_cancel_window',
  'update_gift_card_settings',
  'resolve_gift_card_change_request',
  'gift_fulfill_batch',
] as const;

export const DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS = [
  'list_gift_card_orders',
  'filter_awaiting_creation',
  'print_packing_slip',
  'list_gift_card_change_requests',
] as const;

export const PROVIDER_GIFT_FULFILLMENT_INTENTS = [
  'gift_card_creation_queue',
  'start_card_preparation',
  'mark_card_ready',
  'delivery_queue',
  'accept_delivery',
  'mark_out_for_delivery',
  'capture_delivery_proof',
  'notify_delay',
  'explain_gift_card_order_details',
] as const;

export const CUSTOMER_GIFT_FULFILLMENT_INTENTS = [
  'track_gift_card_shipment',
  'enter_shipping_address',
  'shipping_method_quote',
  'order_status_notifications',
] as const;

export const GIFT_FULFILLMENT_INTENTS = [
  ...DASHBOARD_GIFT_FULFILLMENT_MUTATE_INTENTS,
  ...DASHBOARD_GIFT_FULFILLMENT_READ_INTENTS,
  ...PROVIDER_GIFT_FULFILLMENT_INTENTS,
  ...CUSTOMER_GIFT_FULFILLMENT_INTENTS,
] as const;

export type GiftFulfillmentIntent = (typeof GIFT_FULFILLMENT_INTENTS)[number];

export interface FulfillmentCompoundStep {
  action: GiftFulfillmentIntent;
  params: Record<string, unknown>;
  segment: string;
}

const FULFILLMENT_VERB =
  /\b(list|filter|assign|mark|cancel|extend|print|show|queue|start|ready|delivery|accept|capture|notify|track|enter|get|enable|shipping|quote|notification|packing|slip|shipped|delivered|creator|staff|awaiting|creation|preparation|proof|delay|address|method|status|gift\s*card|fulfillment|order)\b/i;

const COMPOUND_NEXT =
  '(?:list|filter|assign|mark|cancel|extend|print|show|queue|start|ready|delivery|accept|capture|notify|track|enter|get|enable|shipping|quote|notification|packing|slip|shipped|delivered|creator|staff|awaiting|creation|preparation|proof|delay|address|method|status|gift|card|fulfillment|order)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isGiftFulfillmentIntent(
  action: string,
): action is GiftFulfillmentIntent {
  return (GIFT_FULFILLMENT_INTENTS as readonly string[]).includes(action);
}

export function isListGiftCardOrdersPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(orders?|fulfillment)\b/i.test(prompt) &&
    !/\b(awaiting|creation\s+queue|assign)\b/i.test(prompt)
  );
}

export function isFilterAwaitingCreationPrompt(prompt: string): boolean {
  return (
    /\b(list|show|filter)\b/i.test(prompt) &&
    /\b(awaiting|pending)\b/i.test(prompt) &&
    /\b(card\s+creation|creation)\b/i.test(prompt)
  );
}

export function isAssignCardCreatorPrompt(prompt: string): boolean {
  return (
    /\b(assign|set)\b/i.test(prompt) &&
    /\b(card\s+creator|creator)\b/i.test(prompt)
  );
}

export function isAssignDeliveryStaffPrompt(prompt: string): boolean {
  return (
    /\b(assign|set)\b/i.test(prompt) &&
    /\b(delivery\s+staff|courier|deliverer)\b/i.test(prompt)
  );
}

export function isMarkShippedPrompt(prompt: string): boolean {
  return (
    /\bmark\b/i.test(prompt) &&
    /\b(shipped|ship(?:ped)?)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.20.4 — bare "Mark delivered" (no gift card/order noun) is still unambiguous on its own. */
export function isMarkDeliveredPrompt(prompt: string): boolean {
  return (
    /\bmark\b/i.test(prompt) &&
    /\b(delivered|delivery\s+complete)\b/i.test(prompt)
  );
}

export function isCancelGiftCardOrderPrompt(prompt: string): boolean {
  return (
    /\b(cancel)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(order)\b/i.test(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !/\b(request|window|modify)\b/i.test(prompt)
  );
}

export function isExtendCancelWindowPrompt(prompt: string): boolean {
  return (
    /\b(extend|increase|change)\b/i.test(prompt) &&
    /\b(cancel)\b/i.test(prompt) &&
    /\b(window|hours?|policy)\b/i.test(prompt)
  );
}

export function isPrintPackingSlipPrompt(prompt: string): boolean {
  return (
    /\b(print|generate|show)\b/i.test(prompt) &&
    /\b(packing\s+slip|shipping\s+label)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.12.4/5.20.1 — "Physical cards to fulfill/print" and bare "Creation queue" are GiftCardQueuesPage labels, not verb phrases. */
export function isGiftCardCreationQueuePrompt(prompt: string): boolean {
  if (/\bcards?\s+to\s+(?:fulfill|print)\b/i.test(prompt)) return true;
  if (/\bcreation\s+queue\b/i.test(prompt)) return true;
  return (
    /\b(show|list|open)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(creation\s+queue|card\s+creation|prepare)\b/i.test(prompt)
  );
}

export function isStartCardPreparationPrompt(prompt: string): boolean {
  return (
    /\b(start|begin)\b/i.test(prompt) &&
    /\b(card\s+preparation|preparing|prep)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.20.2 — supports "mark card GC-123 ready for pickup" (id breaks card/ready adjacency) and "Card printed — ready" (no "mark" verb). */
export function isMarkCardReadyPrompt(prompt: string): boolean {
  const hasCardAndReady = /\bcard\b/i.test(prompt) && /\bready\b/i.test(prompt);
  if (/\bmark\b/i.test(prompt) && hasCardAndReady) return true;
  if (/\bprinted\b/i.test(prompt) && hasCardAndReady) return true;
  return (
    /\bmark\b/i.test(prompt) &&
    /\b(card\s+ready|ready\s+for\s+delivery|ready\s+for\s+pickup)\b/i.test(
      prompt,
    )
  );
}

/** ai-cmd-provider-5.12.4/5.20.3 — "Gift card pickup queue" / bare "Delivery queue" / "Cards to ship" are GiftCardQueuesPage labels for the delivery/pickup tab. */
export function isDeliveryQueuePrompt(prompt: string): boolean {
  if (/\bpickup\s+queue\b/i.test(prompt)) return true;
  if (/\bdelivery\s+queue\b/i.test(prompt)) return true;
  if (/\bcards?\s+to\s+ship\b/i.test(prompt)) return true;
  return (
    /\b(show|list|open)\b/i.test(prompt) &&
    /\b(delivery\s+queue|out\s+for\s+delivery)\b/i.test(prompt) &&
    /\b(gift\s*card)?\b/i.test(prompt)
  );
}

export function isAcceptDeliveryPrompt(prompt: string): boolean {
  return (
    /\b(accept|take|pick\s+up)\b/i.test(prompt) &&
    /\b(delivery|deliver)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.20.4 — "Shipped to Anna — out for delivery" has no "mark" verb; "shipped" + "out for delivery" together is an equally explicit signal. */
export function isMarkOutForDeliveryPrompt(prompt: string): boolean {
  if (!/\b(out\s+for\s+delivery)\b/i.test(prompt)) return false;
  return /\bmark\b/i.test(prompt) || /\bshipped\b/i.test(prompt);
}

export function isCaptureDeliveryProofPrompt(prompt: string): boolean {
  return (
    /\b(capture|upload|record|save)\b/i.test(prompt) &&
    /\b(delivery\s+proof|proof\s+of\s+delivery|signature|photo)\b/i.test(prompt)
  );
}

export function isNotifyDelayPrompt(prompt: string): boolean {
  return (
    /\b(notify|alert|inform)\b/i.test(prompt) &&
    /\b(delay|late|behind\s+schedule)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.20.5 — read-only order detail (amount, service credits, recipient) for the provider fulfillment queue, distinct from the customer-surface explain_gift_card_order. */
export function isExplainGiftCardOrderDetailsPrompt(prompt: string): boolean {
  if (/\bwhat'?s\s+on\s+this\s+gift\s+order\b/i.test(prompt)) return true;
  if (/\bservice\s+credits?\s+on\s+(?:this\s+)?card\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(explain|show|what'?s)\b/i.test(prompt) &&
    /\bgift\s*card\b/i.test(prompt) &&
    /\border\b/i.test(prompt) &&
    !/\b(mark|cancel|assign|print|start|extend)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isTrackGiftCardShipmentPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(track|where|status)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(shipment|shipping|tracking|carrier|shipped|out\s+for\s+delivery)\b/i.test(
      prompt,
    )
  );
}

export function isEnterShippingAddressPrompt(prompt: string): boolean {
  return (
    /\b(enter|add|update|set)\b/i.test(prompt) &&
    /\b(shipping\s+address|delivery\s+address|ship\s+to)\b/i.test(prompt)
  );
}

export function isShippingMethodQuotePrompt(prompt: string): boolean {
  return (
    /\b(quote|get|show|compare)\b/i.test(prompt) &&
    /\b(shipping\s+method|delivery\s+option|shipping\s+fee|shipping\s+cost)\b/i.test(
      prompt,
    )
  );
}

export function isOrderStatusNotificationsPrompt(prompt: string): boolean {
  return (
    (/\b(enable|turn\s+on|show|get)\b/i.test(prompt) &&
      /\b(order\s+status|notification|notifications|alerts?)\b/i.test(
        prompt,
      )) ||
    (/\b(order\s+status)\b/i.test(prompt) &&
      /\b(notification|notify)\b/i.test(prompt))
  );
}

export function isFulfillmentCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !FULFILLMENT_VERB.test(trimmed)) return false;
  if (
    /\b(buy|purchase)\b/i.test(trimmed) &&
    (isBuyGiftCardPrompt(trimmed) || isBuyGiftCardPhysicalPrompt(trimmed))
  ) {
    return false;
  }
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeFulfillmentCompoundPrompt(trimmed).length > 1
  );
}

export function extractEmployeeNameFromPrompt(prompt: string): string | null {
  const toMatch = prompt.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (toMatch) return toMatch[1].trim();
  const assignMatch = prompt.match(
    /\bassign(?:\s+\w+){0,3}\s+to\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+and|\s*$)/i,
  );
  if (assignMatch) return assignMatch[1].trim();
  const named = prompt.match(/\b(?:Anna|Maria|John|[A-Z][a-z]{2,})\b/);
  return named?.[0]?.trim() ?? null;
}

export function extractGiftCardIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];
  const shortCode = prompt.match(/\bcard\s+(GC-[A-Za-z0-9]+)\b/i);
  if (shortCode) return shortCode[1].toUpperCase();
  const orderWord = prompt.match(/\border\s+([0-9a-f-]{8,})\b/i);
  return orderWord?.[1] ?? null;
}

/** ai-cmd-provider-5.20.5 — narrate a gift card order's contents for the provider fulfillment view. */
export function formatGiftCardOrderDetailsText(order: {
  id: string;
  cardType: string;
  purchaseAmount: number | null;
  balance: number | null;
  currency: string;
  recipientName: string | null;
  deliveryMethod: string | null;
  fulfillmentStatus: string | null;
}): string {
  const money = (value: number | null) =>
    `${order.currency} ${(value ?? 0).toFixed(2)}`;
  const parts = [
    `Order ${order.id.slice(0, 8)} — ${order.cardType} gift card, ${money(order.purchaseAmount)} (${money(order.balance)} remaining)`,
  ];
  if (order.recipientName) parts.push(`for ${order.recipientName}`);
  if (order.deliveryMethod) parts.push(`delivery: ${order.deliveryMethod}`);
  if (order.fulfillmentStatus) {
    parts.push(`status: ${order.fulfillmentStatus}`);
  }
  return `${parts.join(', ')}.`;
}

export function resolveShippingCity(
  cityState: RegExpMatchArray | null,
  cityOnly: RegExpMatchArray | null,
): string {
  if (cityState?.[1]) return cityState[1].trim();
  if (cityOnly?.[2]) return cityOnly[2].trim();
  return '';
}

export function extractShippingAddressFromPrompt(
  prompt: string,
): Record<string, string> | null {
  const street = prompt.match(
    /\b(\d+\s+[\w\s]+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Dr))\b/i,
  );
  const cityState = prompt.match(
    /\b([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/,
  );
  const cityOnly = prompt.match(/\b(\d+\s+[\w\s]+)\s+([A-Za-z\s]{2,30})\b/);
  if (!street && !cityOnly && !cityState) return null;
  const line1 = street?.[1]?.trim() ?? cityOnly?.[1]?.trim() ?? '';
  const city = resolveShippingCity(cityState, cityOnly);
  const stateRegion = cityState?.[2]?.trim() ?? '';
  const postalCode = cityState?.[3]?.trim() ?? '';
  if (!line1 && !city) return null;
  return {
    line1,
    city,
    stateRegion,
    postalCode,
    country: 'US',
    recipientName: 'Recipient',
  };
}

export function extractCarrierTrackingFromPrompt(prompt: string): {
  carrier?: string;
  trackingNumber?: string;
} {
  const carrierMatch = prompt.match(/\b(UPS|USPS|FedEx|DHL)\b/i);
  const trackingMatch = prompt.match(
    /\btracking\s+(?:#|number\s+)?([A-Z0-9-]{6,})\b/i,
  );
  const trackingAlt = prompt.match(/\b([A-Z]{2}\d{9}[A-Z]{2})\b/);
  return {
    carrier: carrierMatch?.[1],
    trackingNumber: trackingMatch?.[1] ?? trackingAlt?.[1],
  };
}

export function extractDelayReasonFromPrompt(prompt: string): string | null {
  const because = prompt.match(
    /\b(?:because|due\s+to|reason)\s+(.+?)(?:\s+and|\s*$)/i,
  );
  if (because) return because[1].trim();
  const delay = prompt.match(
    /\bdelay(?:ed)?\s+(?:because\s+)?(.+?)(?:\s+and|\s*$)/i,
  );
  return delay?.[1]?.trim() ?? null;
}

/** Free-text reason for a cancel/refund action (e.g. "cancel order X because the item arrived damaged"). */
export function extractCancelReasonFromPrompt(prompt: string): string | null {
  const because = prompt.match(
    /\b(?:because|due\s+to|reason(?:\s+is)?:?)\s+(.+?)(?:\s+and|\s*$)/i,
  );
  return because?.[1]?.trim() || null;
}

export function extractCancelWindowHoursFromPrompt(
  prompt: string,
): number | null {
  const hours = prompt.match(/\b(\d+)\s*hours?\b/i);
  if (hours) return Number.parseInt(hours[1], 10);
  const days = prompt.match(/\b(\d+)\s*days?\b/i);
  if (days) return Number.parseInt(days[1], 10) * 24;
  return null;
}

export function extractProofFromPrompt(prompt: string): {
  proofUrl?: string;
  proofNote?: string;
} {
  const url = prompt.match(/\b(https?:\/\/\S+)\b/i);
  const note = prompt.match(/\bnote\s+"([^"]+)"/i);
  return {
    proofUrl: url?.[1],
    proofNote: note?.[1] ?? (url ? undefined : prompt.slice(0, 120)),
  };
}

export function parseFirstCardFromQueue<T extends { id: string }>(
  orders: T[],
): string | null {
  return orders[0]?.id ?? null;
}

export function resolveFulfillmentQueueHead(
  details: Record<string, unknown>,
): string | null {
  const queue = details.queue as Array<{ id: string }> | undefined;
  const orders = details.orders as Array<{ id: string }> | undefined;
  return parseFirstCardFromQueue(queue ?? orders ?? []);
}

export function parseCancelModifyWindowHours(
  params: Record<string, unknown>,
  prompt = '',
): number | null {
  const raw =
    (params.cancelModifyWindowHours as number | undefined) ??
    extractCancelWindowHoursFromPrompt(prompt);
  if (raw == null || !Number.isFinite(Number(raw)) || Number(raw) <= 0)
    return null;
  return Number(raw);
}

export function isPhysicalGiftCardOrder(
  order: { deliveryMethod?: string | null } | null | undefined,
): order is { deliveryMethod: 'physical' } {
  return Boolean(order && order.deliveryMethod === 'physical');
}

export function isShippedFulfillmentStatus(
  status: string | null | undefined,
): boolean {
  return status === 'shipped' || status === 'delivered';
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueGiftFulfillmentIntent(
  prompt: string,
  action: string,
): { action: GiftFulfillmentIntent; rescueReason: string } | null {
  if (isGiftFulfillmentIntent(action)) return null;
  if (isFulfillmentCompoundPrompt(prompt) && action !== 'compound_intent')
    return null;
  if (
    /\b(buy|purchase)\b/i.test(prompt) &&
    (isBuyGiftCardPrompt(prompt) || isBuyGiftCardPhysicalPrompt(prompt))
  ) {
    return null;
  }
  if (
    /\b(gift\s*card|physical)\b/i.test(prompt) &&
    isTrackPhysicalGiftCardPrompt(prompt) &&
    !isTrackGiftCardShipmentPrompt(prompt)
  ) {
    return null;
  }

  if (isTrackGiftCardShipmentPrompt(prompt)) {
    return {
      action: 'track_gift_card_shipment',
      rescueReason: 'track_shipment',
    };
  }
  if (isOrderStatusNotificationsPrompt(prompt)) {
    return {
      action: 'order_status_notifications',
      rescueReason: 'order_notifications',
    };
  }
  if (isEnterShippingAddressPrompt(prompt)) {
    return {
      action: 'enter_shipping_address',
      rescueReason: 'shipping_address',
    };
  }
  if (isShippingMethodQuotePrompt(prompt)) {
    return { action: 'shipping_method_quote', rescueReason: 'shipping_quote' };
  }

  if (isGiftCardCreationQueuePrompt(prompt)) {
    return {
      action: 'gift_card_creation_queue',
      rescueReason: 'creation_queue',
    };
  }
  if (isStartCardPreparationPrompt(prompt)) {
    return { action: 'start_card_preparation', rescueReason: 'start_prep' };
  }
  if (isMarkCardReadyPrompt(prompt)) {
    return { action: 'mark_card_ready', rescueReason: 'card_ready' };
  }
  if (isDeliveryQueuePrompt(prompt)) {
    return { action: 'delivery_queue', rescueReason: 'delivery_queue' };
  }
  if (isAcceptDeliveryPrompt(prompt)) {
    return { action: 'accept_delivery', rescueReason: 'accept_delivery' };
  }
  if (isMarkOutForDeliveryPrompt(prompt)) {
    return {
      action: 'mark_out_for_delivery',
      rescueReason: 'out_for_delivery',
    };
  }
  if (isCaptureDeliveryProofPrompt(prompt)) {
    return { action: 'capture_delivery_proof', rescueReason: 'delivery_proof' };
  }
  if (isNotifyDelayPrompt(prompt)) {
    return { action: 'notify_delay', rescueReason: 'notify_delay' };
  }
  if (isExplainGiftCardOrderDetailsPrompt(prompt)) {
    return {
      action: 'explain_gift_card_order_details',
      rescueReason: 'order_details',
    };
  }

  if (isFilterAwaitingCreationPrompt(prompt)) {
    return {
      action: 'filter_awaiting_creation',
      rescueReason: 'awaiting_creation',
    };
  }
  if (isAssignCardCreatorPrompt(prompt)) {
    return { action: 'assign_card_creator', rescueReason: 'assign_creator' };
  }
  if (isAssignDeliveryStaffPrompt(prompt)) {
    return { action: 'assign_delivery_staff', rescueReason: 'assign_delivery' };
  }
  if (isMarkShippedPrompt(prompt)) {
    return { action: 'mark_shipped', rescueReason: 'mark_shipped' };
  }
  if (isMarkDeliveredPrompt(prompt)) {
    return { action: 'mark_delivered', rescueReason: 'mark_delivered' };
  }
  if (isCancelGiftCardOrderPrompt(prompt)) {
    return { action: 'cancel_gift_card_order', rescueReason: 'cancel_order' };
  }
  if (isExtendCancelWindowPrompt(prompt)) {
    return { action: 'extend_cancel_window', rescueReason: 'cancel_window' };
  }
  if (isPrintPackingSlipPrompt(prompt)) {
    return { action: 'print_packing_slip', rescueReason: 'packing_slip' };
  }
  if (isListGiftCardOrdersPrompt(prompt)) {
    return { action: 'list_gift_card_orders', rescueReason: 'list_orders' };
  }

  return null;
}

function classifyFulfillmentSegment(
  segment: string,
): FulfillmentCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const employeeName = extractEmployeeNameFromPrompt(text);
  if (employeeName) base.employeeName = employeeName;
  const giftCardId = extractGiftCardIdFromPrompt(text);
  if (giftCardId) base.giftCardId = giftCardId;
  const address = extractShippingAddressFromPrompt(text);
  if (address) base.shippingAddress = address;
  const tracking = extractCarrierTrackingFromPrompt(text);
  if (tracking.carrier) base.carrier = tracking.carrier;
  if (tracking.trackingNumber) base.trackingNumber = tracking.trackingNumber;
  const delayReason = extractDelayReasonFromPrompt(text);
  if (delayReason) base.delayReason = delayReason;
  const cancelHours = extractCancelWindowHoursFromPrompt(text);
  if (cancelHours != null) base.cancelModifyWindowHours = cancelHours;
  const proof = extractProofFromPrompt(text);
  if (proof.proofUrl) base.proofUrl = proof.proofUrl;
  if (proof.proofNote) base.proofNote = proof.proofNote;
  if (/\bfirst\b/i.test(text)) base.useFirstInQueue = true;

  if (isGiftCardCreationQueuePrompt(text)) {
    return { action: 'gift_card_creation_queue', params: base, segment: text };
  }
  if (
    isMarkCardReadyPrompt(text) ||
    (/\bmark\b/i.test(text) && /\bready\b/i.test(text))
  ) {
    return { action: 'mark_card_ready', params: base, segment: text };
  }
  if (isFilterAwaitingCreationPrompt(text)) {
    return { action: 'filter_awaiting_creation', params: base, segment: text };
  }
  if (isAssignCardCreatorPrompt(text)) {
    return { action: 'assign_card_creator', params: base, segment: text };
  }
  if (isAssignDeliveryStaffPrompt(text)) {
    return { action: 'assign_delivery_staff', params: base, segment: text };
  }
  if (isListGiftCardOrdersPrompt(text)) {
    return { action: 'list_gift_card_orders', params: base, segment: text };
  }
  if (
    isMarkShippedPrompt(text) ||
    (/\bmark\b/i.test(text) && /\bshipped\b/i.test(text))
  ) {
    return { action: 'mark_shipped', params: base, segment: text };
  }
  if (
    isMarkDeliveredPrompt(text) ||
    (/\bmark\b/i.test(text) && /\bdelivered\b/i.test(text))
  ) {
    return { action: 'mark_delivered', params: base, segment: text };
  }
  if (isCancelGiftCardOrderPrompt(text)) {
    return { action: 'cancel_gift_card_order', params: base, segment: text };
  }
  if (isExtendCancelWindowPrompt(text)) {
    return { action: 'extend_cancel_window', params: base, segment: text };
  }
  if (isPrintPackingSlipPrompt(text)) {
    return { action: 'print_packing_slip', params: base, segment: text };
  }
  if (isStartCardPreparationPrompt(text)) {
    return { action: 'start_card_preparation', params: base, segment: text };
  }
  if (isDeliveryQueuePrompt(text)) {
    return { action: 'delivery_queue', params: base, segment: text };
  }
  if (isAcceptDeliveryPrompt(text)) {
    return { action: 'accept_delivery', params: base, segment: text };
  }
  if (isMarkOutForDeliveryPrompt(text)) {
    return { action: 'mark_out_for_delivery', params: base, segment: text };
  }
  if (isCaptureDeliveryProofPrompt(text)) {
    return { action: 'capture_delivery_proof', params: base, segment: text };
  }
  if (isNotifyDelayPrompt(text)) {
    return { action: 'notify_delay', params: base, segment: text };
  }
  if (isTrackGiftCardShipmentPrompt(text)) {
    return { action: 'track_gift_card_shipment', params: base, segment: text };
  }
  if (isEnterShippingAddressPrompt(text)) {
    return { action: 'enter_shipping_address', params: base, segment: text };
  }
  if (isShippingMethodQuotePrompt(text)) {
    return { action: 'shipping_method_quote', params: base, segment: text };
  }
  if (isOrderStatusNotificationsPrompt(text)) {
    return {
      action: 'order_status_notifications',
      params: base,
      segment: text,
    };
  }
  return null;
}

/** Deterministic multi-command split for gift card fulfillment operations. */
export function decomposeFulfillmentCompoundPrompt(
  prompt: string,
): FulfillmentCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyFulfillmentSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: FulfillmentCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyFulfillmentSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}

/**
 * The reads inside this list — e2e-bug.376, second wave.
 *
 * The registry binding passes the whole intent list as its own `mutateIntents`,
 * so every member is registered `mutating: true`. §110 fixed that pattern for
 * `PROVIDER_PAYMENTS_INTENTS` and checked the other bindings for reads by
 * looking for read *verbs* (`explain_`, `list_`, `get_`, `summarize_`). These
 * are named as nouns — `revenue_forecast`, `staff_service_matrix`,
 * `delivery_queue` — so the check missed them.
 *
 * Excluded from the mutate list rather than removed from the intent list: they
 * are real commands on this surface, they simply do not write.
 */
export const PROVIDER_GIFT_FULFILLMENT_READ_INTENTS: readonly string[] = [
  'explain_gift_card_order_details',
  'delivery_queue',
  'gift_card_creation_queue',
];
