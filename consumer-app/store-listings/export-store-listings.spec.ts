import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildConsumerStoreListingExportBundle,
  validateAllConsumerStoreListings,
} from './store-listing.util.js';

const generatedDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'generated',
);

const shouldWriteFiles = process.env.STORE_LISTINGS_EXPORT === '1';

describe('export store listings (adopt-2.1)', () => {
  it('all locales pass App Store / Play Store character limits', () => {
    expect(validateAllConsumerStoreListings()).toEqual([]);
  });

  it('writes EN/HY/RU markdown and JSON for store upload', () => {
    const bundle = buildConsumerStoreListingExportBundle();
    expect(bundle.locales).toEqual(['en', 'hy', 'ru']);
    expect(bundle.screenshots).toHaveLength(5);
    expect(bundle.previewVideo.scenes).toHaveLength(4);

    if (!shouldWriteFiles) return;

    mkdirSync(generatedDir, { recursive: true });
    writeFileSync(
      path.join(generatedDir, 'bundle.json'),
      `${JSON.stringify(bundle, null, 2)}\n`,
      'utf8',
    );

    for (const locale of bundle.locales) {
      const localeDir = path.join(generatedDir, locale);
      mkdirSync(localeDir, { recursive: true });
      writeFileSync(
        path.join(localeDir, 'listing.json'),
        `${JSON.stringify(bundle.listings[locale], null, 2)}\n`,
        'utf8',
      );
      writeFileSync(
        path.join(localeDir, 'app-store-connect.md'),
        `${bundle.markdown[locale].appStoreConnect}\n`,
        'utf8',
      );
      writeFileSync(
        path.join(localeDir, 'google-play.md'),
        `${bundle.markdown[locale].googlePlay}\n`,
        'utf8',
      );
    }
  });
});
