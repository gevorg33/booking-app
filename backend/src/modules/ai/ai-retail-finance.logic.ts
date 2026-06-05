import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { InventoryService } from '../inventory/inventory.service.js';
import type { RetailPosService } from '../retail-pos/retail-pos.service.js';
import type { ExpensesService } from '../expenses/expenses.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';
import type { CommissionsService } from '../commissions/commissions.service.js';
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
  extractServiceNameFromPrompt,
  extractSkuFromPrompt,
  parseFirstProduct,
  type RetailFinanceCompoundStep,
} from './ai-retail-finance.util.js';

export interface RetailFinanceLogicDeps {
  inventoryService: InventoryService;
  retailPosService: RetailPosService;
  expensesService: ExpensesService;
  analyticsService: AnalyticsService;
  commissionsService: CommissionsService;
  bookingRepo: Repository<Booking>;
  serviceRepo: Repository<Service>;
  productRepo: Repository<Product>;
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
