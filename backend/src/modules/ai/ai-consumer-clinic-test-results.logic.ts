import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import {
  assertConsumerClinicTestResultsBusinessType,
  formatGeneralResultPipelineExplanation,
  formatPatientResultStatusExplanation,
  formatReleasedResultsSummary,
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  resolveSessionCustomerId,
} from './ai-consumer-clinic-test-results.util.js';

export interface ConsumerClinicTestResultsLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  clinicTestResultsService: Pick<
    ClinicTestResultsService,
    'listReleasedResultsForCustomer' | 'listCustomerResultsForTracking'
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

export async function handleListMyTestResultsLogic(
  deps: ConsumerClinicTestResultsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_my_test_results', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_my_test_results',
      'Lab results are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'list_my_test_results',
      'Sign in to view your lab results in My Results.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed =
    parseListMyTestResultsFromPrompt(effectivePrompt, params) ??
    parseListMyTestResultsFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'list_my_test_results',
      'Tell me which lab results you want to see.',
      { clarify: true },
    );
  }

  try {
    const results =
      await deps.clinicTestResultsService.listReleasedResultsForCustomer(
        businessId,
        customerId,
      );
    return success(
      'list_my_test_results',
      formatReleasedResultsSummary(results, parsed.testName),
      {
        customerId,
        count: results.length,
        results,
        testName: parsed.testName ?? null,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load your lab results.';
    return failure('list_my_test_results', message, { customerId });
  }
}

export async function handleExplainResultStatusLogic(
  deps: ConsumerClinicTestResultsLogicDeps,
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
    return failure('explain_result_status', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'explain_result_status',
      'Lab result status help is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseExplainResultStatusFromPrompt(effectivePrompt, params) ??
    parseExplainResultStatusFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'explain_result_status',
      'Which lab result status should I explain?',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);

  if (parsed.status) {
    return success(
      'explain_result_status',
      formatPatientResultStatusExplanation(parsed.status, locale),
      {
        status: parsed.status,
        testName: parsed.testName ?? null,
        customerId: customerId ?? null,
      },
    );
  }

  if (customerId && parsed.testName) {
    try {
      const results =
        await deps.clinicTestResultsService.listReleasedResultsForCustomer(
          businessId,
          customerId,
        );
      const match = results.find((result) =>
        (result.testName ?? '')
          .toLowerCase()
          .includes(parsed.testName!.toLowerCase()),
      );
      if (match) {
        return success(
          'explain_result_status',
          `${match.testName ?? 'Your test'} is Released and available in My Results${match.releasedAt ? ` since ${match.releasedAt.slice(0, 10)}` : ''}.`,
          {
            resultId: match.id,
            status: match.status,
            testName: match.testName,
            customerId,
          },
        );
      }
      return success(
        'explain_result_status',
        `Your ${parsed.testName} result is not in My Results yet. ${formatGeneralResultPipelineExplanation()}`,
        {
          testName: parsed.testName,
          customerId,
          pendingRelease: true,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not check your result status.';
      return failure('explain_result_status', message, {
        testName: parsed.testName,
        customerId,
      });
    }
  }

  return success(
    'explain_result_status',
    formatGeneralResultPipelineExplanation(),
    {
      general: true,
      testName: parsed.testName ?? null,
      customerId: customerId ?? null,
    },
  );
}
