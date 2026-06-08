import { create } from 'zustand';
import {
  setActiveBusinessDateFormats,
  tenantDateFormatPreference,
} from '../lib/business-date-format.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import { applyBrandingCss } from '../lib/branding.js';
import { rememberSalon } from '../lib/recent-salons.js';
import { recordActiveTenant } from '../lib/customer-auth.js';

interface TenantState {
  profile: PublicBusinessProfile | null;
  setProfile: (profile: PublicBusinessProfile | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  profile: null,
  setProfile: (profile) => {
    if (profile) {
      const { dateFormat, timeFormat } = tenantDateFormatPreference(profile);
      setActiveBusinessDateFormats(dateFormat, timeFormat);
      applyBrandingCss(profile);
      rememberSalon({
        slug: profile.slug,
        name: profile.name,
        logoUrl: profile.branding.logoUrl,
      });
      recordActiveTenant(profile.slug);
    }
    set({ profile });
  },
}));
