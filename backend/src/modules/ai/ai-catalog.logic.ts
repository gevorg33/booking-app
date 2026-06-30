import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { ServiceCategoryService } from '../service/service-category.service.js';
import type { ServiceService } from '../service/service.service.js';
import type { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { PackageDiscountType } from '../service-packages/entities/service-package.entity.js';
import {
  applyMultiServiceSettingsToBusinessSettings,
  mergeMultiServiceSettingsPatch,
  resolveMultiServiceSettings,
} from '../../common/utils/multi-service-settings.util.js';
import {
  mergeGiftCardSettings,
  readBusinessGiftCardSettings,
  type GiftCardBusinessSettings,
} from '../gift-cards/gift-card.types.js';
import {
  parseAssignServiceCategoryFromPrompt,
  parseBulkCatalogWithCountFromPrompt,
  decomposeCatalogCompoundPrompt,
  parseBulkCatalogFromPrompt,
  type CatalogCategoryDraft,
  type CatalogCompoundStep,
  type CatalogServiceDraft,
} from './ai-catalog.util.js';
import {
  enrichDeactivateServiceCategoryScopeParamsFromPrompt,
  parseDeactivateServiceCategoryScopeFromPrompt,
  resolveServicesForDeactivateCategoryScope,
} from './ai-deactivate-service-category-scope.util.js';
import { resolveAiCatalogNotifyPayload } from './ai-catalog-notify.util.js';
import { handleUpdateServiceDurationBufferLogic } from './ai-service-duration-buffer.logic.js';
import { handleConfigureServiceFeaturedLogic } from './ai-configure-service-featured.logic.js';
import { handleBulkAssignServicesCategoryLogic } from './ai-bulk-assign-services-category.logic.js';
import { handleConfigurePackageOnlinePaymentLogic } from './ai-configure-package-online-payment.logic.js';

export interface CatalogLogicDeps {
  businessRepo: Repository<Business>;
  categoryService: ServiceCategoryService;
  serviceService: ServiceService;
  packagesService: ServicePackagesService;
  subscriptionsService: ServiceSubscriptionsService;
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

async function loadBusiness(deps: CatalogLogicDeps, businessId: string) {
  return deps.businessRepo.findOne({ where: { id: businessId } });
}

async function saveBusinessSettings(
  deps: CatalogLogicDeps,
  business: Business,
  settings: Record<string, unknown>,
) {
  business.settings = settings;
  await deps.businessRepo.save(business);
}

async function resolveCatalogNotifyFields(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  kind: 'package' | 'subscription_plan',
) {
  if (params.notifyCustomers !== true) return {};
  const business = await loadBusiness(deps, businessId);
  return resolveAiCatalogNotifyPayload(
    params,
    (business?.settings ?? {}) as Record<string, unknown>,
    kind,
  );
}

export async function handleCreateServiceCategoryLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const categoryName = (params.categoryName as string | undefined)?.trim();
  if (!categoryName) {
    return failure(
      'create_service_category',
      'Specify the category name (e.g. "Add category Color").',
      {
        clarify: true,
        missing: ['categoryName'],
      },
    );
  }

  const existing = await deps.categoryService.findAll(businessId);
  if (
    existing.some((c) => c.name.toLowerCase() === categoryName.toLowerCase())
  ) {
    return failure(
      'create_service_category',
      `Category "${categoryName}" already exists.`,
    );
  }

  const created = await deps.categoryService.create(businessId, {
    name: categoryName,
    description: params.description,
    sortOrder: params.sortOrder ?? existing.length,
  });

  const placeholderCount = Number(
    params.placeholderCount ?? params.serviceCount ?? 0,
  );
  const createdServices: string[] = [];
  if (placeholderCount > 0) {
    for (let i = 1; i <= Math.min(placeholderCount, 6); i++) {
      const svc = await deps.serviceService.create(businessId, {
        name: `${categoryName} Service ${i}`,
        durationMinutes: 30,
        price: 0,
        categoryId: created.id,
        description: `Placeholder for ${categoryName}`,
      });
      createdServices.push(svc.id);
    }
  }

  return success(
    'create_service_category',
    placeholderCount
      ? `Created category "${categoryName}" with ${createdServices.length} placeholder service(s).`
      : `Created category "${categoryName}".`,
    {
      categoryId: created.id,
      categoryName: created.name,
      serviceIds: createdServices,
    },
  );
}

export async function handleBulkCreateCatalogLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt: string,
): Promise<CommandResult> {
  const draft: CatalogCategoryDraft | null =
    params.catalogDraft ??
    (params.categoryName
      ? {
          categoryName: params.categoryName,
          services: (params.services ?? []) as CatalogServiceDraft[],
          localizedNames: params.localizedNames,
        }
      : (parseBulkCatalogFromPrompt(prompt) ??
        parseBulkCatalogWithCountFromPrompt(prompt)));

  if (!draft?.categoryName || !draft.services?.length) {
    return failure(
      'bulk_create_catalog',
      'Specify a category and service lines (e.g. "Create category Hair with Women\'s cut 60m $65, Men\'s cut 30m $35").',
      { clarify: true, missing: ['categoryName', 'services'] },
    );
  }

  const categories = await deps.categoryService.findAll(businessId);
  let category = categories.find(
    (c) => c.name.toLowerCase() === draft.categoryName.toLowerCase(),
  );
  if (!category) {
    category = await deps.categoryService.create(businessId, {
      name: draft.categoryName,
      sortOrder: categories.length,
      localizedNames: draft.localizedNames,
    });
  }

  const existingServices = await deps.serviceService.findAll(businessId);
  const created: string[] = [];
  const skipped: string[] = [];

  for (const line of draft.services) {
    const name = line.serviceName?.trim();
    if (!name) continue;
    if (
      existingServices.some((s) => s.name.toLowerCase() === name.toLowerCase())
    ) {
      skipped.push(name);
      continue;
    }
    const svc = await deps.serviceService.create(businessId, {
      name,
      description: line.description,
      durationMinutes: Math.max(10, line.durationMinutes ?? 30),
      bufferMinutes: line.bufferMinutes ?? 0,
      price: line.price ?? 0,
      currency: line.currency ?? 'USD',
      categoryId: category.id,
      localizedNames: line.localizedNames,
    });
    created.push(svc.name);
    existingServices.push(svc);
  }

  if (!created.length && skipped.length) {
    return failure(
      'bulk_create_catalog',
      'All listed services already exist in the catalog.',
    );
  }

  return success(
    'bulk_create_catalog',
    `Catalog updated — category "${draft.categoryName}": ${created.length} new service(s)${skipped.length ? `, ${skipped.length} skipped` : ''}.`,
    {
      categoryId: category.id,
      created,
      skipped,
      categoryName: draft.categoryName,
    },
  );
}

