import {
  DEFAULT_MULTI_SERVICE_SETTINGS,
  applyMultiServiceSettingsToBusinessSettings,
  mergeMultiServiceSettingsPatch,
  resolveMultiServiceSettings,
} from './multi-service-settings.util.js';

describe('multi-service-settings.util', () => {
  it('returns defaults when settings are missing', () => {
    expect(resolveMultiServiceSettings(null)).toEqual(DEFAULT_MULTI_SERVICE_SETTINGS);
  });

  it('reads nested publicBooking.multiService settings', () => {
    const settings = resolveMultiServiceSettings({
      publicBooking: {
        multiService: {
          enabled: true,
          maxServiceCount: 3,
          maxDurationMinutes: 120,
          turnoverBufferMinutes: 10,
          schedulingMode: 'per_service',
          incompatiblePairs: [['a', 'b']],
        },
      },
    });
    expect(settings.enabled).toBe(true);
    expect(settings.maxServiceCount).toBe(3);
    expect(settings.schedulingMode).toBe('per_service');
    expect(settings.incompatiblePairs).toEqual([['a', 'b']]);
    expect(settings.incompatiblePairMode).toBe('service');
    expect(settings.incompatibleCategoryPairs).toEqual([]);
  });

  it('accepts valid positive integers from settings', () => {
    const settings = resolveMultiServiceSettings({
      publicBooking: {
        multiService: {
          maxServiceCount: 6,
          maxDurationMinutes: 240,
          turnoverBufferMinutes: 0,
        },
      },
    });
    expect(settings.maxServiceCount).toBe(6);
    expect(settings.maxDurationMinutes).toBe(240);
    expect(settings.turnoverBufferMinutes).toBe(0);
  });

  it('normalizes invalid numeric values and duplicate incompatible pairs', () => {
    const settings = resolveMultiServiceSettings({
      publicBooking: {
        multiService: {
          maxServiceCount: 0,
          maxDurationMinutes: -5,
          turnoverBufferMinutes: -1,
          incompatiblePairs: [
            ['x', 'y'],
            ['y', 'x'],
            ['', 'z'],
          ],
        },
      },
    });
    expect(settings.maxServiceCount).toBe(DEFAULT_MULTI_SERVICE_SETTINGS.maxServiceCount);
    expect(settings.turnoverBufferMinutes).toBe(DEFAULT_MULTI_SERVICE_SETTINGS.turnoverBufferMinutes);
    expect(settings.incompatiblePairs).toEqual([['x', 'y']]);
  });

  it('merges patches and applies to business settings', () => {
    const merged = mergeMultiServiceSettingsPatch(DEFAULT_MULTI_SERVICE_SETTINGS, {
      enabled: true,
      maxServiceCount: 4,
    });
    expect(merged.enabled).toBe(true);
    expect(merged.maxServiceCount).toBe(4);

    const next = applyMultiServiceSettingsToBusinessSettings({}, merged);
    expect((next.publicBooking as any).multiService.enabled).toBe(true);
  });

  it('defaults scheduling mode and handles invalid pair entries', () => {
    expect(
      resolveMultiServiceSettings({
        publicBooking: { multiService: { schedulingMode: 'invalid' } },
      }).schedulingMode,
    ).toBe('same_visit');

    expect(
      resolveMultiServiceSettings({
        publicBooking: {
          multiService: {
            incompatiblePairs: [['only-one'], ['a', 'a'], 123],
          },
        },
      }).incompatiblePairs,
    ).toEqual([]);
  });

  it('reads category incompatible pair mode and normalizes category pairs', () => {
    const settings = resolveMultiServiceSettings({
      publicBooking: {
        multiService: {
          incompatiblePairMode: 'category',
          incompatibleCategoryPairs: [
            ['cat-a', 'cat-b'],
            ['cat-b', 'cat-a'],
            ['', 'cat-c'],
          ],
        },
      },
    });
    expect(settings.incompatiblePairMode).toBe('category');
    expect(settings.incompatibleCategoryPairs).toEqual([['cat-a', 'cat-b']]);
  });

  it('merges incompatible pair patches without dropping existing values', () => {
    const merged = mergeMultiServiceSettingsPatch(
      {
        ...DEFAULT_MULTI_SERVICE_SETTINGS,
        incompatiblePairMode: 'service',
        incompatiblePairs: [['a', 'b']],
        incompatibleCategoryPairs: [['cat-1', 'cat-2']],
      },
      { incompatiblePairMode: 'category' },
    );
    expect(merged.incompatiblePairMode).toBe('category');
    expect(merged.incompatiblePairs).toEqual([['a', 'b']]);
    expect(merged.incompatibleCategoryPairs).toEqual([['cat-1', 'cat-2']]);
  });
});
