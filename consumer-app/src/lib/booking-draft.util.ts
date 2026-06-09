const DRAFT_KEY = 'consumer_booking_draft';

export interface BookingDraft {
  slug: string;
  serviceId: string;
  employeeId?: string;
  date?: string;
  slot?: string;
  guestContact?: {
    name: string;
    email: string;
    phone: string;
  };
  updatedAt: string;
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDraft;
    if (!parsed.slug || !parsed.serviceId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: Omit<BookingDraft, 'updatedAt'>): void {
  if (typeof localStorage === 'undefined') return;
  const next: BookingDraft = { ...draft, updatedAt: new Date().toISOString() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}

export function clearBookingDraft(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

export function buildBookingDraftResumePath(draft: BookingDraft): string {
  const base = `/s/${draft.slug}/book/${draft.serviceId}`;
  const params = new URLSearchParams();
  if (draft.date) params.set('date', draft.date);
  if (draft.slot) params.set('slot', draft.slot);
  if (draft.employeeId) params.set('employeeId', draft.employeeId);
  params.set('resume', '1');
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function isBookingDraftStale(draft: BookingDraft, now: Date = new Date()): boolean {
  const updatedAt = Date.parse(draft.updatedAt);
  if (!Number.isFinite(updatedAt)) return true;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return now.getTime() - updatedAt > maxAgeMs;
}

export type BookingAbandonedStep = 'service' | 'slot' | 'confirm';

export function resolveAbandonedStepFromDraft(draft: BookingDraft): BookingAbandonedStep {
  if (draft.slot?.trim()) return 'confirm';
  if (draft.date?.trim()) return 'slot';
  return 'service';
}

export function hasResumableBookingProgress(draft: BookingDraft | null | undefined): boolean {
  if (!draft?.slug || !draft.serviceId) return false;
  return Boolean(
    draft.slot?.trim() ||
      draft.date?.trim() ||
      draft.employeeId?.trim() ||
      draft.guestContact?.name?.trim() ||
      draft.guestContact?.email?.trim() ||
      draft.guestContact?.phone?.trim(),
  );
}

export function buildBookingResumeAnalyticsProps(
  draft: BookingDraft,
  onboardingVariant?: string | null,
): {
  serviceId: string;
  abandonedStep: BookingAbandonedStep;
  onboardingVariant?: string;
} {
  return {
    serviceId: draft.serviceId,
    abandonedStep: resolveAbandonedStepFromDraft(draft),
    ...(onboardingVariant ? { onboardingVariant } : {}),
  };
}

export function isBookingDraftResumePath(pathname: string, draft: BookingDraft): boolean {
  const expectedPrefix = `/s/${draft.slug}/book/${draft.serviceId}`;
  return pathname === expectedPrefix || pathname.startsWith(`${expectedPrefix}?`);
}
