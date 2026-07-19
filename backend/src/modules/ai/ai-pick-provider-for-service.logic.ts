import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { parsePickProviderForServiceFromPrompt } from './ai-pick-provider-for-service.util.js';
import type { PickProviderMode } from './ai-pick-provider-for-service.fixtures.js';
import { resolveEmployeeByName } from './ai-explain-provider-specialty.util.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

export interface PickProviderForServiceLogicDeps {
  employeeRepo: Pick<Repository<Employee>, 'find'>;
  serviceRepo: Pick<Repository<Service>, 'find'>;
  publicCustomerAuthService: Pick<PublicCustomerAuthService, 'listBookings'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function resolveServiceByName(
  services: readonly Service[],
  serviceName: string,
): Service | undefined {
  const needle = serviceName.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle)) ??
    services.find((entry) =>
      needle
        .split(/\s+/)
        .every((part) => part && entry.name.toLowerCase().includes(part)),
    )
  );
}

function pickLastVisitWithProvider<
  T extends {
    status: string;
    startTime: string | Date;
    employeeId?: string | null;
  },
>(bookings: readonly T[]): T | null {
  const withProvider = bookings.filter((entry) => Boolean(entry.employeeId));
  const completed = withProvider
    .filter(
      (entry) => String(entry.status).toLowerCase() === BookingStatus.COMPLETED,
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  if (completed[0]) return completed[0];
  return (
    [...withProvider].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )[0] ?? null
  );
}

function buildNavigateQuery(input: {
  employeeId: string;
  employeeName?: string;
  serviceId?: string;
}): Record<string, string> {
  const query: Record<string, string> = { employeeId: input.employeeId };
  if (input.employeeName) query.employeeName = input.employeeName;
  if (input.serviceId) query.serviceId = input.serviceId;
  return query;
}

export function buildPickProviderForServiceSummary(input: {
  mode: PickProviderMode;
  employeeName: string;
  serviceName?: string | null;
}): string {
  if (input.serviceName) {
    return `Selected ${input.employeeName} for ${input.serviceName}. Choose a time to continue booking.`;
  }
  if (input.mode === 'same_as_last') {
    return `Selected ${input.employeeName} from your last visit. Choose a service and time to continue.`;
  }
  return `Selected ${input.employeeName}. Choose a service and time to continue booking.`;
}

export async function handlePickProviderForServiceLogic(
  deps: PickProviderForServiceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parsePickProviderForServiceFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'pick_provider_for_service',
      'Name a stylist to book with, or ask to use your usual stylist from your last visit.',
      { clarify: true, missing: ['providerName'] },
    );
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

  if (parsed.mode === 'same_as_last') {
    const customerId = resolveSessionCustomerId(params);
    if (!customerId) {
      return failure(
        'pick_provider_for_service',
        'Sign in to reuse the stylist from your last visit.',
        { clarify: true, mode: 'same_as_last' },
      );
    }

    // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
    const slug = await resolveBusinessSlugFromParamsOrId(
      deps.businessRepo,
      businessId,
      params,
    );
    if (!slug) {
      return failure('pick_provider_for_service', 'Business not found.', {
        mode: 'same_as_last',
      });
    }

    const { bookings } = await deps.publicCustomerAuthService.listBookings(
      slug,
      customerId,
    );
    const last = pickLastVisitWithProvider(bookings);
    if (!last?.employeeId) {
      return failure(
        'pick_provider_for_service',
        'No past visit with a stylist found yet. Name who you prefer instead.',
        { mode: 'same_as_last', clarify: true },
      );
    }

    const employee =
      employees.find((entry) => entry.id === last.employeeId) ?? null;
    const employeeName = employee?.name ?? last.employeeName ?? 'your stylist';
    const serviceId = last.serviceId ?? undefined;
    const serviceName = last.serviceName ?? undefined;

    const summary = buildPickProviderForServiceSummary({
      mode: 'same_as_last',
      employeeName,
      serviceName,
    });

    return success('pick_provider_for_service', summary, {
      mode: 'same_as_last',
      employeeId: last.employeeId,
      employeeName,
      ...(serviceId ? { serviceId, serviceName } : {}),
      rebookHint: 'rebook_last_appointment',
      navigate: {
        path: serviceId ? 'booking' : 'professionals',
        query: buildNavigateQuery({
          employeeId: last.employeeId,
          employeeName,
          serviceId,
        }),
      },
    });
  }

  const providerName = parsed.providerName?.trim();
  if (!providerName) {
    return failure(
      'pick_provider_for_service',
      'Which stylist would you like to book with?',
      { clarify: true, mode: 'named_provider', missing: ['providerName'] },
    );
  }

  const employee = resolveEmployeeByName(employees, providerName);
  if (!employee) {
    return failure(
      'pick_provider_for_service',
      `I couldn't find a stylist named ${providerName}. Available: ${employees.map((entry) => entry.name).join(', ') || 'none yet'}.`,
      {
        mode: 'named_provider',
        providerName,
        availableProviders: employees.map((entry) => entry.name),
      },
    );
  }

  const serviceName = parsed.serviceName?.trim();
  const service = serviceName
    ? resolveServiceByName(services, serviceName)
    : undefined;

  const summary = buildPickProviderForServiceSummary({
    mode: 'named_provider',
    employeeName: employee.name,
    serviceName: service?.name ?? serviceName ?? null,
  });

  return success('pick_provider_for_service', summary, {
    mode: 'named_provider',
    providerName,
    employeeId: employee.id,
    employeeName: employee.name,
    ...(service
      ? { serviceId: service.id, serviceName: service.name }
      : serviceName
        ? { serviceName }
        : {}),
    navigate: {
      path: service ? 'booking' : 'professionals',
      query: buildNavigateQuery({
        employeeId: employee.id,
        employeeName: employee.name,
        serviceId: service?.id,
      }),
    },
  });
}
