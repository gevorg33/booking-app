import {
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS,
} from '../ai/ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from '../ai/ai-how-to-download-app-multilingual.fixtures.js';
import { rescueHowToDownloadAppCustomerPublicIntent } from '../ai/ai-how-to-download-app-customer-public.util.js';

describe('public-booking how_to_download_app integration (ai-cmd-customer-4.5.7)', () => {
  it.each(
    HOW_TO_DOWNLOAD_APP_PROMPTS.filter((row) => row.surface === 'public').map(
      (row) => [row.id, row] as const,
    ),
  )('rescues public how_to_download_app for $id', (_id, row) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')?.action,
    ).toBe('how_to_download_app');
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('rescues misclassified public how_to_download_app for $id', (_id, row) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('how_to_download_app');
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('rescues multilingual public how_to_download_app for $id', (_id, row) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')?.action,
    ).toBe('how_to_download_app');
  });
});
