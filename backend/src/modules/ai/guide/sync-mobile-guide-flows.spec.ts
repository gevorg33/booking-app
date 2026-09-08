import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = join(__dirname, '../../../../..');
const SCRIPT = join(ROOT, 'scripts/sync-mobile-guide-flows.mjs');

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function readManifestStableFields(path: string): string {
  const manifest = JSON.parse(readText(path)) as Record<string, unknown>;
  const { syncedAt: _syncedAt, ...stable } = manifest;
  return JSON.stringify(stable);
}

describe('sync mobile guide flows (ai-guide-1.9.1)', () => {
  it('sync script exists', () => {
    expect(existsSync(SCRIPT)).toBe(true);
  });

  it('committed mobile bundles match backend guide-flows corpus', () => {
    const consumerBundle = join(
      ROOT,
      'consumer-app/src/lib/mobile-guide/mobile-guide.bundle.ts',
    );
    const providerBundle = join(
      ROOT,
      'provider-app/src/lib/mobile-guide/mobile-guide.bundle.ts',
    );
    const consumerManifest = join(
      ROOT,
      'consumer-app/src/assets/guide-flows-manifest.json',
    );
    const providerManifest = join(
      ROOT,
      'provider-app/src/assets/guide-flows-manifest.json',
    );
    if (!existsSync(consumerBundle) || !existsSync(providerBundle)) {
      if (process.env.SYNC_MOBILE_GUIDE_FLOWS === '1') {
        execSync(`node ${SCRIPT}`, { cwd: ROOT, stdio: 'inherit' });
      } else {
        throw new Error(
          'missing mobile guide bundles — run npm run sync:mobile-guide-flows in consumer-app or provider-app',
        );
      }
    }

    const beforeConsumer = readText(consumerBundle);
    const beforeProvider = readText(providerBundle);
    const beforeConsumerManifest = readManifestStableFields(consumerManifest);
    const beforeProviderManifest = readManifestStableFields(providerManifest);

    // e2e-bug.452 — the generator writes to the working tree, and this test runs
    // it for real because running it for real is the point: it is what proves the
    // committed bundles still match the backend corpus. But `syncedAt` is
    // `new Date().toISOString()`, so every run left two tracked app manifests
    // modified, and every sweep ended with `git status` showing changes nobody
    // made. The assertions never noticed, because `readManifestStableFields`
    // strips `syncedAt` before comparing — the test was correct and littering.
    //
    // Restoring in `finally` rather than after the assertions, so a genuine
    // failure does not also leave the tree dirty for whoever debugs it.
    const originals = [
      [consumerBundle, beforeConsumer],
      [providerBundle, beforeProvider],
      [consumerManifest, readText(consumerManifest)],
      [providerManifest, readText(providerManifest)],
    ] as const;

    try {
      execSync(`node ${SCRIPT}`, { cwd: ROOT, stdio: 'pipe' });
      expect(readText(consumerBundle)).toBe(beforeConsumer);
      expect(readText(providerBundle)).toBe(beforeProvider);
      expect(readManifestStableFields(consumerManifest)).toBe(
        beforeConsumerManifest,
      );
      expect(readManifestStableFields(providerManifest)).toBe(
        beforeProviderManifest,
      );
    } finally {
      for (const [path, contents] of originals) {
        if (readText(path) !== contents) writeFileSync(path, contents);
      }
    }
  });
});
