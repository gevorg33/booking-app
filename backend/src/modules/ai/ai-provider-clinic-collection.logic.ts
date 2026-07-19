import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type {
  ClinicSpecimenListFilters,
  ClinicSpecimenQueueItem,
  ClinicSpecimenService,
} from '../clinic-test-results/specimen/clinic-specimen.service.js';
import type { ClinicSpecimenStatusService } from '../clinic-test-results/specimen/clinic-specimen-status.service.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assertProviderClinicCollectionBusinessType,
  formatProviderCollectionQueueSummary,
  formatSpecimenRecollectText,
  parseExplainSpecimenRecollectFromPrompt,
  parseListMyCollectionQueueFromPrompt,
  parseMarkSpecimenCollectedFromPrompt,
  resolveCollectionQueueDayBounds,
} from './ai-provider-clinic-collection.util.js';

export interface ProviderClinicCollectionLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  clinicSpecimenService: Pick<
    ClinicSpecimenService,
    'listSpecimens' | 'getSpecimenForBusiness'
  >;
  clinicSpecimenStatusService: Pick<
    ClinicSpecimenStatusService,
    'transitionSpecimenStatus'
  >;
  clinicLabAccessService: Pick<
    ClinicLabAccessService,
    'assertSpecimenLabAccess'
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

function resolveSessionEmployeeId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (typeof params.sessionEmployeeId === 'string'
      ? params.sessionEmployeeId
      : undefined) ??
    (typeof params.employeeId === 'string' ? params.employeeId : undefined)
  );
}

function matchCustomerName(
  items: ClinicSpecimenQueueItem[],
  customerName: string,
): ClinicSpecimenQueueItem[] {
  const needle = customerName.toLowerCase();
  return items.filter((item) =>
    (item.customerName ?? '').toLowerCase().includes(needle),
  );
}

export async function resolveSpecimenByIdOrCustomerName(
  deps: ProviderClinicCollectionLogicDeps,
  businessId: string,
  employeeId: string | undefined,
  parsed: { specimenId?: string; orderId?: string; customerName?: string },
  prompt: string,
  params: Record<string, unknown>,
): Promise<ClinicSpecimenQueueItem | null> {
  if (parsed.specimenId) {
    try {
      const specimen = await deps.clinicSpecimenService.getSpecimenForBusiness(
        businessId,
        parsed.specimenId,
      );
      return {
        id: specimen.id,
        status: specimen.status,
        specimenIdentifier: specimen.specimenIdentifier ?? null,
        orderId: specimen.orderId,
        orderDisplayNames: null,
        bookingId: specimen.bookingId ?? null,
        customerName: null,
        bookingStartTime: null,
        employeeName: null,
        department: null,
        collectedAt: specimen.collectedAt?.toISOString() ?? null,
        storageLocationName: null,
        transportFolderCode: null,
        createdAt: specimen.createdAt,
      };
    } catch {
      const listParsed =
        parseListMyCollectionQueueFromPrompt(prompt, params) ??
        parseListMyCollectionQueueFromPrompt('my collection queue today');
      const bounds = resolveCollectionQueueDayBounds(listParsed ?? {});
      const filters: ClinicSpecimenListFilters = {
        view: 'collection',
        from: bounds.from,
        to: bounds.to,
        ...(employeeId ? { employeeId } : {}),
      };
      const queue = await deps.clinicSpecimenService.listSpecimens(
        businessId,
        filters,
      );
      return (
        queue.find(
          (item) =>
            item.id === parsed.specimenId ||
            item.id.startsWith(parsed.specimenId ?? ''),
        ) ?? null
      );
    }
  }

  const listParsed =
    parseListMyCollectionQueueFromPrompt(prompt, params) ??
    parseListMyCollectionQueueFromPrompt('my collection queue today');
  const bounds = resolveCollectionQueueDayBounds(listParsed ?? {});
  const filters: ClinicSpecimenListFilters = {
    view: 'collection',
    from: bounds.from,
    to: bounds.to,
    ...(employeeId ? { employeeId } : {}),
  };
  const queue = await deps.clinicSpecimenService.listSpecimens(
    businessId,
    filters,
  );

  if (parsed.orderId) {
    const byOrder = queue.filter(
      (item) =>
        item.orderId === parsed.orderId ||
        item.orderId.startsWith(parsed.orderId ?? ''),
    );
    if (byOrder.length === 1) return byOrder[0];
    if (byOrder.length > 1) return null;
  }

  if (parsed.customerName) {
    const matches = matchCustomerName(queue, parsed.customerName);
    if (matches.length === 1) return matches[0];
  }

  return null;
}

