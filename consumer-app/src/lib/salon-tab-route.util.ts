export type SalonTabId =
  | 'home'
  | 'services'
  | 'account'
  | 'results'
  | 'lab-to-book'
  | 'lab-requests';

export function resolveSalonTabId(
  pathname: string,
  slug: string,
): SalonTabId | 'redirect-home' {
  const base = `/s/${slug}`;
  if (pathname === base) return 'redirect-home';

  const suffix = pathname.slice(base.length);
  switch (suffix) {
    case '/home':
      return 'home';
    case '/services':
      return 'services';
    case '/account':
      return 'account';
    case '/results':
      return 'results';
    case '/lab-to-book':
      return 'lab-to-book';
    case '/lab-requests':
      return 'lab-requests';
    default:
      return 'redirect-home';
  }
}

export function buildSalonTabHomePath(slug: string): string {
  return `/s/${slug}/home`;
}
