import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import {
  assertConsumerClinicTestResultsBusinessType,
  resolveSessionCustomerId,
} from './ai-consumer-clinic-test-results.util.js';
import {
  buildListMyDocumentsNavigate,
  formatReleasedDocumentsSummary,
  parseListMyDocumentsFromPrompt,
} from './ai-list-my-documents.util.js';

export interface ListMyDocumentsLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  patientDocumentsService: Pick<
    PatientDocumentsService,
    'listReleasedDocumentsForCustomerAccount'
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

export async function handleListMyDocumentsLogic(
  deps: ListMyDocumentsLogicDeps,
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
    return failure('list_my_documents', 'Business not found.');
  }

  const nonClinicType = assertConsumerClinicTestResultsBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_my_documents',
      'Clinic documents are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'list_my_documents',
      'Sign in to view your clinic documents in My Results.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed =
    parseListMyDocumentsFromPrompt(effectivePrompt, params) ??
    parseListMyDocumentsFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'list_my_documents',
      'Tell me which documents you want to see (e.g. "Show my referral letter" or "List my imaging reports").',
      { clarify: true },
    );
  }

  try {
    const documents =
      await deps.patientDocumentsService.listReleasedDocumentsForCustomerAccount(
        businessId,
        customerId,
        customerId,
        parsed.category ?? null,
      );

    let filtered = documents;
    if (parsed.title) {
      const needle = parsed.title.toLowerCase();
      filtered = documents.filter(
        (document) =>
          document.title?.toLowerCase().includes(needle) ||
          document.originalFileName?.toLowerCase().includes(needle),
      );
    }

    return success(
      'list_my_documents',
      formatReleasedDocumentsSummary(filtered, {
        category: parsed.category,
        title: parsed.title,
        locale,
      }),
      {
        customerId,
        count: filtered.length,
        documents: filtered,
        category: parsed.category ?? null,
        title: parsed.title ?? null,
        myDocumentsSection: true,
        navigate: buildListMyDocumentsNavigate(parsed.category),
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load your clinic documents.';
    return failure('list_my_documents', message, { customerId });
  }
}
