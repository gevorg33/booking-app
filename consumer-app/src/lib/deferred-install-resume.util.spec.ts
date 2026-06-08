import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFERRED_INSTALL_RESUME_SCENARIOS,
  DEFERRED_INSTALL_RESUME_SEARCH_SCENARIOS,
} from './deferred-install-resume.fixtures.js';
import {
  buildDeferredInstallResumePath,
  readDeferredInstallResumeContext,
  resolveDeferredInstallNavigationPath,
} from './deferred-install-resume.util.js';

describe('deferred-install-resume.util (n99-3.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
  });

  it.each(DEFERRED_INSTALL_RESUME_SCENARIOS)(
    'resolveDeferredInstallNavigationPath $id',
    ({ link, path }) => {
      expect(resolveDeferredInstallNavigationPath(link)).toBe(path);
    },
  );

  it('buildDeferredInstallResumePath always sets deferredResume flag', () => {
    expect(
      buildDeferredInstallResumePath({
        slug: 'salon-a',
        serviceId: 'svc-1',
        date: '2026-06-10',
        slot: '2026-06-10T10:00:00.000Z',
        capturedAt: '2026-06-08T00:00:00.000Z',
      }),
    ).toContain('deferredResume=1');
  });

  it.each(DEFERRED_INSTALL_RESUME_SEARCH_SCENARIOS)(
    'readDeferredInstallResumeContext $id',
    ({ search, slot, expectResume, expectSkipDiscovery, expectCollapseSchedule }) => {
      const ctx = readDeferredInstallResumeContext(search, slot);
      expect(ctx.isResume).toBe(expectResume);
      expect(ctx.skipSlotDiscovery).toBe(expectSkipDiscovery);
      expect(ctx.collapseScheduleUi).toBe(expectCollapseSchedule);
    },
  );
});
