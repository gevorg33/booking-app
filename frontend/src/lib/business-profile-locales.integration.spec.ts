import { describe, expect, it } from 'vitest';
import {
  businessToProfileForm,
  emptyBusinessProfileForm,
  profileFormToPayload,
} from './business-profile';
import { seedPublicProfileLocalesFromLegacy } from './business-public-profile-locales';

describe('business profile locales integration', () => {
  it('maps API business settings into the dashboard form and back to the profile payload', () => {
    const apiBusiness = {
      name: 'Default Salon',
      description: 'Default description',
      phone: '+1',
      email: 'a@b.com',
      address: 'Default address',
      settings: {
        locale: 'hy',
        branding: { tagline: 'Default tagline', primaryColor: '#7c3aed' },
        publicProfileLocales: {
          hy: {
            name: 'Սալոն',
            description: 'Հայերեն',
            tagline: 'Բարև',
            address: 'Երևան',
          },
          en: { tagline: 'Hello' },
        },
      },
    };

    const form = businessToProfileForm(apiBusiness);
    expect(form.publicProfileLocales.hy.name).toBe('Սալոն');
    expect(form.publicProfileLocales.en.tagline).toBe('Hello');
    expect(form.locale).toBe('hy');

    const payload = profileFormToPayload(form);
    expect(payload.publicProfileLocales).toEqual({
      hy: {
        name: 'Սալոն',
        description: 'Հայերեն',
        tagline: 'Բարև',
        address: 'Երևան',
      },
      en: { tagline: 'Hello' },
    });
    expect(payload.description).toBe('Հայերեն');
    expect(payload.address).toBe('Երևան');
    expect(payload.branding?.tagline).toBe('Բարև');
    expect(payload.locale).toBe('hy');
  });

  it('seeds legacy single-language profile into the default locale column', () => {
    const form = businessToProfileForm({
      name: 'GevGas operations',
      description: 'Universal salon',
      address: '5 Kristapor',
      settings: {
        locale: 'hy',
        branding: { tagline: 'Best service' },
      },
    });
    expect(form.publicProfileLocales.hy).toMatchObject({
      name: 'GevGas operations',
      description: 'Universal salon',
      tagline: 'Best service',
      address: '5 Kristapor',
    });
  });

  it('does not overwrite existing locale overrides when seeding legacy data', () => {
    const seeded = seedPublicProfileLocalesFromLegacy(
      {
        en: { name: '', description: '', tagline: '', address: '' },
        hy: { name: 'Սալոն', description: '', tagline: '', address: '' },
        ru: { name: '', description: '', tagline: '', address: '' },
      },
      {
        defaultLocale: 'hy',
        name: 'Legacy',
        description: 'Old',
      },
    );
    expect(seeded.hy.name).toBe('Սալոն');
  });

  it('handles businesses without settings and legacy twitter social key', () => {
    const form = businessToProfileForm({
      name: 'Salon',
      settings: { social: { twitter: 'https://x.com/salon' } },
    });
    expect(form.publicProfileLocales.en.name).toBe('Salon');
    expect(form.social.x).toBe('https://x.com/salon');
  });

  it('omits publicProfileLocales from payload when all locale fields are empty', () => {
    const form = {
      ...emptyBusinessProfileForm(),
      name: 'Salon',
      publicProfileLocales: emptyBusinessProfileForm().publicProfileLocales,
    };
    expect(profileFormToPayload(form).publicProfileLocales).toBeUndefined();
  });

  it('syncs entity fallback fields from the default public language column', () => {
    const form = {
      ...emptyBusinessProfileForm(),
      name: 'Internal',
      locale: 'en',
      publicProfileLocales: {
        en: {
          name: 'Public EN',
          description: 'Desc EN',
          tagline: 'Tag EN',
          address: 'Addr EN',
        },
        hy: { name: '', description: '', tagline: '', address: '' },
        ru: { name: '', description: '', tagline: '', address: '' },
      },
    };
    const payload = profileFormToPayload(form);
    expect(payload.description).toBe('Desc EN');
    expect(payload.branding?.tagline).toBe('Tag EN');
    expect(payload.address).toBe('Addr EN');
  });

  it('includes every optional social and branding field when provided', () => {
    const form = {
      ...emptyBusinessProfileForm(),
      name: 'Salon',
      branding: {
        logoUrl: 'logo.png',
        primaryColor: '#111111',
      },
      social: {
        website: 'https://a.com',
        instagram: 'https://ig.com',
        facebook: 'https://fb.com',
        x: 'https://x.com',
        tiktok: 'https://tiktok.com',
        linkedin: 'https://linkedin.com',
        youtube: 'https://youtube.com',
      },
      location: { mapEmbedHtml: '<iframe></iframe>' },
    };

    expect(profileFormToPayload(form)).toMatchObject({
      branding: {
        logoUrl: 'logo.png',
        primaryColor: '#111111',
      },
      social: {
        website: 'https://a.com',
        instagram: 'https://ig.com',
        facebook: 'https://fb.com',
        x: 'https://x.com',
        tiktok: 'https://tiktok.com',
        linkedin: 'https://linkedin.com',
        youtube: 'https://youtube.com',
      },
      location: { mapEmbedHtml: '<iframe></iframe>' },
    });
  });
});
