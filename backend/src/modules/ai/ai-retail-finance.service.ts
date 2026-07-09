import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { AppEventService } from '../analytics/app-event.service.js';
import { CommissionsService } from '../commissions/commissions.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeRetailFinanceCompoundPrompt,
  isRetailFinanceCompoundPrompt,
  rescueRetailFinanceIntent,
} from './ai-retail-finance.util.js';
import {
  handleAddRetailSaleToBookingLogic,
  handleAddRetailToMyBookingLogic,
  handleAdjustInventoryLogic,
  handleCommissionReportLogic,
  handleCreateCommissionRuleLogic,
  handleCreateProductLogic,
  handleDeleteCommissionRuleLogic,
  handleDeleteExpenseLogic,
  handleDeleteInventoryProductLogic,
  handleExportAnalyticsReportLogic,
  handleLinkProductToServiceLogic,
  handleListExpensesLogic,
  handleListProductsLogic,
  handlePayoutExportLogic,
  handleRecordExpenseLogic,
  handleRemoveRetailLineLogic,
  handleRetailFinanceCompoundLogic,
  handleSetRecommendedProductsLogic,
  handleSetRetailSalesLinesLogic,
  handleSuggestRetailUpsellLogic,
  handleSummarizeAdoptionFunnelLogic,
  handleSummarizePlLogic,
  handleSummarizeReviewsLogic,
  handleUnlinkInventoryProductLogic,
  handleUpdateInventoryProductLogic,
  type RetailFinanceLogicDeps,
} from './ai-retail-finance.logic.js';

@Injectable()
export class AiRetailFinanceService {
  private readonly deps: RetailFinanceLogicDeps;

  constructor(
    inventoryService: InventoryService,
    productRecommendationService: ProductRecommendationService,
    retailPosService: RetailPosService,
    expensesService: ExpensesService,
    analyticsService: AnalyticsService,
    commissionsService: CommissionsService,
    reviewsService: ReviewsService,
    appEventService: AppEventService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(Product) productRepo: Repository<Product>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    bookingDepth: AiBookingDepthService,
  ) {
    this.deps = {
      inventoryService,
      productRecommendationService,
      retailPosService,
      expensesService,
      analyticsService,
      commissionsService,
      reviewsService,
      appEventService,
      bookingRepo,
      serviceRepo,
      productRepo,
      employeeRepo,
      bookingDepth,
    };
  }

  rescueRetailFinanceIntent(prompt: string, action: string) {
    return rescueRetailFinanceIntent(prompt, action);
  }

  isRetailFinanceCompound(prompt: string) {
    return isRetailFinanceCompoundPrompt(prompt);
  }

  decomposeRetailFinanceCompound(prompt: string) {
    return decomposeRetailFinanceCompoundPrompt(prompt);
  }

  handleListProducts(businessId: string, params: Record<string, any>) {
    return handleListProductsLogic(this.deps, businessId, params);
  }

  handleCreateProduct(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCreateProductLogic(this.deps, businessId, params, prompt);
  }

  handleLinkProductToService(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleLinkProductToServiceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAdjustInventory(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleAdjustInventoryLogic(this.deps, businessId, params, prompt);
  }

  handleUpdateInventoryProduct(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleUpdateInventoryProductLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleDeleteInventoryProduct(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleDeleteInventoryProductLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleUnlinkInventoryProduct(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleUnlinkInventoryProductLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSetRecommendedProducts(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleSetRecommendedProductsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAddRetailSaleToBooking(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleAddRetailSaleToBookingLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleRemoveRetailLine(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleRemoveRetailLineLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleRecordExpense(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleRecordExpenseLogic(this.deps, businessId, params, prompt);
  }

  handleListExpenses(businessId: string, params: Record<string, any>) {
    return handleListExpensesLogic(this.deps, businessId, params);
  }

  handleDeleteExpense(businessId: string, params: Record<string, any>) {
    return handleDeleteExpenseLogic(this.deps, businessId, params);
  }

  handleSummarizePl(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleSummarizePlLogic(this.deps, businessId, params, prompt);
  }

  handleCommissionReport(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCommissionReportLogic(this.deps, businessId, params, prompt);
  }

  handleCreateCommissionRule(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCreateCommissionRuleLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleDeleteCommissionRule(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleDeleteCommissionRuleLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handlePayoutExport(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handlePayoutExportLogic(this.deps, businessId, params, prompt);
  }

  handleExportAnalyticsReport(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExportAnalyticsReportLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSummarizeReviews(businessId: string, params: Record<string, any>) {
    return handleSummarizeReviewsLogic(this.deps, businessId, params);
  }

  handleSummarizeAdoptionFunnel(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleSummarizeAdoptionFunnelLogic(this.deps, businessId, params);
  }

  handleSuggestRetailUpsell(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleSuggestRetailUpsellLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAddRetailToMyBooking(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleAddRetailToMyBookingLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleSetRetailSalesLines(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
    prompt?: string,
  ) {
    return handleSetRetailSalesLinesLogic(
      this.deps,
      businessId,
      params,
      userId,
      prompt,
    );
  }

  handleRetailFinanceCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
  ): Promise<CommandResult> {
    return handleRetailFinanceCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userId,
    );
  }
}
