import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GuideCorpusLocale } from './ai-guide-corpus-i18n.util.js';

type MessageTree = { [key: string]: string | MessageTree };

const SNAPSHOT_REL = join(
  'modules',
  'ai',
  'guide',
  'dashboard-guide-corpus-i18n.snapshot.json',
);

type GuideCorpusI18nSnapshot = Record<GuideCorpusLocale, MessageTree>;

let cachedSnapshot: GuideCorpusI18nSnapshot | null = null;

function resolveSnapshotPath(): string {
  const candidates = [
    join(process.cwd(), 'dist', SNAPSHOT_REL),
    join(process.cwd(), 'src', SNAPSHOT_REL),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`missing guide corpus i18n snapshot: ${candidates.join(' or ')}`);
}

function loadGuideCorpusI18nSnapshot(): GuideCorpusI18nSnapshot {
  if (cachedSnapshot) return cachedSnapshot;
  const raw = readFileSync(resolveSnapshotPath(), 'utf8');
  cachedSnapshot = JSON.parse(raw) as GuideCorpusI18nSnapshot;
  return cachedSnapshot;
}

export function getFrontendGuideCorpusMessages(
  locale: GuideCorpusLocale,
): MessageTree {
  return loadGuideCorpusI18nSnapshot()[locale];
}
