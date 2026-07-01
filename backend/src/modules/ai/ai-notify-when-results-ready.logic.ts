import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assertConsumerClinicTestResultsBusinessType,
  resolveSessionCustomerId,
} from './ai-consumer-clinic-test-results.util.js';
import {
  assembleNotifyWhenResultsReadySummary,
  buildNotifyWhenResultsReadyNavigate,
  parseNotifyWhenResultsReadyFromPrompt,
} from './ai-notify-when-results-ready.util.js';

export interface NotifyWhenResultsReadyLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
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

export async function handleNotifyWhenResultsReadyLogic(
  deps: NotifyWhenResultsReadyLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('notify_when_results_ready', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'notify_when_results_ready',
      'Lab result notifications are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseNotifyWhenResultsReadyFromPrompt(effectivePrompt, params) ??
    parseNotifyWhenResultsReadyFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'notify_when_results_ready',
      'Ask how result-ready notifications work (e.g. "Text me when results are ready" or "How do I get notified when my lab results are released?").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  const summary = assembleNotifyWhenResultsReadySummary(parsed);
  const navigate = buildNotifyWhenResultsReadyNavigate(parsed.channel);

  return success('notify_when_results_ready', summary, {
    aspect: parsed.aspect,
    channel: parsed.channel ?? null,
    testName: parsed.testName ?? null,
    customerId: customerId ?? null,
    readOnlyExplain: true,
    resultReadyNotificationFaq: true,
    navigate,
  });
}
