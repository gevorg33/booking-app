import type { Business } from '../business/entities/business.entity.js';
import type { Repository } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import { enrichExplainSalonProfileParamsFromPrompt } from './ai-explain-salon-profile.util.js';
import type { SalonProfileAspect } from './ai-explain-salon-profile.fixtures.js';
import { readBusinessLocationSettings } from './ai-explain-business-hours-and-location.util.js';

export type ExplainSalonProfileLogicDeps = {
  businessRepo: Repository<Business>;
};

function readSalonBranding(settings: Record<string, unknown>): {
  tagline?: string;
  logoUrl?: string;
} {
  const branding = (settings.branding ?? {}) as Record<string, unknown>;
  const tagline =
    typeof branding.tagline === 'string' ? branding.tagline.trim() : undefined;
  const logoUrl =
    typeof branding.logoUrl === 'string' ? branding.logoUrl.trim() : undefined;
  return {
    ...(tagline ? { tagline } : {}),
    ...(logoUrl ? { logoUrl } : {}),
  };
}

function readSalonSocialLinks(
  settings: Record<string, unknown>,
): Record<string, string> {
  const social = (settings.social ?? {}) as Record<string, unknown>;
  const links: Record<string, string> = {};
  for (const [key, value] of Object.entries(social)) {
    if (typeof value === 'string' && value.trim()) {
      links[key] = value.trim();
    }
  }
  return links;
}

function buildSalonProfileSummary(
  business: Business,
  aspect: SalonProfileAspect,
  branding: ReturnType<typeof readSalonBranding>,
  socialLinks: Record<string, string>,
  hasMapEmbed: boolean,
): string {
  const parts: string[] = [`${business.name} — salon profile.`];
  if (aspect === 'overview' || aspect === 'all') {
    if (branding.tagline) parts.push(branding.tagline);
    if (business.description?.trim()) parts.push(business.description.trim());
  }
  if (aspect === 'photos' || aspect === 'all') {
    parts.push(
      hasMapEmbed
        ? 'View photos and location on the salon profile page.'
        : 'Open the salon profile page for business details.',
    );
  }
  if (aspect === 'reviews' || aspect === 'all') {
    parts.push('Browse stylist profiles and reviews from the salon profile.');
  }
  if (aspect === 'social' || aspect === 'all') {
    const socialCount = Object.keys(socialLinks).length;
    parts.push(
      socialCount > 0
        ? `Social links (${socialCount}) are on the salon profile page.`
        : 'Social links are listed on the salon profile when configured.',
    );
  }
  if (business.phone?.trim()) parts.push(`Phone: ${business.phone.trim()}.`);
  return parts.join(' ');
}

export async function handleExplainSalonProfileLogic(
  deps: ExplainSalonProfileLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'explain_salon_profile',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainSalonProfileParamsFromPrompt(
    params,
    textPrompt,
  );
  const aspect = enriched.aspect as SalonProfileAspect;
  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const branding = readSalonBranding(settings);
  const socialLinks = readSalonSocialLinks(settings);
  const locationSettings = readBusinessLocationSettings(settings);
  const hasMapEmbed = Boolean(locationSettings.mapEmbedHtml?.trim());

  const summary = buildSalonProfileSummary(
    business,
    aspect,
    branding,
    socialLinks,
    hasMapEmbed,
  );

  return {
    success: true,
    action: 'explain_salon_profile',
    summary,
    details: {
      aspect,
      businessName: business.name,
      tagline: branding.tagline ?? null,
      description: business.description ?? null,
      phone: business.phone ?? null,
      email: business.email ?? null,
      address: business.address ?? null,
      logoUrl: branding.logoUrl ?? null,
      socialLinks,
      hasMapEmbed,
      navigate: {
        path: 'profile',
        query: {},
      },
    },
  };
}
