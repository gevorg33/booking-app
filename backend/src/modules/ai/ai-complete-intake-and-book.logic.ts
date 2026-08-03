import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';
import {
  assertCompleteIntakeAndBookBusinessType,
  buildCompleteIntakeAndBookNavigate,
  formatCompleteIntakeAndBookSummary,
  isCompleteIntakeAndBookCompoundPrompt,
  isCompleteIntakeAndBookCorePrompt,
  parseCompleteIntakeAndBookFromPrompt,
  resolveIntakeBookLabService,
} from './ai-complete-intake-and-book.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function readBusinessType(settings: unknown): string | null {
  const businessType = (settings as { businessType?: unknown } | null)
    ?.businessType;
  return typeof businessType === 'string' ? businessType : null;
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return typeof params.sessionCustomerId === 'string'
    ? params.sessionCustomerId
    : typeof params.customerId === 'string'
      ? params.customerId
      : undefined;
}

/** Compound step seed from intake_lab_book_pay / complete_intake_and_book decompose. */
function isSeededCompleteIntakeAndBookStep(
  params: Record<string, unknown>,
): boolean {
  const value = params.completeIntakeAndBook;
  return value === true || value === '1' || value === 1 || value === 'true';
}

export async function handleCompleteIntakeAndBookLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isCompleteIntakeAndBookCompoundPrompt(textPrompt)) {
    // e2e-bug.201 — intake_lab_book_pay intentionally fails
    // isCompleteIntakeAndBookCompoundPrompt when a payment cue is present so the
    // prompt routes to that compound. Step 1 still runs this handler with
    // completeIntakeAndBook seeded — accept core intake+lab book prompts.
    const seeded = isSeededCompleteIntakeAndBookStep(params);
    if (!(seeded && isCompleteIntakeAndBookCorePrompt(textPrompt))) {
      return failure(
        'complete_intake_and_book',
        'Ask to fill the pre-visit intake and book a lab test (e.g. "Fill intake and book blood draw").',
        { clarify: true },
      );
    }
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'complete_intake_and_book',
      'Sign in to complete the pre-visit intake and book your lab test.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('complete_intake_and_book', 'Business not found.');
  }

  const businessType = readBusinessType(business.settings);
  const nonClinicType = assertCompleteIntakeAndBookBusinessType(businessType);
  if (nonClinicType !== null) {
    return failure(
      'complete_intake_and_book',
      'Pre-visit intake booking is only available for clinic vertical businesses.',
      { businessType: nonClinicType },
    );
  }

  const parsed = parseCompleteIntakeAndBookFromPrompt(textPrompt, params);
  const services = await deps.serviceService.findAll(businessId);
  const service = resolveIntakeBookLabService(
    services.map((entry) => ({
      id: entry.id,
      name: entry.name,
      metadata: entry.metadata,
    })),
    parsed?.serviceName,
  );

  if (!service) {
    return failure(
      'complete_intake_and_book',
      parsed?.serviceName
        ? `No lab test offering pre-visit intake matches "${parsed.serviceName}".`
        : 'No lab test with pre-visit intake is available to book.',
      { clarify: true, serviceName: parsed?.serviceName },
    );
  }

  const bookingFirstAvailable = parsed?.bookingFirstAvailable === true;
  const navigate = buildCompleteIntakeAndBookNavigate(service.id);

  let intakeId: string;
  let intakeStatus: string | undefined;
  try {
    const draft = await deps.publicPreVisitIntakeService.ensureCustomerDraft(
      business.slug,
      customerId,
      { serviceId: service.id },
    );
    intakeId = draft.id;
    intakeStatus = draft.status;
  } catch (err: unknown) {
    // e2e-bug.98 — never report success when the draft was not persisted.
    // Surface the real precondition failure (e.g. no published questionnaire).
    const message =
      err instanceof Error && err.message.trim()
        ? err.message
        : 'Could not start the pre-visit intake for this lab test.';
    return failure('complete_intake_and_book', message, {
      clarify: true,
      draftFailed: true,
      serviceId: service.id,
      serviceName: service.name,
      // Client may still open the booking page to retry once intake is configured.
      navigate,
    });
  }

  const summary = formatCompleteIntakeAndBookSummary(
    service.name,
    bookingFirstAvailable,
  );

  return success('complete_intake_and_book', summary, {
    serviceId: service.id,
    serviceName: service.name,
    preVisitIntakeRequired: true,
    bookingPhase: 'intake',
    completeIntakeAndBook: true,
    bookingFirstAvailable,
    clientAction: 'startConsumerPreVisitIntake',
    navigate,
    intakeId,
    intakeStatus,
    sessionContext: {
      serviceId: service.id,
      serviceName: service.name,
      bookingPhase: 'intake',
      completeIntakeAndBook: true,
      preVisitIntakeRequired: true,
      intakeId,
      ...(bookingFirstAvailable ? { bookingFirstAvailable: true } : {}),
    },
  });
}
