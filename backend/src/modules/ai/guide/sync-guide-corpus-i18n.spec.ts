import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import en from '../../../../../frontend/src/i18n/messages/en.js';
import hy from '../../../../../frontend/src/i18n/messages/hy.js';
import ru from '../../../../../frontend/src/i18n/messages/ru.js';
import type { GuideCorpusLocale } from './ai-guide-corpus-i18n.util.js';

type MessageTree = { [key: string]: string | MessageTree };

const SNAPSHOT_PATH = join(
  __dirname,
  'dashboard-guide-corpus-i18n.snapshot.json',
);

function deepMergeMessages(
  base: MessageTree,
  override: MessageTree,
): MessageTree {
  const result: MessageTree = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    const b = base[key];
    if (
      ov != null &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      b != null &&
      typeof b === 'object' &&
      !Array.isArray(b)
    ) {
      result[key] = deepMergeMessages(b, ov);
    } else if (ov !== undefined) {
      result[key] = ov;
    }
  }
  return result;
}

function pickGuideCorpusMessages(full: MessageTree): MessageTree {
  return {
    guide: full.guide,
    helpCenter: full.helpCenter,
  };
}

// e2e-bug.526 — `guide.flows` is backend-owned and must survive the rebuild.
//
// This sync reconstructs the snapshot from the frontend catalogs alone
// (`pickGuideCorpusMessages` takes only `guide` and `helpCenter`), but the
// committed snapshot also carries a 924-line `guide.flows` subtree that the
// frontend has **never** defined — `git log -S 'flows:'` on en.ts returns
// nothing. It is read at runtime by `loadGuideCorpusSnapshot` and walked by
// guide-flow-customer-public-i18n.util (the e2e-bug.46 full-corpus gate, 20
// topicIds).
//
// So running the documented sync *deleted* live data, and the drift gate below
// then demanded exactly that deletion — the gate was unsatisfiable without data
// loss, which is why it sat in the known-failures manifest instead of being
// regenerated. Re-attaching the backend-owned subtree makes both correct.
//
// Acknowledged trade-off: the gate cannot police `guide.flows`, because there is
// no frontend source to compare it against. It still compares everything the
// frontend does own, which is what it was built to catch.
function readCommittedSnapshot():
  | Record<GuideCorpusLocale, MessageTree>
  | undefined {
  if (!existsSync(SNAPSHOT_PATH)) return undefined;
  return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as Record<
    GuideCorpusLocale,
    MessageTree
  >;
}

function preserveBackendOwnedFlows(
  committed: Record<GuideCorpusLocale, MessageTree> | undefined,
  locale: GuideCorpusLocale,
  tree: MessageTree,
): MessageTree {
  const flows = (committed?.[locale]?.guide as MessageTree | undefined)?.flows;
  if (flows === undefined) return tree;
  const guide = (tree.guide ?? {}) as MessageTree;
  return { ...tree, guide: { ...guide, flows } };
}

function buildGuideCorpusI18nSnapshot(): Record<
  GuideCorpusLocale,
  MessageTree
> {
  const enTree = en;
  const committed = readCommittedSnapshot();
  return {
    en: preserveBackendOwnedFlows(
      committed,
      'en',
      pickGuideCorpusMessages(enTree),
    ),
    hy: preserveBackendOwnedFlows(
      committed,
      'hy',
      pickGuideCorpusMessages(deepMergeMessages(enTree, hy)),
    ),
    ru: preserveBackendOwnedFlows(
      committed,
      'ru',
      pickGuideCorpusMessages(deepMergeMessages(enTree, ru)),
    ),
  };
}

const shouldSync = process.env.SYNC_GUIDE_CORPUS_I18N === '1';
const describeSync = shouldSync ? describe : describe.skip;

describeSync('sync guide corpus i18n snapshot (ai-guide-1.3.4)', () => {
  it('writes dashboard-guide-corpus-i18n.snapshot.json from frontend catalogs', () => {
    writeFileSync(
      SNAPSHOT_PATH,
      `${JSON.stringify(buildGuideCorpusI18nSnapshot(), null, 2)}\n`,
    );
  });
});

describe('guide corpus i18n snapshot drift (ai-guide-1.3.4)', () => {
  it('committed snapshot matches frontend guide/helpCenter catalogs when monorepo present', () => {
    const frontendEn = join(
      process.cwd(),
      '../frontend/src/i18n/messages/en.ts',
    );
    if (!existsSync(frontendEn)) return;

    const committed = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
    expect(committed).toEqual(buildGuideCorpusI18nSnapshot());
  });
});
