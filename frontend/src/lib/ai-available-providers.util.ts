import type { AiCommandDetails } from '@/lib/ai-client.types';

export interface AiAvailableProvider {
  id?: string;
  name: string;
  role?: string;
  earliestDateKey?: string;
  earliestStartTime?: string;
  previewTimes?: string[];
  matchedServiceName?: string;
  openSlots?: Array<{ start: string; end: string }>;
  scheduledBlocks?: Array<{ start: string; end: string }>;
}

function asProviderRow(value: unknown): AiAvailableProvider | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) return null;
  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    name,
    role: typeof row.role === 'string' ? row.role : undefined,
    earliestDateKey:
      typeof row.earliestDateKey === 'string' ? row.earliestDateKey : undefined,
    earliestStartTime:
      typeof row.earliestStartTime === 'string' ? row.earliestStartTime : undefined,
    previewTimes: Array.isArray(row.previewTimes)
      ? row.previewTimes.map(String)
      : undefined,
    matchedServiceName:
      typeof row.matchedServiceName === 'string' ? row.matchedServiceName : undefined,
    openSlots: Array.isArray(row.openSlots)
      ? (row.openSlots as Array<{ start: string; end: string }>)
      : undefined,
    scheduledBlocks: Array.isArray(row.scheduledBlocks)
      ? (row.scheduledBlocks as Array<{ start: string; end: string }>)
      : undefined,
  };
}

export function normalizeAvailableProviders(
  details?: AiCommandDetails | Record<string, unknown>,
): AiAvailableProvider[] {
  if (!details) return [];

  const row = details as Record<string, unknown>;
  const structured = [
    ...(Array.isArray(row.availability) ? row.availability : []),
    ...(Array.isArray(details.providers) ? details.providers : []),
  ]
    .map(asProviderRow)
    .filter((row): row is AiAvailableProvider => row !== null);

  if (structured.length > 0) {
    const seen = new Set<string>();
    return structured.filter((row) => {
      const key = row.id ?? row.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const names = Array.isArray(details.availableProviders)
    ? details.availableProviders.map(String).filter(Boolean)
    : [];
  return names.map((name) => ({ name }));
}

function normalizeBookableTime(value: string): string {
  const isoMatch = value.match(/T(\d{2}:\d{2})/);
  return isoMatch?.[1] ?? value;
}

export function listProviderBookableTimes(provider: AiAvailableProvider): string[] {
  if (provider.previewTimes?.length) {
    return provider.previewTimes.map(normalizeBookableTime);
  }
  if (provider.openSlots?.length) {
    return provider.openSlots.map((slot) => normalizeBookableTime(slot.start));
  }
  if (provider.earliestStartTime) {
    return [normalizeBookableTime(provider.earliestStartTime)];
  }
  return [];
}

export function formatProviderTimes(provider: AiAvailableProvider): string | null {
  const times = listProviderBookableTimes(provider);
  if (times.length > 0) {
    return times.join(', ');
  }
  return null;
}

export function buildProviderBookingPrompt(input: {
  provider: AiAvailableProvider;
  serviceName?: string;
  date?: string;
  time?: string;
}): string {
  const service = input.serviceName?.trim() || 'the service';
  const time =
    input.time ??
    listProviderBookableTimes(input.provider)[0];
  const datePart = input.date ? ` on ${input.date}` : '';
  if (time) {
    return `Book ${service} with ${input.provider.name}${datePart} at ${time}`;
  }
  return `Book ${service} with ${input.provider.name}${datePart}`;
}
