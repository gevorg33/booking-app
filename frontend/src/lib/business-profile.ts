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
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  branding: BusinessBranding;
  social: BusinessSocialLinks;
  location: BusinessLocationSettings;
}

export const emptyBusinessProfileForm = (): BusinessProfileForm => ({
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  branding: { logoUrl: '', primaryColor: '#7c3aed', tagline: '' },
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
});

export function businessToProfileForm(business: any): BusinessProfileForm {
  const branding = business.settings?.branding || {};
  const social = business.settings?.social || {};
  const location = business.settings?.location || {};

  return {
    name: business.name ?? '',
    description: business.description ?? '',
    phone: business.phone ?? '',
    email: business.email ?? '',
    address: business.address ?? '',
    branding: {
      logoUrl: branding.logoUrl ?? '',
      primaryColor: branding.primaryColor ?? '#7c3aed',
      tagline: branding.tagline ?? '',
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
  };
}

export function profileFormToPayload(form: BusinessProfileForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    branding: {
      logoUrl: (form.branding.logoUrl ?? '').trim() || undefined,
      primaryColor: (form.branding.primaryColor ?? '').trim() || undefined,
      tagline: (form.branding.tagline ?? '').trim() || undefined,
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
  };
}