export async function resolveCategoryByName(
  deps: CatalogLogicDeps,
  businessId: string,
  categoryName: string,
) {
  const categories = await deps.categoryService.findAll(businessId);
  return resolveByName(categories, categoryName);
}

export async function handleUpdateServiceLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseAssignServiceCategoryFromPrompt(String(prompt ?? ''));
  const serviceName = (
    (params.serviceName as string | undefined) ?? parsed.serviceName
  )?.trim();
  const categoryName = (
    (params.categoryName as string | undefined) ?? parsed.categoryName
  )?.trim();

  if (!serviceName || !categoryName) {
    return failure(
      'update_service',
      'Specify the service and target category (e.g. "Move Neck Massage under service category: Massage").',
      {
        clarify: true,
        missing: [
          ...(!serviceName ? ['serviceName'] : []),
          ...(!categoryName ? ['categoryName'] : []),
        ],
      },
    );
  }

  const service = resolveByName(services, serviceName);
  if (!service) {
    return failure('update_service', `Service "${serviceName}" not found.`);
  }

  const category = await resolveCategoryByName(
    deps,
    businessId,
    categoryName,
  );
  if (!category) {
    return failure(
      'update_service',
      `Service category "${categoryName}" not found.`,
      { clarify: true, missing: ['categoryName'] },
    );
  }

  const updated = await deps.serviceService.update(
    service.id,
    { categoryId: category.id },
    params.userId as string | undefined,
  );

  return success(
    'update_service',
    `Moved "${updated.name}" under category "${category.name}".`,
    {
      serviceId: updated.id,
      serviceName: updated.name,
      categoryId: category.id,
      categoryName: category.name,
    },
  );
}

