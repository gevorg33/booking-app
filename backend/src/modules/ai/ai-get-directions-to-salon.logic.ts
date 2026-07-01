import type { Business } from '../business/entities/business.entity.js';
import type { Repository } from 'typeorm';
import { buildSalonDirectionsLinks } from '../../common/utils/salon-directions.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { GetDirectionsToSalonAspect } from './ai-get-directions-to-salon.fixtures.js';
import {
  enrichGetDirectionsToSalonParamsFromPrompt,
  inferGetDirectionsToSalonAspect,
} from './ai-get-directions-to-salon.util.js';
import {
  extractGoogleMapsUrl,
  readBusinessLocationSettings,
} from './ai-explain-business-hours-and-location.util.js';

export type GetDirectionsToSalonLogicDeps = {
  businessRepo: Repository<Business>;
};

function buildDirectionsSummary(
  businessName: string,
  aspect: GetDirectionsToSalonAspect,
  links: ReturnType<typeof buildSalonDirectionsLinks>,
  parkingCopy: string | null,
): string {
  const parts: string[] = [];

  if (aspect === 'directions' || aspect === 'all') {
    if (links.directionsUrl) {
      parts.push(`${businessName} — directions: ${links.directionsUrl}`);
    } else if (links.address) {
      parts.push(`${businessName} — address: ${links.address}`);
    } else {
      parts.push(
        `${businessName} — address details are not listed on the profile yet.`,
      );
    }
  }

  if (aspect === 'parking' || aspect === 'all') {
    if (parkingCopy) {
      parts.push(`${businessName} — parking: ${parkingCopy}`);
    } else {
      parts.push(
        `${businessName} — parking details are not listed on the profile yet.`,
      );
    }
  }

  return parts.join(' ');
}

export function buildGetDirectionsToSalonSummary(input: {
  business: Business;
  aspect: GetDirectionsToSalonAspect;
  links: ReturnType<typeof buildSalonDirectionsLinks>;
  parkingCopy: string | null;
}): string {
  return buildDirectionsSummary(
    input.business.name,
    input.aspect,
    input.links,
    input.parkingCopy,
  );
}

export async function handleGetDirectionsToSalonLogic(
  deps: GetDirectionsToSalonLogicDeps,
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
      action: 'get_directions_to_salon',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichGetDirectionsToSalonParamsFromPrompt(
    params,
    textPrompt,
  );
  const aspect = enriched.aspect as GetDirectionsToSalonAspect;
  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const locationSettings = readBusinessLocationSettings(settings);
  const links = buildSalonDirectionsLinks({
    address: business.address,
    mapsEmbedHtml: locationSettings.mapEmbedHtml,
    extractMapsUrl: extractGoogleMapsUrl,
  });
  const parkingCopy = locationSettings.parkingCopy ?? null;

  const summary = buildGetDirectionsToSalonSummary({
    business,
    aspect,
    links,
    parkingCopy,
  });

  return {
    success: true,
    action: 'get_directions_to_salon',
    summary,
    details: {
      aspect,
      address: links.address,
      directionsUrl: links.directionsUrl,
      mapsUrl: links.mapsUrl,
      parkingCopy,
      navigate: {
        path: 'profile',
        query: {},
      },
    },
  };
}

export { inferGetDirectionsToSalonAspect };
