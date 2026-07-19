import type { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface OpenClinicDocumentLogicDeps {
  patientDocumentsService: Pick<
    PatientDocumentsService,
    'getReleasedDocumentForCustomerAccount'
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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleOpenClinicDocumentLogic(
  deps: OpenClinicDocumentLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'open_clinic_document',
      'Sign in to open your clinic document.',
      { clarify: true },
    );
  }

  const documentId =
    typeof params.documentId === 'string' ? params.documentId.trim() : '';
  if (!documentId) {
    return failure(
      'open_clinic_document',
      'Specify which document you want to open.',
      { clarify: true, missing: ['documentId'] },
    );
  }

  try {
    const document =
      await deps.patientDocumentsService.getReleasedDocumentForCustomerAccount(
        businessId,
        customerId,
        documentId,
        customerId,
      );
    return success(
      'open_clinic_document',
      `${document.title ?? document.originalFileName ?? 'Document'} is ready to view.`,
      {
        document,
        navigate: {
          path: '/results',
          query: { section: 'my-documents', documentId },
        },
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not open this document.';
    return failure('open_clinic_document', message, { documentId });
  }
}