export async function handleDeactivateServiceLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
  prompt?: string,
): Promise<CommandResult> {
  const enriched = enrichDeactivateServiceCategoryScopeParamsFromPrompt(
    params,
    String(prompt ?? params._prompt ?? ''),
  );
  const parsed = parseDeactivateServiceCategoryScopeFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    enriched,
  );

  if (parsed?.allInCategory && parsed.categoryName) {
    const matched = resolveServicesForDeactivateCategoryScope(
      services,
      parsed.categoryName,
    );
    if (!matched.length) {
      return failure(
        'deactivate_service',
        `No active services found in category "${parsed.categoryName}".`,
        { clarify: true, categoryName: parsed.categoryName },
      );
    }
    for (const service of matched) {
      await deps.serviceService.remove(service.id);
    }
    const names = matched.map((service) => service.name).join(', ');
    return success(
      'deactivate_service',
      `Deactivated ${matched.length} service(s) in ${parsed.categoryName}: ${names}.`,
      {
        categoryName: parsed.categoryName,
        serviceIds: matched.map((service) => service.id),
        count: matched.length,
      },
    );
  }

  const serviceName = (enriched.serviceName as string | undefined)?.trim();
  if (!serviceName) {
    return failure(
      'deactivate_service',
      'Specify which service to hide from public booking.',
      {
        clarify: true,
        missing: ['serviceName'],
      },
    );
  }
  const service = resolveByName(services, serviceName);
  if (!service)
    return failure('deactivate_service', `Service "${serviceName}" not found.`);
  await deps.serviceService.remove(service.id);
  return success(
    'deactivate_service',
    `Deactivated "${service.name}" — hidden from catalog.`,
    {
      serviceId: service.id,
    },
  );
}

export async function handleListPackagesLogic(
  deps: Pick<CatalogLogicDeps, 'packagesService'>,
  businessId: string,
): Promise<CommandResult> {
  const packages = await deps.packagesService.listPackages(
    businessId,
    'active',
  );
  return success(
    'list_packages',
    packages.length
      ? `${packages.length} active package(s) in catalog.`
      : 'No active packages.',
    { packages, count: packages.length },
  );
}

export async function handleCreatePackageLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const packageName = (params.packageName as string | undefined)?.trim();
  const serviceNames = (params.serviceNames ?? []) as string[];
  if (!packageName) {
    return failure(
      'create_package',
      'Specify the package name (e.g. "Spa Day package").',
      {
        clarify: true,
        missing: ['packageName'],
      },
    );
  }

  const matched = serviceNames
    .map((n) => resolveByName(services, n))
    .filter(Boolean) as Service[];
  if (matched.length < 1) {
    return failure(
      'create_package',
      'Name at least one service for the package (e.g. massage + facial).',
      {
        clarify: true,
        missing: ['serviceNames'],
      },
    );
  }

  const discount =
    params.discountValue != null
      ? {
          discountType:
            (params.discountType as PackageDiscountType) ??
            PackageDiscountType.PERCENT,
          discountValue: Number(params.discountValue),
        }
      : { discountType: PackageDiscountType.PERCENT, discountValue: 0 };

  const created = await deps.packagesService.createPackage(businessId, {
    name: packageName,
    description: params.description,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    expiresAt: params.expiresAt ?? null,
    items: matched.map((s) => ({ serviceId: s.id, quantity: 1 })),
    ...(await resolveCatalogNotifyFields(
      deps,
      businessId,
      params,
      'package',
    )),
  });

  return success(
    'create_package',
    `Created package "${created.name}" with ${matched.length} service(s).${
      params.notifyCustomers ? ' Customer announcement queued.' : ''
    }`,
    {
      packageId: created.id,
      packageName: created.name,
      serviceIds: matched.map((s) => s.id),
    },
  );
}

