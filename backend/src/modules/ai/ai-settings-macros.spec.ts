import { describe, expect, it } from '@jest/globals';
import { AiSettingsService } from './ai-settings.service.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

describe('AiSettingsService macros', () => {
  const service = new AiSettingsService({} as any);

  it('merges default macros when missing', () => {
    const merged = service.mergeSettings({});
    expect(merged.macros.length).toBeGreaterThanOrEqual(2);
    expect(merged.macros[0].name).toBeTruthy();
    expect(merged.macros.some((m) => m.id === 'monday-morning-setup')).toBe(
      true,
    );
  });

  it('preserves custom macros from stored settings', () => {
    const merged = service.mergeSettings({
      ai: {
        macros: [{ id: 'custom', name: 'Custom', prompt: 'Do thing' }],
      },
    });
    expect(merged.macros).toEqual([
      { id: 'custom', name: 'Custom', prompt: 'Do thing' },
    ]);
  });

  it('includes macros in DEFAULT_AI_SETTINGS', () => {
    expect(DEFAULT_AI_SETTINGS.macros.length).toBe(2);
  });
});
