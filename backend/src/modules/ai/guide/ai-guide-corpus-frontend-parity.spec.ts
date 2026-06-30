import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX,
  buildDashboardGuideCorpusCrossLinkIndex,
} from './dashboard-guide-corpus.cross-link.util.js';
import { DASHBOARD_GUIDE_PAGE_ANCHORS } from './dashboard-guide-corpus.manifest.js';

const FRONTEND_INDEX_PATH = join(
  __dirname,
  '../../../../../frontend/src/lib/dashboard-guide-corpus.index.json',
);
const GUIDE_PAGE_PATH = join(
  __dirname,
  '../../../../../frontend/src/app/(dashboard)/dashboard/guide/page.tsx',
);

describe('ai-guide-corpus frontend parity (ai-guide-1.3.4)', () => {
  it('buildDashboardGuideCorpusCrossLinkIndex matches exported constant', () => {
    expect(buildDashboardGuideCorpusCrossLinkIndex()).toEqual(
      DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX,
    );
  });

  it('committed frontend index JSON mirrors backend manifest cross-links', () => {
    const committed = JSON.parse(readFileSync(FRONTEND_INDEX_PATH, 'utf8'));
    expect(committed).toEqual(DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX);
  });

  it('dashboard /guide page declares every corpus anchor as a section id', () => {
    const page = readFileSync(GUIDE_PAGE_PATH, 'utf8');
    for (const anchor of DASHBOARD_GUIDE_PAGE_ANCHORS) {
      expect(page).toContain(`id="${anchor}"`);
    }
  });
});
