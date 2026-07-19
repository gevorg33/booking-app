import { shouldShowPatientResultsTab } from './clinic-service.js';

export type SalonTabId =
  | 'home'
  | 'services'
  | 'account'
  | 'results'
  | 'lab-to-book'
  | 'lab-requests';

/** Clinic-only tabs — non-clinic businesses must not mount these pages (e2e-bug.43). */
export function isClinicOnlySalonTab(page: SalonTabId): boolean {
  return page === 'results' || page === 'lab-to-book' || page === 'lab-requests';
}

export function resolveSalonTabId(
  pathname: string,
  slug: string,
  options?: { businessType?: string | null },
): SalonTabId | 'redirect-home' {
  const base = `/s/${slug}`;
  if (pathname === base) return 'redirect-home';

  const suffix = pathname.slice(base.length);
  let tab: SalonTabId | 'redirect-home';
  switch (suffix) {
    case '/home':
      tab = 'home';
      break;
    case '/services':
      tab = 'services';
      break;
    case '/account':
      tab = 'account';
      break;
    case '/results':
      tab = 'results';
      break;
    case '/lab-to-book':
      tab = 'lab-to-book';
      break;
    case '/lab-requests':
      tab = 'lab-requests';
      break;
    default:
      return 'redirect-home';
  }

  // When businessType is known, bounce clinic-only deep links for non-clinic salons.
  if (
    options &&
    'businessType' in options &&
    isClinicOnlySalonTab(tab) &&
    !shouldShowPatientResultsTab(options.businessType)
  ) {
    return 'redirect-home';
  }
  return tab;
}

export function buildSalonTabHomePath(slug: string): string {
  return `/s/${slug}/home`;
}
