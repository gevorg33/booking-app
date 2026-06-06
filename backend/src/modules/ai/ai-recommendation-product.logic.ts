import { In, type Repository } from 'typeorm';
import type { InventoryService } from '../inventory/inventory.service.js';
import type { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import type {
  CategoryRecommendedProduct,
  Product,
  ServiceRecommendedProduct,
} from '../inventory/entities/inventory.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ServiceCategory } from '../service/entities/service-category.entity.js';
import { resolveProductRecommendationSettings } from '../../common/utils/product-recommendation-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
  type ParsedConfigureRecommendationProduct,
} from './ai-recommendation-product.util.js';

export interface RecommendationProductLogicDeps {
  inventoryService: Pick<
    InventoryService,
    'listProducts' | 'createProduct' | 'updateProduct'
  >;
}

export interface RecommendationLinkLogicDeps {
  inventoryService: Pick<InventoryService, 'listProducts'>;
  productRecommendationService: Pick<
    ProductRecommendationService,
    'setServiceRecommendations' | 'setCategoryRecommendations'
  >;
  serviceRepo: Pick<Repository<Service>, 'find' | 'findOne'>;
  categoryRepo: Pick<Repository<ServiceCategory>, 'find' | 'findOne'>;
}

export interface ExplainRecommendationSetupLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  inventoryService: Pick<InventoryService, 'listProducts'>;
  serviceRepo: Pick<Repository<Service>, 'find'>;
  categoryRepo: Pick<Repository<ServiceCategory>, 'find'>;
  serviceLinkRepo: Pick<Repository<ServiceRecommendedProduct>, 'find'>;
  categoryLinkRepo: Pick<Repository<CategoryRecommendedProduct>, 'find'>;
}

interface LinkedProductView {
  productId: string;
  productName: string;
  isActive: boolean;
  sortOrder: number;
}

interface ServiceRecommendationGroup {
  serviceId: string;
  serviceName: string;
  products: LinkedProductView[];
}

