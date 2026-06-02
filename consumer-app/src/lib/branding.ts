import type { PublicBusinessProfile } from './types.js';

export function primaryColor(profile: PublicBusinessProfile | null): string {
  return profile?.branding?.primaryColor || '#7c3aed';
}

export function applyBrandingCss(profile: PublicBusinessProfile | null): void {
  const color = primaryColor(profile);
  document.documentElement.style.setProperty('--tenant-primary', color);
}
