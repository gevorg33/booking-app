import {
  extractClinicMetadata,
  isClinicService,
} from './clinic-service.util.js';
import { extractTourMetadata, isTourService } from './tour-service.util.js';

export type ServicePreparationAspect =
  | 'fasting'
  | 'preparation'
  | 'what_to_bring'
  | 'meeting_point'
  | 'all';

export interface ServicePreparationSnapshot {
  serviceId: string;
  serviceName: string;
  isClinic: boolean;
  isTour: boolean;
  requiresFasting: boolean | null;
  preparationNotes: string | null;
  meetingPoint: string | null;
  includedItems: string | null;
}

export function buildServicePreparationSnapshot(input: {
  id: string;
  name: string;
  metadata?: Record<string, unknown> | null;
}): ServicePreparationSnapshot {
  const metadata = input.metadata ?? {};
  const clinic = isClinicService(metadata)
    ? extractClinicMetadata(metadata)
    : null;
  const tour = isTourService(metadata) ? extractTourMetadata(metadata) : null;

  return {
    serviceId: input.id,
    serviceName: input.name,
    isClinic: clinic !== null,
    isTour: tour !== null,
    requiresFasting:
      clinic?.requiresFasting === true ? true : clinic ? false : null,
    preparationNotes: clinic?.preparationNotes ?? null,
    meetingPoint: tour?.meetingPoint ?? null,
    includedItems: tour?.includedItems ?? null,
  };
}

export function buildServicePreparationSummary(
  snapshot: ServicePreparationSnapshot,
  aspect: ServicePreparationAspect,
): string {
  const parts: string[] = [`"${snapshot.serviceName}"`];

  const includeFasting = aspect === 'fasting' || aspect === 'all';
  const includePrep = aspect === 'preparation' || aspect === 'all';
  const includeBring = aspect === 'what_to_bring' || aspect === 'all';
  const includeMeeting = aspect === 'meeting_point' || aspect === 'all';

  if (includeFasting) {
    if (snapshot.requiresFasting === true) {
      parts.push('fasting is required before this visit');
    } else if (snapshot.isClinic) {
      parts.push('no fasting requirement is set for this service');
    }
  }

  if (includePrep && snapshot.preparationNotes) {
    parts.push(`preparation notes: ${snapshot.preparationNotes}`);
  } else if (includePrep && snapshot.isClinic) {
    parts.push('no preparation notes are listed for this service yet');
  }

  if (includeBring && snapshot.includedItems) {
    parts.push(`what to bring: ${snapshot.includedItems}`);
  } else if (includeBring && snapshot.isTour) {
    parts.push('no bring-list is listed for this tour yet');
  } else if (includeBring && !snapshot.isTour && !snapshot.isClinic) {
    parts.push('no special items are listed for this service');
  }

  if (includeMeeting && snapshot.meetingPoint) {
    parts.push(`meeting point: ${snapshot.meetingPoint}`);
  } else if (includeMeeting && snapshot.isTour) {
    parts.push('no meeting point is listed for this tour yet');
  }

  if (parts.length === 1) {
    return `${snapshot.serviceName} — no visit preparation details are listed on this service yet.`;
  }

  return parts.join(' — ') + '.';
}
