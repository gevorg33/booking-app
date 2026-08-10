import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ServiceService } from '../service/service.service.js';
import type { PublicPreVisitIntakeService } from '../public-booking/public-pre-visit-intake.service.js';
import {
  clinicLabTestOffersPreVisitIntake,
  isClinicLabTestService,
} from '../../common/utils/clinic-public-pre-visit-intake.util.js';
import {
  clinicServiceAcceptsPatientNotes,
  extractClinicMetadata,
  isClinicService,
  isClinicVerticalBusinessType,
} from '../../common/utils/clinic-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainClinicBookingFromPrompt,
  type ClinicBookingAspect,
  type ParsedExplainClinicBooking,
} from './ai-clinic-booking.util.js';
import { matchServiceByNameLegacy } from './ai-legacy-service-match.util.js';

export interface ClinicBookingLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  serviceService: Pick<ServiceService, 'findAll'>;
  publicPreVisitIntakeService: Pick<
    PublicPreVisitIntakeService,
    | 'ensureCustomerDraft'
    | 'getCustomerFlow'
    | 'startCustomerIntake'
    | 'submitCustomerAnswers'
    | 'getCheckoutConfig'
  >;
}

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

const FIELD_EXPLANATIONS: Record<
  Exclude<ClinicBookingAspect, 'all'>,
  string
> = {
  symptoms:
    'The optional "Symptoms or reason for visit" field lets you briefly tell the clinic why you are booking. Enter it on the checkout form—not in this chat when HIPAA mode is on.',
  referralNotes:
    'The optional "Referral notes" field is for your referring doctor’s name or prior test context. Fill it on the checkout form before you confirm.',
  preparation:
    'Lab services may show fasting or preparation instructions on checkout. Follow any amber prep banner and arrive prepared for collection.',
  preVisitIntake:
    'Some lab services include a signed-in pre-visit intake questionnaire before checkout. It collects structured answers to help the clinic prepare.',
};

function buildGenericAspectSummary(aspect: ClinicBookingAspect): string {
  if (aspect === 'all') {
    return [
      FIELD_EXPLANATIONS.symptoms,
      FIELD_EXPLANATIONS.referralNotes,
      FIELD_EXPLANATIONS.preparation,
      FIELD_EXPLANATIONS.preVisitIntake,
    ].join(' ');
  }
  return FIELD_EXPLANATIONS[aspect];
}

function buildServicePrepSummary(input: {
  serviceName: string;
  requiresFasting: boolean;
  preparationNotes?: string | null;
  offersPreVisitIntake: boolean;
}): string {
  const parts: string[] = [`"${input.serviceName}" on checkout:`];
  if (input.requiresFasting) {
    parts.push('fasting is required before this test');
  } else {
    parts.push('no fasting flag is set for this service');
  }
  if (input.preparationNotes) {
    parts.push(`preparation notes: ${input.preparationNotes}`);
  }
  if (input.offersPreVisitIntake) {
    parts.push('a pre-visit intake step may appear when you are signed in');
  }
  return parts.join('; ') + '.';
}

function buildAspectSummary(
  parsed: ParsedExplainClinicBooking,
  service?: {
    name: string;
    metadata?: Record<string, unknown> | null;
    offersPreVisitIntake?: boolean;
  } | null,
): string {
  const clinic = service ? extractClinicMetadata(service.metadata) : null;

  if (
    parsed.aspect === 'preparation' &&
    service &&
    clinic &&
    isClinicService(service.metadata)
  ) {
    return buildServicePrepSummary({
      serviceName: service.name,
      requiresFasting: clinic.requiresFasting === true,
      preparationNotes: clinic.preparationNotes ?? null,
      offersPreVisitIntake: service.offersPreVisitIntake === true,
    });
  }

  if (
    parsed.aspect === 'preVisitIntake' &&
    service &&
    isClinicLabTestService(service.metadata)
  ) {
    if (service.offersPreVisitIntake) {
      return `"${service.name}" includes a signed-in pre-visit intake questionnaire before checkout. Complete it to help the clinic prepare for your lab visit.`;
    }
    return `"${service.name}" is a lab test; a pre-visit intake step appears only when the clinic published an intake questionnaire for this service.`;
  }

  if (service && parsed.aspect === 'all' && clinic) {
    const overview = buildGenericAspectSummary('all');
    const prep = buildServicePrepSummary({
      serviceName: service.name,
      requiresFasting: clinic.requiresFasting === true,
      preparationNotes: clinic.preparationNotes ?? null,
      offersPreVisitIntake: service.offersPreVisitIntake === true,
    });
    return `${overview} ${prep}`;
  }

  if (service && parsed.aspect !== 'all') {
    return `${buildGenericAspectSummary(parsed.aspect)} Service: "${service.name}".`;
  }

  return buildGenericAspectSummary(parsed.aspect);
}

export async function handleExplainClinicBookingLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainClinicBookingFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_clinic_booking',
      'Ask about clinic checkout fields (e.g. "What should I put in the symptoms field?" or "Do I need to fast before this lab test?").',
      {
        clarify: true,
        missing: ['aspect'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_clinic_booking', 'Business not found.');
  }

  const businessType = readBusinessType(business.settings);
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'explain_clinic_booking',
      'Clinic checkout fields are only shown for clinic, polyclinic, beauty clinic, and dental businesses.',
      { businessType },
    );
  }

  const services = await deps.serviceService.findAll(businessId);
  const clinicServices = services.filter((item) =>
    isClinicService((item.metadata ?? {}) as Record<string, unknown>),
  );

  const service = parsed.serviceId
    ? clinicServices.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? matchServiceByNameLegacy(clinicServices, parsed.serviceName)
      : undefined;

  if (parsed.serviceName && !service) {
    return failure(
      'explain_clinic_booking',
      `Could not find a clinic service matching "${parsed.serviceName}".`,
      {
        clarify: true,
        serviceName: parsed.serviceName,
      },
    );
  }

  const resolvedService = service
    ? {
        name: service.name,
        metadata: (service.metadata ?? {}) as Record<string, unknown>,
        offersPreVisitIntake: clinicLabTestOffersPreVisitIntake(
          service.metadata,
          true,
        ),
      }
    : null;

  if (
    resolvedService &&
    (parsed.aspect === 'symptoms' || parsed.aspect === 'referralNotes') &&
    !clinicServiceAcceptsPatientNotes(resolvedService.metadata)
  ) {
    return failure(
      'explain_clinic_booking',
      `"${resolvedService.name}" is not configured to collect patient notes on checkout.`,
      { serviceName: resolvedService.name },
    );
  }

  const summary = buildAspectSummary(parsed, resolvedService);

  return success('explain_clinic_booking', summary, {
    aspect: parsed.aspect,
    serviceId: service?.id ?? null,
    serviceName: service?.name ?? parsed.serviceName ?? null,
    acceptsPatientNotes: resolvedService
      ? clinicServiceAcceptsPatientNotes(resolvedService.metadata)
      : null,
    requiresFasting: resolvedService
      ? (extractClinicMetadata(resolvedService.metadata)?.requiresFasting ??
        false)
      : null,
    preparationNotes:
      resolvedService &&
      extractClinicMetadata(resolvedService.metadata)?.preparationNotes
        ? extractClinicMetadata(resolvedService.metadata)?.preparationNotes
        : null,
    offersPreVisitIntake: resolvedService?.offersPreVisitIntake ?? null,
  });
}
