import { describe, expect, it, jest } from '@jest/globals';
import {
  handleCreateLocationLogic,
  handleUpdateLocationLogic,
  type LocationsLogicDeps,
} from './ai-locations.logic.js';

const existingLocations = [
  { id: 'loc-1', name: 'Downtown', isDefault: true },
  { id: 'loc-2', name: 'Uptown Branch', isDefault: false },
];

function buildDeps(overrides: Record<string, any> = {}): LocationsLogicDeps {
  return {
    locationsService: {
      findAll: jest.fn(async () => existingLocations),
      create: jest.fn(async (_biz: string, dto: any) => ({
        id: 'loc-new',
        isDefault: false,
        ...dto,
      })),
      update: jest.fn(async (id: string, _biz: string, dto: any) => ({
        id,
        name: existingLocations.find((l) => l.id === id)?.name,
        ...dto,
      })),
      ...overrides,
    } as any,
  };
}

describe('ai-locations.logic (ai-cmd-dashboard-6.12.3)', () => {
  describe('handleCreateLocationLogic', () => {
    it('clarifies when no name is given', async () => {
      const result = await handleCreateLocationLogic(buildDeps(), 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('creates the location', async () => {
      const deps = buildDeps();
      const result = await handleCreateLocationLogic(deps, 'biz-1', {
        name: 'Uptown Branch',
        address: '123 Main St',
      });
      expect(result.success).toBe(true);
      expect(deps.locationsService.create).toHaveBeenCalledWith('biz-1', {
        name: 'Uptown Branch',
        address: '123 Main St',
      });
    });

    it('accepts locationName as an alias for name', async () => {
      const result = await handleCreateLocationLogic(buildDeps(), 'biz-1', {
        locationName: 'Westside',
      });
      expect(result.success).toBe(true);
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        create: jest.fn(async () => {
          throw new Error('Location name already exists');
        }),
      });
      const result = await handleCreateLocationLogic(deps, 'biz-1', {
        name: 'Downtown',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('already exists');
    });
  });

  describe('handleUpdateLocationLogic', () => {
    it('clarifies when the location cannot be resolved', async () => {
      const result = await handleUpdateLocationLogic(buildDeps(), 'biz-1', {
        newName: 'New Name',
      });
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('clarifies when no field is given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateLocationLogic(deps, 'biz-1', {
        locationName: 'Downtown',
      });
      expect(result.success).toBe(false);
      expect(deps.locationsService.update).not.toHaveBeenCalled();
    });

    it('updates the resolved location by name', async () => {
      const deps = buildDeps();
      const result = await handleUpdateLocationLogic(deps, 'biz-1', {
        locationName: 'downtown',
        phone: '555-0100',
      });
      expect(result.success).toBe(true);
      expect(deps.locationsService.update).toHaveBeenCalledWith(
        'loc-1',
        'biz-1',
        { phone: '555-0100' },
      );
    });

    it('updates the resolved location by id', async () => {
      const deps = buildDeps();
      const result = await handleUpdateLocationLogic(deps, 'biz-1', {
        locationId: 'loc-2',
        isDefault: true,
      });
      expect(result.success).toBe(true);
      expect(deps.locationsService.update).toHaveBeenCalledWith(
        'loc-2',
        'biz-1',
        { isDefault: true },
      );
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        update: jest.fn(async () => {
          throw new Error('Cannot delete the default location');
        }),
      });
      const result = await handleUpdateLocationLogic(deps, 'biz-1', {
        locationName: 'Downtown',
        newName: 'New Downtown',
      });
      expect(result.success).toBe(false);
    });
  });
});
