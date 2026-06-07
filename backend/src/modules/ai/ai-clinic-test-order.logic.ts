import type { Repository } from 'typeorm';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestPanel } from '../clinic-test-results/entities/clinic-test-panel.entity.js';
import type { ClinicTestType } from '../clinic-test-results/entities/clinic-test-type.entity.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type {
  ClinicLabQueueFilters,
  ClinicTestOrderService,
} from '../clinic-test-results/order/clinic-test-order.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assertClinicTestOrderBusinessType,
  matchClinicCatalogItem,
  parseCreateTestOrderFromPrompt,
  parseListTestOrdersFromPrompt,
  resolveBookingForClinicTestOrder,
  type ParsedClinicTestOrderRequest,
} from './ai-clinic-test-order.util.js';

export interface ClinicTestOrderLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  bookingRepo: Pick<Repository<Booking>, 'find' | 'findOne'>;
  testTypeRepo: Pick<Repository<ClinicTestType>, 'find'>;
  testPanelRepo: Pick<Repository<ClinicTestPanel>, 'find'>;
  clinicTestOrderService: Pick<
    ClinicTestOrderService,
    'createCatalogOrderForBooking' | 'listLabQueue' | 'listOrdersForBooking'
  >;
  clinicLabAccessService: Pick<
    ClinicLabAccessService,
    'assertCanCreateManualLabOrder' | 'scopeLabQueueFilters'
  >;
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
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function clarify(
  action: string,
  summary: string,
  missing: string[],
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: false,
    action,
    summary,
    details: { ...details, clarify: true, missing },
  };
}

async function loadCatalog(
  deps: ClinicTestOrderLogicDeps,
  businessId: string,
): Promise<{ testTypes: ClinicTestType[]; testPanels: ClinicTestPanel[] }> {
  const [testTypes, testPanels] = await Promise.all([
    deps.testTypeRepo.find({ where: { businessId, isActive: true } }),
    deps.testPanelRepo.find({ where: { businessId, isActive: true } }),
  ]);
  return { testTypes, testPanels };
}

function resolveParsedRequest(
  prompt: string,
  params: Record<string, unknown>,
  mode: 'create' | 'list',
): ParsedClinicTestOrderRequest | null {
  return mode === 'create'
    ? parseCreateTestOrderFromPrompt(prompt, params)
    : parseListTestOrdersFromPrompt(prompt, params);
}

export async function handleCreateTestOrderLogic(
  deps: ClinicTestOrderLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('create_test_order', 'Business not found.');
  }

  const nonClinicType = assertClinicTestOrderBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'create_test_order',
      'Lab test orders are only available for clinic vertical businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    resolveParsedRequest(effectivePrompt, params, 'create') ??
    parseCreateTestOrderFromPrompt(effectivePrompt, params);
  if (!parsed?.testNames?.length) {
    return clarify('create_test_order', 'Which lab tests should I order?', [
      'testNames',
    ]);
  }
  if (!parsed.bookingId && !parsed.customerName) {
    return clarify(
      'create_test_order',
      'Which patient visit should these lab orders be linked to?',
      ['customerName', 'bookingId'],
    );
  }

  const timeZone = business.timezone ?? 'UTC';
  const booking = await resolveBookingForClinicTestOrder(
    deps,
    businessId,
    parsed,
    effectivePrompt,
    timeZone,
  );
  if (!booking) {
    return failure(
      'create_test_order',
      'No matching confirmed visit was found for that patient and date.',
      {
        customerName: parsed.customerName ?? null,
        date: parsed.date ?? null,
      },
    );
  }

  const { testTypes, testPanels } = await loadCatalog(deps, businessId);
  const matched = parsed.testNames.map((label) => ({
    label,
    item: matchClinicCatalogItem({ label, testTypes, testPanels }),
  }));
  const unmatched = matched
    .filter((entry) => !entry.item)
    .map((entry) => entry.label);
  if (unmatched.length > 0) {
    return failure(
      'create_test_order',
      `Could not match catalog tests: ${unmatched.join(', ')}.`,
      { unmatchedTestNames: unmatched },
    );
  }

  const previewLabels = matched.map((entry) => entry.item!.label).join(', ');
  const patientLabel =
    booking.customer?.name ?? parsed.customerName ?? 'patient';
  if (!confirmed) {
    return success(
      'create_test_order',
      `Ready to order ${previewLabels} for ${patientLabel}'s visit on ${booking.startTime.toISOString()}. Confirm to create the lab order.`,
      {
        requiresConfirmation: true,
        bookingId: booking.id,
        customerName: patientLabel,
        testNames: matched.map((entry) => entry.label),
        displayNames: previewLabels,
      },
    );
  }

  await deps.clinicLabAccessService.assertCanCreateManualLabOrder(
    businessId,
    userId,
    booking.id,
  );

  const created =
    await deps.clinicTestOrderService.createCatalogOrderForBooking(
      businessId,
      booking.id,
      matched.map((entry) => ({
        type: entry.item!.type,
        testTypeId: entry.item!.type === 'test_type' ? entry.item!.id : null,
        testPanelId: entry.item!.type === 'test_panel' ? entry.item!.id : null,
        label: entry.item!.label,
      })),
    );

  return success(
    'create_test_order',
    `Created lab order ${created.displayNames ?? previewLabels} for ${patientLabel}.`,
    {
      orderId: created.id,
      bookingId: created.bookingId,
      status: created.status,
      displayNames: created.displayNames,
    },
  );
}

export async function handleListTestOrdersLogic(
  deps: ClinicTestOrderLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_test_orders', 'Business not found.');
  }

  const nonClinicType = assertClinicTestOrderBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_test_orders',
      'Lab test orders are only available for clinic vertical businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    resolveParsedRequest(effectivePrompt, params, 'list') ??
    parseListTestOrdersFromPrompt(effectivePrompt, params);

  if (parsed?.bookingId) {
    const orders = await deps.clinicTestOrderService.listOrdersForBooking(
      businessId,
      parsed.bookingId,
    );
    return success(
      'list_test_orders',
      orders.length
        ? `Found ${orders.length} lab order(s) for booking ${parsed.bookingId}.`
        : `No lab orders found for booking ${parsed.bookingId}.`,
      { orders, count: orders.length },
    );
  }

  const filters: ClinicLabQueueFilters = {};
  if (parsed?.status) filters.status = parsed.status;
  if (parsed?.dateFrom) filters.from = parsed.dateFrom;
  if (parsed?.dateTo) filters.to = parsed.dateTo;
  if (parsed?.awaitingPatientBooking) {
    filters.awaitingPatientBooking = true;
  }

  const timeZone = business.timezone ?? 'UTC';
  if (parsed?.customerName) {
    const booking = await resolveBookingForClinicTestOrder(
      deps,
      businessId,
      parsed,
      effectivePrompt,
      timeZone,
    );
    if (booking) {
      filters.customerId = booking.customerId;
      if (!filters.from && !filters.to) {
        const dayKey = booking.startTime.toISOString();
        filters.from = dayKey;
        filters.to = dayKey;
      }
    }
  }

  const scopedFilters = await deps.clinicLabAccessService.scopeLabQueueFilters(
    businessId,
    userId,
    filters,
  );
  const orders = await deps.clinicTestOrderService.listLabQueue(
    businessId,
    scopedFilters,
  );

  return success(
    'list_test_orders',
    orders.length
      ? `Found ${orders.length} lab order(s) matching your filters.`
      : 'No lab orders matched your filters.',
    { orders, count: orders.length, filters: scopedFilters },
  );
}
