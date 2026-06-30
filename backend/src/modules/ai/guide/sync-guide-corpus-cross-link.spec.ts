import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX } from './dashboard-guide-corpus.cross-link.util.js';

const FRONTEND_INDEX_PATH = join(
  __dirname,
  '../../../../../frontend/src/lib/dashboard-guide-corpus.index.json',
);

const shouldSync = process.env.SYNC_GUIDE_CORPUS_CROSS_LINK === '1';
const describeSync = shouldSync ? describe : describe.skip;

describeSync('sync guide corpus cross-link index (ai-guide-1.3.4)', () => {
  it('writes frontend dashboard-guide-corpus.index.json from backend manifest', () => {
    writeFileSync(
      FRONTEND_INDEX_PATH,
      `${JSON.stringify(DASHBOARD_GUIDE_CORPUS_CROSS_LINK_INDEX, null, 2)}\n`,
    );
  });
});
