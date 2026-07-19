import type { PublicBusinessProfile } from './types.js';

export function primaryColor(profile: PublicBusinessProfile | null): string {
  return profile?.branding?.primaryColor || '#7c3aed';
}

/** Convert `#rrggbb` to `r, g, b` for Ionic `--ion-color-*-rgb` vars. */
export function hexToRgbChannels(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function mixHexToward(hex: string, toward: 0 | 255, weight: number): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  const mix = (channel: number) =>
    Math.round(channel * (1 - weight) + toward * weight)
      .toString(16)
      .padStart(2, '0');
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function applyBrandingCss(profile: PublicBusinessProfile | null): void {
  const color = primaryColor(profile);
  const root = document.documentElement;
  // Set both so IonIcon/IonButton and custom CTAs resolve the identical brand hex.
  root.style.setProperty('--tenant-primary', color);
  root.style.setProperty('--ion-color-primary', color);
  const rgb = hexToRgbChannels(color);
  if (rgb) {
    root.style.setProperty('--ion-color-primary-rgb', rgb);
  }
  const shade = mixHexToward(color, 0, 0.12);
  const tint = mixHexToward(color, 255, 0.18);
  if (shade) root.style.setProperty('--ion-color-primary-shade', shade);
  if (tint) root.style.setProperty('--ion-color-primary-tint', tint);
}
