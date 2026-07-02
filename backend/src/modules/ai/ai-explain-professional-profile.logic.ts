import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { Repository } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import {
  formatProviderRatingLabel,
  readEmployeeProfileCopy,
  resolveEmployeeByName,
} from './ai-explain-provider-specialty.util.js';
import { parseExplainProfessionalProfileFromPrompt } from './ai-explain-professional-profile.util.js';
import type { ProfessionalProfileAspect } from './ai-explain-professional-profile.fixtures.js';

export interface ExplainProfessionalProfileLogicDeps {
  employeeRepo: Pick<Repository<Employee>, 'find'>;
  serviceRepo: Pick<Repository<Service>, 'find'>;
  reviewsService: Pick<ReviewsService, 'getPublicReviewsByEmployees'>;
}

type ProviderProfileSnapshot = {
  employeeId: string;
  name: string;
  role: string | null;
  specialty: string | null;
  bio: string | null;
  serviceNames: string[];
  averageRating: number | null;
  reviewCount: number;
};

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

function serviceNamesForEmployee(
  employee: Employee,
  servicesById: Map<string, Service>,
): string[] {
  const ids = employee.serviceIds ?? [];
  return ids
    .map((id) => servicesById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
}

function buildProviderProfileNavigate(employee: Employee): {
  path: 'provider_profile';
  query: Record<string, string>;
} {
  return {
    path: 'provider_profile',
    query: {
      employeeId: employee.id,
      employeeName: employee.name,
    },
  };
}

export function buildExplainProfessionalProfileSummary(input: {
  aspect: ProfessionalProfileAspect;
  provider?: ProviderProfileSnapshot | null;
}): string {
  if (input.aspect === 'browse_professionals') {
    return 'Opening the team page so you can browse stylist profiles and services.';
  }

  const provider = input.provider;
  if (!provider) {
    return 'Opening the stylist profile page.';
  }

  const parts = [`Opening ${provider.name}'s profile`];
  if (provider.role) parts[0] += ` (${provider.role})`;
  if (provider.specialty) {
    parts.push(`Specialty: ${provider.specialty}.`);
  } else if (provider.bio) {
    parts.push(provider.bio.endsWith('.') ? provider.bio : `${provider.bio}.`);
  }
  if (provider.serviceNames.length > 0) {
    parts.push(`Services: ${provider.serviceNames.join(', ')}.`);
  }
  const rating = formatProviderRatingLabel(
    provider.averageRating,
    provider.reviewCount,
  );
  if (rating) parts.push(`Rating: ${rating}.`);
  return parts.join(' ');
}

export async function handleExplainProfessionalProfileLogic(
  deps: ExplainProfessionalProfileLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseExplainProfessionalProfileFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_professional_profile',
      'Ask to show a stylist profile, their services, or browse the team.',
      { clarify: true, missing: ['aspect'] },
    );
  }

  if (parsed.aspect === 'browse_professionals') {
    const summary = buildExplainProfessionalProfileSummary({
      aspect: parsed.aspect,
    });
    return success('explain_professional_profile', summary, {
      aspect: parsed.aspect,
      navigate: { path: 'professionals', query: {} },
    });
  }

  const [employees, services] = await Promise.all([
    deps.employeeRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    }),
    deps.serviceRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    }),
  ]);

  const servicesById = new Map(
    services.map((service) => [service.id, service]),
  );
  const toSnapshot = (employee: Employee): ProviderProfileSnapshot => {
    const profile = readEmployeeProfileCopy(employee.metadata);
    return {
      employeeId: employee.id,
      name: employee.name,
      role: profile.role,
      specialty: profile.specialty,
      bio: profile.bio,
      serviceNames: serviceNamesForEmployee(employee, servicesById),
      averageRating: null,
      reviewCount: 0,
    };
  };

  let employee: Employee | null = null;

  if (parsed.aspect === 'current_provider_profile') {
    const employeeId =
      typeof params.employeeId === 'string' ? params.employeeId : undefined;
    employee =
      (employeeId
        ? (employees.find((entry) => entry.id === employeeId) ?? null)
        : null) ?? null;
    if (!employee) {
      return failure(
        'explain_professional_profile',
        'Open a stylist profile first, or name who you want to view.',
        {
          aspect: parsed.aspect,
          clarify: true,
          missing: ['employeeId'],
        },
      );
    }
  } else {
    const providerName = parsed.providerName?.trim();
    if (!providerName) {
      return failure(
        'explain_professional_profile',
        'Which stylist profile should I open?',
        {
          aspect: parsed.aspect,
          clarify: true,
          missing: ['providerName'],
        },
      );
    }
    employee = resolveEmployeeByName(employees, providerName) ?? null;
    if (!employee) {
      return failure(
        'explain_professional_profile',
        `I couldn't find a stylist named ${providerName}. Available: ${employees.map((entry) => entry.name).join(', ') || 'none yet'}.`,
        {
          aspect: parsed.aspect,
          providerName,
          availableProviders: employees.map((entry) => entry.name),
        },
      );
    }
  }

  const reviewSummaries = await deps.reviewsService.getPublicReviewsByEmployees(
    businessId,
    [employee.id],
  );
  const snapshot = toSnapshot(employee);
  const reviews = reviewSummaries.get(employee.id);
  snapshot.averageRating = reviews?.averageRating ?? null;
  snapshot.reviewCount = reviews?.reviewCount ?? 0;

  const summary = buildExplainProfessionalProfileSummary({
    aspect: parsed.aspect,
    provider: snapshot,
  });

  return success('explain_professional_profile', summary, {
    aspect: parsed.aspect,
    ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
    provider: snapshot,
    navigate: buildProviderProfileNavigate(employee),
  });
}
