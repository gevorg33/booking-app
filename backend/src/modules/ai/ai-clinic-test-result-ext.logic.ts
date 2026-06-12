import type { Repository } from 'typeorm';
import { BookingStatus, type Booking } from '../booking/entities/booking.entity.js';
import type { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import type { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractOrderIdFromPrompt,
  extractReleaseCustomerNameFromPrompt,
} from './ai-clinic-test-result.util.js';
import { extractVisitCustomerNameFromPrompt } from './ai-clinic-test-order.util.js';

export interface ClinicTestResultExtLogicDeps {
  bookingRepo: Pick<Repository<Booking>, 'find'>;
  resultRepo: Repository<ClinicTestResult>;
  clinicTestResultService: ClinicTestResultService;
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

export async function handleUploadPatientResultLogic(
  _deps: ClinicTestResultExtLogicDeps,
  _businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
): Promise<CommandResult> {
  const orderId =
    (typeof params.orderId === 'string' && params.orderId) ||
    extractOrderIdFromPrompt(prompt ?? '');
  if (!orderId) {
    return failure(
      'upload_patient_result',
      'Specify the lab order (orderId) to upload a result file — e.g. "upload result for order #abc".',
    );
  }
  return failure(
    'upload_patient_result',
    `File upload for order ${orderId} must be completed in the lab results UI — attach the document there, then use enter_test_result for values.`,
  );
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
    customerId = await resolveCustomerIdByName(
      deps,
      businessId,
      customerName,
    );
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
  const low =
    typeof params.normalLow === 'string'
      ? params.normalLow
      : typeof params.normalLow === 'number'
        ? String(params.normalLow)
        : undefined;
  const high =
    typeof params.normalHigh === 'string'
      ? params.normalHigh
      : typeof params.normalHigh === 'number'
        ? String(params.normalHigh)
        : undefined;
  const rangeHint =
    low && high ? ` (${low}–${high})` : low || high ? ` (${low ?? ''}–${high ?? ''})` : '';
  return failure(
    'configure_test_reference_range',
    `Reference range updates for ${measurementCode}${rangeHint} are configured in Lab catalog settings — use the measurement editor to set normal low/high.`,
  );
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
    { count: abnormal.length, entries: shown, customerName: customerName || undefined },
  );
}
