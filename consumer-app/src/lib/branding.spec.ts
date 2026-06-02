import { applyBrandingCss, primaryColor } from './branding.js';

describe('branding', () => {
  it('sets tenant primary CSS variable', () => {
    applyBrandingCss({
      id: '1',
      name: 'Test',
      slug: 'test',
      timezone: 'UTC',
      locale: 'en',
      branding: { primaryColor: '#112233' },
      publicBookingEnabled: true,
    });
    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe(
      '#112233',
    );
  });

  it('falls back to default primary', () => {
    expect(primaryColor(null)).toBe('#7c3aed');
  });
});
