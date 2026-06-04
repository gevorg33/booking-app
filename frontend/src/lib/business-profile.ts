import {
  emptyPublicProfileLocalesForm,
  publicProfileLocalesFromApi,
  publicProfileLocalesToPayload,
  resolveDefaultPublicLocale,
  seedPublicProfileLocalesFromLegacy,
  type PublicProfileLocalesFormState,
} from '@/lib/business-public-profile-locales';
import type { AppLocale } from '@/i18n';

export interface BusinessBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface BusinessSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
}

export interface BusinessLocationSettings {
  mapEmbedHtml?: string;
}

export interface BusinessProfileForm {
  /** Internal / dashboard name (not shown on public page unless copied into a locale column). */
  name: string;
  phone: string;
  email: string;
  locale: string;
  branding: BusinessBranding;
  social: BusinessSocialLinks;
  location: BusinessLocationSettings;
  publicProfileLocales: PublicProfileLocalesFormState;
}

export const emptyBusinessProfileForm = (): BusinessProfileForm => ({
  name: '',
  phone: '',
  email: '',
  locale: 'en',
  branding: { logoUrl: '', primaryColor: '#7c3aed' },
  social: {
    website: '',
    instagram: '',
    facebook: '',
    x: '',
    tiktok: '',
    linkedin: '',
    youtube: '',
  },
  location: { mapEmbedHtml: '' },
  publicProfileLocales: emptyPublicProfileLocalesForm(),
});

export function businessToProfileForm(business: any): BusinessProfileForm {
  const branding = business.settings?.branding || {};
  const social = business.settings?.social || {};
  const location = business.settings?.location || {};
  const defaultLocale = resolveDefaultPublicLocale(business.settings?.locale);

  const publicProfileLocales = seedPublicProfileLocalesFromLegacy(
    publicProfileLocalesFromApi(business.settings?.publicProfileLocales),
    {
      defaultLocale,
      name: business.name,
      description: business.description,
      tagline: branding.tagline,
      address: business.address,
    },
  );

  return {
    name: business.name ?? '',
    phone: business.phone ?? '',
    email: business.email ?? '',
    locale: defaultLocale,
    branding: {
      logoUrl: branding.logoUrl ?? '',
      primaryColor: branding.primaryColor ?? '#7c3aed',
    },
    social: {
      website: social.website ?? '',
      instagram: social.instagram ?? '',
      facebook: social.facebook ?? '',
      x: social.x ?? social.twitter ?? '',
      tiktok: social.tiktok ?? '',
      linkedin: social.linkedin ?? '',
      youtube: social.youtube ?? '',
    },
    location: {
      mapEmbedHtml: location.mapEmbedHtml ?? '',
    },
    publicProfileLocales,
  };
}

function primaryLocaleFields(form: BusinessProfileForm): PublicProfileLocalesFormState[AppLocale] {
  const locale = resolveDefaultPublicLocale(form.locale);
  return form.publicProfileLocales[locale];
}

export function profileFormToPayload(form: BusinessProfileForm) {
  const primary = primaryLocaleFields(form);

  return {
    name: form.name.trim() || primary.name.trim(),
    description: primary.description.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: primary.address.trim() || undefined,
    locale: form.locale || undefined,
    branding: {
      logoUrl: (form.branding.logoUrl ?? '').trim() || undefined,
      primaryColor: (form.branding.primaryColor ?? '').trim() || undefined,
      tagline: primary.tagline.trim() || undefined,
    },
    social: {
      website: (form.social.website ?? '').trim() || undefined,
      instagram: (form.social.instagram ?? '').trim() || undefined,
      facebook: (form.social.facebook ?? '').trim() || undefined,
      x: (form.social.x ?? '').trim() || undefined,
      tiktok: (form.social.tiktok ?? '').trim() || undefined,
      linkedin: (form.social.linkedin ?? '').trim() || undefined,
      youtube: (form.social.youtube ?? '').trim() || undefined,
    },
    location: {
      mapEmbedHtml: (form.location.mapEmbedHtml ?? '').trim() || undefined,
    },
    publicProfileLocales: publicProfileLocalesToPayload(form.publicProfileLocales),
  };
}
