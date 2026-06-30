#!/usr/bin/env node
/** ai-guide-1.9.12 — offline guide corpus embedded in both mobile apps. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const APPS = [
  {
    app: 'consumer-app',
    surface: 'customer',
    playbooksDir: 'customer',
  },
  {
    app: 'provider-app',
    surface: 'provider',
    playbooksDir: 'provider',
  },
];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

for (const { app, surface, playbooksDir } of APPS) {
  const prefix = `${app}/src`;
  const required = [
    `${prefix}/assets/guide-flows-i18n.json`,
    `${prefix}/assets/guide-flows-manifest.json`,
    `${prefix}/assets/guide-flows/${playbooksDir}`,
    `${prefix}/assets/guide-flows/overlays`,
    `${prefix}/lib/mobile-guide/mobile-guide.bundle.ts`,
    `${prefix}/lib/mobile-guide/index.ts`,
  ];

  for (const file of required) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      console.error(`✗ missing ${file}`);
      process.exit(1);
    }
  }

  const pkg = readJson(`${app}/package.json`);
  const manifest = readJson(`${prefix}/assets/guide-flows-manifest.json`);
  const bundleSource = fs.readFileSync(
    path.join(ROOT, `${prefix}/lib/mobile-guide/mobile-guide.bundle.ts`),
    'utf8',
  );

  if (manifest.surface !== surface) {
    console.error(`✗ ${app} manifest surface must be ${surface}`);
    process.exit(1);
  }
  if (manifest.appVersion !== pkg.version) {
    console.error(
      `✗ ${app} guide manifest appVersion ${manifest.appVersion} !== package.json ${pkg.version} — run sync:mobile-guide-flows`,
    );
    process.exit(1);
  }
  if (!bundleSource.includes('MOBILE_GUIDE_OFFLINE_MANIFEST')) {
    console.error(`✗ ${app} mobile-guide.bundle.ts missing offline manifest export`);
    process.exit(1);
  }
  if (!bundleSource.includes('guide-flows-manifest.json')) {
    console.error(`✗ ${app} mobile-guide.bundle.ts missing manifest import`);
    process.exit(1);
  }
  if (!fs.readFileSync(path.join(ROOT, `${prefix}/lib/mobile-guide/index.ts`), 'utf8').includes('assertMobileGuideOfflineBundle')) {
    console.error(`✗ ${app} mobile-guide index missing offline bundle assert`);
    process.exit(1);
  }
}

console.log('✓ mobile guide offline bundles present in consumer-app and provider-app');
