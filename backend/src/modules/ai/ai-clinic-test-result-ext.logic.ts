import type { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import {
  buildClinicLabResultUploadHandoff,
  buildClinicLabResultUploadNavigate,
} from '../../common/utils/clinic-lab-upload-nav.util.js';
import type { ClinicTestCatalogService } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import type { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import type { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import { formatClinicTestTypeReferenceRange } from '../clinic-test-results/catalog/clinic-test-catalog.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractOrderIdFromPrompt,
  extractReleaseCustomerNameFromPrompt,
  orderIdMatches,
} from './ai-clinic-test-result.util.js';
import { extractVisitCustomerNameFromPrompt } from './ai-clinic-test-order.util.js';

export interface ClinicTestResultExtLogicDeps {
  bookingRepo: Pick<Repository<Booking>, 'find'>;
  resultRepo: Repository<ClinicTestResult>;
  orderRepo: Pick<Repository<ClinicTestOrder>, 'find' | 'findOne'>;
  clinicTestResultService: ClinicTestResultService;
  clinicCatalogService: Pick<
    ClinicTestCatalogService,
    'updateReferenceRangeByCode'
  >;
  clinicLabAccessService: Pick<ClinicLabAccessService, 'resolveStaffContext'>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(action: string, summary: string): CommandResult {
  return { success: false, action, summary, details: {} };
}

async function resolveCustomerIdByName(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  customerName: string,
): Promise<string | undefined> {
  const bookings = await deps.bookingRepo.find({
    where: { businessId },
    relations: { customer: true },
    order: { startTime: 'DESC' },
    take: 100,
  });
  const needle = customerName.toLowerCase();
  const booking = bookings.find(
    (row) =>
      row.status !== BookingStatus.CANCELLED &&
      row.customer?.name?.toLowerCase().includes(needle),
  );
  return booking?.customerId;
}

async function resolveClinicTestOrderForUpload(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  orderIdHint: string,
): Promise<ClinicTestOrder | null> {
  const trimmed = orderIdHint.trim();
  if (!trimmed) return null;

  const exact = await deps.orderRepo.findOne({
    where: { id: trimmed, businessId },
  });
  if (exact) return exact;

  const recent = await deps.orderRepo.find({
    where: { businessId },
    order: { createdAt: 'DESC' },
    take: 100,
  });
  return recent.find((row) => orderIdMatches(row.id, trimmed)) ?? null;
}

export async function handleUploadPatientResultLogic(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
): Promise<CommandResult> {
  const orderIdHint =
    (typeof params.orderId === 'string' && params.orderId.trim()) ||
    extractOrderIdFromPrompt(prompt ?? '') ||
    undefined;
  if (!orderIdHint) {
    return failure(
      'upload_patient_result',
      'Specify the lab order (orderId) to upload a result file — e.g. "upload result for order #abc".',
    );
  }

  const order = await resolveClinicTestOrderForUpload(
    deps,
    businessId,
    orderIdHint,
  );
  const resolvedOrderId = order?.id ?? orderIdHint.trim();
  const navigate = buildClinicLabResultUploadNavigate({
    orderId: resolvedOrderId,
    bookingId: order?.bookingId ?? null,
  });
  const uploadHandoff = buildClinicLabResultUploadHandoff(businessId, {
    orderId: resolvedOrderId,
    bookingId: order?.bookingId ?? null,
  });

  const summary = order?.bookingId
    ? `Opening lab results for order ${resolvedOrderId} — attach your result file in the booking panel. Use enter_test_result to type values manually.`
    : `Opening the lab queue for order ${resolvedOrderId} — attach your result file there. Use enter_test_result to type values manually.`;

  return success('upload_patient_result', summary, {
    orderId: resolvedOrderId,
    orderIdHint,
    bookingId: order?.bookingId ?? undefined,
    navigate,
    uploadHandoff,
  });
}

export async function handleExplainPatientResultsLogic(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
): Promise<CommandResult> {
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()) ||
    extractReleaseCustomerNameFromPrompt(prompt ?? '') ||
    extractVisitCustomerNameFromPrompt(prompt ?? '') ||
    undefined;
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()) ||
    extractOrderIdFromPrompt(prompt ?? '') ||
    undefined;

  if (!customerName && !orderId) {
    return failure(
      'explain_patient_results',
      'Please specify the patient name (customerName) or orderId to explain lab results.',
    );
  }

  let customerId: string | undefined;
  if (customerName) {
    customerId = await resolveCustomerIdByName(deps, businessId, customerName);
  }

  const results = await deps.resultRepo.find({
    where: customerId
      ? { businessId, customerId }
      : orderId
        ? { businessId, orderId }
        : { businessId },
    relations: { measurements: { testType: true } },
    order: { updatedAt: 'DESC' },
    take: 20,
  });
  const released = results.filter((r) => r.status === 'Released');
  if (released.length === 0) {
    const label = customerName ?? `order ${orderId}`;
    return success(
      'explain_patient_results',
      `No released lab results found for ${label} yet.`,
      { customerName, orderId, count: 0 },
    );
  }

  const lines = released.slice(0, 5).map((r) => {
    const flags =
      r.measurements
        ?.map(
          (m) =>
            `${m.testType?.code ?? 'measurement'}: ${m.value ?? '—'}${m.measurementFlag ? ` [${m.measurementFlag}]` : ''}`,
        )
        .join('; ') || 'values recorded';
    return `• Order ${r.orderId ?? r.id}: ${flags}`;
  });

  return success(
    'explain_patient_results',
    `Released results for ${customerName ?? `order ${orderId}`}:\n${lines.join('\n')}`,
    {
      customerName,
      orderId,
      resultIds: released.slice(0, 5).map((r) => r.id),
    },
  );
}

export async function handleConfigureTestReferenceRangeLogic(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const measurementCode =
    typeof params.measurementCode === 'string'
      ? params.measurementCode.trim()
      : undefined;
  if (!measurementCode) {
    return failure(
      'configure_test_reference_range',
      'Specify measurementCode (e.g. WBC, glucose) and normal low/high values.',
    );
  }

  const normalLow = params.normalLow;
  const normalHigh = params.normalHigh;
  if (normalLow == null && normalHigh == null) {
    return failure(
      'configure_test_reference_range',
      'Specify normalLow and normalHigh reference range bounds.',
    );
  }

  let role: string;
  try {
    const ctx = await deps.clinicLabAccessService.resolveStaffContext(
      businessId,
      userId,
    );
    role = ctx.membershipRole;
  } catch {
    return failure(
      'configure_test_reference_range',
      'You must be a business member to configure lab reference ranges.',
    );
  }

  try {
    const updated = await deps.clinicCatalogService.updateReferenceRangeByCode(
      businessId,
      measurementCode,
      normalLow,
      normalHigh,
      role,
    );
    const rangeLabel = formatClinicTestTypeReferenceRange(
      updated.normalLow,
      updated.normalHigh,
    );
    return success(
      'configure_test_reference_range',
      `Reference range for ${updated.code} set to ${rangeLabel}.`,
      {
        measurementCode: updated.code,
        normalLow: updated.normalLow,
        normalHigh: updated.normalHigh,
        testTypeId: updated.id,
      },
    );
  } catch (error) {
    if (error instanceof NotFoundException) {
      return failure(
        'configure_test_reference_range',
        `No lab test type found for measurement code "${measurementCode}". Add it in the lab catalog first.`,
      );
    }
    if (error instanceof BadRequestException) {
      const message =
        typeof error.message === 'string'
          ? error.message
          : 'Could not update reference range.';
      return failure('configure_test_reference_range', message);
    }
    throw error;
  }
}

export async function handleListAbnormalResultsLogic(
  deps: ClinicTestResultExtLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const limit = typeof params.limit === 'number' ? params.limit : 10;
  let customerId: string | undefined;
  const customerName =
    typeof params.customerName === 'string' ? params.customerName.trim() : '';
  if (customerName) {
    customerId = await resolveCustomerIdByName(deps, businessId, customerName);
  }

  const results = await deps.resultRepo.find({
    where: customerId ? { businessId, customerId } : { businessId },
    relations: { measurements: { testType: true } },
    order: { updatedAt: 'DESC' },
    take: 50,
  });

  const abnormal = results.flatMap((result) =>
    (result.measurements ?? [])
      .filter((m) => m.measurementFlag && m.measurementFlag !== 'Normal')
      .map((m) => ({
        resultId: result.id,
        orderId: result.orderId,
        measurementCode: m.testType?.code ?? m.testTypeId,
        value: m.value,
        flag: m.measurementFlag,
      })),
  );

  if (abnormal.length === 0) {
    const scope = customerName ? ` for ${customerName}` : '';
    return success(
      'list_abnormal_results',
      `No abnormal measurements flagged in recent lab results${scope}.`,
      { count: 0, entries: [], customerName: customerName || undefined },
    );
  }

  const shown = abnormal.slice(0, limit);
  const lines = shown.map(
    (e) =>
      `• ${e.measurementCode} ${e.value} [${e.flag}] (order ${e.orderId ?? e.resultId})`,
  );
  return success(
    'list_abnormal_results',
    `Abnormal results (${abnormal.length}):\n${lines.join('\n')}`,
    {
      count: abnormal.length,
      entries: shown,
      customerName: customerName || undefined,
    },
  );
}