interface CategoryRecommendationGroup {
  categoryId: string;
  categoryName: string;
  products: LinkedProductView[];
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveProductByName(
  products: Product[],
  name: string,
): Product | undefined {
  const needle = name.trim().toLowerCase();
  return (
    products.find((item) => item.name.toLowerCase() === needle) ??
    products.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function collectMissingFields(
  parsed: ParsedConfigureRecommendationProduct,
): string[] {
  const missing: string[] = [];
  if (!parsed.productName && !parsed.productId) missing.push('productName');
  if (parsed.wantsImage && !parsed.imageUrl) missing.push('imageUrl');
  if (parsed.wantsLink && !parsed.externalLink) missing.push('externalLink');
  return missing;
}

export async function handleConfigureRecommendationProductLogic(
  deps: RecommendationProductLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfigureRecommendationProductFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_recommendation_product',
      'Specify a post-checkout recommendation product to add or update (e.g. "Add a shampoo product for post-checkout with image and link").',
      {
        clarify: true,
        missing: ['productName'],
      },
    );
  }

  const missing = collectMissingFields(parsed);
  if (missing.length > 0) {
    const parts: string[] = [];
    if (missing.includes('productName')) {
      parts.push('product name');
    }
    if (missing.includes('imageUrl')) {
      parts.push('image URL');
    }
    if (missing.includes('externalLink')) {
      parts.push('external shop link');
    }
    return failure(
      'configure_recommendation_product',
      `Provide ${parts.join(' and ')} for the post-checkout recommendation product.`,
      { clarify: true, missing },
    );
  }

  const products = await deps.inventoryService.listProducts(
    businessId,
    params.locationId as string | undefined,
    true,
  );

  const existing = parsed.productId
    ? products.find((item) => item.id === parsed.productId)
    : parsed.productName
      ? resolveProductByName(products, parsed.productName)
      : undefined;

  if (existing || parsed.isUpdate) {
    if (!existing) {
      return failure(
        'configure_recommendation_product',
        `No recommendation product found matching "${parsed.productName ?? parsed.productId}".`,
        { clarify: true, missing: ['productName'] },
      );
    }

    const updated = await deps.inventoryService.updateProduct(
      existing.id,
      businessId,
      {
        ...(parsed.productName ? { name: parsed.productName } : {}),
        ...(parsed.description !== undefined
          ? { description: parsed.description }
          : {}),
        ...(parsed.imageUrl !== undefined ? { imageUrl: parsed.imageUrl } : {}),
        ...(parsed.externalLink !== undefined
          ? { externalLink: parsed.externalLink }
          : {}),
        ...(parsed.retailPrice !== undefined
          ? { retailPrice: parsed.retailPrice }
          : {}),
        isActive: true,
      },
    );

    return success(
      'configure_recommendation_product',
      `Updated post-checkout recommendation product "${updated.name}".`,
      { product: updated, productId: updated.id, updated: true },
    );
  }

  const created = await deps.inventoryService.createProduct(businessId, {
    name: parsed.productName!,
    description: parsed.description,
    imageUrl: parsed.imageUrl,
    externalLink: parsed.externalLink,
    retailPrice: parsed.retailPrice ?? 0,
    isActive: true,
  });

  return success(
    'configure_recommendation_product',
    `Added post-checkout recommendation product "${created.name}".`,
    { product: created, productId: created.id, created: true },
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

export async function handleLinkRecommendedProductsLogic(
  deps: RecommendationLinkLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseLinkRecommendedProductsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'link_recommended_products',
      'Specify which products to recommend and for which service or category (e.g. "Recommend shampoo and conditioner after haircut service").',
      {
        clarify: true,
        missing: ['productNames', 'serviceName'],
      },
    );
  }

  const missing: string[] = [];
  if (parsed.productNames.length === 0 && !parsed.productIds?.length) {
    missing.push('productNames');
  }
  if (
    !parsed.serviceName &&
    !parsed.serviceId &&
    !parsed.categoryName &&
    !parsed.categoryId
  ) {
    missing.push('serviceName');
  }
  if (missing.length > 0) {
    return failure(
      'link_recommended_products',
      'Specify product names and a target service or category for checkout recommendations.',
      { clarify: true, missing },
    );
  }

  const products = await deps.inventoryService.listProducts(
    businessId,
    params.locationId as string | undefined,
    true,
  );

  const resolvedProductIds: string[] = [];
  const unresolvedProducts: string[] = [];

  if (parsed.productIds?.length) {
    for (const productId of parsed.productIds) {
      const found = products.find((item) => item.id === productId);
      if (found) resolvedProductIds.push(found.id);
      else unresolvedProducts.push(productId);
    }
  } else {
    for (const productName of parsed.productNames) {
      const found = resolveProductByName(products, productName);
      if (found) resolvedProductIds.push(found.id);
      else unresolvedProducts.push(productName);
    }
  }

  if (unresolvedProducts.length > 0) {
    return failure(
      'link_recommended_products',
      `Could not find product(s): ${unresolvedProducts.join(', ')}. Create them first or check the name.`,
      {
        clarify: true,
        missing: ['productNames'],
        unresolvedProducts,
      },
    );
  }

  if (parsed.serviceId || parsed.serviceName) {
    const service = parsed.serviceId
      ? await deps.serviceRepo.findOne({
          where: { id: parsed.serviceId, businessId, isActive: true },
        })
      : resolveByName(
          await deps.serviceRepo.find({
            where: { businessId, isActive: true },
          }),
          parsed.serviceName!,
        );

    if (!service) {
      return failure(
        'link_recommended_products',
        `No active service found matching "${parsed.serviceName ?? parsed.serviceId}".`,
        { clarify: true, missing: ['serviceName'] },
      );
    }

    const linkedProductIds =
      await deps.productRecommendationService.setServiceRecommendations(
        businessId,
        service.id,
        resolvedProductIds,
      );

    return success(
      'link_recommended_products',
      `Linked ${linkedProductIds.length} product(s) to "${service.name}" for post-checkout recommendations.`,
      {
        serviceId: service.id,
        serviceName: service.name,
        productIds: linkedProductIds,
        productNames: parsed.productNames,
      },
    );
  }

  const category = parsed.categoryId
    ? await deps.categoryRepo.findOne({
        where: { id: parsed.categoryId, businessId },
      })
    : resolveByName(
        await deps.categoryRepo.find({ where: { businessId } }),
        parsed.categoryName!,
      );

  if (!category) {
    return failure(
      'link_recommended_products',
      `No category found matching "${parsed.categoryName ?? parsed.categoryId}".`,
      { clarify: true, missing: ['categoryName'] },
    );
  }

  const linkedProductIds =
    await deps.productRecommendationService.setCategoryRecommendations(
      businessId,
      category.id,
      resolvedProductIds,
    );

  return success(
    'link_recommended_products',
    `Linked ${linkedProductIds.length} product(s) to "${category.name}" category for post-checkout recommendations.`,
    {
      categoryId: category.id,
      categoryName: category.name,
      productIds: linkedProductIds,
      productNames: parsed.productNames,
    },
  );
}

function mapLinkedProducts(
  links: Array<{ productId: string; sortOrder: number }>,
  productById: Map<string, Product>,
): LinkedProductView[] {
  return links.map((link) => {
    const product = productById.get(link.productId);
    return {
      productId: link.productId,
      productName: product?.name ?? link.productId,
      isActive: product?.isActive ?? false,
      sortOrder: link.sortOrder,
    };
  });
}

function formatLinkedProductNames(products: LinkedProductView[]): string {
  if (products.length === 0) return 'none';
  return products
    .map((product) =>
      product.isActive ? product.productName : `${product.productName} (inactive)`,
    )
    .join(', ');
}

function buildExplainSummary(input: {
  maxProductCount: number;
  activeProductCount: number;
  serviceGroups: ServiceRecommendationGroup[];
  categoryGroups: CategoryRecommendationGroup[];
  filterServiceName?: string;
  filterCategoryName?: string;
}): string {
  const header = `Post-checkout recommendations show up to ${input.maxProductCount} product(s). ${input.activeProductCount} active product(s) in catalog.`;

  if (input.filterServiceName) {
    const group = input.serviceGroups[0];
    if (!group || group.products.length === 0) {
      return `${header} No products linked for "${input.filterServiceName}" service.`;
    }
    return `${header} ${group.serviceName} service: ${formatLinkedProductNames(group.products)}.`;
  }

  if (input.filterCategoryName) {
    const group = input.categoryGroups[0];
    if (!group || group.products.length === 0) {
      return `${header} No products linked for "${input.filterCategoryName}" category.`;
    }
    return `${header} ${group.categoryName} category: ${formatLinkedProductNames(group.products)}.`;
  }

  const serviceLines = input.serviceGroups
    .filter((group) => group.products.length > 0)
    .map(
      (group) => `${group.serviceName}: ${formatLinkedProductNames(group.products)}`,
    );
  const categoryLines = input.categoryGroups
    .filter((group) => group.products.length > 0)
    .map(
      (group) =>
        `${group.categoryName} category: ${formatLinkedProductNames(group.products)}`,
    );

  if (serviceLines.length === 0 && categoryLines.length === 0) {
    return `${header} No service or category recommendation links configured yet.`;
  }

  return [
    header,
    ...serviceLines,
    ...categoryLines,
  ].join(' ');
}

export async function handleExplainRecommendationSetupLogic(
  deps: ExplainRecommendationSetupLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainRecommendationSetupFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_recommendation_setup',
      'Ask about checkout recommendation setup (e.g. "Explain recommendation setup" or "Which products are linked for post-checkout recommendations?").',
    );
  }

  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('explain_recommendation_setup', 'Business not found.');
  }

  const { maxProductCount } = resolveProductRecommendationSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const activeProducts = await deps.inventoryService.listProducts(businessId);
  const allProducts = await deps.inventoryService.listProducts(
    businessId,
    undefined,
    true,
  );
  const productById = new Map(allProducts.map((product) => [product.id, product]));

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    order: { name: 'ASC' },
  });
  const categories = await deps.categoryRepo.find({
    where: { businessId },
    order: { name: 'ASC' },
  });

  const serviceIds = services.map((service) => service.id);
  const categoryIds = categories.map((category) => category.id);

  const serviceLinks =
    serviceIds.length > 0
      ? await deps.serviceLinkRepo.find({
          where: { serviceId: In(serviceIds) },
          order: { sortOrder: 'ASC' },
        })
      : [];
  const categoryLinks =
    categoryIds.length > 0
      ? await deps.categoryLinkRepo.find({
          where: { categoryId: In(categoryIds) },
          order: { sortOrder: 'ASC' },
        })
      : [];

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const serviceGroups: ServiceRecommendationGroup[] = services.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    products: mapLinkedProducts(
      serviceLinks.filter((link) => link.serviceId === service.id),
      productById,
    ),
  }));

  const categoryGroups: CategoryRecommendationGroup[] = categories.map(
    (category) => ({
      categoryId: category.id,
      categoryName: category.name,
      products: mapLinkedProducts(
        categoryLinks.filter((link) => link.categoryId === category.id),
        productById,
      ),
    }),
  );

  let filteredServiceGroups = serviceGroups;
  let filteredCategoryGroups = categoryGroups;
  let filterServiceName: string | undefined;
  let filterCategoryName: string | undefined;

  if (parsed.serviceId || parsed.serviceName) {
    const service = parsed.serviceId
      ? serviceById.get(parsed.serviceId)
      : resolveByName(services, parsed.serviceName!);
    if (!service) {
      return failure(
        'explain_recommendation_setup',
        `No active service found matching "${parsed.serviceName ?? parsed.serviceId}".`,
        { clarify: true, missing: ['serviceName'] },
      );
    }
    filteredServiceGroups = serviceGroups.filter(
      (group) => group.serviceId === service.id,
    );
    filterServiceName = service.name;
  } else if (parsed.categoryId || parsed.categoryName) {
    const category = parsed.categoryId
      ? categoryById.get(parsed.categoryId)
      : resolveByName(categories, parsed.categoryName!);
    if (!category) {
      return failure(
        'explain_recommendation_setup',
        `No category found matching "${parsed.categoryName ?? parsed.categoryId}".`,
        { clarify: true, missing: ['categoryName'] },
      );
    }
    filteredCategoryGroups = categoryGroups.filter(
      (group) => group.categoryId === category.id,
    );
    filterCategoryName = category.name;
  }

  const linkedServicesCount = serviceGroups.filter(
    (group) => group.products.length > 0,
  ).length;
  const linkedCategoriesCount = categoryGroups.filter(
    (group) => group.products.length > 0,
  ).length;

  const summary = buildExplainSummary({
    maxProductCount,
    activeProductCount: activeProducts.length,
    serviceGroups: filteredServiceGroups,
    categoryGroups: filteredCategoryGroups,
    filterServiceName,
    filterCategoryName,
  });

  return success('explain_recommendation_setup', summary, {
    maxProductCount,
    activeProductCount: activeProducts.length,
    linkedServicesCount,
    linkedCategoriesCount,
    serviceLinks: filteredServiceGroups,
    categoryLinks: filteredCategoryGroups,
    ...(filterServiceName ? { serviceName: filterServiceName } : {}),
    ...(filterCategoryName ? { categoryName: filterCategoryName } : {}),
  });
}
