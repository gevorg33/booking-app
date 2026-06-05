import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import type { GiftCardFulfillmentService } from '../gift-cards/gift-card-fulfillment.service.js';
import type { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import type { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import type { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';
import {
  mergeGiftCardSettings,
  readBusinessGiftCardSettings,
} from '../gift-cards/gift-card.types.js';
import { deactivateCancelledGiftCard } from '../gift-cards/gift-card-refund.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeFulfillmentCompoundPrompt,
  extractCancelWindowHoursFromPrompt,
  extractCarrierTrackingFromPrompt,
  extractDelayReasonFromPrompt,
  extractEmployeeNameFromPrompt,
  extractGiftCardIdFromPrompt,
  extractProofFromPrompt,
  extractShippingAddressFromPrompt,
  isPhysicalGiftCardOrder,
  isShippedFulfillmentStatus,
  parseCancelModifyWindowHours,
  parseFirstCardFromQueue,
  resolveFulfillmentQueueHead,
  type FulfillmentCompoundStep,
} from './ai-gift-fulfillment.util.js';

export interface GiftFulfillmentLogicDeps {
  fulfillmentService: GiftCardFulfillmentService;
  giftCardOrderService: GiftCardOrderService;
  giftCardPurchaseService: GiftCardPurchaseService;
  giftCardRefundService: GiftCardRefundService;
  businessRepo: Repository<Business>;
  giftCardRepo: Repository<GiftCard>;
  employeeRepo: Repository<Employee>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveGiftCardId(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<string | null> {
  if (params.giftCardId) return params.giftCardId as string;
  const fromPrompt = extractGiftCardIdFromPrompt(
    prompt ?? (params._prompt as string) ?? '',
  );
  if (fromPrompt) return fromPrompt;
  if (params.useFirstInQueue) {
    const queue =
      await deps.fulfillmentService.listCardCreationQueue(businessId);
    return parseFirstCardFromQueue(queue);
  }
  return null;
}

async function resolveEmployee(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<Employee | null> {
  if (params.employeeId) {
    const found = await deps.employeeRepo.findOne({
      where: { id: params.employeeId as string, businessId, isActive: true },
    });
    return found ?? null;
  }
  const name =
    (params.employeeName as string | undefined) ??
    extractEmployeeNameFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (!name) return null;
  const employees = await deps.employeeRepo.find({
    where: { businessId, isActive: true },
  });
  return resolveByName(employees, name) ?? null;
}

function buildPackingSlip(card: GiftCard) {
  const address = card.shippingAddress;
  return {
    orderId: card.id,
    recipientName: card.recipientName ?? address?.recipientName ?? 'Recipient',
    address: address
      ? {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          stateRegion: address.stateRegion,
          postalCode: address.postalCode,
          country: address.country,
        }
      : null,
    personalMessage: card.personalMessage,
    shippingMethod: card.shippingMethod,
    printableAt: new Date().toISOString(),
  };
}

export async function handleListGiftCardOrdersLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const result = await deps.fulfillmentService.listDashboardOrders(businessId, {
    page: params.page as number | undefined,
    pageSize: params.pageSize as number | undefined,
    search: params.search as string | undefined,
  });
  return success(
    'list_gift_card_orders',
    result.total
      ? `${result.total} gift card order(s) — showing page ${result.page}.`
      : 'No gift card fulfillment orders found.',
    {
      orders: result.orders,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    },
  );
}

export async function handleFilterAwaitingCreationLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const result = await deps.fulfillmentService.listDashboardOrders(businessId, {
    status: 'awaiting_card_creation',
    page: params.page as number | undefined,
    pageSize: params.pageSize as number | undefined,
  });
  return success(
    'filter_awaiting_creation',
    result.total
      ? `${result.total} order(s) awaiting card creation.`
      : 'No orders awaiting card creation.',
    {
      orders: result.orders,
      total: result.total,
      status: 'awaiting_card_creation',
    },
  );
}

export async function handleAssignCardCreatorLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  const employee = await resolveEmployee(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'assign_card_creator',
      'Specify which gift card order to assign.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  if (!employee) {
    return failure(
      'assign_card_creator',
      'Specify card creator staff by name.',
      {
        clarify: true,
        missing: ['employeeName'],
      },
    );
  }

  const card = await deps.fulfillmentService.getDashboardOrder(
    businessId,
    giftCardId,
  );
  card.cardCreatorStaffId = employee.id;
  await deps.giftCardRepo.save(card);

  return success(
    'assign_card_creator',
    `Assigned ${employee.name} as card creator for order ${card.id.slice(0, 8)}.`,
    {
      giftCardId: card.id,
      employeeId: employee.id,
      employeeName: employee.name,
    },
  );
}

export async function handleAssignDeliveryStaffLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  const employee = await resolveEmployee(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'assign_delivery_staff',
      'Specify which gift card order to assign.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  if (!employee) {
    return failure('assign_delivery_staff', 'Specify delivery staff by name.', {
      clarify: true,
      missing: ['employeeName'],
    });
  }

  const card = await deps.fulfillmentService.getDashboardOrder(
    businessId,
    giftCardId,
  );
  card.deliveryStaffId = employee.id;
  await deps.giftCardRepo.save(card);

  return success(
    'assign_delivery_staff',
    `Assigned ${employee.name} for delivery on order ${card.id.slice(0, 8)}.`,
    {
      giftCardId: card.id,
      employeeId: employee.id,
      employeeName: employee.name,
    },
  );
}

export async function handleMarkShippedLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure('mark_shipped', 'Specify gift card order to mark shipped.', {
      clarify: true,
      missing: ['giftCardId'],
    });
  }
  const tracking = extractCarrierTrackingFromPrompt(
    prompt ?? (params._prompt as string) ?? '',
  );
  const carrier =
    (params.carrier as string | undefined) ?? tracking.carrier ?? 'Carrier';
  const trackingNumber =
    (params.trackingNumber as string | undefined) ??
    tracking.trackingNumber ??
    `TRK-${Date.now()}`;

  try {
    const card = await deps.fulfillmentService.markShipped(
      businessId,
      giftCardId,
      carrier,
      trackingNumber,
    );
    return success(
      'mark_shipped',
      `Order marked shipped via ${carrier} — tracking ${trackingNumber}.`,
      {
        giftCardId: card.id,
        carrier,
        trackingNumber,
        fulfillmentStatus: card.fulfillmentStatus,
      },
    );
  } catch (err: any) {
    return failure(
      'mark_shipped',
      err?.message ?? 'Could not mark order shipped.',
    );
  }
}

