const STORAGE_KEY = 'consumer_recent_salons';
const PINNED_KEY = 'consumer_pinned_salons';
const MAX_RECENT = 8;

export interface RecentSalon {
  slug: string;
  name: string;
  logoUrl?: string;
  visitedAt: string;
  lastBookedAt?: string;
}

export interface WelcomeSalonEntry extends RecentSalon {
  pinned: boolean;
  subtitle: string;
}

export interface WelcomeSalonSections {
  quickReturn: WelcomeSalonEntry[];
  saved: WelcomeSalonEntry[];
  recent: WelcomeSalonEntry[];
}

export function loadRecentSalons(): RecentSalon[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSalon[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecentSalons(next: RecentSalon[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
}

export function salonRecencyTimestamp(salon: RecentSalon): number {
  return Date.parse(salon.lastBookedAt ?? salon.visitedAt) || 0;
}

export function sortSalonsByRecency(salons: RecentSalon[]): RecentSalon[] {
  return [...salons].sort((left, right) => salonRecencyTimestamp(right) - salonRecencyTimestamp(left));
}

export function rememberSalon(
  entry: Omit<RecentSalon, 'visitedAt'> & { lastBookedAt?: string },
): void {
  if (typeof localStorage === 'undefined') return;
  const now = new Date().toISOString();
  const previous = loadRecentSalons().find((salon) => salon.slug === entry.slug);
  const existing = loadRecentSalons().filter((salon) => salon.slug !== entry.slug);
  const next: RecentSalon[] = [
    {
      ...previous,
      ...entry,
      visitedAt: now,
      lastBookedAt: entry.lastBookedAt ?? previous?.lastBookedAt,
    },
    ...existing,
  ];
  persistRecentSalons(next);
}

export function rememberBookedSalon(
  entry: Omit<RecentSalon, 'visitedAt' | 'lastBookedAt'>,
): void {
  rememberSalon({ ...entry, lastBookedAt: new Date().toISOString() });
}

export function loadPinnedSalonSlugs(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isSalonPinned(slug: string): boolean {
  return loadPinnedSalonSlugs().includes(slug);
}

export function pinSalon(slug: string): void {
  if (typeof localStorage === 'undefined') return;
  const pinned = loadPinnedSalonSlugs().filter((entry) => entry !== slug);
  localStorage.setItem(PINNED_KEY, JSON.stringify([slug, ...pinned].slice(0, MAX_RECENT)));
}

export function unpinSalon(slug: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    PINNED_KEY,
    JSON.stringify(loadPinnedSalonSlugs().filter((entry) => entry !== slug)),
  );
}

export function toggleSalonPin(slug: string): boolean {
  if (isSalonPinned(slug)) {
    unpinSalon(slug);
    return false;
  }
  pinSalon(slug);
  return true;
}

function resolveSalonRecord(slug: string, recentBySlug: Map<string, RecentSalon>): RecentSalon {
  return (
    recentBySlug.get(slug) ?? {
      slug,
      name: slug,
      visitedAt: new Date(0).toISOString(),
    }
  );
}

export function loadSavedSalons(): RecentSalon[] {
  const pinnedSlugs = loadPinnedSalonSlugs();
  if (pinnedSlugs.length === 0) return [];
  const recentBySlug = new Map(loadRecentSalons().map((salon) => [salon.slug, salon]));
  return pinnedSlugs.map((slug) => resolveSalonRecord(slug, recentBySlug));
}

function dedupeSalonsBySlug(salons: RecentSalon[]): RecentSalon[] {
  const seen = new Set<string>();
  const next: RecentSalon[] = [];
  for (const salon of salons) {
    if (seen.has(salon.slug)) continue;
    seen.add(salon.slug);
    next.push(salon);
  }
  return next;
}

export function formatSalonRecencySubtitle(
  salon: RecentSalon,
  now: Date = new Date(),
): string {
  const reference = salon.lastBookedAt ?? salon.visitedAt;
  const then = Date.parse(reference);
  if (!Number.isFinite(then)) return salon.name;

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - then) / dayMs);
  const prefix = salon.lastBookedAt ? 'Booked' : 'Visited';

  if (diffDays <= 0) return `${prefix} today`;
  if (diffDays === 1) return `${prefix} yesterday`;
  if (diffDays < 7) return `${prefix} ${diffDays} days ago`;
  return `${prefix} on ${new Date(then).toLocaleDateString()}`;
}

function toWelcomeEntry(salon: RecentSalon, pinned: boolean, now: Date): WelcomeSalonEntry {
  return {
    ...salon,
    pinned,
    subtitle: formatSalonRecencySubtitle(salon, now),
  };
}

export function buildWelcomeSalonSections(now: Date = new Date()): WelcomeSalonSections {
  const pinnedSlugs = new Set(loadPinnedSalonSlugs());
  const recent = sortSalonsByRecency(loadRecentSalons());
  // Pin order (most recently pinned first) — not recency, so saves stay findable.
  const saved = loadSavedSalons();
  const savedSlugs = new Set(saved.map((salon) => salon.slug));
  const recentOnly = recent.filter((salon) => !savedSlugs.has(salon.slug));
  const recentCapped = recentOnly.slice(0, MAX_RECENT);

  // e2e-bug.21 — pinned first and never sliced away by the recent-only MAX_RECENT cap.
  const quickReturn = dedupeSalonsBySlug([...saved, ...recentCapped]).map((salon) =>
    toWelcomeEntry(salon, pinnedSlugs.has(salon.slug), now),
  );

  return {
    quickReturn,
    saved: saved.map((salon) => toWelcomeEntry(salon, true, now)),
    recent: recentCapped.map((salon) => toWelcomeEntry(salon, false, now)),
  };
}
