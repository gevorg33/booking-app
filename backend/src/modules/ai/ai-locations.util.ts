/** ai-cmd-dashboard-6.12.3 — business location CRUD (dashboard, manager+). */

export const DASHBOARD_LOCATIONS_MUTATE_INTENTS = [
  'create_location',
  'update_location',
] as const;

export type LocationsIntent = (typeof DASHBOARD_LOCATIONS_MUTATE_INTENTS)[number];

const LOCATIONS_INTENT_SET = new Set<string>(DASHBOARD_LOCATIONS_MUTATE_INTENTS);

export function isLocationsIntent(action: string): action is LocationsIntent {
  return LOCATIONS_INTENT_SET.has(action);
}

export interface LocationLike {
  id: string;
  name: string;
}

export function resolveLocationFromList<T extends LocationLike>(
  locations: T[],
  params: Record<string, unknown>,
): T | undefined {
  const id =
    typeof params.locationId === 'string' && params.locationId.trim()
      ? params.locationId.trim()
      : undefined;
  if (id) return locations.find((entry) => entry.id === id);

  const name =
    typeof params.locationName === 'string' && params.locationName.trim()
      ? params.locationName.trim()
      : undefined;
  if (!name) return undefined;

  const needle = name.toLowerCase();
  return (
    locations.find((entry) => entry.name.toLowerCase() === needle) ??
    locations.find((entry) => entry.name.toLowerCase().includes(needle))
  );
}
