import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import {
  assertConsumerClinicTestResultsBusinessType,
  resolveSessionCustomerId,
} from './ai-consumer-clinic-test-results.util.js';
import {
  assembleAbnormalResultFlagSummary,
  buildExplainAbnormalResultFlagNavigate,
  parseExplainAbnormalResultFlagFromPrompt,
} from './ai-explain-abnormal-result-flag.util.js';

export interface ExplainAbnormalResultFlagLogicDeps {
  businessRepo: EntityReader<Business>;
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

export async function handleExplainAbnormalResultFlagLogic(
  deps: ExplainAbnormalResultFlagLogicDeps,
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
    return failure('explain_abnormal_result_flag', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'explain_abnormal_result_flag',
      'Lab measurement flag help is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseExplainAbnormalResultFlagFromPrompt(effectivePrompt, params) ??
    parseExplainAbnormalResultFlagFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'explain_abnormal_result_flag',
      'Ask about a lab measurement flag (e.g. "What does High mean on my CBC?" or "Is abnormal serious?").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  const summary = assembleAbnormalResultFlagSummary(parsed, locale);
  const navigate = buildExplainAbnormalResultFlagNavigate(parsed.testName);

  return success('explain_abnormal_result_flag', summary, {
    aspect: parsed.aspect,
    flag: parsed.flag ?? null,
    testName: parsed.testName ?? null,
    customerId: customerId ?? null,
    measurementFlagFaq: true,
    notMedicalAdvice: true,
    ...(navigate ? { navigate } : {}),
  });
}
