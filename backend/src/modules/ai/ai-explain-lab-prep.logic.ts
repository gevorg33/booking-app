import {
  extractClinicMetadata,
  isClinicService,
  isClinicVerticalBusinessType,
} from '../../common/utils/clinic-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';
import {
  enrichExplainLabPrepParamsFromPrompt,
  isExplainLabPrepPrompt,
  type ParsedExplainLabPrep,
} from './ai-explain-lab-prep.util.js';

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

function resolveByName<T extends { id: string; name: string }>(
  rows: readonly T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  return (
    rows.find((row) => row.name.toLowerCase() === needle) ??
    rows.find((row) => row.name.toLowerCase().includes(needle)) ??
    rows.find((row) => needle.includes(row.name.toLowerCase()))
  );
}

type LabServiceRow = {
  id: string;
  name: string;
  requiresFasting: boolean;
  preparationNotes: string | null;
};

function mapLabServices(
  services: Awaited<
    ReturnType<ClinicBookingLogicDeps['serviceService']['findAll']>
  >,
): LabServiceRow[] {
  return services
    .filter((item) =>
      isClinicService((item.metadata ?? {}) as Record<string, unknown>),
    )
    .map((item) => {
      const clinic = extractClinicMetadata(
        (item.metadata ?? {}) as Record<string, unknown>,
      );
      if (clinic?.serviceType !== 'lab_test') return null;
      return {
        id: item.id,
        name: item.name,
        requiresFasting: clinic.requiresFasting === true,
        preparationNotes: clinic.preparationNotes ?? null,
      };
    })
    .filter((row): row is LabServiceRow => row != null);
}

function buildServiceLabPrepSummary(service: LabServiceRow): string {
  const parts: string[] = [`"${service.name}":`];
  if (service.requiresFasting) {
    parts.push('fasting is required before this test');
  } else {
    parts.push('no fasting flag is set for this test');
  }
  if (service.preparationNotes) {
    parts.push(`preparation notes: ${service.preparationNotes}`);
  }
  return parts.join(' ') + '.';
}

function buildCatalogLabPrepSummary(services: LabServiceRow[]): string {
  if (services.length === 0) {
    return 'No lab tests are published in the clinic catalog yet.';
  }
  const fasting = services.filter((service) => service.requiresFasting);
  const nonFasting = services.filter((service) => !service.requiresFasting);
  const parts: string[] = [];
  if (fasting.length > 0) {
    parts.push(
      `Fasting required: ${fasting.map((service) => service.name).join(', ')}.`,
    );
  } else {
    parts.push('No published lab tests require fasting.');
  }
  if (nonFasting.length > 0 && fasting.length > 0) {
    parts.push(
      `No fasting flag: ${nonFasting.map((service) => service.name).join(', ')}.`,
    );
  }
  return parts.join(' ');
}

export async function handleExplainLabPrepLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainLabPrepParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainLabPrepPrompt(textPrompt)) {
    return failure(
      'explain_lab_prep',
      'Ask whether a lab test requires fasting or what preparation applies.',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_lab_prep', 'Business not found.');
  }

  const businessType = readBusinessType(business.settings);
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'explain_lab_prep',
      'Lab preparation guidance is only available for clinic vertical businesses.',
      { businessType },
    );
  }

  const labServices = mapLabServices(
    await deps.serviceService.findAll(businessId),
  );
  const parsed: ParsedExplainLabPrep = {
    serviceId:
      typeof enriched.serviceId === 'string' ? enriched.serviceId : undefined,
    serviceName:
      typeof enriched.serviceName === 'string'
        ? enriched.serviceName
        : undefined,
  };

  const service = parsed.serviceId
    ? labServices.find((row) => row.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveByName(labServices, parsed.serviceName)
      : labServices.length === 1
        ? labServices[0]
        : undefined;

  if (parsed.serviceName && !service) {
    return failure(
      'explain_lab_prep',
      `Could not find a lab test matching "${parsed.serviceName}".`,
      {
        clarify: true,
        missing: ['serviceName'],
        serviceName: parsed.serviceName,
      },
    );
  }

  const summary = service
    ? buildServiceLabPrepSummary(service)
    : buildCatalogLabPrepSummary(labServices);

  return success('explain_lab_prep', summary, {
    serviceId: service?.id ?? null,
    serviceName: service?.name ?? parsed.serviceName ?? null,
    requiresFasting: service?.requiresFasting ?? null,
    preparationNotes: service?.preparationNotes ?? null,
    fastingLabTests: labServices
      .filter((row) => row.requiresFasting)
      .map((row) => row.name),
    navigate: service
      ? { path: 'services', query: { serviceId: service.id } }
      : { path: 'services', query: {} },
  });
}
