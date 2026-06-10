import { describe, expect, it } from 'vitest';
import {
  buildProviderSelfBlockPayload,
  isProviderSelfBlockFormValid,
  PROVIDER_SELF_BLOCK_PRESETS,
} from './provider-self-block.util';

describe('provider-self-block.util (prov-exp-7.1)', () => {
  it('exposes lunch and break presets', () => {
    expect(PROVIDER_SELF_BLOCK_PRESETS.map((preset) => preset.id)).toEqual([
      'lunch',
      'break',
    ]);
  });

  it('validates end after start', () => {
    expect(
      isProviderSelfBlockFormValid({
        date: '2026-06-09',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).toBe(true);
    expect(
      isProviderSelfBlockFormValid({
        date: '2026-06-09',
        startTime: '14:00',
        endTime: '13:00',
      }),
    ).toBe(false);
  });

  it('builds payload when valid', () => {
    expect(
      buildProviderSelfBlockPayload({
        date: '2026-06-09',
        startTime: '12:00',
        endTime: '13:00',
        placeholder: ' Lunch ',
      }),
    ).toEqual({
      date: '2026-06-09',
      startTime: '12:00',
      endTime: '13:00',
      placeholder: 'Lunch',
    });
  });
});
