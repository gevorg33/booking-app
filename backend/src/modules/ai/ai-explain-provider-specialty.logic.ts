import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { Repository } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import {
  type ProviderSpecialtyAspect,
  enrichExplainProviderSpecialtyParamsFromPrompt,
  formatProviderRatingLabel,
  readEmployeeProfileCopy,
  resolveEmployeeByName,
  scoreEmployeeForSpecialtyTopic,
} from './ai-explain-provider-specialty.util.js';

export type ProviderSpecialtyLogicDeps = {
  employeeRepo: Repository<Employee>;
  serviceRepo: Repository<Service>;
  reviewsService: Pick<ReviewsService, 'getPublicReviewsByEmployees'>;
};

type ProviderSpecialtyMatch = {
  employeeId: string;
  name: string;
  role: string | null;
  specialty: string | null;
  bio: string | null;
  serviceNames: string[];
  averageRating: number | null;
  reviewCount: number;
  score?: number;
};

function serviceNamesForEmployee(
  employee: Employee,
  servicesById: Map<string, Service>,
): string[] {
  const ids = employee.serviceIds ?? [];
  return ids
    .map((id) => servicesById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
}

function buildNamedProviderSummary(match: ProviderSpecialtyMatch): string {
  const parts = [match.name];
  if (match.role) parts.push(`— ${match.role}`);
  if (match.specialty) parts.push(`Specialty: ${match.specialty}.`);
  else if (match.bio) parts.push(match.bio.endsWith('.') ? match.bio : `${match.bio}.`);
  if (match.serviceNames.length > 0) {
    parts.push(`Services: ${match.serviceNames.join(', ')}.`);
  }
  const rating = formatProviderRatingLabel(
    match.averageRating,
    match.reviewCount,
  );
  if (rating) parts.push(`Rating: ${rating}.`);
  return parts.join(' ');
}

function buildSpecialtyMatchSummary(
  topic: string,
  matches: ProviderSpecialtyMatch[],
): string {
  if (matches.length === 0) {
    return `No provider profile explicitly lists ${topic} yet. Browse the team to compare roles and services.`;
  }
  const labels = matches.slice(0, 3).map((match) => {
    const bits = [match.name];
    if (match.role) bits.push(match.role);
    const rating = formatProviderRatingLabel(
      match.averageRating,
      match.reviewCount,
    );
    if (rating) bits.push(rating);
    return bits.join(' · ');
  });
  return `For ${topic}, we'd suggest ${labels.join('; ')}.`;
}

export function buildProviderSpecialtySummary(input: {
  aspect: ProviderSpecialtyAspect;
  specialtyTopic?: string | null;
  namedProvider?: ProviderSpecialtyMatch | null;
  matches?: ProviderSpecialtyMatch[];
}): string {
  if (input.aspect === 'named_provider' && input.namedProvider) {
    return buildNamedProviderSummary(input.namedProvider);
  }
  if (input.aspect === 'specialty_match' && input.specialtyTopic) {
    return buildSpecialtyMatchSummary(
      input.specialtyTopic,
      input.matches ?? [],
    );
  }
  return 'Provider specialty details are not available yet.';
}

export async function handleExplainProviderSpecialtyLogic(
  deps: ProviderSpecialtyLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainProviderSpecialtyParamsFromPrompt(
    params,
    textPrompt,
  );
  const aspect = enriched.aspect as ProviderSpecialtyAspect;
  const providerName = (enriched.providerName as string | undefined) ?? null;
  const specialtyTopic =
    (enriched.specialtyTopic as string | undefined) ?? null;

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

  const servicesById = new Map(services.map((service) => [service.id, service]));
  const reviewSummaries = await deps.reviewsService.getPublicReviewsByEmployees(
    businessId,
    employees.map((employee) => employee.id),
  );

  const toMatch = (
    employee: Employee,
    score?: number,
  ): ProviderSpecialtyMatch => {
    const profile = readEmployeeProfileCopy(employee.metadata);
    const reviews = reviewSummaries.get(employee.id);
    return {
      employeeId: employee.id,
      name: employee.name,
      role: profile.role,
      specialty: profile.specialty,
      bio: profile.bio,
      serviceNames: serviceNamesForEmployee(employee, servicesById),
      averageRating: reviews?.averageRating ?? null,
      reviewCount: reviews?.reviewCount ?? 0,
      ...(score != null ? { score } : {}),
    };
  };

  if (aspect === 'named_provider') {
    if (!providerName) {
      return {
        success: false,
        action: 'explain_provider_specialty',
        summary: 'Which provider would you like to learn about?',
        details: {
          aspect,
          clarify: true,
          missing: ['providerName'],
        },
      };
    }

    const employee = resolveEmployeeByName(employees, providerName);
    if (!employee) {
      return {
        success: false,
        action: 'explain_provider_specialty',
        summary: `I couldn't find a provider named ${providerName}.`,
        details: {
          aspect,
          providerName,
          availableProviders: employees.map((entry) => entry.name),
        },
      };
    }

    const namedProvider = toMatch(employee);
    const summary = buildProviderSpecialtySummary({
      aspect,
      namedProvider,
    });

    return {
      success: true,
      action: 'explain_provider_specialty',
      summary,
      details: {
        aspect,
        providerName,
        provider: namedProvider,
        navigate: {
          path: 'professionals',
          query: {
            employeeId: employee.id,
            employeeName: employee.name,
          },
        },
      },
    };
  }

  const topic = specialtyTopic?.trim();
  if (!topic) {
    return {
      success: false,
      action: 'explain_provider_specialty',
      summary: 'What specialty or service topic should I match to a provider?',
      details: {
        aspect,
        clarify: true,
        missing: ['specialtyTopic'],
      },
    };
  }

  const ranked = employees
    .map((employee) => ({
      employee,
      score: scoreEmployeeForSpecialtyTopic({
        employeeName: employee.name,
        metadata: employee.metadata,
        serviceNames: serviceNamesForEmployee(employee, servicesById),
        topic,
      }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftRating = reviewSummaries.get(left.employee.id)?.averageRating ?? -1;
      const rightRating =
        reviewSummaries.get(right.employee.id)?.averageRating ?? -1;
      if (rightRating !== leftRating) return rightRating - leftRating;
      return left.employee.name.localeCompare(right.employee.name);
    });

  const matches = ranked.map((entry) => toMatch(entry.employee, entry.score));
  const summary = buildProviderSpecialtySummary({
    aspect,
    specialtyTopic: topic,
    matches,
  });
  const top = matches[0];

  return {
    success: true,
    action: 'explain_provider_specialty',
    summary,
    details: {
      aspect,
      specialtyTopic: topic,
      providers: matches.slice(0, 5),
      navigate: top
        ? {
            path: 'professionals',
            query: {
              employeeId: top.employeeId,
              employeeName: top.name,
            },
          }
        : { path: 'professionals', query: {} },
    },
  };
}
