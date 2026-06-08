#!/usr/bin/env node
/**
 * Writes frontend/public/.well-known/* from env for static hosts / CI verification.
 * Next.js route handlers serve the same payloads at runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIVERSAL_LINK_PATHS = ['/book/*', '/s/*'];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wellKnownDir = path.join(root, 'public', '.well-known');

function readConfig(env) {
  const appleTeamId = env.CONSUMER_APPLE_TEAM_ID?.trim() || env.APPLE_TEAM_ID?.trim() || '';
  if (!appleTeamId) return null;
  return {
    appleTeamId,
    iosBundleId: env.CONSUMER_IOS_BUNDLE_ID?.trim() || 'com.optischedule.consumer',
    androidPackageName: env.CONSUMER_ANDROID_PACKAGE?.trim() || 'com.optischedule.consumer',
    androidSha256Fingerprints: (env.CONSUMER_ANDROID_SHA256_FINGERPRINTS ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
}

function validateConfig(config) {
  const errors = [];
  if (!config.appleTeamId || config.appleTeamId === 'TEAMID') errors.push('appleTeamId is a placeholder');
  if (config.androidSha256Fingerprints.length === 0) errors.push('androidSha256Fingerprints is empty');
  return errors;
}

const config = readConfig(process.env);
const validationErrors = config ? validateConfig(config) : ['CONSUMER_APPLE_TEAM_ID missing'];

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${(config?.appleTeamId ?? 'TEAMID').trim()}.${config?.iosBundleId ?? 'com.optischedule.consumer'}`,
        paths: UNIVERSAL_LINK_PATHS,
      },
    ],
  },
};

const assetlinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: config?.androidPackageName ?? 'com.optischedule.consumer',
      sha256_cert_fingerprints: config?.androidSha256Fingerprints ?? [
        'REPLACE_WITH_RELEASE_OR_DEBUG_SHA256_FINGERPRINT',
      ],
    },
  },
];

fs.mkdirSync(wellKnownDir, { recursive: true });
fs.writeFileSync(
  path.join(wellKnownDir, 'apple-app-site-association'),
  `${JSON.stringify(aasa, null, 2)}\n`,
);
fs.writeFileSync(path.join(wellKnownDir, 'assetlinks.json'), `${JSON.stringify(assetlinks, null, 2)}\n`);

if (validationErrors.length > 0) {
  console.warn('⚠ App link config incomplete (dev placeholders written):');
  for (const error of validationErrors) console.warn(`  - ${error}`);
} else {
  console.log('✓ Generated verified .well-known files');
}
