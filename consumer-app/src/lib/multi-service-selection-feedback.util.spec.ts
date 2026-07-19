import { describe, expect, it } from 'vitest';
import { resolveBlockedMultiServiceAddReason } from './multi-service-selection-feedback.util.js';

const baseSettings = {
  incompatiblePairMode: 'service' as const,
  incompatiblePairs: [] as Array<[string, string]>,
  incompatibleCategoryPairs: [] as Array<[string, string]>,
  maxServiceCount: 5,
  maxDurationMinutes: 180,
  turnoverBufferMinutes: 0,
};

const services = [
  { id: 'a', durationMinutes: 30 },
  { id: 'b', durationMinutes: 30 },
  { id: 'c', durationMinutes: 30 },
  { id: 'd', durationMinutes: 30 },
  { id: 'e', durationMinutes: 30 },
  { id: 'f', durationMinutes: 30 },
  { id: 'long', durationMinutes: 200 },
  { id: 'x', durationMinutes: 30 },
  { id: 'y', durationMinutes: 30 },
];

describe('multi-service-selection-feedback.util', () => {
  it.each([
    {
      id: 'e2e-bug.24-max-count-blocks-sixth',
      selectedIds: ['a', 'b', 'c', 'd', 'e'],
      serviceId: 'f',
      settings: baseSettings,
      expected: 'max_count' as const,
    },
    {
      id: 'e2e-bug.24-duration-blocks-add',
      selectedIds: ['a'],
      serviceId: 'long',
      settings: baseSettings,
      expected: 'duration' as const,
    },
    {
      id: 'e2e-bug.24-incompatible-pair',
      selectedIds: ['x'],
      serviceId: 'y',
      settings: {
        ...baseSettings,
        incompatiblePairs: [['x', 'y'] as [string, string]],
      },
      expected: 'incompatible' as const,
    },
    {
      id: 'e2e-bug.24-allowed-returns-null',
      selectedIds: ['a'],
      serviceId: 'b',
      settings: baseSettings,
      expected: null,
    },
  ])('$id', ({ selectedIds, serviceId, settings, expected }) => {
    expect(
      resolveBlockedMultiServiceAddReason({
        serviceId,
        selectedIds,
        services,
        settings,
      }),
    ).toBe(expected);
  });

});
