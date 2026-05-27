const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PublicBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  branding: PublicBranding;
  publicBookingEnabled: boolean;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  nearestDate: string | null;
  nearestDateLabel: string | null;
  slots: Array<{ startTime: string; endTime: string }>;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || body?.error || `Request failed (${res.status})`);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export function getPublicProfile(slug: string) {
  return publicFetch<PublicBusinessProfile>(`/public/${slug}`);
}

export function getPublicProviders(slug: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return publicFetch<{ providers: PublicProvider[] }>(`/public/${slug}/providers${q}`);
}

export function getPublicProviderSlots(slug: string, employeeId: string, date: string) {
  return publicFetch<{ date: string; employeeId: string; employeeName: string; slots: Array<{ startTime: string; endTime: string }> }>(
    `/public/${slug}/providers/${employeeId}/slots?date=${encodeURIComponent(date)}`,
  );
}

export function getPublicServicesForSlot(slug: string, employeeId: string, startTime: string) {
  return publicFetch<{ services: PublicService[] }>(
    `/public/${slug}/services/for-slot?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`,
  );
}

export function createPublicBooking(
  slug: string,
  body: {
    employeeId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
    customer: { name: string; email?: string; phone?: string };
  },
) {
  return publicFetch<{ booking: unknown; customer: { id: string; name: string; created: boolean } }>(
    `/public/${slug}/bookings`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export interface PublicAssistantNavigate {
  path: 'professionals' | 'services' | 'checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResponse {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
}

export function sendPublicAssistantMessage(
  slug: string,
  body: {
    prompt: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    context?: Record<string, unknown>;
  },
) {
  return publicFetch<PublicAssistantResponse>(`/public/${slug}/assistant`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}
