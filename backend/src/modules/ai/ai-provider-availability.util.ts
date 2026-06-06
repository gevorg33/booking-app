import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import { buildNoProvidersAvailableMessage } from './ai-booking-slot-messages.util.js';
import type { TimeOfDayWindow } from './ai-operations.util.js';
import type { RecommendedProvider } from '../public-booking/public-booking.service.js';

export interface ProviderAvailabilityRow {
  id: string;
  name: string;
  role?: string;
  earliestDateKey: string;
  earliestStartTime: string;
  previewTimes: string[];
  matchedServiceName: string;
}

export function mapRecommendedProviders(
  providers: RecommendedProvider[],
): ProviderAvailabilityRow[] {
  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    role: provider.role,
    earliestDateKey: provider.earliestDateKey ?? '',
    earliestStartTime: provider.earliestStartTime ?? '',
    previewTimes: provider.previewTimes ?? [],
    matchedServiceName: provider.matchedServiceName ?? '',
  }));
}

export function buildCheckProvidersSummary(input: {
  serviceName: string;
  dateKey: string;
  providers: RecommendedProvider[];
  timeOfDay?: TimeOfDayWindow | string | null;
  notBeforeTime?: string | null;
}): {
  summary: string;
  availableProviders: string[];
  availability: ProviderAvailabilityRow[];
} {
  const displayDay = formatDateDisplay(input.dateKey);

  if (input.providers.length === 0) {
    return {
      summary: buildNoProvidersAvailableMessage({
        serviceName: input.serviceName,
        dateKey: input.dateKey,
        timeOfDay: input.timeOfDay,
        notBeforeTime: input.notBeforeTime,
      }),
      availableProviders: [],
      availability: [],
    };
  }

  const lines = [
    `${input.providers.length} provider(s) available for ${input.serviceName} on ${displayDay}:`,
    ...input.providers.map((provider) => {
      const times = provider.previewTimes?.length
        ? provider.previewTimes.join(', ')
        : (provider.earliestStartTime ?? 'open');
      const role = provider.role ? ` (${provider.role})` : '';
      return `• ${provider.name}${role} — ${times}`;
    }),
    '',
    'Tap a provider below or reply with a name and time to book.',
  ];

  const availability = mapRecommendedProviders(input.providers);

  return {
    summary: lines.join('\n'),
    availableProviders: availability.map((row) => row.name),
    availability,
  };
}
