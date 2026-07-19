import { applyBrandingCss, primaryColor } from './branding.js';

describe('branding', () => {
  it('sets tenant primary CSS variable and ion rgb channels', () => {
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
    expect(document.documentElement.style.getPropertyValue('--ion-color-primary')).toBe(
      '#112233',
    );
    expect(document.documentElement.style.getPropertyValue('--ion-color-primary-rgb')).toBe(
      '17, 34, 51',
    );
    expect(document.documentElement.style.getPropertyValue('--ion-color-primary-shade')).toBe(
      '#0f1e2d',
    );
    expect(document.documentElement.style.getPropertyValue('--ion-color-primary-tint')).toBe(
      '#3c4a58',
    );
  });

  it('falls back to default primary', () => {
    expect(primaryColor(null)).toBe('#7c3aed');
  });
});
