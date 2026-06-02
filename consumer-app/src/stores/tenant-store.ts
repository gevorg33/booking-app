import { create } from 'zustand';
import type { PublicBusinessProfile } from '../lib/types.js';
import { applyBrandingCss } from '../lib/branding.js';
import { rememberSalon } from '../lib/recent-salons.js';

interface TenantState {
  profile: PublicBusinessProfile | null;
  setProfile: (profile: PublicBusinessProfile | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  profile: null,
  setProfile: (profile) => {
    if (profile) {
      applyBrandingCss(profile);
      rememberSalon({
        slug: profile.slug,
        name: profile.name,
        logoUrl: profile.branding.logoUrl,
      });
    }
    set({ profile });
  },
}));
