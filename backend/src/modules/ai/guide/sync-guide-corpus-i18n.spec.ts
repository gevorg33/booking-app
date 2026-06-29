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

function deepMergeMessages(base: MessageTree, override: MessageTree): MessageTree {
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
      result[key] = deepMergeMessages(b as MessageTree, ov as MessageTree);
    } else if (ov !== undefined) {
      result[key] = ov;
    }
  }
  return result;
}

function pickGuideCorpusMessages(full: MessageTree): MessageTree {
  return {
    guide: full.guide as MessageTree,
    helpCenter: full.helpCenter as MessageTree,
  };
}

function buildGuideCorpusI18nSnapshot(): Record<GuideCorpusLocale, MessageTree> {
  const enTree = en as MessageTree;
  return {
    en: pickGuideCorpusMessages(enTree),
    hy: pickGuideCorpusMessages(deepMergeMessages(enTree, hy as MessageTree)),
    ru: pickGuideCorpusMessages(deepMergeMessages(enTree, ru as MessageTree)),
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
