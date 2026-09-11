import {
  isHowToDownloadAppPrompt,
  rescueHowToDownloadAppIntent,
} from './ai-how-to-download-app.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

export function rescueHowToDownloadAppCustomerPublicIntent(
  prompt: string,
  action: string,
): { action: 'how_to_download_app'; rescueReason: string } | null {
  const rescued = rescueMarketingGrowthIntent(prompt, action);
  if (rescued?.action === 'how_to_download_app') {
    return {
      action: 'how_to_download_app',
      rescueReason: rescued.rescueReason,
    };
  }
  const direct = rescueHowToDownloadAppIntent(prompt, action);
  if (direct) return direct;
  return null;
}

export function detectHowToDownloadAppCustomerPublicAction(
  prompt: string,
): 'how_to_download_app' | null {
  return (
    rescueHowToDownloadAppCustomerPublicIntent(prompt, 'unknown')?.action ??
    null
  );
}
