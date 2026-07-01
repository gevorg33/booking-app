import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import {
  CategoryRecommendedProduct,
  ServiceRecommendedProduct,
} from '../inventory/entities/inventory.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { handleExplainCheckoutRecommendationsLogic } from './ai-checkout-recommendations.logic.js';
import { handleDismissRecommendationsLogic } from './ai-dismiss-recommendations.logic.js';
import { handleExplainConsumerCheckoutSuccessLogic } from './ai-consumer-checkout-success.logic.js';
import { handleExplainRecommendationAnalyticsLogic } from './ai-recommendation-analytics.logic.js';
import { handleSummarizeRecommendationPerformanceLogic } from './ai-recommendation-performance.logic.js';
import {
  handleConfigureRecommendationProductLogic,
  handleExplainRecommendationSetupLogic,
  handleLinkRecommendedProductsLogic,
  type ExplainRecommendationSetupLogicDeps,
  type RecommendationLinkLogicDeps,
  type RecommendationProductLogicDeps,
} from './ai-recommendation-product.logic.js';

@Injectable()
export class AiRecommendationProductService {
  private readonly deps: RecommendationProductLogicDeps;
  private readonly linkDeps: RecommendationLinkLogicDeps;
  private readonly explainDeps: ExplainRecommendationSetupLogicDeps;
  private readonly checkoutExplainDeps: {
    businessRepo: Repository<Business>;
    serviceRepo: Repository<Service>;
    bookingRepo: Repository<Booking>;
    productRecommendationService: ProductRecommendationService;
  };
  private readonly analyticsExplainDeps: {
    businessRepo: Repository<Business>;
    eventStore: EventStoreService;
    inventoryService: InventoryService;
  };
  private readonly performanceSummarizeDeps: {
    businessRepo: Repository<Business>;
    eventStore: EventStoreService;
    inventoryService: InventoryService;
    serviceRepo: Repository<Service>;
  };

  constructor(
    inventoryService: InventoryService,
    productRecommendationService: ProductRecommendationService,
    eventStore: EventStoreService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(ServiceRecommendedProduct)
    serviceLinkRepo: Repository<ServiceRecommendedProduct>,
    @InjectRepository(CategoryRecommendedProduct)
    categoryLinkRepo: Repository<CategoryRecommendedProduct>,
  ) {
    this.deps = { inventoryService };
    this.linkDeps = {
      inventoryService,
      productRecommendationService,
      serviceRepo,
      categoryRepo,
    };
    this.explainDeps = {
      businessRepo,
      inventoryService,
      serviceRepo,
      categoryRepo,
      serviceLinkRepo,
      categoryLinkRepo,
    };
    this.checkoutExplainDeps = {
      businessRepo,
      serviceRepo,
      bookingRepo,
      productRecommendationService,
    };
    this.analyticsExplainDeps = {
      businessRepo,
      eventStore,
      inventoryService,
    };
    this.performanceSummarizeDeps = {
      businessRepo,
      eventStore,
      inventoryService,
      serviceRepo,
    };
  }

  handleConfigureRecommendationProduct(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureRecommendationProductLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleLinkRecommendedProducts(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleLinkRecommendedProductsLogic(
      this.linkDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainRecommendationSetup(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainRecommendationSetupLogic(
      this.explainDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainCheckoutRecommendations(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainCheckoutRecommendationsLogic(
      this.checkoutExplainDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainConsumerCheckoutSuccess(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainConsumerCheckoutSuccessLogic(
      this.checkoutExplainDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleDismissRecommendations(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleDismissRecommendationsLogic(businessId, params, prompt);
  }

  handleExplainRecommendationAnalytics(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainRecommendationAnalyticsLogic(
      this.analyticsExplainDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleSummarizeRecommendationPerformance(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleSummarizeRecommendationPerformanceLogic(
      this.performanceSummarizeDeps,
      businessId,
      params,
      prompt,
    );
  }
}
