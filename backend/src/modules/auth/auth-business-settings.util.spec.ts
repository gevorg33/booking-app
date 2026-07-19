import { buildAuthBusinessSettings } from './auth-business-settings.util.js';

describe('buildAuthBusinessSettings (e2e-bug.61)', () => {
  it.each([
    {
      id: 'clinic',
      settings: { businessType: 'clinic', integrations: { stripe: { secret: 'sk' } } },
      expected: { businessType: 'clinic' },
    },
    {
      id: 'polyclinic-trim',
      settings: { businessType: '  polyclinic  ' },
      expected: { businessType: 'polyclinic' },
    },
    {
      id: 'empty-type',
      settings: { businessType: '   ', currency: 'USD' },
      expected: {},
    },
    {
      id: 'missing',
      settings: { currency: 'AMD' },
      expected: {},
    },
    {
      id: 'null',
      settings: null,
      expected: {},
    },
    {
      id: 'undefined',
      settings: undefined,
      expected: {},
    },
  ])('$id — only exposes businessType, never integrations', ({ settings, expected }) => {
    expect(buildAuthBusinessSettings(settings)).toEqual(expected);
    expect(buildAuthBusinessSettings(settings)).not.toHaveProperty('integrations');
  });
});