export async function handleMarkDeliveredLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'mark_delivered',
      'Specify gift card order to mark delivered.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  try {
    const card = await deps.fulfillmentService.markDelivered(
      businessId,
      giftCardId,
    );
    return success(
      'mark_delivered',
      `Gift card order delivered${card.deliveredAt ? ` at ${card.deliveredAt.toISOString()}` : ''}.`,
      {
        giftCardId: card.id,
        fulfillmentStatus: card.fulfillmentStatus,
        deliveredAt: card.deliveredAt,
      },
    );
  } catch (err: any) {
    return failure(
      'mark_delivered',
      err?.message ?? 'Could not mark order delivered.',
    );
  }
}

export async function handleCancelGiftCardOrderLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'cancel_gift_card_order',
      'Specify gift card order to cancel.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('cancel_gift_card_order', 'Business not found.');

  const card = await deps.fulfillmentService.getDashboardOrder(
    businessId,
    giftCardId,
  );
  deactivateCancelledGiftCard(card);
  let refundStatus: string | null = null;
  if (card.stripeSessionId) {
    refundStatus = await deps.giftCardRefundService.refundPurchase(
      business,
      card,
    );
  }
  await deps.giftCardRepo.save(card);

  return success(
    'cancel_gift_card_order',
    `Gift card order cancelled${refundStatus ? ` — refund ${refundStatus}` : ''}.`,
    {
      giftCardId: card.id,
      refundStatus,
      fulfillmentStatus: card.fulfillmentStatus,
    },
  );
}

