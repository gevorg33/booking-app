#!/usr/bin/env node
/** adopt-5.6 — accessibility + localization gate for mobile adoption surfaces. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'consumer-app/src/lib/mobile-a11y.util.ts',
  'consumer-app/src/lib/mobile-adoption-surfaces.fixtures.ts',
  'consumer-app/src/components/AccessibilityBootstrap.tsx',
  'consumer-app/src/theme/adoption-a11y.css',
  'provider-app/src/lib/mobile-a11y.util.ts',
  'provider-app/src/lib/mobile-adoption-surfaces.fixtures.ts',
  'provider-app/src/components/AccessibilityBootstrap.tsx',
  'provider-app/src/theme/adoption-a11y.css',
];

for (const file of required) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

for (const app of ['consumer-app', 'provider-app']) {
  const appSource = fs.readFileSync(path.join(ROOT, `${app}/src/App.tsx`), 'utf8');
  if (!appSource.includes('AccessibilityBootstrap')) {
    console.error(`✗ ${app} must mount AccessibilityBootstrap`);
    process.exit(1);
  }
}

const consumerCatalog = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/lib/consumer-copy-catalog.ts'),
  'utf8',
);
for (const key of [
  'analyticsConsentTitle',
  'pushPrimingTitle',
  'appGateTitle',
  'offlineStatusOffline',
]) {
  if (!consumerCatalog.includes(key)) {
    console.error(`✗ consumer copy missing ${key}`);
    process.exit(1);
  }
}

const providerEn = fs.readFileSync(
  path.join(ROOT, 'frontend/src/i18n/messages/en.ts'),
  'utf8',
);
for (const key of ['analyticsConsentTitle', 'analyticsConsentMessage']) {
  if (!providerEn.includes(key)) {
    console.error(`✗ provider i18n missing ${key}`);
    process.exit(1);
  }
}

console.log('✓ mobile adoption a11y + EN/HY/RU localization wiring present');
