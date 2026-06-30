export interface AssistantExampleEmployee {
  id: string;
  name: string;
  serviceIds?: string[];
  isActive?: boolean;
}

export interface AssistantExampleService {
  id: string;
  name: string;
  categoryName?: string | null;
  isActive?: boolean;
}

export interface AssistantExampleTenantInput {
  employees?: AssistantExampleEmployee[] | null;
  providers?: AssistantExampleEmployee[] | null;
  services?: AssistantExampleService[] | null;
}

export interface AssistantExampleVars {
  provider: string;
  service: string;
  service2: string;
  serviceCategory: string;
}

export function normalizeAssistantExampleTenant(
  input: AssistantExampleTenantInput | null | undefined,
): { employees: AssistantExampleEmployee[]; services: AssistantExampleService[] } {
  return {
    employees: (input?.employees ?? input?.providers ?? []).filter(Boolean),
    services: (input?.services ?? []).filter(Boolean),
  };
}

function pickEmployee(employees: AssistantExampleEmployee[]) {
  return employees.find((employee) => employee.isActive !== false && employee.name?.trim()) ?? null;
}

function pickServices(
  services: AssistantExampleService[],
  employee: AssistantExampleEmployee | null,
) {
  const active = services.filter((service) => service.isActive !== false && service.name?.trim());
  let primary: AssistantExampleService | null = null;
  if (employee?.serviceIds?.length) {
    primary = active.find((service) => employee.serviceIds!.includes(service.id)) ?? null;
  }
  primary = primary ?? active[0] ?? null;
  const secondary = active.find((service) => service.id !== primary?.id) ?? primary;
  const categoryName =
    primary?.categoryName?.trim() ||
    active.find((service) => service.categoryName?.trim())?.categoryName?.trim() ||
    primary?.name?.trim() ||
    '';
  return { primary, secondary, categoryName };
}

export function pickAssistantExampleVars(
  input: AssistantExampleTenantInput | null | undefined,
  fallbacks: AssistantExampleVars,
): AssistantExampleVars {
  const { employees, services } = normalizeAssistantExampleTenant(input);
  const employee = pickEmployee(employees);
  const { primary, secondary, categoryName } = pickServices(services, employee);
  return {
    provider: employee?.name?.trim() || fallbacks.provider,
    service: primary?.name?.trim() || fallbacks.service,
    service2: secondary?.name?.trim() || primary?.name?.trim() || fallbacks.service2,
    serviceCategory: categoryName || fallbacks.serviceCategory,
  };
}

export function interpolateAssistantTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function mapPublicServicesForAssistantExamples(
  services: Array<{ id: string; name: string; category?: { name?: string | null } | null }>,
): AssistantExampleService[] {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    categoryName: service.category?.name ?? null,
  }));
}

export function mapPublicProvidersForAssistantExamples(
  providers: Array<{ id: string; name: string }>,
): AssistantExampleEmployee[] {
  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
  }));
}
