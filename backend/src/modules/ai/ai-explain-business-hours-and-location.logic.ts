import type { Business } from '../business/entities/business.entity.js';
import type { Repository } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import {
  type BusinessHoursLocationAspect,
  enrichExplainBusinessHoursLocationParamsFromPrompt,
  extractGoogleMapsUrl,
  formatBusinessHoursLabel,
  formatWeekdayLabel,
  readBusinessLocationSettings,
} from './ai-explain-business-hours-and-location.util.js';
import type { PublicOpeningHours } from '../public-booking/public-opening-hours.util.js';

export type BusinessHoursLocationLogicDeps = {
  businessRepo: Repository<Business>;
  /** e2e-bug.227 — same schedule-template source as public profile openingHours. */
  loadOpeningHours?: (
    businessId: string,
  ) => Promise<PublicOpeningHours | undefined>;
};

function buildHoursSummary(
  businessName: string,
  settings: Record<string, unknown>,
  weekday?: string | null,
  openingHours?: PublicOpeningHours | null,
): string {
  const hoursLabel = formatBusinessHoursLabel(settings, weekday, openingHours);
  if (weekday) {
    return `${businessName} — ${formatWeekdayLabel(weekday)} hours: ${hoursLabel}.`;
  }
  return `${businessName} — opening hours: ${hoursLabel}.`;
}

function buildLocationSummary(
  businessName: string,
  business: Business,
  locationSettings: ReturnType<typeof readBusinessLocationSettings>,
): string {
  const parts = [`${businessName}`];
  if (business.address?.trim()) {
    parts.push(`Address: ${business.address.trim()}.`);
  }
  const mapsUrl = extractGoogleMapsUrl(locationSettings.mapEmbedHtml);
  if (mapsUrl) {
    parts.push(`Map: ${mapsUrl}`);
  } else if (!business.address?.trim()) {
    parts.push('Address details are not listed on the profile yet.');
  }
  return parts.join(' ');
}

function buildParkingSummary(
  businessName: string,
  locationSettings: ReturnType<typeof readBusinessLocationSettings>,
): string {
  if (locationSettings.parkingCopy) {
    return `${businessName} — parking: ${locationSettings.parkingCopy}`;
  }
  return `${businessName} — parking details are not listed on the profile yet.`;
}

export function buildBusinessHoursLocationSummary(input: {
  business: Business;
  aspect: BusinessHoursLocationAspect;
  weekday?: string | null;
  openingHours?: PublicOpeningHours | null;
}): string {
  const settings = (input.business.settings ?? {}) as Record<string, unknown>;
  const locationSettings = readBusinessLocationSettings(settings);

  switch (input.aspect) {
    case 'hours':
      return buildHoursSummary(
        input.business.name,
        settings,
        input.weekday,
        input.openingHours,
      );
    case 'location':
      return buildLocationSummary(
        input.business.name,
        input.business,
        locationSettings,
      );
    case 'parking':
      return buildParkingSummary(input.business.name, locationSettings);
    case 'hours_and_location':
    default:
      return [
        buildHoursSummary(
          input.business.name,
          settings,
          input.weekday,
          input.openingHours,
        ),
        buildLocationSummary(
          input.business.name,
          input.business,
          locationSettings,
        ),
        locationSettings.parkingCopy
          ? buildParkingSummary(input.business.name, locationSettings)
          : null,
      ]
        .filter(Boolean)
        .join(' ');
  }
}

export async function handleExplainBusinessHoursAndLocationLogic(
  deps: BusinessHoursLocationLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'explain_business_hours_and_location',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainBusinessHoursLocationParamsFromPrompt(
    params,
    textPrompt,
  );
  const aspect = enriched.aspect as BusinessHoursLocationAspect;
  const weekday = (enriched.weekday as string | undefined) ?? null;
  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const locationSettings = readBusinessLocationSettings(settings);
  const mapsUrl = extractGoogleMapsUrl(locationSettings.mapEmbedHtml);
  const openingHours = deps.loadOpeningHours
    ? await deps.loadOpeningHours(businessId)
    : undefined;
  const hoursLabel = formatBusinessHoursLabel(settings, weekday, openingHours);

  const summary = buildBusinessHoursLocationSummary({
    business,
    aspect,
    weekday,
    openingHours,
  });

  return {
    success: true,
    action: 'explain_business_hours_and_location',
    summary,
    details: {
      aspect,
      ...(weekday ? { weekday } : {}),
      hoursLabel,
      ...(openingHours?.summaryLines
        ? { openingHoursSummaryLines: openingHours.summaryLines }
        : {}),
      address: business.address ?? null,
      mapsUrl,
      parkingCopy: locationSettings.parkingCopy ?? null,
      phone: business.phone ?? null,
      email: business.email ?? null,
      navigate: {
        path: 'profile',
        query: {},
      },
    },
  };
}
