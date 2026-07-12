import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { InventoryService } from '../inventory/inventory.service.js';
import type { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import type { RetailPosService } from '../retail-pos/retail-pos.service.js';
import type { ExpensesService } from '../expenses/expenses.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';
import type { AppEventService } from '../analytics/app-event.service.js';
import type { CommissionsService } from '../commissions/commissions.service.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { AiBookingDepthService } from './ai-booking-depth.service.js';
import type { CommandResult } from './command-completion.types.js';
import { extractDateRangeFromPrompt } from './ai-orchestration.helpers.js';
import {
  decomposeRetailFinanceCompoundPrompt,
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
  extractExpenseAmountFromPrompt,
  extractExpenseCategoryFromPrompt,
  extractExpenseDescriptionFromPrompt,
  extractInventoryDeltaFromPrompt,
  extractProductIdFromPrompt,
  extractProductNameFromPrompt,
  extractQuantityFromPrompt,
  extractRetailPriceFromPrompt,
  extractRetailSearchQuery,
  extractServiceNameFromPrompt,
  extractSkuFromPrompt,
  parseFirstProduct,
  parseRetailSalesLinesFromPrompt,
  type RetailFinanceCompoundStep,
} from './ai-retail-finance.util.js';

export interface RetailFinanceLogicDeps {
  inventoryService: InventoryService;
  productRecommendationService: Pick<
    ProductRecommendationService,
    'setServiceRecommendations' | 'setCategoryRecommendations'
  >;
  retailPosService: RetailPosService;
  expensesService: ExpensesService;
  analyticsService: AnalyticsService;
  commissionsService: CommissionsService;
  reviewsService: Pick<ReviewsService, 'summary' | 'list'>;
  appEventService: Pick<AppEventService, 'getAdoptionDashboard'>;
  bookingRepo: Repository<Booking>;
  serviceRepo: Repository<Service>;
  productRepo: Repository<Product>;
  employeeRepo: Repository<Employee>;
  bookingDepth: AiBookingDepthService;
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

function resolveDateRange(
  params: Record<string, any>,
  prompt?: string,
): { from?: string; to?: string } {
  if (params.from || params.to) {
    return {
      from: params.from as string | undefined,
      to: params.to as string | undefined,
    };
  }
  const range = extractDateRangeFromPrompt(
    prompt ?? (params._prompt as string) ?? '',
  );
  if (!range) return {};
  return { from: range.start, to: range.end };
}

async function resolveProduct(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<Product | null> {
  const productId =
    (params.productId as string | undefined) ??
    extractProductIdFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (productId) {
    const byId = await deps.productRepo.findOne({
      where: { id: productId, businessId, isActive: true },
    });
    if (byId) return byId;
    const products = await deps.inventoryService.listProducts(businessId);
    return (
      products.find((p) => p.id === productId || p.id.startsWith(productId)) ??
      null
    );
  }

  const name =
    (params.productName as string | undefined) ??
    extractProductNameFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (!name) return null;

  const products = await deps.inventoryService.listProducts(businessId);
  return resolveByName(products, name) ?? null;
}

async function resolveService(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<Service | null> {
  if (params.serviceId) {
    const found = await deps.serviceRepo.findOne({
      where: { id: params.serviceId as string, businessId, isActive: true },
    });
    return found ?? null;
  }
  const name =
    (params.serviceName as string | undefined) ??
    extractServiceNameFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (!name) return null;
  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  return resolveByName(services, name) ?? null;
}

async function resolveBooking(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<Booking | null> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const bookingId =
    (params.bookingId as string | undefined) ??
    extractBookingIdFromPrompt(promptText);
  if (bookingId) {
    const byId = await deps.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { customer: true, service: true },
    });
    if (byId) return byId;
    const bookings = await deps.bookingRepo.find({
      where: { businessId },
      relations: { customer: true, service: true },
      order: { startTime: 'DESC' },
      take: 100,
    });
    return (
      bookings.find((b) => b.id === bookingId || b.id.startsWith(bookingId)) ??
      null
    );
  }

  const customerName =
    (params.customerName as string | undefined) ??
    extractCustomerNameFromPrompt(promptText);
  if (customerName) {
    const bookings = await deps.bookingRepo.find({
      where: { businessId },
      relations: { customer: true, service: true },
      order: { startTime: 'DESC' },
      take: 50,
    });
    const needle = customerName.toLowerCase();
    return (
      bookings.find((b) => b.customer?.name?.toLowerCase().includes(needle)) ??
      null
    );
  }

  return null;
}

async function resolveProviderBooking(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Booking | null> {
  const employeeId =
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined);
  if (!employeeId) return null;

  const bookings = await deps.bookingRepo.find({
    where: { businessId, employeeId },
    relations: { service: true, customer: true },
    order: { startTime: 'ASC' },
    take: 30,
  });

  const active = bookings.filter((b) => b.status !== BookingStatus.CANCELLED);
  if (!active.length) return null;

  const now = new Date();
  return (
    active.find((b) => b.startTime <= now && b.endTime >= now) ??
    active.find((b) => b.startTime >= now) ??
    active[active.length - 1]
  );
}

export async function handleListProductsLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const products = await deps.inventoryService.listProducts(
    businessId,
    params.locationId as string | undefined,
  );
  return success(
    'list_products',
    products.length
      ? `${products.length} product(s) in inventory.`
      : 'No products in inventory.',
    { products, count: products.length },
  );
}

export async function handleCreateProductLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const name =
    (params.name as string | undefined) ??
    (params.productName as string | undefined) ??
    extractProductNameFromPrompt(promptText);
  if (!name) {
    return failure('create_product', 'Provide product name.', {
      clarify: true,
      missing: ['name'],
    });
  }

  try {
    const created = await deps.inventoryService.createProduct(businessId, {
      name,
      sku:
        (params.sku as string | undefined) ??
        extractSkuFromPrompt(promptText) ??
        undefined,
      retailPrice:
        (params.retailPrice as number | undefined) ??
        extractRetailPriceFromPrompt(promptText) ??
        0,
      quantityOnHand:
        (params.quantityOnHand as number | undefined) ??
        extractQuantityFromPrompt(promptText) ??
        0,
      unitCost: (params.unitCost as number | undefined) ?? 0,
      locationId: params.locationId as string | undefined,
    });
    return success('create_product', `Product "${created.name}" created.`, {
      product: created,
      productId: created.id,
    });
  } catch (err: any) {
    return failure(
      'create_product',
      err?.message ?? 'Could not create product.',
    );
  }
}

