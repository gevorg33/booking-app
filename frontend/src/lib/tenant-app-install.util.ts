import QRCode from 'qrcode';
import type { TenantAppInstallCampaign } from './deferred-install-link.util';

export function buildTenantAppInstallQrFilename(
  slug: string,
  campaign: TenantAppInstallCampaign,
): string {
  return `optischedule-${slug}-${campaign}.png`;
}

export async function renderTenantAppInstallQrDataUrl(
  installUrl: string,
  width = 180,
): Promise<string> {
  return QRCode.toDataURL(installUrl, { margin: 1, width });
}

export async function downloadTenantAppInstallQrPng(
  installUrl: string,
  filename: string,
): Promise<void> {
  if (typeof document === 'undefined') return;
  const dataUrl = await renderTenantAppInstallQrDataUrl(installUrl, 512);
  downloadQrDataUrl(dataUrl, filename);
}

export function downloadQrDataUrl(dataUrl: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function shouldShowTenantAppInstallQr(
  iosStoreUrl: string,
  androidStoreUrl: string,
): boolean {
  return Boolean(iosStoreUrl.trim() || androidStoreUrl.trim());
}