export async function handleListMyCollectionQueueLogic(
  deps: ProviderClinicCollectionLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_my_collection_queue', 'Business not found.');
  }

  const nonClinicType = assertProviderClinicCollectionBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_my_collection_queue',
      'Specimen collection queue is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseListMyCollectionQueueFromPrompt(effectivePrompt, params) ??
    parseListMyCollectionQueueFromPrompt(effectivePrompt);
  if (!parsed) {
    return clarify(
      'list_my_collection_queue',
      'Which day should I show your collection queue for?',
      ['date'],
    );
  }

  const employeeId = resolveSessionEmployeeId(params);
  const bounds = resolveCollectionQueueDayBounds(parsed);
  const filters: ClinicSpecimenListFilters = {
    view: 'collection',
    from: bounds.from,
    to: bounds.to,
    ...(employeeId ? { employeeId } : {}),
  };

  const queue = await deps.clinicSpecimenService.listSpecimens(
    businessId,
    filters,
  );

  return success(
    'list_my_collection_queue',
    formatProviderCollectionQueueSummary(queue, bounds.label),
    {
      date: bounds.label,
      count: queue.length,
      specimens: queue,
      scopedEmployeeId: employeeId ?? null,
    },
  );
}

export async function handleMarkSpecimenCollectedLogic(
  deps: ProviderClinicCollectionLogicDeps,
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
    return failure('mark_specimen_collected', 'Business not found.');
  }

  const nonClinicType = assertProviderClinicCollectionBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'mark_specimen_collected',
      'Specimen collection is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseMarkSpecimenCollectedFromPrompt(effectivePrompt, params) ??
    parseMarkSpecimenCollectedFromPrompt(effectivePrompt);
  if (!parsed?.specimenId && !parsed?.orderId && !parsed?.customerName) {
    return clarify(
      'mark_specimen_collected',
      'Which specimen should I mark collected?',
      ['specimenId', 'customerName', 'orderId'],
    );
  }

  const employeeId = resolveSessionEmployeeId(params);
  const target = await resolveSpecimenByIdOrCustomerName(
    deps,
    businessId,
    employeeId,
    parsed,
    effectivePrompt,
    params,
  );
  if (!target) {
    return failure(
      'mark_specimen_collected',
      'No matching specimen was found on your collection queue.',
      {
        specimenId: parsed.specimenId ?? null,
        orderId: parsed.orderId ?? null,
        customerName: parsed.customerName ?? null,
      },
    );
  }

  try {
    const access = await deps.clinicLabAccessService.assertSpecimenLabAccess(
      businessId,
      userId,
      target.id,
    );
    const updated =
      await deps.clinicSpecimenStatusService.transitionSpecimenStatus({
        businessId,
        specimenId: target.id,
        toStatus: 'Collected',
        employeeId: access.employeeId,
        v1ShortPath: true,
      });

    const patient = target.customerName ?? parsed.customerName ?? 'the patient';
    return success(
      'mark_specimen_collected',
      `Marked specimen for ${patient} as collected.`,
      {
        specimenId: updated.id,
        status: updated.status,
        orderId: updated.orderId,
        customerName: target.customerName ?? parsed.customerName ?? null,
        collectedAt: updated.collectedAt?.toISOString() ?? null,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not mark the specimen collected.';
    return failure('mark_specimen_collected', message, {
      specimenId: target.id,
      customerName: target.customerName ?? parsed.customerName ?? null,
    });
  }
}

/** ai-cmd-provider-5.19.3 — why a specimen needs recollection, and what's next. */
export async function handleExplainSpecimenRecollectLogic(
  deps: ProviderClinicCollectionLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_specimen_recollect', 'Business not found.');
  }

  const nonClinicType = assertProviderClinicCollectionBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'explain_specimen_recollect',
      'Specimen recollection is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseExplainSpecimenRecollectFromPrompt(effectivePrompt, params) ??
    parseExplainSpecimenRecollectFromPrompt(effectivePrompt);
  if (!parsed?.specimenId && !parsed?.customerName) {
    return clarify(
      'explain_specimen_recollect',
      'Which specimen needs recollection? Specify the specimen id or the customer name.',
      ['specimenId', 'customerName'],
    );
  }

  const employeeId = resolveSessionEmployeeId(params);
  const target = await resolveSpecimenByIdOrCustomerName(
    deps,
    businessId,
    employeeId,
    parsed,
    effectivePrompt,
    params,
  );
  if (!target) {
    return failure(
      'explain_specimen_recollect',
      'No matching specimen was found.',
      {
        specimenId: parsed.specimenId ?? null,
        customerName: parsed.customerName ?? null,
      },
    );
  }

  const specimen = await deps.clinicSpecimenService.getSpecimenForBusiness(
    businessId,
    target.id,
  );

  const customerName = target.customerName ?? parsed.customerName ?? 'The patient';
  return success(
    'explain_specimen_recollect',
    formatSpecimenRecollectText(customerName, specimen),
    {
      specimenId: specimen.id,
      status: specimen.status,
      incompletionReason: specimen.incompletionReason ?? null,
      customerName: target.customerName ?? parsed.customerName ?? null,
    },
  );
}
