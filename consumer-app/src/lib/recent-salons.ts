const STORAGE_KEY = 'consumer_recent_salons';
const MAX_RECENT = 8;

export interface RecentSalon {
  slug: string;
  name: string;
  logoUrl?: string;
  visitedAt: string;
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

export function rememberSalon(entry: Omit<RecentSalon, 'visitedAt'>): void {
  if (typeof localStorage === 'undefined') return;
  const now = new Date().toISOString();
  const existing = loadRecentSalons().filter((s) => s.slug !== entry.slug);
  const next: RecentSalon[] = [{ ...entry, visitedAt: now }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