export async function handleLinkProductToServiceLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const product = await resolveProduct(deps, businessId, params, prompt);
  const service = await resolveService(deps, businessId, params, prompt);
  if (!product) {
    return failure('link_product_to_service', 'Specify product to link.', {
      clarify: true,
      missing: ['productName'],
    });
  }
  if (!service) {
    return failure('link_product_to_service', 'Specify service to link.', {
      clarify: true,
      missing: ['serviceName'],
    });
  }

  try {
    const link = await deps.inventoryService.linkToService(
      businessId,
      service.id,
      product.id,
      (params.quantityPerService as number | undefined) ?? 1,
    );
    return success(
      'link_product_to_service',
      `Linked ${product.name} to ${service.name}.`,
      { link, productId: product.id, serviceId: service.id },
    );
  } catch (err: any) {
    return failure(
      'link_product_to_service',
      err?.message ?? 'Could not link product to service.',
    );
  }
}

export async function handleUpdateInventoryProductLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const product = await resolveProduct(deps, businessId, params, prompt);
  if (!product) {
    return failure(
      'update_inventory_product',
      'Specify which product to update.',
      { clarify: true, missing: ['productName'] },
    );
  }

  const name =
    typeof params.newName === 'string' ? params.newName : undefined;
  const sku = typeof params.sku === 'string' ? params.sku : undefined;
  const retailPrice =
    typeof params.retailPrice === 'number' ? params.retailPrice : undefined;
  const unitCost =
    typeof params.unitCost === 'number' ? params.unitCost : undefined;
  const reorderLevel =
    typeof params.reorderLevel === 'number' ? params.reorderLevel : undefined;
  const isActive =
    typeof params.isActive === 'boolean' ? params.isActive : undefined;

  if (
    name === undefined &&
    sku === undefined &&
    retailPrice === undefined &&
    unitCost === undefined &&
    reorderLevel === undefined &&
    isActive === undefined
  ) {
    return failure(
      'update_inventory_product',
      `What should I change on "${product.name}"? Provide a new name, SKU, retail price, unit cost, reorder level, or active status.`,
    );
  }

  try {
    const updated = await deps.inventoryService.updateProduct(
      product.id,
      businessId,
      {
        ...(name !== undefined ? { name } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(retailPrice !== undefined ? { retailPrice } : {}),
        ...(unitCost !== undefined ? { unitCost } : {}),
        ...(reorderLevel !== undefined ? { reorderLevel } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    );
    return success(
      'update_inventory_product',
      `Updated product "${updated.name}".`,
      { product: updated, productId: updated.id },
    );
  } catch (err: any) {
    return failure(
      'update_inventory_product',
      err?.message ?? 'Could not update the product.',
    );
  }
}

export async function handleDeleteInventoryProductLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const product = await resolveProduct(deps, businessId, params, prompt);
  if (!product) {
    return failure(
      'delete_inventory_product',
      'Specify which product to remove.',
      { clarify: true, missing: ['productName'] },
    );
  }

  try {
    const updated = await deps.inventoryService.updateProduct(
      product.id,
      businessId,
      { isActive: false },
    );
    return success(
      'delete_inventory_product',
      `Removed "${updated.name}" from the active catalog.`,
      { productId: updated.id },
    );
  } catch (err: any) {
    return failure(
      'delete_inventory_product',
      err?.message ?? 'Could not remove the product.',
    );
  }
}

export async function handleUnlinkInventoryProductLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const linkId =
    typeof params.linkId === 'string' && params.linkId.trim()
      ? params.linkId.trim()
      : undefined;

  let resolvedLinkId = linkId;
  if (!resolvedLinkId) {
    const product = await resolveProduct(deps, businessId, params, prompt);
    const service = await resolveService(deps, businessId, params, prompt);
    if (!product || !service) {
      return failure(
        'unlink_inventory_product',
        'Specify the product and service to unlink (or a linkId).',
        { clarify: true, missing: ['productName', 'serviceName'] },
      );
    }
    const links = await deps.inventoryService.listServiceLinks(businessId, {
      serviceId: service.id,
      productId: product.id,
    });
    resolvedLinkId = links[0]?.id;
    if (!resolvedLinkId) {
      return failure(
        'unlink_inventory_product',
        `No link found between "${product.name}" and "${service.name}".`,
      );
    }
  }

  try {
    await deps.inventoryService.unlinkServiceProduct(
      resolvedLinkId,
      businessId,
    );
    return success(
      'unlink_inventory_product',
      'Unlinked the product from the service.',
      { linkId: resolvedLinkId },
    );
  } catch (err: any) {
    return failure(
      'unlink_inventory_product',
      err?.message ?? 'Could not unlink the product.',
    );
  }
}

export async function handleSetRecommendedProductsLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const service = await resolveService(deps, businessId, params, prompt);
  const categoryId =
    typeof params.categoryId === 'string' && params.categoryId.trim()
      ? params.categoryId.trim()
      : undefined;

  if (!service && !categoryId) {
    return failure(
      'set_recommended_products',
      'Specify the service or category these recommendations apply to.',
      { clarify: true, missing: ['serviceName', 'categoryId'] },
    );
  }

  const productNames = Array.isArray(params.productNames)
    ? params.productNames.filter(
        (name): name is string => typeof name === 'string',
      )
    : [];
  const productIdsParam = Array.isArray(params.productIds)
    ? params.productIds.filter(
        (id): id is string => typeof id === 'string',
      )
    : [];

  if (productNames.length === 0 && productIdsParam.length === 0) {
    return failure(
      'set_recommended_products',
      'Which products should be recommended? Provide productIds or productNames.',
      { clarify: true, missing: ['productIds', 'productNames'] },
    );
  }

  let resolvedProductIds = productIdsParam;
  if (resolvedProductIds.length === 0) {
    const products = await deps.inventoryService.listProducts(businessId);
    resolvedProductIds = productNames
      .map((name) => {
        const needle = name.toLowerCase();
        return (
          products.find((p) => p.name.toLowerCase() === needle) ??
          products.find((p) => p.name.toLowerCase().includes(needle))
        )?.id;
      })
      .filter((id): id is string => !!id);

    if (resolvedProductIds.length === 0) {
      return failure(
        'set_recommended_products',
        'None of the given product names matched the catalog.',
      );
    }
  }

  try {
    const productIds = service
      ? await deps.productRecommendationService.setServiceRecommendations(
          businessId,
          service.id,
          resolvedProductIds,
        )
      : await deps.productRecommendationService.setCategoryRecommendations(
          businessId,
          categoryId!,
          resolvedProductIds,
        );
    return success(
      'set_recommended_products',
      `Set ${productIds.length} recommended product${productIds.length === 1 ? '' : 's'} for ${service ? service.name : 'the category'}.`,
      { productIds, serviceId: service?.id, categoryId },
    );
  } catch (err: any) {
    return failure(
      'set_recommended_products',
      err?.message ?? 'Could not set recommended products.',
    );
  }
}

export async function handleAdjustInventoryLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const product = await resolveProduct(deps, businessId, params, prompt);
  if (!product) {
    return failure('adjust_inventory', 'Specify product to adjust.', {
      clarify: true,
      missing: ['productName'],
    });
  }

  const delta =
    (params.delta as number | undefined) ??
    extractInventoryDeltaFromPrompt(prompt ?? (params._prompt as string) ?? '');
  if (delta === undefined || delta === null || Number.isNaN(delta)) {
    return failure(
      'adjust_inventory',
      'Specify inventory adjustment delta (e.g. by 10).',
      {
        clarify: true,
        missing: ['delta'],
      },
    );
  }

  try {
    const updated = await deps.inventoryService.adjustStock(
      product.id,
      businessId,
      delta,
    );
    return success(
      'adjust_inventory',
      `${updated.name} stock adjusted to ${updated.quantityOnHand}.`,
      {
        product: updated,
        productId: updated.id,
        quantityOnHand: updated.quantityOnHand,
      },
    );
  } catch (err: any) {
    return failure(
      'adjust_inventory',
      err?.message ?? 'Could not adjust inventory.',
    );
  }
}

export async function handleAddRetailSaleToBookingLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const booking = await resolveBooking(deps, businessId, params, prompt);
  if (!booking) {
    return failure(
      'add_retail_sale_to_booking',
      'Specify booking (id or customer).',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }

  const product = await resolveProduct(deps, businessId, params, prompt);
  if (!product) {
    return failure(
      'add_retail_sale_to_booking',
      'Specify retail product to add.',
      {
        clarify: true,
        missing: ['productName'],
      },
    );
  }

  const quantity = Math.max(1, (params.quantity as number | undefined) ?? 1);

  try {
    const current = await deps.retailPosService.getBookingRetailSales(
      businessId,
      booking.id,
    );
    const merged = new Map<string, number>();
    for (const line of current.lines) {
      merged.set(
        line.productId,
        (merged.get(line.productId) ?? 0) + line.quantity,
      );
    }
    merged.set(product.id, (merged.get(product.id) ?? 0) + quantity);

    const checkout = await deps.retailPosService.setBookingRetailSales(
      businessId,
      booking.id,
      userId ?? 'system',
      {
        lines: [...merged.entries()].map(([productId, qty]) => ({
          productId,
          quantity: qty,
        })),
      },
    );

    return success(
      'add_retail_sale_to_booking',
      `Added ${product.name} (×${quantity}) to booking — retail total ${checkout.retailTotal}.`,
      {
        bookingId: booking.id,
        productId: product.id,
        checkout,
      },
    );
  } catch (err: any) {
    return failure(
      'add_retail_sale_to_booking',
      err?.message ?? 'Could not add retail sale.',
    );
  }
}

export async function handleRemoveRetailLineLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const booking = await resolveBooking(deps, businessId, params, prompt);
  if (!booking) {
    return failure('remove_retail_line', 'Specify booking to update.', {
      clarify: true,
      missing: ['bookingId'],
    });
  }

  const product = await resolveProduct(deps, businessId, params, prompt);
  const productId = (params.productId as string | undefined) ?? product?.id;
  const productName =
    (params.productName as string | undefined) ??
    extractProductNameFromPrompt(prompt ?? (params._prompt as string) ?? '');

  try {
    const current = await deps.retailPosService.getBookingRetailSales(
      businessId,
      booking.id,
    );
    const remaining = current.lines.filter((line) => {
      if (productId && line.productId === productId) return false;
      if (
        productName &&
        line.productName.toLowerCase().includes(productName.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const checkout = await deps.retailPosService.setBookingRetailSales(
      businessId,
      booking.id,
      userId ?? 'system',
      {
        lines: remaining.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      },
    );

    return success(
      'remove_retail_line',
      remaining.length
        ? `Removed retail line — ${remaining.length} line(s) remain.`
        : 'Removed retail line — cart cleared.',
      { bookingId: booking.id, checkout },
    );
  } catch (err: any) {
    return failure(
      'remove_retail_line',
      err?.message ?? 'Could not remove retail line.',
    );
  }
}

/** ai-cmd-provider-5.4.4 — provider mobile: remove one retail line from own booking. */
export async function handleRemoveRetailFromMyBookingLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const booking =
    (await resolveBooking(deps, businessId, params, prompt)) ??
    (await resolveProviderBooking(deps, businessId, params));
  if (!booking) {
    return failure(
      'remove_retail_from_booking',
      'Specify booking (id, customer, or your active appointment).',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const employeeId =
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined);
  if (employeeId && booking.employeeId !== employeeId) {
    return failure(
      'remove_retail_from_booking',
      'That booking is not assigned to you.',
      { bookingId: booking.id },
    );
  }

  return handleRemoveRetailLineLogic(
    deps,
    businessId,
    {
      ...params,
      bookingId: booking.id,
      _prompt: prompt ?? (params._prompt as string),
    },
    userId,
    prompt,
  );
}

export async function handleRecordExpenseLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const category =
    (params.category as string | undefined) ??
    extractExpenseCategoryFromPrompt(promptText);
  const amount =
    (params.amount as number | undefined) ??
    extractExpenseAmountFromPrompt(promptText);
  if (!category) {
    return failure('record_expense', 'Specify expense category.', {
      clarify: true,
      missing: ['category'],
    });
  }
  if (amount === undefined || amount === null) {
    return failure('record_expense', 'Specify expense amount.', {
      clarify: true,
      missing: ['amount'],
    });
  }

  try {
    const expense = await deps.expensesService.create(businessId, {
      category,
      amount,
      description:
        (params.description as string | undefined) ??
        extractExpenseDescriptionFromPrompt(promptText) ??
        category,
      expenseDate:
        (params.expenseDate as string | undefined) ??
        new Date().toISOString().slice(0, 10),
      currency: (params.currency as string | undefined) ?? 'USD',
      locationId: params.locationId as string | undefined,
    });
    return success(
      'record_expense',
      `Expense recorded — ${category} $${amount}.`,
      { expense },
    );
  } catch (err: any) {
    return failure(
      'record_expense',
      err?.message ?? 'Could not record expense.',
    );
  }
}

export async function handleListExpensesLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const expenses = await deps.expensesService.list(
    businessId,
    params.locationId as string | undefined,
  );
  return success(
    'list_expenses',
    expenses.length
      ? `${expenses.length} expense(s) found.`
      : 'No expenses recorded.',
    { expenses, count: expenses.length },
  );
}

export async function handleDeleteExpenseLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const expenseId =
    typeof params.expenseId === 'string' && params.expenseId.trim()
      ? params.expenseId.trim()
      : undefined;

  let resolvedId = expenseId;
  if (!resolvedId) {
    const category =
      typeof params.category === 'string' ? params.category.trim() : undefined;
    const description =
      typeof params.description === 'string'
        ? params.description.trim().toLowerCase()
        : undefined;
    if (!category && !description) {
      return failure(
        'delete_expense',
        'Specify which expense to delete (expenseId, category, or description).',
        { clarify: true, missing: ['expenseId'] },
      );
    }
    const expenses = await deps.expensesService.list(businessId);
    const match = expenses.find(
      (e) =>
        (!category || e.category === category) &&
        (!description || e.description?.toLowerCase().includes(description)),
    );
    if (!match) {
      return failure('delete_expense', 'No matching expense was found.');
    }
    resolvedId = match.id;
  }

  try {
    await deps.expensesService.remove(resolvedId, businessId);
    return success('delete_expense', 'Expense deleted.', {
      expenseId: resolvedId,
    });
  } catch (err: any) {
    return failure(
      'delete_expense',
      err?.message ?? 'Could not delete the expense.',
    );
  }
}

