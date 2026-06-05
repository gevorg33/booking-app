import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategoryService } from '../service/service-category.service.js';
import { ServiceService } from '../service/service.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeCatalogCompoundPrompt,
  isCatalogCompoundPrompt,
  rescueCatalogIntent,
} from './ai-catalog.util.js';
import {
  handleAssignSubscriptionToCustomerLogic,
  handleBulkCreateCatalogLogic,
  handleConfigureGiftCardProductsLogic,
  handleConfigureMultiServiceSettingsLogic,
  handleCreateGiftCardBundleLogic,
  handleCreatePackageLogic,
  handleCreateServiceCategoryLogic,
  handleCreateSubscriptionPlanLogic,
  handleCatalogCompoundLogic,
  handleDeactivatePackageLogic,
  handleDeactivateServiceLogic,
  handleDeactivateSubscriptionPlanLogic,
  handleDuplicatePackageLogic,
  handleListPackagesLogic,
  handleListSubscriptionPlansLogic,
  handleSetServiceCompatibilityLogic,
  handleUpdatePackageLogic,
  handleUpdateSubscriptionPlanLogic,
  type CatalogLogicDeps,
} from './ai-catalog.logic.js';

@Injectable()
export class AiCatalogService {
  private readonly deps: CatalogLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    categoryService: ServiceCategoryService,
    serviceService: ServiceService,
    packagesService: ServicePackagesService,
    subscriptionsService: ServiceSubscriptionsService,
  ) {
    this.deps = {
      businessRepo,
      categoryService,
      serviceService,
      packagesService,
      subscriptionsService,
    };
  }

  rescueCatalogIntent(prompt: string, action: string) {
    return rescueCatalogIntent(prompt, action);
  }

  isCatalogCompound(prompt: string) {
    return isCatalogCompoundPrompt(prompt);
  }

  decomposeCatalogCompound(prompt: string) {
    return decomposeCatalogCompoundPrompt(prompt);
  }

  handleCreateServiceCategory(businessId: string, params: Record<string, any>) {
    return handleCreateServiceCategoryLogic(this.deps, businessId, params);
  }

  handleBulkCreateCatalog(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleBulkCreateCatalogLogic(this.deps, businessId, params, prompt);
  }

  handleDeactivateService(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleDeactivateServiceLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleListPackages(businessId: string) {
    return handleListPackagesLogic(this.deps, businessId);
  }

  handleCreatePackage(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleCreatePackageLogic(this.deps, businessId, params, services);
  }

  handleUpdatePackage(businessId: string, params: Record<string, any>) {
    return handleUpdatePackageLogic(this.deps, businessId, params);
  }

  handleDeactivatePackage(businessId: string, params: Record<string, any>) {
    return handleDeactivatePackageLogic(this.deps, businessId, params);
  }

  handleDuplicatePackage(businessId: string, params: Record<string, any>) {
    return handleDuplicatePackageLogic(this.deps, businessId, params);
  }

  handleListSubscriptionPlans(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleListSubscriptionPlansLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleCreateSubscriptionPlan(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleCreateSubscriptionPlanLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleUpdateSubscriptionPlan(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleUpdateSubscriptionPlanLogic(this.deps, businessId, params);
  }

  handleDeactivateSubscriptionPlan(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleDeactivateSubscriptionPlanLogic(this.deps, businessId, params);
  }

  handleAssignSubscription(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleAssignSubscriptionToCustomerLogic(
      this.deps,
      businessId,
      params,
      services,
      customers,
      resolveCustomer,
    );
  }

  handleConfigureGiftCardProducts(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleConfigureGiftCardProductsLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleCreateGiftCardBundle(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleCreateGiftCardBundleLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleConfigureMultiServiceSettings(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleConfigureMultiServiceSettingsLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleSetServiceCompatibility(
    businessId: string,
    params: Record<string, any>,
    services: Service[],
  ) {
    return handleSetServiceCompatibilityLogic(
      this.deps,
      businessId,
      params,
      services,
    );
  }

  handleCatalogCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    services: Service[],
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
    userId?: string,
  ): Promise<CommandResult> {
    return handleCatalogCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      services,
      customers,
      resolveCustomer,
      userId,
    );
  }
}
