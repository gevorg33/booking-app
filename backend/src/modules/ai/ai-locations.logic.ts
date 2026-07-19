import type { LocationsService } from '../locations/locations.service.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveLocationFromList, type LocationLike } from './ai-locations.util.js';

export interface LocationsLogicDeps {
  locationsService: Pick<LocationsService, 'findAll' | 'create' | 'update'>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveLocationOrFail(
  deps: LocationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  action: string,
): Promise<
  { ok: true; location: LocationLike } | { ok: false; result: CommandResult }
> {
  const locations = await deps.locationsService.findAll(businessId);
  const location = resolveLocationFromList(locations, params);
  if (!location) {
    return {
      ok: false,
      result: failure(
        action,
        'Which location is this? Provide locationId or locationName.',
        { clarify: true, missing: ['locationName', 'locationId'] },
      ),
    };
  }
  return { ok: true, location };
}

export async function handleCreateLocationLogic(
  deps: LocationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'create_location';
  const name =
    typeof params.name === 'string' && params.name.trim()
      ? params.name.trim()
      : typeof params.locationName === 'string' && params.locationName.trim()
        ? params.locationName.trim()
        : '';
  if (!name) {
    return failure(action, 'What should this location be called?', {
      clarify: true,
      missing: ['name'],
    });
  }

  const address =
    typeof params.address === 'string' ? params.address : undefined;
  const phone = typeof params.phone === 'string' ? params.phone : undefined;
  const timezone =
    typeof params.timezone === 'string' ? params.timezone : undefined;
  const isDefault =
    typeof params.isDefault === 'boolean' ? params.isDefault : undefined;

  try {
    const location = await deps.locationsService.create(businessId, {
      name,
      ...(address !== undefined ? { address } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
    });
    return success(action, `Created location "${location.name}".`, {
      location,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not create the location.');
  }
}

export async function handleUpdateLocationLogic(
  deps: LocationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_location';
  const resolved = await resolveLocationOrFail(deps, businessId, params, action);
  if (!resolved.ok) return resolved.result;

  const name =
    typeof params.newName === 'string' && params.newName.trim()
      ? params.newName.trim()
      : undefined;
  const address =
    typeof params.address === 'string' ? params.address : undefined;
  const phone = typeof params.phone === 'string' ? params.phone : undefined;
  const timezone =
    typeof params.timezone === 'string' ? params.timezone : undefined;
  const isDefault =
    typeof params.isDefault === 'boolean' ? params.isDefault : undefined;

  if (
    name === undefined &&
    address === undefined &&
    phone === undefined &&
    timezone === undefined &&
    isDefault === undefined
  ) {
    return failure(
      action,
      `What should I change on "${resolved.location.name}"? Provide a new name, address, phone, timezone, or default status.`,
    );
  }

  try {
    const location = await deps.locationsService.update(
      resolved.location.id,
      businessId,
      {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    );
    return success(action, `Updated location "${location.name}".`, {
      location,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not update the location.');
  }
}