export async function handleUpdatePackageLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const packageId = params.packageId as string | undefined;
  const packageName = params.packageName as string | undefined;
  if (!packageId && !packageName) {
    return failure(
      'update_package',
      'Specify which package to update (name or ID).',
      {
        clarify: true,
        missing: ['packageName'],
      },
    );
  }

  const packages = await deps.packagesService.listPackages(
    businessId,
    'all',
    true,
  );
  const pkg = packageId
    ? packages.find((p) => p.id === packageId)
    : resolveByName(packages, packageName!);
  if (!pkg) return failure('update_package', 'Package not found.');

  const updated = await deps.packagesService.updatePackage(businessId, pkg.id, {
    name: params.newName ?? params.packageName,
    description: params.description,
    discountValue:
      params.discountValue != null ? Number(params.discountValue) : undefined,
    discountType: params.discountType,
    expiresAt: params.expiresAt,
    ...(await resolveCatalogNotifyFields(
      deps,
      businessId,
      params,
      'package',
    )),
  });

  return success(
    'update_package',
    `Updated package "${updated.name}".${
      params.notifyCustomers ? ' Customer announcement queued.' : ''
    }`, {
    packageId: updated.id,
  });
}

export async function handleDeactivatePackageLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const packages = await deps.packagesService.listPackages(
    businessId,
    'all',
    true,
  );
  const pkg = params.packageId
    ? packages.find((p) => p.id === params.packageId)
    : resolveByName(packages, params.packageName as string);
  if (!pkg) {
    return failure(
      'deactivate_package',
      'Specify which package to deactivate.',
      {
        clarify: true,
        missing: ['packageName'],
      },
    );
  }
  await deps.packagesService.deactivatePackage(businessId, pkg.id);
  return success('deactivate_package', `Deactivated package "${pkg.name}".`, {
    packageId: pkg.id,
  });
}

export async function handleDuplicatePackageLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const packages = await deps.packagesService.listPackages(
    businessId,
    'all',
    true,
  );
  const pkg = params.packageId
    ? packages.find((p) => p.id === params.packageId)
    : resolveByName(packages, params.packageName as string);
  if (!pkg) {
    return failure('duplicate_package', 'Specify which package to duplicate.', {
      clarify: true,
      missing: ['packageName'],
    });
  }
  const copy = await deps.packagesService.duplicatePackage(businessId, pkg.id);
  return success(
    'duplicate_package',
    `Duplicated "${pkg.name}" → "${copy.name}".`,
    { packageId: copy.id },
  );
}

export async function handleListSubscriptionPlansLogic(
  deps: Pick<CatalogLogicDeps, 'subscriptionsService'>,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const service = params.serviceName
    ? resolveByName(services, params.serviceName as string)
    : undefined;
  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    service?.id,
    true,
  );
  return success(
    'list_subscription_plans',
    plans.length
      ? `${plans.length} subscription plan(s).`
      : 'No subscription plans.',
    { plans, count: plans.length },
  );
}

export async function handleCreateSubscriptionPlanLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const planName = (params.planName as string | undefined)?.trim();
  const serviceName = params.serviceName as string | undefined;
  const durationMonths = Number(params.durationMonths ?? 0);
  const includedAppointments = Number(params.includedAppointments ?? 0);

  if (!planName || !serviceName) {
    return failure(
      'create_subscription_plan',
      'Specify plan name and service (e.g. "12-month nail plan: 24 visits for Nail Care").',
      { clarify: true, missing: ['planName', 'serviceName'] },
    );
  }
  const service = resolveByName(services, serviceName);
  if (!service)
    return failure(
      'create_subscription_plan',
      `Service "${serviceName}" not found.`,
    );

  if (durationMonths < 1 || includedAppointments < 1) {
    return failure(
      'create_subscription_plan',
      'Specify duration in months and included visits.',
      {
        clarify: true,
        missing: ['durationMonths', 'includedAppointments'],
      },
    );
  }

  const plan = await deps.subscriptionsService.createPlan(businessId, {
    name: planName,
    serviceId: service.id,
    durationMonths,
    includedAppointments,
    discountValue:
      params.discountValue != null ? Number(params.discountValue) : undefined,
    discountType: params.discountType,
    ...(await resolveCatalogNotifyFields(
      deps,
      businessId,
      params,
      'subscription_plan',
    )),
  });

  return success(
    'create_subscription_plan',
    `Created plan "${plan.name}" — ${includedAppointments} visits over ${durationMonths} months.${
      params.notifyCustomers ? ' Customer announcement queued.' : ''
    }`,
    { planId: plan.id, serviceId: service.id },
  );
}

export async function handleUpdateSubscriptionPlanLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    undefined,
    true,
  );
  const plan = params.planId
    ? plans.find((p) => p.id === params.planId)
    : resolveByName(plans, (params.planName as string) ?? '');
  if (!plan) {
    return failure(
      'update_subscription_plan',
      'Specify which subscription plan to update.',
      {
        clarify: true,
        missing: ['planName'],
      },
    );
  }

  const updated = await deps.subscriptionsService.updatePlan(
    businessId,
    plan.id,
    {
      name: params.newName ?? params.planName,
      includedAppointments: params.includedAppointments,
      durationMonths: params.durationMonths,
      discountValue:
        params.discountValue != null ? Number(params.discountValue) : undefined,
      ...(await resolveCatalogNotifyFields(
        deps,
        businessId,
        params,
        'subscription_plan',
      )),
    },
  );

  return success(
    'update_subscription_plan',
    `Updated plan "${updated.name}".${
      params.notifyCustomers ? ' Customer announcement queued.' : ''
    }`,
    { planId: updated.id },
  );
}

export async function handleDeactivateSubscriptionPlanLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    undefined,
    true,
  );
  const plan = params.planId
    ? plans.find((p) => p.id === params.planId)
    : resolveByName(plans, (params.planName as string) ?? '');
  if (!plan) {
    return failure(
      'deactivate_subscription_plan',
      'Specify which plan to deactivate.',
      {
        clarify: true,
        missing: ['planName'],
      },
    );
  }
  await deps.subscriptionsService.deactivatePlan(businessId, plan.id);
  return success(
    'deactivate_subscription_plan',
    `Deactivated plan "${plan.name}".`,
    { planId: plan.id },
  );
}

export async function handleAssignSubscriptionToCustomerLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
  customers: Customer[],
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customerName = params.customerName as string | undefined;
  const planName = params.planName as string | undefined;
  if (!customerName || !planName) {
    return failure(
      'assign_subscription_to_customer',
      'Specify customer and plan (e.g. "Give Anna the 6-month massage plan").',
      { clarify: true, missing: ['customerName', 'planName'] },
    );
  }

  const customer = params.customerId
    ? customers.find((c) => c.id === params.customerId)
    : resolveCustomer(customers, customerName);
  if (!customer)
    return failure(
      'assign_subscription_to_customer',
      `Customer "${customerName}" not found.`,
    );

  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    undefined,
    true,
  );
  const plan = resolveByName(plans, planName);
  if (!plan)
    return failure(
      'assign_subscription_to_customer',
      `Plan "${planName}" not found.`,
    );

  const sub = await deps.subscriptionsService.assignSubscription(
    businessId,
    customer.id,
    plan.id,
  );
  return success(
    'assign_subscription_to_customer',
    `Assigned "${plan.name}" to ${customer.name}.`,
    { subscriptionId: sub.id, customerId: customer.id, planId: plan.id },
  );
}

export async function handleConfigureGiftCardProductsLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const business = await loadBusiness(deps, businessId);
  if (!business)
    return failure('configure_gift_card_products', 'Business not found.');

  const current = readBusinessGiftCardSettings(business.settings);
  const presetAmounts = (params.presetAmounts as number[] | undefined)?.filter(
    (n) => n > 0,
  );
  const serviceName = params.serviceName as string | undefined;

  const patch: Partial<GiftCardBusinessSettings> = {
    purchaseEnabled: params.purchaseEnabled !== false,
    presetAmounts: presetAmounts?.length
      ? presetAmounts
      : current.presetAmounts,
  };

  if (serviceName) {
    const service = resolveByName(services, serviceName);
    if (!service)
      return failure(
        'configure_gift_card_products',
        `Service "${serviceName}" not found.`,
      );
    const exists = current.purchasableServices.some(
      (s) => s.serviceId === service.id,
    );
    patch.purchasableServices = exists
      ? current.purchasableServices
      : [
          ...current.purchasableServices,
          { serviceId: service.id, price: Number(service.price) },
        ];
  }

  const next = mergeGiftCardSettings({ ...current, ...patch });
  await saveBusinessSettings(deps, business, {
    ...(business.settings ?? {}),
    giftCards: next,
  });

  return success(
    'configure_gift_card_products',
    `Gift card products updated — presets: ${next.presetAmounts.map((a) => `$${a}`).join(', ')}.`,
    { settings: next },
  );
}

export async function handleCreateGiftCardBundleLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const bundleName = (params.bundleName as string | undefined)?.trim();
  const serviceNames = (params.serviceNames ?? []) as string[];
  const price = Number(params.price ?? 0);

  if (!bundleName || serviceNames.length < 2) {
    return failure(
      'create_gift_card_bundle',
      'Specify bundle name and at least two services (e.g. "haircut + beard + facial").',
      { clarify: true, missing: ['bundleName', 'serviceNames'] },
    );
  }

  const business = await loadBusiness(deps, businessId);
  if (!business)
    return failure('create_gift_card_bundle', 'Business not found.');

  const lines = serviceNames
    .map((name) => {
      const svc = resolveByName(services, name);
      return svc
        ? { serviceId: svc.id, serviceName: svc.name, quantity: 1 }
        : null;
    })
    .filter(Boolean) as Array<{
    serviceId: string;
    serviceName: string;
    quantity: number;
  }>;

  if (lines.length < 2) {
    return failure(
      'create_gift_card_bundle',
      'Could not match at least two services for the bundle.',
    );
  }

  const current = readBusinessGiftCardSettings(business.settings);
  const bundleId = `bundle-${Date.now()}`;
  const bundlePrice =
    price > 0
      ? price
      : lines.reduce((sum, l) => {
          const svc = services.find((s) => s.id === l.serviceId);
          return sum + Number(svc?.price ?? 0);
        }, 0);

  const next = mergeGiftCardSettings({
    ...current,
    purchaseEnabled: true,
    bundles: [
      ...current.bundles,
      {
        id: bundleId,
        name: bundleName,
        lines,
        price: bundlePrice,
        expiresInMonths: 12,
      },
    ],
  });
  await saveBusinessSettings(deps, business, {
    ...(business.settings ?? {}),
    giftCards: next,
  });

  return success(
    'create_gift_card_bundle',
    `Added gift card bundle "${bundleName}" (${lines.map((l) => l.serviceName).join(' + ')}).`,
    { bundleId, bundleName, price: bundlePrice },
  );
}

export async function handleConfigureMultiServiceSettingsLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await loadBusiness(deps, businessId);
  if (!business)
    return failure('configure_multi_service_settings', 'Business not found.');

  const current = resolveMultiServiceSettings(business.settings);
  const merged = mergeMultiServiceSettingsPatch(current, {
    enabled: params.enabled !== false,
    maxServiceCount:
      params.maxServiceCount != null
        ? Number(params.maxServiceCount)
        : undefined,
    maxDurationMinutes:
      params.maxDurationMinutes != null
        ? Number(params.maxDurationMinutes)
        : undefined,
    turnoverBufferMinutes:
      params.turnoverBufferMinutes != null
        ? Number(params.turnoverBufferMinutes)
        : undefined,
    schedulingMode: params.schedulingMode,
  });

  const settings = applyMultiServiceSettingsToBusinessSettings(
    business.settings ?? {},
    merged,
  );
  await saveBusinessSettings(deps, business, settings);

  return success(
    'configure_multi_service_settings',
    `Multi-service booking ${merged.enabled ? 'enabled' : 'updated'} — max ${merged.maxServiceCount} services, ${merged.maxDurationMinutes} min cap.`,
    { settings: merged },
  );
}

export async function handleSetServiceCompatibilityLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const names = (params.incompatibleServiceNames ??
    params.serviceNames ??
    []) as string[];
  if (names.length < 2) {
    return failure(
      'set_service_compatibility',
      'Name two services that cannot be booked same visit (e.g. massage + chemical peel).',
      { clarify: true, missing: ['incompatibleServiceNames'] },
    );
  }

  const a = resolveByName(services, names[0]);
  const b = resolveByName(services, names[1]);
  if (!a || !b)
    return failure(
      'set_service_compatibility',
      'Could not match both services.',
    );

  const business = await loadBusiness(deps, businessId);
  if (!business)
    return failure('set_service_compatibility', 'Business not found.');

  const current = resolveMultiServiceSettings(business.settings);
  const pairKey = [a.id, b.id].sort().join('|');
  const exists = current.incompatiblePairs.some(
    ([x, y]) => [x, y].sort().join('|') === pairKey,
  );
  const incompatiblePairs: Array<[string, string]> = exists
    ? current.incompatiblePairs
    : [...current.incompatiblePairs, [a.id, b.id].sort() as [string, string]];

  const merged = mergeMultiServiceSettingsPatch(current, {
    enabled: true,
    incompatiblePairMode: 'service',
    incompatiblePairs,
  });
  const settings = applyMultiServiceSettingsToBusinessSettings(
    business.settings ?? {},
    merged,
  );
  await saveBusinessSettings(deps, business, settings);

  return success(
    'set_service_compatibility',
    `Blocked same-visit combo: ${a.name} + ${b.name}.`,
    { incompatiblePairs: merged.incompatiblePairs },
  );
}

export async function handleCatalogCompoundLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  services: Service[],
  customers: Customer[],
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  userId?: string,
): Promise<CommandResult> {
  const steps: CatalogCompoundStep[] =
    (params.compoundSteps as CatalogCompoundStep[] | undefined) ??
    decomposeCatalogCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple catalog commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  for (const step of steps.slice(0, 4)) {
    const stepParams = { ...step.params, ...params };
    let result: CommandResult;
    switch (step.action) {
      case 'bulk_create_catalog':
        result = await handleBulkCreateCatalogLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'create_service_category':
        result = await handleCreateServiceCategoryLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'create_package':
        result = await handleCreatePackageLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'create_subscription_plan':
        result = await handleCreateSubscriptionPlanLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'configure_gift_card_products':
        result = await handleConfigureGiftCardProductsLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'configure_multi_service_settings':
        result = await handleConfigureMultiServiceSettingsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'set_service_compatibility':
        result = await handleSetServiceCompatibilityLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'update_service_duration_buffer':
        result = await handleUpdateServiceDurationBufferLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
          userId,
        );
        break;
      case 'configure_service_featured':
        result = await handleConfigureServiceFeaturedLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
          userId,
        );
        break;
      case 'bulk_assign_services_category':
        result = await handleBulkAssignServicesCategoryLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
          userId,
        );
        break;
      case 'configure_package_online_payment':
        result = await handleConfigurePackageOnlinePaymentLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
          userId,
        );
        break;
      case 'update_service':
        result = await handleUpdateServiceLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
        );
        break;
      case 'deactivate_service':
        result = await handleDeactivateServiceLogic(
          deps,
          businessId,
          stepParams,
          services,
          step.segment,
        );
        break;
      case 'assign_subscription_to_customer':
        result = await handleAssignSubscriptionToCustomerLogic(
          deps,
          businessId,
          stepParams,
          services,
          customers,
          resolveCustomer,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported catalog compound step: ${step.action}.`,
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
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} catalog step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      catalogCompound: true,
      userId,
    },
  };
}
