export interface ProfessionalServicesContext {
  employeeId: string;
  startTime: string;
  employeeName?: string;
}

const STORAGE_KEY = 'consumer:professional-services-context';

export function persistProfessionalServicesContext(
  slug: string,
  context: ProfessionalServicesContext,
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slug,
        employeeId: context.employeeId.trim(),
        startTime: context.startTime.trim(),
        employeeName: context.employeeName?.trim() || undefined,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function readProfessionalServicesContext(
  slug: string,
  query: URLSearchParams,
): ProfessionalServicesContext | null {
  const fromQuery: ProfessionalServicesContext = {
    employeeId: query.get('employeeId')?.trim() ?? '',
    startTime: query.get('startTime')?.trim() ?? '',
    employeeName: query.get('employeeName')?.trim() || undefined,
  };
  if (fromQuery.employeeId && fromQuery.startTime) return fromQuery;

  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfessionalServicesContext & { slug?: string };
    if (parsed.slug !== slug) return null;
    if (!parsed.employeeId?.trim() || !parsed.startTime?.trim()) return null;
    return {
      employeeId: parsed.employeeId.trim(),
      startTime: parsed.startTime.trim(),
      employeeName: parsed.employeeName?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function clearProfessionalServicesContext(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
