import type { DeferredInstallLink } from './deferred-install-link.util.js';

/** Query flag — post-install resume lands on confirm, not slot search (n99-3.1). */
export const DEFERRED_INSTALL_RESUME_PARAM = 'deferredResume';

export interface DeferredInstallResumeContext {
  isResume: boolean;
  skipSlotDiscovery: boolean;
  collapseScheduleUi: boolean;
}

function buildSalonPath(slug: string, subpath = ''): string {
  const base = `/s/${slug}`;
  if (!subpath) return base;
  return `${base}${subpath.startsWith('/') ? subpath : `/${subpath}`}`;
}

function buildBookServicePath(
  slug: string,
  serviceId: string,
  options?: { employeeId?: string | null },
): string {
  const base = buildSalonPath(slug, `/book/${serviceId}`);
  const employeeId = options?.employeeId?.trim();
  if (!employeeId) return base;
  return `${base}?${new URLSearchParams({ employeeId }).toString()}`;
}

export interface DeferredInstallResumeContext {
  isResume: boolean;
  skipSlotDiscovery: boolean;
  collapseScheduleUi: boolean;
}

export function buildDeferredInstallResumePath(link: DeferredInstallLink): string {
  if (!link.serviceId?.trim()) {
    return buildSalonPath(link.slug);
  }

  const base = buildSalonPath(link.slug, `/book/${link.serviceId.trim()}`);
  const params = new URLSearchParams();

  if (link.date?.trim()) params.set('date', link.date.trim().slice(0, 10));
  if (link.slot?.trim()) params.set('slot', link.slot.trim());
  if (link.employeeId?.trim()) params.set('employeeId', link.employeeId.trim());
  params.set(DEFERRED_INSTALL_RESUME_PARAM, '1');

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function resolveDeferredInstallNavigationPath(link: DeferredInstallLink): string {
  if (link.serviceId?.trim() && link.slot?.trim()) {
    return buildDeferredInstallResumePath(link);
  }
  if (link.serviceId?.trim()) {
    return buildBookServicePath(link.slug, link.serviceId.trim(), {
      employeeId: link.employeeId,
    });
  }
  return buildSalonPath(link.slug);
}

export function mergeDeferredInstallLink(
  base: DeferredInstallLink,
  patch: Partial<Omit<DeferredInstallLink, 'slug' | 'capturedAt'>>,
): DeferredInstallLink {
  return {
    ...base,
    serviceId: patch.serviceId?.trim() || base.serviceId,
    referralCode: patch.referralCode?.trim().toUpperCase() || base.referralCode,
    installSource: patch.installSource ?? base.installSource,
    campaign: patch.campaign?.trim() || base.campaign,
    date: patch.date?.trim().slice(0, 10) || base.date,
    slot: patch.slot?.trim() || base.slot,
    employeeId: patch.employeeId?.trim() || base.employeeId,
  };
}

export function readDeferredInstallResumeContext(
  search: string,
  slot: string,
): DeferredInstallResumeContext {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const isResume = params.get(DEFERRED_INSTALL_RESUME_PARAM) === '1' && Boolean(slot.trim());
  return {
    isResume,
    skipSlotDiscovery: isResume,
    collapseScheduleUi: isResume,
  };
}

export function normalizeDeferredBookingFields(input: {
  date?: string | null;
  slot?: string | null;
  employeeId?: string | null;
}): Pick<DeferredInstallLink, 'date' | 'slot' | 'employeeId'> {
  const date = input.date?.trim().slice(0, 10) || undefined;
  const slot = input.slot?.trim() || undefined;
  const employeeId = input.employeeId?.trim() || undefined;
  return { date, slot, employeeId };
}