export async function handleSummarizePlLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  try {
    const report = await deps.analyticsService.profitAndLoss(businessId, {
      from,
      to,
      locationId: params.locationId as string | undefined,
    });
    const { currency } = report;
    return success(
      'summarize_pl',
      `P&L (${currency}) — revenue ${report.revenue}, expenses ${report.expenses}, net ${report.netProfit}.`,
      { report, from, to },
    );
  } catch (err: any) {
    return failure('summarize_pl', err?.message ?? 'Could not summarize P&L.');
  }
}

export async function handleCommissionReportLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  try {
    const [staffReport, rules] = await Promise.all([
      deps.analyticsService.staffPerformance(businessId, {
        from,
        to,
        locationId: params.locationId as string | undefined,
      }),
      deps.commissionsService.list(businessId),
    ]);

    const summary = staffReport.rows.map((row) => {
      const employeeRules = rules.filter(
        (r) => r.employeeId === row.employeeId,
      );
      return {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        bookings: row.bookings,
        completed: row.completed,
        revenue: row.revenue,
        commissionRules: employeeRules.map((r) => ({
          id: r.id,
          type: r.type,
          value: r.value,
          serviceId: r.serviceId,
        })),
      };
    });

    return success(
      'commission_report',
      `Commission report — ${summary.length} staff member(s), ${rules.length} rule(s).`,
      { summary, rules, staff: staffReport, from, to },
    );
  } catch (err: any) {
    return failure(
      'commission_report',
      err?.message ?? 'Could not build commission report.',
    );
  }
}

export async function handleCreateCommissionRuleLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const employeeName =
    typeof params.employeeName === 'string' ? params.employeeName : undefined;
  const employees = employeeName
    ? await deps.employeeRepo.find({ where: { businessId, isActive: true } })
    : [];
  const resolvedEmployee = employeeName
    ? resolveByName(employees, employeeName)
    : undefined;

  const service = await resolveService(deps, businessId, params, prompt);

  const type =
    params.type === 'flat' || params.type === 'percent'
      ? params.type
      : 'percent';
  const value = typeof params.value === 'number' ? params.value : undefined;

  if (value === undefined) {
    return failure(
      'create_commission_rule',
      'Specify the commission value (percent or flat amount).',
      { clarify: true, missing: ['value'] },
    );
  }
  if (employeeName && !resolvedEmployee) {
    return failure(
      'create_commission_rule',
      `Employee "${employeeName}" was not found.`,
    );
  }

  try {
    const rule = await deps.commissionsService.create(businessId, {
      employeeId: resolvedEmployee?.id,
      serviceId: service?.id,
      type,
      value,
    });
    const scope = [
      resolvedEmployee ? resolvedEmployee.name : null,
      service ? service.name : null,
    ]
      .filter(Boolean)
      .join(' / ');
    return success(
      'create_commission_rule',
      `Created a ${type === 'percent' ? `${value}%` : `$${value}`} commission rule${scope ? ` for ${scope}` : ''}.`,
      { rule },
    );
  } catch (err: any) {
    return failure(
      'create_commission_rule',
      err?.message ?? 'Could not create the commission rule.',
    );
  }
}

export async function handleDeleteCommissionRuleLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const ruleId =
    typeof params.ruleId === 'string' && params.ruleId.trim()
      ? params.ruleId.trim()
      : undefined;

  let resolvedId = ruleId;
  if (!resolvedId) {
    const employeeName =
      typeof params.employeeName === 'string' ? params.employeeName : undefined;
    const service = await resolveService(deps, businessId, params, prompt);
    if (!employeeName && !service) {
      return failure(
        'delete_commission_rule',
        'Specify which commission rule to delete (ruleId, employeeName, or serviceName).',
        { clarify: true, missing: ['ruleId'] },
      );
    }
    const rules = await deps.commissionsService.list(businessId);
    const employees = employeeName
      ? await deps.employeeRepo.find({ where: { businessId, isActive: true } })
      : [];
    const employee = employeeName
      ? resolveByName(employees, employeeName)
      : undefined;
    const match = rules.find(
      (r) =>
        (!employee || r.employeeId === employee.id) &&
        (!service || r.serviceId === service.id),
    );
    if (!match) {
      return failure(
        'delete_commission_rule',
        'No matching commission rule was found.',
      );
    }
    resolvedId = match.id;
  }

  try {
    await deps.commissionsService.remove(resolvedId, businessId);
    return success('delete_commission_rule', 'Commission rule deleted.', {
      ruleId: resolvedId,
    });
  } catch (err: any) {
    return failure(
      'delete_commission_rule',
      err?.message ?? 'Could not delete the commission rule.',
    );
  }
}

export async function handlePayoutExportLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  try {
    const result = await deps.commissionsService.exportPayoutCsv(
      businessId,
      from,
      to,
      params.locationId as string | undefined,
    );
    return success(
      'payout_export',
      `Payout export ready — ${result.rowCount} row(s).`,
      { export: result, from, to },
    );
  } catch (err: any) {
    return failure('payout_export', err?.message ?? 'Payout export failed.');
  }
}

export async function handleExportAnalyticsReportLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  const format =
    (params.format as string | undefined)?.toLowerCase() === 'pdf'
      ? 'pdf'
      : 'csv';
  const query = { from, to, locationId: params.locationId as string | undefined };

  try {
    if (format === 'pdf') {
      const html = await deps.analyticsService.exportPdfHtml(businessId, query);
      return success(
        'export_analytics_report',
        'Analytics report ready (printable HTML).',
        { export: { format, content: html }, from, to },
      );
    }
    const csv = await deps.analyticsService.exportCsv(businessId, query);
    const rowCount = csv.split('\n').length - 1;
    return success(
      'export_analytics_report',
      `Analytics export ready — ${rowCount} row(s) (csv).`,
      { export: { format, content: csv, rowCount }, from, to },
    );
  } catch (err: any) {
    return failure(
      'export_analytics_report',
      err?.message ?? 'Analytics export failed.',
    );
  }
}

export async function handleSummarizeReviewsLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  try {
    const perEmployee = await deps.reviewsService.summary(businessId);
    const employeeId = params.employeeId as string | undefined;
    const filtered = employeeId
      ? perEmployee.filter((r) => r.employeeId === employeeId)
      : perEmployee;

    const totalReviews = filtered.reduce((sum, r) => sum + r.reviewCount, 0);
    const overallAvg =
      totalReviews > 0
        ? Math.round(
            (filtered.reduce((sum, r) => sum + r.avgRating * r.reviewCount, 0) /
              totalReviews) *
              10,
          ) / 10
        : 0;

    const recent = (await deps.reviewsService.list(businessId, employeeId))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        employeeId: r.employeeId,
        createdAt: r.createdAt,
      }));

    return success(
      'summarize_reviews',
      totalReviews > 0
        ? `${totalReviews} review(s), average rating ${overallAvg}/5.`
        : 'No reviews yet.',
      { perEmployee: filtered, overallAvg, totalReviews, recentReviews: recent },
    );
  } catch (err: any) {
    return failure(
      'summarize_reviews',
      err?.message ?? 'Could not summarize reviews.',
    );
  }
}

export async function handleSummarizeAdoptionFunnelLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const periodDays =
    typeof params.periodDays === 'number' ? params.periodDays : 30;

  try {
    const dashboard = await deps.appEventService.getAdoptionDashboard(
      businessId,
      periodDays,
    );
    const steps = dashboard.funnel.steps;
    const first = steps[0];
    const last = steps[steps.length - 1];
    const overallConversion =
      first && last && first.count > 0
        ? Math.round((last.count / first.count) * 1000) / 10
        : null;

    return success(
      'summarize_adoption_funnel',
      steps.length
        ? `Adoption funnel (last ${dashboard.periodDays} days): ${steps
            .map((s) => `${s.step} ${s.count}`)
            .join(' → ')}${overallConversion != null ? ` — ${overallConversion}% overall conversion` : ''}.`
        : `No adoption funnel activity in the last ${dashboard.periodDays} days.`,
      { dashboard, overallConversion },
    );
  } catch (err: any) {
    return failure(
      'summarize_adoption_funnel',
      err?.message ?? 'Could not summarize the adoption funnel.',
    );
  }
}

export async function handleSuggestRetailUpsellLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const booking =
    (await resolveBooking(deps, businessId, params, prompt)) ??
    (params.myAppointment || /\bmy\s+appointment\b/i.test(prompt ?? '')
      ? await resolveProviderBooking(deps, businessId, params)
      : null);

  const sellable = await deps.retailPosService.listSellableProducts(businessId);
  let serviceLinked: Awaited<ReturnType<InventoryService['listServiceLinks']>> =
    [];

  if (booking?.serviceId) {
    serviceLinked = await deps.inventoryService.listServiceLinks(businessId, {
      serviceId: booking.serviceId,
    });
  } else if (params.serviceId || params.serviceName) {
    const service = await resolveService(deps, businessId, params, prompt);
    if (service) {
      serviceLinked = await deps.inventoryService.listServiceLinks(businessId, {
        serviceId: service.id,
      });
    }
  }

  const linkedProductIds = new Set(serviceLinked.map((l) => l.productId));
  const suggestions = sellable
    .map((p) => ({
      ...p,
      linkedToService: linkedProductIds.has(p.id),
      priority: linkedProductIds.has(p.id) ? 1 : 2,
    }))
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

  return success(
    'suggest_retail_upsell',
    suggestions.length
      ? `${suggestions.length} retail upsell suggestion(s).`
      : 'No sellable retail products available.',
    {
      suggestions,
      serviceLinked,
      bookingId: booking?.id,
      serviceId: booking?.serviceId,
    },
  );
}

/** ai-cmd-provider-5.4.5 — navigate/search sellable retail products by name or SKU. */
export async function handleSearchRetailSkuLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const query =
    (params.query as string | undefined) ??
    (params.productName as string | undefined) ??
    extractRetailSearchQuery(prompt ?? (params._prompt as string) ?? '');

  if (!query) {
    return failure(
      'search_retail_sku',
      'Specify a product name or SKU to search for.',
      { clarify: true, missing: ['query'] },
    );
  }

  const sellable = await deps.retailPosService.listSellableProducts(businessId);
  const needle = query.toLowerCase();
  const matches = sellable.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      (p.sku != null && p.sku.toLowerCase() === needle),
  );

  return success(
    'search_retail_sku',
    matches.length
      ? `Found ${matches.length} product(s) matching "${query}".`
      : `No sellable products match "${query}".`,
    { query, matches },
  );
}

export async function handleAddRetailToMyBookingLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const booking = await resolveProviderBooking(deps, businessId, params);
  if (!booking) {
    return failure(
      'add_retail_to_my_booking',
      'No active booking found for your schedule.',
      {
        clarify: true,
        missing: ['sessionEmployeeId'],
      },
    );
  }

  const employeeId =
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined);
  if (employeeId && booking.employeeId !== employeeId) {
    return failure(
      'add_retail_to_my_booking',
      'That booking is not assigned to you.',
      {
        bookingId: booking.id,
      },
    );
  }

  return handleAddRetailSaleToBookingLogic(
    deps,
    businessId,
    {
      ...params,
      bookingId: booking.id,
      _prompt: prompt ?? (params._prompt as string),
    },
    userId,
    prompt,
  );
}

export async function handleSetRetailSalesLinesLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  prompt?: string,
): Promise<CommandResult> {
  const booking =
    (await resolveBooking(deps, businessId, params, prompt)) ??
    (await resolveProviderBooking(deps, businessId, params));
  if (!booking) {
    return failure(
      'set_retail_sales_lines',
      'Specify booking (id, customer, or your active appointment).',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const rawLines: Array<{
    productId?: string;
    productName?: string;
    quantity?: number;
  }> =
    (params.lines as
      | Array<{ productId?: string; productName?: string; quantity?: number }>
      | undefined) ??
    parseRetailSalesLinesFromPrompt(
      prompt ?? (params._prompt as string) ?? '',
    );

  if (!rawLines || !rawLines.length) {
    return failure(
      'set_retail_sales_lines',
      'Specify the retail products and quantities for this cart (e.g. "set cart to 2 shampoo, 1 conditioner").',
      { clarify: true, missing: ['lines'] },
    );
  }

  const products = await deps.inventoryService.listProducts(businessId);
  const resolvedLines: Array<{ productId: string; quantity: number }> = [];
  const unresolved: string[] = [];

  for (const line of rawLines) {
    const quantity = Math.max(1, Number(line.quantity) || 1);
    if (line.productId) {
      resolvedLines.push({ productId: line.productId, quantity });
      continue;
    }
    if (!line.productName) continue;
    const match = resolveByName(products, line.productName);
    if (match) {
      resolvedLines.push({ productId: match.id, quantity });
    } else {
      unresolved.push(line.productName);
    }
  }

  if (unresolved.length) {
    return failure(
      'set_retail_sales_lines',
      `Could not find product(s): ${unresolved.join(', ')}.`,
      { clarify: true, unresolved },
    );
  }
  if (!resolvedLines.length) {
    return failure(
      'set_retail_sales_lines',
      'Specify the retail products and quantities for this cart (e.g. "set cart to 2 shampoo, 1 conditioner").',
      { clarify: true, missing: ['lines'] },
    );
  }

  try {
    const checkout = await deps.retailPosService.setBookingRetailSales(
      businessId,
      booking.id,
      userId ?? 'system',
      { lines: resolvedLines },
    );
    return success(
      'set_retail_sales_lines',
      `Retail cart updated — ${resolvedLines.length} line(s), retail total ${checkout.retailTotal}.`,
      { bookingId: booking.id, checkout },
    );
  } catch (err: any) {
    return failure(
      'set_retail_sales_lines',
      err?.message ?? 'Could not update retail cart.',
    );
  }
}

export function mergeRetailFinanceCompoundContext(
  context: Record<string, unknown>,
  step: RetailFinanceCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };

  if (details.productId) next.productId = details.productId;
  if (details.serviceId) next.serviceId = details.serviceId;
  if (details.bookingId) next.bookingId = details.bookingId;

  if (step.action === 'list_products' && !next.productId) {
    const products = details.products as
      | Array<{ id: string; name: string }>
      | undefined;
    const first = parseFirstProduct(products ?? []);
    if (first) next.productId = first.id;
  }
  if (step.action === 'create_product' && details.productId) {
    next.productId = details.productId;
  }
  if (step.action === 'link_product_to_service') {
    if (details.productId) next.productId = details.productId;
    if (details.serviceId) next.serviceId = details.serviceId;
  }
  if (step.action === 'add_retail_sale_to_booking' && details.bookingId) {
    next.bookingId = details.bookingId;
  }
  return next;
}

export async function handleRetailFinanceCompoundLogic(
  deps: RetailFinanceLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const steps: RetailFinanceCompoundStep[] =
    (params.compoundSteps as RetailFinanceCompoundStep[] | undefined) ??
    decomposeRetailFinanceCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple retail/finance commands. Try separating with "and" or semicolons.',
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
      case 'list_products':
        result = await handleListProductsLogic(deps, businessId, stepParams);
        break;
      case 'create_product':
        result = await handleCreateProductLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'link_product_to_service':
        result = await handleLinkProductToServiceLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'adjust_inventory':
        result = await handleAdjustInventoryLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'add_retail_sale_to_booking':
        result = await handleAddRetailSaleToBookingLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'remove_retail_line':
        result = await handleRemoveRetailLineLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'record_expense':
        result = await handleRecordExpenseLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'list_expenses':
        result = await handleListExpensesLogic(deps, businessId, stepParams);
        break;
      case 'summarize_pl':
        result = await handleSummarizePlLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'commission_report':
        result = await handleCommissionReportLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'payout_export':
        result = await handlePayoutExportLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'suggest_retail_upsell':
        result = await handleSuggestRetailUpsellLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'add_retail_to_my_booking':
        result = await handleAddRetailToMyBookingLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'set_retail_sales_lines':
        result = await handleSetRetailSalesLinesLogic(
          deps,
          businessId,
          stepParams,
          userId,
          step.segment,
        );
        break;
      case 'mark_paid':
        result = await deps.bookingDepth.handleMarkPaid(
          businessId,
          stepParams,
          userId,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported retail/finance compound step: ${step.action}.`,
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
    compoundContext = mergeRetailFinanceCompoundContext(
      compoundContext,
      step,
      result,
    );
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} retail/finance step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      retailFinanceCompound: true,
      userId,
      finalContext: compoundContext,
    },
  };
}
