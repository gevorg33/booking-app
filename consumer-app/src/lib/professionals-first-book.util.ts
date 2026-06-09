import type { PublicService } from './types.js';
import { buildProfessionalsFirstBookPath } from './provider-booking.util.js';

export interface ProfessionalsFirstBookLocationState {
  professionalsFirstService?: PublicService;
  employeeName?: string;
  employeeId?: string;
  startTime?: string;
}

export interface ProfessionalsFirstBookQuery {
  employeeId: string;
  slot: string;
  date: string;
  professionalsFirst: boolean;
}

const STORAGE_KEY = 'consumer:professionals-first-book';

export function persistProfessionalsFirstBookState(
  slug: string,
  serviceId: string,
  state: ProfessionalsFirstBookLocationState,
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slug,
        serviceId,
        employeeId: state.employeeId?.trim(),
        startTime: state.startTime?.trim(),
        employeeName: state.employeeName?.trim() || undefined,
        professionalsFirstService: state.professionalsFirstService,
      }),
    );
  } catch {
    // quota / private mode — router state is the fallback
  }
}

function readPersistedRecord(
  slug: string,
  serviceId: string,
): ProfessionalsFirstBookLocationState & { slug?: string; serviceId?: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfessionalsFirstBookLocationState & {
      slug?: string;
      serviceId?: string;
    };
    if (parsed.slug !== slug || parsed.serviceId !== serviceId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readProfessionalsFirstBookState(
  state: unknown,
  context?: { slug?: string; serviceId?: string },
): ProfessionalsFirstBookLocationState {
  const fromRouter =
    state && typeof state === 'object'
      ? {
          professionalsFirstService: (state as ProfessionalsFirstBookLocationState)
            .professionalsFirstService,
          employeeName:
            (state as ProfessionalsFirstBookLocationState).employeeName?.trim() || undefined,
          employeeId:
            (state as ProfessionalsFirstBookLocationState).employeeId?.trim() || undefined,
          startTime:
            (state as ProfessionalsFirstBookLocationState).startTime?.trim() || undefined,
        }
      : {};

  if (fromRouter.professionalsFirstService) return fromRouter;
  if (!context?.slug || !context.serviceId) return fromRouter;

  const persisted = readPersistedRecord(context.slug, context.serviceId);
  if (!persisted) return fromRouter;

  return {
    professionalsFirstService: persisted.professionalsFirstService,
    employeeName: persisted.employeeName?.trim() || undefined,
    employeeId: persisted.employeeId?.trim() || undefined,
    startTime: persisted.startTime?.trim() || undefined,
  };
}

/** URL query for professionals-first book — falls back to session when Android drops search params. */
export function readProfessionalsFirstBookQuery(
  slug: string | undefined,
  serviceId: string | undefined,
  params: URLSearchParams,
): ProfessionalsFirstBookQuery {
  const fromQuery: ProfessionalsFirstBookQuery = {
    employeeId: params.get('employeeId')?.trim() ?? '',
    slot: params.get('slot')?.trim() ?? '',
    date: params.get('date')?.trim()?.slice(0, 10) ?? '',
    professionalsFirst: params.get('professionalsFirst') === '1',
  };
  if (fromQuery.professionalsFirst && fromQuery.employeeId && fromQuery.slot) {
    return {
      ...fromQuery,
      date: fromQuery.date || fromQuery.slot.slice(0, 10),
    };
  }

  if (!slug || !serviceId) return fromQuery;

  const persisted = readPersistedRecord(slug, serviceId);
  if (!persisted?.employeeId?.trim() || !persisted.startTime?.trim()) return fromQuery;

  const startTime = persisted.startTime.trim();
  return {
    employeeId: persisted.employeeId.trim(),
    slot: startTime,
    date: startTime.slice(0, 10),
    professionalsFirst: true,
  };
}

export function buildProfessionalsFirstBookPathFromQuery(
  slug: string,
  serviceId: string,
  query: Pick<ProfessionalsFirstBookQuery, 'employeeId' | 'slot'>,
): string {
  return buildProfessionalsFirstBookPath(slug, serviceId, query.employeeId, query.slot);
}
