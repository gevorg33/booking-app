import {
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS,
} from './ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from './ai-how-to-download-app-multilingual.fixtures.js';
import { rescueHowToDownloadAppCustomerPublicIntent } from './ai-how-to-download-app-customer-public.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('customer-ai-command how_to_download_app integration (ai-cmd-customer-4.5.7)', () => {
  it.each(
    HOW_TO_DOWNLOAD_APP_PROMPTS.filter((row) => row.surface === 'customer').map(
      (row) => [row.id, row] as const,
    ),
  )('rescues customer how_to_download_app for $id', (_id, row) => {
    expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
      'how_to_download_app',
    );
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')?.action,
    ).toBe('how_to_download_app');
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )(
    'rescues misclassified customer how_to_download_app for $id',
    (_id, row) => {
      expect(
        rescueHowToDownloadAppCustomerPublicIntent(
          row.prompt,
          row.misclassifiedAction,
        )?.action,
      ).toBe('how_to_download_app');
    },
  );

  it.each(
    HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('rescues multilingual customer how_to_download_app for $id', (_id, row) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')?.action,
    ).toBe('how_to_download_app');
  });
});
