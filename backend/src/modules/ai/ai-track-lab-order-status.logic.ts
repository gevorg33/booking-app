import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import {
  assertConsumerClinicTestResultsBusinessType,
  resolveSessionCustomerId,
} from './ai-consumer-clinic-test-results.util.js';
import {
  formatLabOrderTrackingSummary,
  parseTrackLabOrderStatusFromPrompt,
} from './ai-track-lab-order-status.util.js';

export interface TrackLabOrderStatusLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  clinicTestResultsService: Pick<
    ClinicTestResultsService,
    'listCustomerResultsForTracking'
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

export async function handleTrackLabOrderStatusLogic(
  deps: TrackLabOrderStatusLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const locale = resolveLocale(
    typeof params.locale === 'string' ? params.locale : null,
    'en',
  );

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('track_lab_order_status', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'track_lab_order_status',
      'Lab order tracking is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'track_lab_order_status',
      'Sign in to track your lab orders and results.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed =
    parseTrackLabOrderStatusFromPrompt(effectivePrompt, params) ??
    parseTrackLabOrderStatusFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'track_lab_order_status',
      'Tell me which lab order or result you want to track.',
      { clarify: true },
    );
  }

  try {
    const results =
      await deps.clinicTestResultsService.listCustomerResultsForTracking(
        businessId,
        customerId,
      );
    const readyCount = results.filter(
      (result) => result.status === 'Released',
    ).length;
    const inProgressCount = results.length - readyCount;

    return success(
      'track_lab_order_status',
      formatLabOrderTrackingSummary(results, parsed.testName, locale),
      {
        customerId,
        count: results.length,
        readyCount,
        inProgressCount,
        results,
        testName: parsed.testName ?? null,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load your lab order status.';
    return failure('track_lab_order_status', message, { customerId });
  }
}
