import type { CommandResult } from './command-completion.types.js';
import {
  handleAcceptDeliveryLogic,
  handleAssignCardCreatorLogic,
  handleAssignDeliveryStaffLogic,
  handleCancelGiftCardOrderLogic,
  handleCaptureDeliveryProofLogic,
  handleDeliveryQueueLogic,
  handleEnterShippingAddressLogic,
  handleExtendCancelWindowLogic,
  handleFilterAwaitingCreationLogic,
  handleGiftCardCreationQueueLogic,
  handleGiftFulfillBatchLogic,
  handleListGiftCardChangeRequestsLogic,
  handleListGiftCardOrdersLogic,
  handleMarkCardReadyLogic,
  handleMarkDeliveredLogic,
  handleMarkOutForDeliveryLogic,
  handleMarkShippedLogic,
  handleNotifyDelayLogic,
  handleOrderStatusNotificationsLogic,
  handlePrintPackingSlipLogic,
  handleResolveGiftCardChangeRequestLogic,
  handleShippingMethodQuoteLogic,
  handleStartCardPreparationLogic,
  handleTrackGiftCardShipmentLogic,
  handleUpdateGiftCardSettingsLogic,
  type GiftFulfillmentLogicDeps,
} from './ai-gift-fulfillment.logic.js';

export type GiftFulfillmentDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId?: string;
  sessionCustomerId?: string;
};

export type GiftFulfillmentLogicDispatchHandler = (
  deps: GiftFulfillmentLogicDeps,
  ctx: GiftFulfillmentDispatchContext,
) => Promise<CommandResult>;

export function buildGiftFulfillmentLogicDispatchMap(): ReadonlyMap<
  string,
  GiftFulfillmentLogicDispatchHandler
> {
  const map = new Map<string, GiftFulfillmentLogicDispatchHandler>();

  map.set('list_gift_card_orders', (deps, ctx) =>
    handleListGiftCardOrdersLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('filter_awaiting_creation', (deps, ctx) =>
    handleFilterAwaitingCreationLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('assign_card_creator', (deps, ctx) =>
    handleAssignCardCreatorLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('assign_delivery_staff', (deps, ctx) =>
    handleAssignDeliveryStaffLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('mark_shipped', (deps, ctx) =>
    handleMarkShippedLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('mark_delivered', (deps, ctx) =>
    handleMarkDeliveredLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('cancel_gift_card_order', (deps, ctx) =>
    handleCancelGiftCardOrderLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('extend_cancel_window', (deps, ctx) =>
    handleExtendCancelWindowLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('update_gift_card_settings', (deps, ctx) =>
    handleUpdateGiftCardSettingsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('list_gift_card_change_requests', (deps, ctx) =>
    handleListGiftCardChangeRequestsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('resolve_gift_card_change_request', (deps, ctx) =>
    handleResolveGiftCardChangeRequestLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('gift_fulfill_batch', (deps, ctx) =>
    handleGiftFulfillBatchLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('print_packing_slip', (deps, ctx) =>
    handlePrintPackingSlipLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('gift_card_creation_queue', (deps, ctx) =>
    handleGiftCardCreationQueueLogic(deps, ctx.businessId),
  );
  map.set('start_card_preparation', (deps, ctx) =>
    handleStartCardPreparationLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('mark_card_ready', (deps, ctx) =>
    handleMarkCardReadyLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('delivery_queue', (deps, ctx) =>
    handleDeliveryQueueLogic(deps, ctx.businessId),
  );
  map.set('accept_delivery', (deps, ctx) =>
    handleAcceptDeliveryLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('mark_out_for_delivery', (deps, ctx) =>
    handleMarkOutForDeliveryLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId,
      ctx.prompt,
    ),
  );
  map.set('capture_delivery_proof', (deps, ctx) =>
    handleCaptureDeliveryProofLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('notify_delay', (deps, ctx) =>
    handleNotifyDelayLogic(deps, ctx.businessId, ctx.params, ctx.prompt),
  );
  map.set('track_gift_card_shipment', (deps, ctx) =>
    handleTrackGiftCardShipmentLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('enter_shipping_address', (deps, ctx) =>
    handleEnterShippingAddressLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionCustomerId: ctx.sessionCustomerId,
        _prompt: ctx.prompt,
      },
      ctx.prompt,
    ),
  );
  map.set('shipping_method_quote', (deps, ctx) =>
    handleShippingMethodQuoteLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('order_status_notifications', (deps, ctx) =>
    handleOrderStatusNotificationsLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );

  return map;
}

/** Registry-driven dispatch table for AiGiftFulfillmentService (ai-cmd-ext-0.5). */
export const GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP =
  buildGiftFulfillmentLogicDispatchMap();
