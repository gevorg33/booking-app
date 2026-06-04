import { describe, expect, it } from 'vitest';
import {
  emptyPublicProfileLocalesForm,
  publicProfileLocalesFromApi,
  publicProfileLocalesToPayload,
  resolveDefaultPublicLocale,
  seedPublicProfileLocalesFromLegacy,
} from './business-public-profile-locales';

describe('business-public-profile-locales', () => {
  it('round-trips API data through form state', () => {
    const form = publicProfileLocalesFromApi({
      hy: { name: 'Սալոն', tagline: 'Բարև' },
      en: { description: 'Welcome' },
    });
    expect(form.hy.name).toBe('Սալոն');
    expect(publicProfileLocalesToPayload(form)).toEqual({
      hy: { name: 'Սալոն', tagline: 'Բարև' },
      en: { description: 'Welcome' },
    });
  });

  it('returns undefined when all locale fields are empty', () => {
    expect(publicProfileLocalesToPayload(emptyPublicProfileLocalesForm())).toBeUndefined();
  });

  it('skips undefined locale entries when reading from API', () => {
    const form = publicProfileLocalesFromApi({
      en: undefined,
      hy: { name: 'Hy' },
    });
    expect(form.hy.name).toBe('Hy');
    expect(form.en.name).toBe('');
  });

  it('seeds legacy profile into default locale when overrides are empty', () => {
    const seeded = seedPublicProfileLocalesFromLegacy(emptyPublicProfileLocalesForm(), {
      defaultLocale: 'hy',
      name: 'Salon',
      description: 'About us',
      tagline: 'Welcome',
      address: 'Yerevan',
    });
    expect(seeded.hy).toEqual({
      name: 'Salon',
      description: 'About us',
      tagline: 'Welcome',
      address: 'Yerevan',
    });
  });

  it('omits empty field keys from payload objects', () => {
    expect(
      publicProfileLocalesToPayload({
        ...emptyPublicProfileLocalesForm(),
        ru: { name: '', description: '', tagline: 'Only tagline', address: '' },
      }),
    ).toEqual({ ru: { tagline: 'Only tagline' } });
  });

  it('returns form unchanged when any locale already has content', () => {
    const existing = {
      ...emptyPublicProfileLocalesForm(),
      en: { name: 'Existing', description: '', tagline: '', address: '' },
    };
    const seeded = seedPublicProfileLocalesFromLegacy(existing, {
      defaultLocale: 'hy',
      name: 'Legacy',
    });
    expect(seeded).toEqual(existing);
  });

  it('seeds empty strings when legacy fields are omitted', () => {
    const seeded = seedPublicProfileLocalesFromLegacy(emptyPublicProfileLocalesForm(), {
      defaultLocale: 'en',
    });
    expect(seeded.en).toEqual({
      name: '',
      description: '',
      tagline: '',
      address: '',
    });
  });

  it('trims whitespace from legacy values before seeding', () => {
    const seeded = seedPublicProfileLocalesFromLegacy(emptyPublicProfileLocalesForm(), {
      defaultLocale: 'ru',
      name: '  Shop  ',
      address: '  Street  ',
    });
    expect(seeded.ru.name).toBe('Shop');
    expect(seeded.ru.address).toBe('Street');
  });

  it('resolves default public locale from business settings', () => {
    expect(resolveDefaultPublicLocale('hy')).toBe('hy');
    expect(resolveDefaultPublicLocale('invalid')).toBe('en');
    expect(resolveDefaultPublicLocale(undefined)).toBe('en');
  });

  it('handles null API map and partial locale entries', () => {
    expect(publicProfileLocalesFromApi(null)).toEqual(emptyPublicProfileLocalesForm());
    const form = publicProfileLocalesFromApi({
      en: { name: 'Name only' },
    });
    expect(form.en).toEqual({
      name: 'Name only',
      description: '',
      tagline: '',
      address: '',
    });
  });
});
