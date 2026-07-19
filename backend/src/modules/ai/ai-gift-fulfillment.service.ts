import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardFulfillmentService } from '../gift-cards/gift-card-fulfillment.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeFulfillmentCompoundPrompt,
  isFulfillmentCompoundPrompt,
  rescueGiftFulfillmentIntent,
} from './ai-gift-fulfillment.util.js';
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
  handleFulfillmentCompoundLogic,
  handleGiftCardCreationQueueLogic,
  handleGiftFulfillBatchLogic,
  handleExplainGiftCardOrderDetailsLogic,
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
import { dispatchGiftFulfillmentLogicIntent } from './ai-gift-fulfillment-dispatch.util.js';
import type { GiftFulfillmentDispatchContext } from './ai-gift-fulfillment-dispatch.build.js';

@Injectable()
export class AiGiftFulfillmentService {
  private readonly deps: GiftFulfillmentLogicDeps;

  constructor(
    fulfillmentService: GiftCardFulfillmentService,
    giftCardOrderService: GiftCardOrderService,
    giftCardPurchaseService: GiftCardPurchaseService,
    giftCardRefundService: GiftCardRefundService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(GiftCard) giftCardRepo: Repository<GiftCard>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
  ) {
    this.deps = {
      fulfillmentService,
      giftCardOrderService,
      giftCardPurchaseService,
      giftCardRefundService,
      businessRepo,
      giftCardRepo,
      employeeRepo,
    };
  }

  rescueFulfillmentIntent(prompt: string, action: string) {
    return rescueGiftFulfillmentIntent(prompt, action);
  }

  isFulfillmentCompound(prompt: string) {
    return isFulfillmentCompoundPrompt(prompt);
  }

  decomposeFulfillmentCompound(prompt: string) {
    return decomposeFulfillmentCompoundPrompt(prompt);
  }

  handleListGiftCardOrders(businessId: string, params: Record<string, any>) {
    return handleListGiftCardOrdersLogic(this.deps, businessId, params);
  }

  handleFilterAwaitingCreation(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleFilterAwaitingCreationLogic(this.deps, businessId, params);
  }

  handleAssignCardCreator(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleAssignCardCreatorLogic(this.deps, businessId, params, prompt);
  }

  handleAssignDeliveryStaff(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleAssignDeliveryStaffLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleMarkShipped(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleMarkShippedLogic(this.deps, businessId, params, prompt);
  }

  handleMarkDelivered(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleMarkDeliveredLogic(this.deps, businessId, params, prompt);
  }

  handleCancelGiftCardOrder(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCancelGiftCardOrderLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExtendCancelWindow(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExtendCancelWindowLogic(this.deps, businessId, params, prompt);
  }

  handleUpdateGiftCardSettings(businessId: string, params: Record<string, any>) {
    return handleUpdateGiftCardSettingsLogic(this.deps, businessId, params);
  }

  handleListGiftCardChangeRequests(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleListGiftCardChangeRequestsLogic(this.deps, businessId, params);
  }

  handleResolveGiftCardChangeRequest(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleResolveGiftCardChangeRequestLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleGiftFulfillBatch(businessId: string, params: Record<string, any>) {
    return handleGiftFulfillBatchLogic(this.deps, businessId, params);
  }

  handlePrintPackingSlip(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handlePrintPackingSlipLogic(this.deps, businessId, params, prompt);
  }

  handleGiftCardCreationQueue(businessId: string) {
    return handleGiftCardCreationQueueLogic(this.deps, businessId);
  }

  handleStartCardPreparation(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleStartCardPreparationLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainGiftCardOrderDetails(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainGiftCardOrderDetailsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleMarkCardReady(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleMarkCardReadyLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleDeliveryQueue(businessId: string) {
    return handleDeliveryQueueLogic(this.deps, businessId);
  }

  handleAcceptDelivery(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleAcceptDeliveryLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleMarkOutForDelivery(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleMarkOutForDeliveryLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleCaptureDeliveryProof(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCaptureDeliveryProofLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleNotifyDelay(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleNotifyDelayLogic(this.deps, businessId, params, prompt);
  }

  handleTrackGiftCardShipment(businessId: string, params: Record<string, any>) {
    return handleTrackGiftCardShipmentLogic(this.deps, businessId, params);
  }

  handleEnterShippingAddress(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleEnterShippingAddressLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleShippingMethodQuote(businessId: string, params: Record<string, any>) {
    return handleShippingMethodQuoteLogic(this.deps, businessId, params);
  }

  handleOrderStatusNotifications(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleOrderStatusNotificationsLogic(this.deps, businessId, params);
  }

  handleFulfillmentCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
  ): Promise<CommandResult> {
    return handleFulfillmentCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userId,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a gift-fulfillment intent. */
  dispatchIntent(
    ctx: GiftFulfillmentDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchGiftFulfillmentLogicIntent(this.deps, ctx);
  }
}
