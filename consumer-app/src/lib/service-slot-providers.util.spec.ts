import { describe, expect, it } from 'vitest';
import {
  resolveBookPageSpecialistEmployeeId,
  shouldShowBookPageSpecialistPicker,
} from './service-slot-providers.util.js';

describe('resolveBookPageSpecialistEmployeeId', () => {
  it('returns empty when no providers can take the slot', () => {
    expect(resolveBookPageSpecialistEmployeeId([], 'emp-1')).toBe('');
  });

  it('auto-selects the only available provider', () => {
    expect(resolveBookPageSpecialistEmployeeId([{ id: 'emp-1' }], '')).toBe('emp-1');
  });

  it('keeps a valid current selection when multiple providers are available', () => {
    expect(
      resolveBookPageSpecialistEmployeeId([{ id: 'emp-1' }, { id: 'emp-2' }], 'emp-2'),
    ).toBe('emp-2');
  });

  it('auto-selects the only provider when the previous choice is unavailable', () => {
    expect(
      resolveBookPageSpecialistEmployeeId([{ id: 'emp-2' }], 'emp-1'),
    ).toBe('emp-2');
  });

  it('clears selection when multiple providers are available and current choice is invalid', () => {
    expect(
      resolveBookPageSpecialistEmployeeId(
        [{ id: 'emp-2' }, { id: 'emp-3' }],
        'emp-1',
      ),
    ).toBe('');
  });
});

describe('shouldShowBookPageSpecialistPicker', () => {
  it('hides picker for zero or one provider', () => {
    expect(shouldShowBookPageSpecialistPicker(0)).toBe(false);
    expect(shouldShowBookPageSpecialistPicker(1)).toBe(false);
  });

  it('shows picker when multiple providers can take the slot', () => {
    expect(shouldShowBookPageSpecialistPicker(2)).toBe(true);
  });
});
