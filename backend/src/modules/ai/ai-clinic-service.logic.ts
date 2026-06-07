import { BadRequestException } from '@nestjs/common';
import { type Repository } from 'typeorm';
import type { OnboardingService } from '../onboarding/onboarding.service.js';
import { Business } from '../business/entities/business.entity.js';
import type { ServiceService } from '../service/service.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_VERTICAL_BUSINESS_TYPES,
  extractClinicMetadata,
  formatClinicServiceTypeBadge,
  isClinicService,
  isClinicVerticalBusinessType,
  type ClinicServiceType,
} from '../../common/utils/clinic-service.util.js';
import {
  parseApplyClinicPlaybookFromPrompt,
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
  type ParsedConfigureClinicService,
  type ParsedExplainClinicServices,
} from './ai-clinic-service.util.js';

export interface ClinicServiceLogicDeps {
  serviceService: Pick<ServiceService, 'findAll' | 'update'>;
}

export interface ClinicPlaybookLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  onboardingService: Pick<OnboardingService, 'applyVerticalPlaybook'>;
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

function resolveServiceByName<T extends { id: string; name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function buildConfigureSummary(
  serviceName: string,
  parsed: ParsedConfigureClinicService,
): string {
  const parts: string[] = [];
  if (parsed.serviceType) {
    parts.push(`type ${formatClinicServiceTypeBadge(parsed.serviceType)}`);
  }
  if (parsed.requiresFasting === true) parts.push('fasting required');
  if (parsed.requiresFasting === false) parts.push('fasting not required');
  if (parsed.preparationNotes) {
    parts.push(`prep "${parsed.preparationNotes}"`);
  }
  return `Updated "${serviceName}" — ${parts.join(', ')}.`;
}

export async function handleConfigureClinicServiceLogic(
  deps: ClinicServiceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfigureClinicServiceFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_clinic_service',
      'Specify the service and clinic settings to update (e.g. "Mark CBC as a lab test requiring fasting" or "Set lipid panel prep instructions to fast 12 hours").',
      {
        clarify: true,
        missing: ['serviceName', 'serviceType', 'requiresFasting', 'preparationNotes'],
      },
    );
  }

  const services = await deps.serviceService.findAll(businessId);
  const service = parsed.serviceId
    ? services.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveServiceByName(services, parsed.serviceName)
      : undefined;

  if (!service) {
    return failure(
      'configure_clinic_service',
      `Could not find a catalog service matching "${parsed.serviceName ?? parsed.serviceId}".`,
      { serviceName: parsed.serviceName, serviceId: parsed.serviceId },
    );
  }

  const existingClinic = extractClinicMetadata(
    (service.metadata ?? {}) as Record<string, unknown>,
  );

  const updateDto: Record<string, unknown> = {};
  if (parsed.serviceType) updateDto.serviceType = parsed.serviceType;
  if (parsed.requiresFasting !== undefined) {
    updateDto.requiresFasting = parsed.requiresFasting;
  }
  if (parsed.preparationNotes !== undefined) {
    updateDto.preparationNotes = parsed.preparationNotes;
  }

  const updated = await deps.serviceService.update(service.id, updateDto);
  const clinicMeta = extractClinicMetadata(
    (updated.metadata ?? {}) as Record<string, unknown>,
  );

  return success(
    'configure_clinic_service',
    buildConfigureSummary(service.name, parsed),
    {
      serviceId: service.id,
      serviceName: service.name,
      wasClinic: Boolean(existingClinic),
      clinic: clinicMeta,
      applied: parsed,
    },
  );
}

export interface ClinicServiceSummary {
  id: string;
  name: string;
  department: string | null;
  serviceType: ClinicServiceType | null;
  requiresFasting: boolean;
  preparationNotes: string | null;
}

export interface ClinicCatalogStats {
  total: number;
  consultation: number;
  labTest: number;
  procedure: number;
  unclassified: number;
  fastingLabTests: number;
  departments: Array<{ name: string; count: number }>;
}

function buildCatalogStats(services: ClinicServiceSummary[]): ClinicCatalogStats {
  const departmentCounts = new Map<string, number>();
  let consultation = 0;
  let labTest = 0;
  let procedure = 0;
  let unclassified = 0;
  let fastingLabTests = 0;

  for (const service of services) {
    const dept = service.department ?? 'Uncategorized';
    departmentCounts.set(dept, (departmentCounts.get(dept) ?? 0) + 1);

    if (service.serviceType === 'consultation') consultation += 1;
    else if (service.serviceType === 'lab_test') {
      labTest += 1;
      if (service.requiresFasting) fastingLabTests += 1;
    } else if (service.serviceType === 'procedure') procedure += 1;
    else unclassified += 1;
  }

  const departments = [...departmentCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    total: services.length,
    consultation,
    labTest,
    procedure,
    unclassified,
    fastingLabTests,
    departments,
  };
}

function formatFastingServices(services: ClinicServiceSummary[]): string {
  const fasting = services.filter(
    (service) =>
      service.serviceType === 'lab_test' && service.requiresFasting,
  );
  if (fasting.length === 0) return 'No lab tests require fasting.';
  return `Fasting required: ${fasting.map((service) => service.name).join(', ')}.`;
}

