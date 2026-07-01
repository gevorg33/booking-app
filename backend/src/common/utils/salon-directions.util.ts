export interface SalonDirectionsLinks {
  directionsUrl: string | null;
  mapsUrl: string | null;
  address: string | null;
}

export function buildGoogleMapsDirectionsUrl(
  address: string | null | undefined,
): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`;
}

export function buildSalonDirectionsLinks(input: {
  address?: string | null;
  mapsEmbedHtml?: string | null;
  extractMapsUrl?: (mapEmbedHtml?: string) => string | null;
}): SalonDirectionsLinks {
  const address = input.address?.trim() || null;
  const extractMapsUrl =
    input.extractMapsUrl ??
    ((html?: string) => {
      if (!html) return null;
      const match = html.match(/src=["']([^"']+)["']/i);
      const src = match?.[1]?.trim();
      return src && /^https?:\/\//i.test(src) ? src : null;
    });

  return {
    directionsUrl: buildGoogleMapsDirectionsUrl(address),
    mapsUrl: extractMapsUrl(input.mapsEmbedHtml ?? undefined),
    address,
  };
}
