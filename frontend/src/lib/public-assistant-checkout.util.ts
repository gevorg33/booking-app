import type { PublicAssistantNavigate } from '@/lib/public-api';
import type { AiAvailableProvider } from '@/lib/ai-available-providers.util';

export interface AssistantBlockSlot {
  startTime: string;
  employeeId?: string;
  employeeName: string;
}

function normalizeSlotTime(value: string): string {
  const isoMatch = value.match(/T(\d{2}:\d{2})/);
  return isoMatch?.[1] ?? value;
}

export function resolveAssistantSlotStartTime(
  slots: AssistantBlockSlot[] | undefined,
  provider: Pick<AiAvailableProvider, 'id' | 'name'>,
  time: string,
): string | undefined {
  if (!slots?.length) return undefined;
  const match = slots.find((slot) => {
    const sameProvider =
      (provider.id && slot.employeeId === provider.id) ||
      slot.employeeName === provider.name;
    if (!sameProvider) return false;
    return normalizeSlotTime(slot.startTime) === time;
  });
  return match?.startTime;
}

export function buildPublicAssistantCheckoutNavigate(
  details: Record<string, unknown> | undefined,
  provider: AiAvailableProvider,
  time: string,
): PublicAssistantNavigate | null {
  if (!details) return null;

  const slots = Array.isArray(details.slots)
    ? (details.slots as AssistantBlockSlot[])
    : undefined;
  const startTime =
    resolveAssistantSlotStartTime(slots, provider, time) ??
    provider.earliestStartTime;
  const employeeId =
    provider.id ??
    slots?.find(
      (slot) =>
        slot.employeeName === provider.name &&
        normalizeSlotTime(slot.startTime) === time,
    )?.employeeId;

  if (!employeeId || !startTime) return null;

  const serviceIds = Array.isArray(details.serviceIds)
    ? details.serviceIds.map(String).filter(Boolean)
    : typeof details.serviceId === 'string'
      ? [details.serviceId]
      : [];

  if (serviceIds.length > 1) {
    return {
      path: 'multi/checkout',
      query: {
        services: serviceIds.join(','),
        startTime,
        employeeId,
        ...(provider.name ? { employeeName: provider.name } : {}),
      },
    };
  }

  if (serviceIds.length === 1) {
    return {
      path: 'checkout',
      query: {
        serviceId: serviceIds[0]!,
        startTime,
        employeeId,
      },
    };
  }

  return null;
}