function buildExplainClinicServicesSummary(
  parsed: ParsedExplainClinicServices,
  services: ClinicServiceSummary[],
  stats: ClinicCatalogStats,
): string {
  const filterNote = parsed.serviceName ? ` for "${parsed.serviceName}"` : '';
  const parts: string[] = [];

  if (services.length === 0) {
    parts.push(`No clinic catalog services found${filterNote}.`);
    return parts.join(' ');
  }

  if (parsed.serviceName && services.length === 1) {
    const service = services[0]!;
    const typeLabel = service.serviceType
      ? formatClinicServiceTypeBadge(service.serviceType)
      : 'Unclassified';
    const fastingNote =
      service.serviceType === 'lab_test' && service.requiresFasting
        ? ' — fasting required'
        : '';
    const prepNote = service.preparationNotes
      ? ` Prep: ${service.preparationNotes}.`
      : '';
    parts.push(
      `${service.name} (${typeLabel}, ${service.department ?? 'Uncategorized'})${fastingNote}.${prepNote}`,
    );
    return parts.join(' ');
  }

  parts.push(
    `${stats.total} clinic service${stats.total === 1 ? '' : 's'}${filterNote}: ${stats.consultation} consultation, ${stats.labTest} lab test, ${stats.procedure} procedure${stats.unclassified ? `, ${stats.unclassified} unclassified` : ''}.`,
  );

  if (stats.departments.length > 0) {
    parts.push(
      `Departments: ${stats.departments.map((dept) => `${dept.name} (${dept.count})`).join(', ')}.`,
    );
  }

  parts.push(formatFastingServices(services));

  return parts.join(' ');
}

export async function handleExplainClinicServicesLogic(
  deps: ClinicServiceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainClinicServicesFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_clinic_services',
      'Ask about clinic catalog services (e.g. "Explain our clinic services and department counts" or "Which lab tests require fasting?").',
      { clarify: true },
    );
  }

  const allServices = await deps.serviceService.findAll(businessId);
  let clinicServices = allServices
    .filter((service) =>
      isClinicService((service.metadata ?? {}) as Record<string, unknown>),
    )
    .map((service) => {
      const clinic = extractClinicMetadata(
        (service.metadata ?? {}) as Record<string, unknown>,
      );
      return {
        id: service.id,
        name: service.name,
        department:
          (service as { category?: { name?: string } | null }).category?.name ??
          null,
        serviceType: clinic?.serviceType ?? null,
        requiresFasting: clinic?.requiresFasting === true,
        preparationNotes: clinic?.preparationNotes ?? null,
      };
    });

  if (parsed.serviceId) {
    clinicServices = clinicServices.filter(
      (service) => service.id === parsed.serviceId,
    );
  } else if (parsed.serviceName) {
    const match = resolveServiceByName(clinicServices, parsed.serviceName);
    clinicServices = match ? [match] : [];
  }

  const stats = buildCatalogStats(clinicServices);
  const summary = buildExplainClinicServicesSummary(
    parsed,
    clinicServices,
    stats,
  );

  return success('explain_clinic_services', summary, {
    stats,
    services: clinicServices,
    serviceName: parsed.serviceName ?? null,
    serviceId: parsed.serviceId ?? null,
  });
}

export async function handleApplyClinicPlaybookLogic(
  deps: ClinicPlaybookLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseApplyClinicPlaybookFromPrompt(
    String(prompt ?? params._prompt ?? ''),
  );
  if (!parsed) {
    return failure(
      'apply_clinic_playbook',
      'Ask to apply the clinic playbook (e.g. "Apply clinic playbook" or "Set up polyclinic starter catalog and schedule").',
      { clarify: true },
    );
  }

  if (!userId) {
    return failure(
      'apply_clinic_playbook',
      'Sign in as a team member to apply the clinic playbook and create schedule slots.',
      { clarify: true, missing: ['userId'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('apply_clinic_playbook', 'Business not found.');
  }

  const businessType =
    typeof business.settings?.businessType === 'string'
      ? business.settings.businessType
      : null;
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'apply_clinic_playbook',
      `Clinic playbook applies to clinic vertical businesses — this business is typed "${businessType ?? 'unset'}". Set business type to clinic or polyclinic in onboarding first.`,
      {
        businessType,
        expectedBusinessTypes: CLINIC_VERTICAL_BUSINESS_TYPES,
      },
    );
  }

  try {
    const result = await deps.onboardingService.applyVerticalPlaybook(
      businessId,
      userId,
    );

    const scheduleNote =
      result.alreadyConfigured === true
        ? 'Schedule was already configured — catalog entries were added where missing.'
        : `Applied "${result.templatesApplied?.join(', ') ?? 'Clinic operating hours'}" (${result.slotsCreated ?? 0} slots for ${result.employeeName ?? 'staff'}).`;

    const summary = `Clinic playbook applied — ${result.categoriesCreated ?? 0} categories, ${result.servicesCreated ?? 0} services created. ${scheduleNote}`;

    return success('apply_clinic_playbook', summary, {
      playbookId: result.playbookId,
      categoriesCreated: result.categoriesCreated,
      servicesCreated: result.servicesCreated,
      slotsCreated: result.slotsCreated,
      templatesApplied: result.templatesApplied,
      alreadyConfigured: result.alreadyConfigured ?? false,
      employeeName: result.employeeName ?? null,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof BadRequestException) {
      const message =
        typeof error.message === 'string'
          ? error.message
          : 'Could not apply clinic playbook.';
      return failure('apply_clinic_playbook', message);
    }
    throw error;
  }
}
