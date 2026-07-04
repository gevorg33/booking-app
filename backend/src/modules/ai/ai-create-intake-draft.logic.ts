import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';
import { resolveIntakeBookLabService } from './ai-complete-intake-and-book.util.js';

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
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

async function resolveBusinessSlug(
  deps: ClinicBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

export async function handleCreateIntakeDraftLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'create_intake_draft',
      'Sign in to start your pre-visit intake.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('create_intake_draft', 'Business not found.');

  let serviceId = params.serviceId as string | undefined;
  let serviceName: string | undefined;
  if (!serviceId) {
    const name = (params.serviceName as string | undefined)?.trim();
    const services = await deps.serviceService.findAll(businessId);
    const service = resolveIntakeBookLabService(
      services.map((entry) => ({
        id: entry.id,
        name: entry.name,
        metadata: entry.metadata,
      })),
      name,
    );
    if (!service) {
      return failure(
        'create_intake_draft',
        name
          ? `No lab test offering pre-visit intake matches "${name}".`
          : 'Which lab test would you like to complete intake for?',
        { clarify: true, missing: ['serviceName'] },
      );
    }
    serviceId = service.id;
    serviceName = service.name;
  }

  try {
    const draft = await deps.publicPreVisitIntakeService.ensureCustomerDraft(
      slug,
      customerId,
      {
        serviceId,
        questionnaireId: params.questionnaireId as string | undefined,
      },
    );
    return success(
      'create_intake_draft',
      `Pre-visit intake started for "${draft.questionnaire.title}" — ${draft.status}.`,
      {
        intakeId: draft.id,
        status: draft.status,
        questionnaireId: draft.questionnaireId,
        serviceId,
        serviceName,
        sessionContext: { intakeId: draft.id, serviceId, serviceName },
      },
    );
  } catch (err: any) {
    return failure(
      'create_intake_draft',
      err?.message ?? 'Could not start pre-visit intake for this service.',
      { serviceId, reason: 'draft_failed' },
    );
  }
}
