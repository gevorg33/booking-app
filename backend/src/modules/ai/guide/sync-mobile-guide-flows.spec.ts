import { existsSync, readFileSync } from 'node:fs';
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
    execSync(`node ${SCRIPT}`, { cwd: ROOT, stdio: 'pipe' });
    expect(readText(consumerBundle)).toBe(beforeConsumer);
    expect(readText(providerBundle)).toBe(beforeProvider);
    expect(readManifestStableFields(consumerManifest)).toBe(beforeConsumerManifest);
    expect(readManifestStableFields(providerManifest)).toBe(beforeProviderManifest);
  });
});
