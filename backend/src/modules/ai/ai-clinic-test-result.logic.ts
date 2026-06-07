import type { Repository } from 'typeorm';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { ClinicTestResultActionService } from '../clinic-test-results/test-result/clinic-test-result-action.service.js';
import type { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assertClinicTestResultBusinessType,
  parseEnterTestResultFromPrompt,
  parseReleaseTestResultFromPrompt,
  resolveReleaseCandidates,
} from './ai-clinic-test-result.util.js';

export interface ClinicTestResultLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  bookingRepo: Pick<Repository<Booking>, 'find' | 'findOne'>;
  resultRepo: Pick<Repository<ClinicTestResult>, 'find' | 'findOne'>;
  clinicTestResultService: Pick<
    ClinicTestResultService,
    'enterManualMeasurement'
  >;
  clinicTestResultActionService: Pick<
    ClinicTestResultActionService,
    'markAsReleased'
  >;
  clinicLabAccessService: Pick<ClinicLabAccessService, 'assertResultLabAccess'>;
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

export async function handleEnterTestResultLogic(
  deps: ClinicTestResultLogicDeps,
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
    return failure('enter_test_result', 'Business not found.');
  }

  const nonClinicType = assertClinicTestResultBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'enter_test_result',
      'Lab result entry is only available for clinic vertical businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseEnterTestResultFromPrompt(effectivePrompt, params) ??
    parseEnterTestResultFromPrompt(effectivePrompt);
  if (!parsed?.measurementCode || !parsed.value) {
    return clarify(
      'enter_test_result',
      'Which measurement and value should I record?',
      ['measurementCode', 'value'],
    );
  }
  if (!parsed.orderId && !parsed.resultId) {
    return clarify(
      'enter_test_result',
      'Which lab order or result should this value be recorded on?',
      ['orderId', 'resultId'],
    );
  }

  if (!confirmed) {
    const targetLabel = parsed.resultId
      ? `result ${parsed.resultId}`
      : `order ${parsed.orderId}`;
    return success(
      'enter_test_result',
      `Ready to record ${parsed.measurementCode} ${parsed.value} on ${targetLabel}. Confirm to save the lab value.`,
      {
        requiresConfirmation: true,
        measurementCode: parsed.measurementCode,
        value: parsed.value,
        orderId: parsed.orderId ?? null,
        resultId: parsed.resultId ?? null,
      },
    );
  }

  try {
    let resultId = parsed.resultId;
    if (!resultId && parsed.orderId) {
      const linked = await deps.resultRepo.find({
        where: { businessId },
        select: { id: true, orderId: true },
        take: 100,
      });
      resultId = linked.find(
        (row) => row.orderId && row.orderId.includes(parsed.orderId ?? ''),
      )?.id;
    }
    if (!resultId) {
      return failure(
        'enter_test_result',
        'No lab result was found for that order.',
        { orderId: parsed.orderId ?? null },
      );
    }

    const access = await deps.clinicLabAccessService.assertResultLabAccess(
      businessId,
      userId,
      resultId,
    );

    const saved = await deps.clinicTestResultService.enterManualMeasurement({
      businessId,
      measurementCode: parsed.measurementCode,
      value: parsed.value,
      orderId: parsed.orderId,
      resultId,
      employeeId: access.ctx.employeeId,
      staff: {
        userId: access.ctx.userId,
        role: String(access.ctx.membershipRole),
        employeeId: access.ctx.employeeId,
      },
    });

    return success(
      'enter_test_result',
      `Recorded ${parsed.measurementCode} ${parsed.value} on the lab result.`,
      {
        resultId: saved.result.id,
        orderId: saved.result.orderId,
        status: saved.result.status,
        measurementId: saved.measurement.id,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not record lab value.';
    return failure('enter_test_result', message, {
      measurementCode: parsed.measurementCode,
      value: parsed.value,
      orderId: parsed.orderId ?? null,
      resultId: parsed.resultId ?? null,
    });
  }
}

export async function handleReleaseTestResultLogic(
  deps: ClinicTestResultLogicDeps,
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
    return failure('release_test_result', 'Business not found.');
  }

  const nonClinicType = assertClinicTestResultBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'release_test_result',
      'Lab result release is only available for clinic vertical businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseReleaseTestResultFromPrompt(effectivePrompt, params) ??
    parseReleaseTestResultFromPrompt(effectivePrompt);
  if (!parsed?.orderId && !parsed?.resultId && !parsed?.customerName) {
    return clarify(
      'release_test_result',
      'Which patient or lab result should I release to the chart?',
      ['customerName', 'orderId', 'resultId'],
    );
  }

  const candidates = await resolveReleaseCandidates(
    deps,
    businessId,
    parsed ?? {},
  );

  if (candidates.length === 0) {
    return failure(
      'release_test_result',
      'No reviewed lab results matched your request.',
      {
        customerName: parsed?.customerName ?? null,
        orderId: parsed?.orderId ?? null,
        resultId: parsed?.resultId ?? null,
      },
    );
  }

  if (candidates.length > 1 && !parsed?.resultId && !confirmed) {
    return clarify(
      'release_test_result',
      `Found ${candidates.length} reviewed results. Specify an order or result id, or confirm to release the most recent match.`,
      ['resultId', 'orderId'],
      {
        candidateResultIds: candidates.slice(0, 5).map((row) => row.id),
      },
    );
  }

  const target = candidates[0];

  if (!confirmed) {
    return success(
      'release_test_result',
      `Ready to release lab result ${target.id} to the patient chart. Confirm to release.`,
      {
        requiresConfirmation: true,
        resultId: target.id,
        orderId: target.orderId,
        status: target.status,
      },
    );
  }

  try {
    const access = await deps.clinicLabAccessService.assertResultLabAccess(
      businessId,
      userId,
      target.id,
    );
    const released = await deps.clinicTestResultActionService.markAsReleased({
      businessId,
      resultId: target.id,
      employeeId: access.ctx.employeeId,
      comment: parsed?.customerName
        ? `Released to ${parsed.customerName} via AI command`
        : 'Released via AI command',
    });

    return success(
      'release_test_result',
      `Released lab result ${released.id} to the patient chart.`,
      {
        resultId: released.id,
        orderId: released.orderId,
        status: released.status,
        releasedAt: released.releasedAt?.toISOString() ?? null,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not release lab result.';
    return failure('release_test_result', message, {
      resultId: target.id,
    });
  }
}