export async function handleExtendCancelWindowLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('extend_cancel_window', 'Business not found.');

  const hours = parseCancelModifyWindowHours(
    params,
    prompt ?? (params._prompt as string) ?? '',
  );
  if (hours == null) {
    return failure(
      'extend_cancel_window',
      'Specify cancel window hours (e.g. "extend cancel window to 48 hours").',
      {
        clarify: true,
        missing: ['cancelModifyWindowHours'],
      },
    );
  }

  const current = readBusinessGiftCardSettings(business.settings);
  const next = mergeGiftCardSettings({
    ...current,
    cancelModifyWindowHours: hours,
  });
  business.settings = {
    ...(business.settings ?? {}),
    giftCards: next,
  };
  await deps.businessRepo.save(business);

  return success(
    'extend_cancel_window',
    `Gift card cancel/modify window extended to ${hours} hour(s).`,
    { cancelModifyWindowHours: hours },
  );
}

export async function handlePrintPackingSlipLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'print_packing_slip',
      'Specify gift card order for packing slip.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  const card = await deps.fulfillmentService.getDashboardOrder(
    businessId,
    giftCardId,
  );
  const slip = buildPackingSlip(card);
  return success(
    'print_packing_slip',
    `Packing slip ready for order ${card.id.slice(0, 8)}.`,
    { slip },
  );
}

export async function handleGiftCardCreationQueueLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const queue = await deps.fulfillmentService.listCardCreationQueue(businessId);
  return success(
    'gift_card_creation_queue',
    queue.length
      ? `${queue.length} card(s) in creation queue.`
      : 'Creation queue is empty.',
    { queue, count: queue.length },
  );
}

export async function handleStartCardPreparationLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'start_card_preparation',
      'Specify gift card order to start preparing.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  try {
    const card = await deps.fulfillmentService.getDashboardOrder(
      businessId,
      giftCardId,
    );
    if (card.deliveryMethod !== 'physical') {
      return failure(
        'start_card_preparation',
        'Not a physical gift card order.',
      );
    }
    if (card.fulfillmentStatus !== 'awaiting_card_creation') {
      return failure(
        'start_card_preparation',
        `Order is ${card.fulfillmentStatus ?? 'not'} — expected awaiting_card_creation.`,
      );
    }
    return success(
      'start_card_preparation',
      `Card preparation started for order ${card.id.slice(0, 8)}.`,
      {
        giftCardId: card.id,
        fulfillmentStatus: card.fulfillmentStatus,
        started: true,
      },
    );
  } catch (err: any) {
    return failure(
      'start_card_preparation',
      err?.message ?? 'Could not start card preparation.',
    );
  }
}

export async function handleMarkCardReadyLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'mark_card_ready',
      'Specify gift card order to mark ready.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  try {
    const card = await deps.fulfillmentService.markCardReady(
      businessId,
      giftCardId,
      userId ?? 'system',
    );
    return success(
      'mark_card_ready',
      `Gift card ready for delivery — order ${card.id.slice(0, 8)}.`,
      {
        giftCardId: card.id,
        fulfillmentStatus: card.fulfillmentStatus,
        cardReadyAt: card.cardReadyAt,
      },
    );
  } catch (err: any) {
    return failure(
      'mark_card_ready',
      err?.message ?? 'Could not mark card ready.',
    );
  }
}

export async function handleDeliveryQueueLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const queue = await deps.fulfillmentService.listDeliveryQueue(businessId);
  return success(
    'delivery_queue',
    queue.length
      ? `${queue.length} order(s) in delivery queue.`
      : 'Delivery queue is empty.',
    { queue, count: queue.length },
  );
}

export async function handleMarkOutForDeliveryLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'mark_out_for_delivery',
      'Specify gift card order for delivery.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  try {
    const card = await deps.fulfillmentService.markOutForDelivery(
      businessId,
      giftCardId,
      userId ?? 'system',
    );
    return success(
      'mark_out_for_delivery',
      `Order ${card.id.slice(0, 8)} marked out for delivery.`,
      { giftCardId: card.id, fulfillmentStatus: card.fulfillmentStatus },
    );
  } catch (err: any) {
    return failure(
      'mark_out_for_delivery',
      err?.message ?? 'Could not mark out for delivery.',
    );
  }
}

export async function handleAcceptDeliveryLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  return handleMarkOutForDeliveryLogic(
    deps,
    businessId,
    params,
    userId,
    prompt,
  );
}

export async function handleCaptureDeliveryProofLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  if (!giftCardId) {
    return failure(
      'capture_delivery_proof',
      'Specify gift card order for delivery proof.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }

  const proof = extractProofFromPrompt(
    prompt ?? (params._prompt as string) ?? '',
  );
  const proofUrl = (params.proofUrl as string | undefined) ?? proof.proofUrl;
  const proofNote = (params.proofNote as string | undefined) ?? proof.proofNote;
  if (!proofUrl && !proofNote) {
    return failure('capture_delivery_proof', 'Provide proof URL or note.', {
      clarify: true,
      missing: ['proofUrl'],
    });
  }

  const card = await deps.fulfillmentService.getDashboardOrder(
    businessId,
    giftCardId,
  );
  const existing = card.shippingAddress?.instructions ?? '';
  const append = [
    proofUrl ? `proof:${proofUrl}` : null,
    proofNote ? `note:${proofNote}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
  card.shippingAddress = {
    recipientName:
      card.shippingAddress?.recipientName ?? card.recipientName ?? 'Recipient',
    line1: card.shippingAddress?.line1 ?? '',
    city: card.shippingAddress?.city ?? '',
    postalCode: card.shippingAddress?.postalCode ?? '',
    country: card.shippingAddress?.country ?? 'US',
    line2: card.shippingAddress?.line2,
    stateRegion: card.shippingAddress?.stateRegion,
    phone: card.shippingAddress?.phone,
    instructions: existing ? `${existing}; ${append}` : append,
  };
  await deps.giftCardRepo.save(card);

  return success('capture_delivery_proof', 'Delivery proof recorded.', {
    giftCardId: card.id,
    proofUrl,
    proofNote,
  });
}

export async function handleNotifyDelayLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const giftCardId = await resolveGiftCardId(deps, businessId, params, prompt);
  const delayReason =
    (params.delayReason as string | undefined) ??
    extractDelayReasonFromPrompt(prompt ?? (params._prompt as string) ?? '') ??
    'Unspecified delay';

  const details: Record<string, unknown> = {
    delayReason,
    notificationQueued: true,
    queuedAt: new Date().toISOString(),
  };
  if (giftCardId) {
    try {
      const card = await deps.fulfillmentService.getDashboardOrder(
        businessId,
        giftCardId,
      );
      details.giftCardId = card.id;
      details.recipientEmail = card.recipientEmail ?? card.purchaserEmail;
    } catch {
      details.giftCardId = giftCardId;
    }
  }

  return success(
    'notify_delay',
    `Delay notification queued — ${delayReason}.`,
    details,
  );
}

export async function handleTrackGiftCardShipmentLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'track_gift_card_shipment',
      'Sign in to track your gift card shipment.',
      { clarify: true },
    );
  }

  const giftCardId = params.giftCardId as string | undefined;
  const order = giftCardId
    ? await deps.giftCardOrderService.getCustomerOrder(
        businessId,
        customerId,
        giftCardId,
      )
    : (
        await deps.giftCardOrderService.listCustomerOrders(
          businessId,
          customerId,
        )
      ).find((o) => o.deliveryMethod === 'physical');

  if (!isPhysicalGiftCardOrder(order)) {
    return failure(
      'track_gift_card_shipment',
      'No physical gift card shipment found.',
    );
  }

  const trackingInfo = {
    carrier: order.trackingCarrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    fulfillmentStatus: order.fulfillmentStatus,
    shippedAt: isShippedFulfillmentStatus(order.fulfillmentStatus),
  };

  const summaryParts = [`Status: ${order.fulfillmentStatus ?? 'processing'}`];
  if (trackingInfo.carrier)
    summaryParts.push(`carrier ${trackingInfo.carrier}`);
  if (trackingInfo.trackingNumber)
    summaryParts.push(`tracking ${trackingInfo.trackingNumber}`);

  return success('track_gift_card_shipment', summaryParts.join(' — '), {
    order,
    tracking: trackingInfo,
  });
}

export async function handleEnterShippingAddressLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const address =
    (params.shippingAddress as Record<string, string> | undefined) ??
    extractShippingAddressFromPrompt(
      prompt ?? (params._prompt as string) ?? '',
    );
  if (!address?.line1 || !address.city) {
    return failure(
      'enter_shipping_address',
      'Provide shipping address (street and city).',
      {
        clarify: true,
        missing: ['shippingAddress'],
      },
    );
  }

  const preview = {
    recipientName:
      (params.recipientName as string | undefined) ??
      address.recipientName ??
      'Recipient',
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    stateRegion: address.stateRegion ?? null,
    postalCode: address.postalCode ?? '',
    country: address.country ?? 'US',
    valid: true,
  };

  const giftCardId = params.giftCardId as string | undefined;
  if (giftCardId) {
    const customerId = resolveSessionCustomerId(params);
    if (customerId) {
      try {
        const order = await deps.giftCardOrderService.getCustomerOrder(
          businessId,
          customerId,
          giftCardId,
        );
        return success(
          'enter_shipping_address',
          `Shipping address validated for order ${order.id.slice(0, 8)}.`,
          { preview, giftCardId: order.id },
        );
      } catch {
        // fall through to preview-only
      }
    }
  }

  return success('enter_shipping_address', 'Shipping address validated.', {
    preview,
  });
}

export async function handleShippingMethodQuoteLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const catalog =
    await deps.giftCardPurchaseService.getPublicCatalog(businessId);
  if (!catalog.purchaseEnabled || !catalog.settings?.physicalDeliveryEnabled) {
    return failure(
      'shipping_method_quote',
      'Physical gift card shipping is not enabled.',
    );
  }

  const methods = catalog.settings.shippingMethods ?? [];
  const amount =
    (params.amount as number | undefined) ??
    catalog.settings.presetAmounts?.[0] ??
    50;
  const shippingMethodId = params.shippingMethodId as string | undefined;

  if (shippingMethodId) {
    try {
      const quote = await deps.giftCardPurchaseService.quotePurchase(
        businessId,
        {
          cardType: 'monetary',
          amount: Number(amount),
          deliveryMethod: 'physical',
          shippingMethodId,
          purchaserEmail:
            (params.purchaserEmail as string) ?? 'guest@example.com',
        },
      );
      return success(
        'shipping_method_quote',
        `${quote.label} — subtotal $${quote.subtotal.toFixed(2)} + shipping $${quote.shippingFee.toFixed(2)} = $${quote.total.toFixed(2)}.`,
        { quote, methods },
      );
    } catch (err: any) {
      return failure(
        'shipping_method_quote',
        err?.message ?? 'Could not quote shipping.',
      );
    }
  }

  const quotes = await Promise.all(
    methods.map(async (method) => {
      try {
        const quote = await deps.giftCardPurchaseService.quotePurchase(
          businessId,
          {
            cardType: 'monetary',
            amount: Number(amount),
            deliveryMethod: 'physical',
            shippingMethodId: method.id,
            purchaserEmail: 'guest@example.com',
          },
        );
        return { method, quote };
      } catch {
        return { method, quote: null };
      }
    }),
  );

  return success(
    'shipping_method_quote',
    methods.length
      ? `${methods.length} shipping option(s) — from $${Math.min(...methods.map((m) => m.fee)).toFixed(2)}.`
      : 'No shipping methods configured.',
    { methods, quotes: quotes.filter((q) => q.quote), amount },
  );
}

export async function handleOrderStatusNotificationsLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'order_status_notifications',
      'Sign in to view order notifications.',
      { clarify: true },
    );
  }

  const orders = await deps.giftCardOrderService.listCustomerOrders(
    businessId,
    customerId,
  );
  const physical = orders.filter((o) => o.deliveryMethod === 'physical');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const settings = readBusinessGiftCardSettings(business?.settings);

  const notifications = physical.map((order) => ({
    giftCardId: order.id,
    status: order.fulfillmentStatus ?? 'processing',
    notifyOnShipped: true,
    notifyOnDelivered: true,
    trackingAvailable: Boolean(order.trackingNumber),
  }));

  return success(
    'order_status_notifications',
    physical.length
      ? `${physical.length} physical order(s) — notifications ${settings.cancelModifyEnabled ? 'enabled' : 'limited'}.`
      : 'No physical gift card orders for notifications.',
    {
      notifications,
      preferences: {
        emailUpdates: true,
        smsUpdates: false,
        cancelModifyWindowHours: settings.cancelModifyWindowHours,
      },
      orders: physical,
    },
  );
}

function mergeCompoundContext(
  context: Record<string, unknown>,
  step: FulfillmentCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };

  if (details.giftCardId) next.giftCardId = details.giftCardId;
  if (
    step.action === 'gift_card_creation_queue' ||
    step.action === 'filter_awaiting_creation'
  ) {
    if (!next.giftCardId) {
      const first = resolveFulfillmentQueueHead(details);
      if (first) next.giftCardId = first;
    }
    if (step.params.useFirstInQueue) next.useFirstInQueue = true;
  }
  if (step.action === 'enter_shipping_address' && details.preview) {
    next.shippingAddress = details.preview;
  }
  if (step.action === 'shipping_method_quote') {
    const quote = details.quote as { shippingMethodId?: string } | undefined;
    if (quote && (quote as any).shippingMethodId)
      next.shippingMethodId = (quote as any).shippingMethodId;
  }
  return next;
}

export async function handleFulfillmentCompoundLogic(
  deps: GiftFulfillmentLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const steps: FulfillmentCompoundStep[] =
    (params.compoundSteps as FulfillmentCompoundStep[] | undefined) ??
    decomposeFulfillmentCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple fulfillment commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'list_gift_card_orders':
        result = await handleListGiftCardOrdersLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'filter_awaiting_creation':
        result = await handleFilterAwaitingCreationLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'assign_card_creator':
        result = await handleAssignCardCreatorLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'assign_delivery_staff':
        result = await handleAssignDeliveryStaffLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'mark_shipped':
        result = await handleMarkShippedLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'mark_delivered':
        result = await handleMarkDeliveredLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'cancel_gift_card_order':
        result = await handleCancelGiftCardOrderLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'extend_cancel_window':
        result = await handleExtendCancelWindowLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'print_packing_slip':
        result = await handlePrintPackingSlipLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'gift_card_creation_queue':
        result = await handleGiftCardCreationQueueLogic(deps, businessId);
        break;
      case 'start_card_preparation':
        result = await handleStartCardPreparationLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'mark_card_ready':
        result = await handleMarkCardReadyLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'delivery_queue':
        result = await handleDeliveryQueueLogic(deps, businessId);
        break;
      case 'accept_delivery':
        result = await handleAcceptDeliveryLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'mark_out_for_delivery':
        result = await handleMarkOutForDeliveryLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'capture_delivery_proof':
        result = await handleCaptureDeliveryProofLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'notify_delay':
        result = await handleNotifyDelayLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'track_gift_card_shipment':
        result = await handleTrackGiftCardShipmentLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'enter_shipping_address':
        result = await handleEnterShippingAddressLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'shipping_method_quote':
        result = await handleShippingMethodQuoteLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'order_status_notifications':
        result = await handleOrderStatusNotificationsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported fulfillment compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
    compoundContext = mergeCompoundContext(compoundContext, step, result);
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} fulfillment step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      fulfillmentCompound: true,
      userId,
      finalContext: compoundContext,
    },
  };
}
