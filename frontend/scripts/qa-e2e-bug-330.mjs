/**
 * Guru live QA for e2e-bug.330 — dashboard/provider/overlay/availability
 * guide playbooks (~41) without a curated shortTitleKey must no longer
 * humanize into a dangling preposition/conjunction/article/copula or a bare
 * clause-boundary dash as the progress-summary step title.
 *
 * Verification strategy mirrors the established e2e-bug.316 script: call the
 * real guide-resolution pipeline directly against the built `dist/` output
 * (`resolveGuideFlowPlaybook` → `buildGuideResponseFromFlowPlaybook` →
 * `buildGuideResponseForMultiTurnStep`) so results reflect the actual
 * production code path without the LLM-enrichment layer (`enrichResult`)
 * that live dashboard-command HTTP responses pass through and which
 * paraphrases/obscures the raw short title under test.
 *
 * Run: cd backend && npm run build && node ../frontend/scripts/qa-e2e-bug-330.mjs
 */
import { createRequire } from 'module';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

process.chdir(backendRoot);

const { getFrontendGuideCorpusMessages } = require(resolve(
  backendRoot,
  'dist/modules/ai/guide/ai-guide-corpus-i18n.fixtures.js',
));
const { listAllGuideFlowPlaybookDefs } = require(resolve(
  backendRoot,
  'dist/modules/ai/guide/guide-flow.loader.js',
));
const {
  resolveGuideFlowPlaybook,
  buildGuideResponseFromFlowPlaybook,
} = require(resolve(
  backendRoot,
  'dist/modules/ai/guide/guide-flow.corpus.util.js',
));
const { buildGuideResponseForMultiTurnStep } = require(resolve(
  backendRoot,
  'dist/modules/ai/ai-product-guide-multiturn.util.js',
));

const DANGLING_LAST_WORDS = new Set([
  'a', 'an', 'the', 'to', 'with', 'and', 'or', 'but', 'when', 'then', 'like',
  'before', 'after', 'once', 'so', 'that', 'on', 'at', 'in', 'of', 'for',
  'against', 'is', 'are', 'was', 'were', 'my', 'your', 'our', 'their', 'its',
  'if',
  'կամ', 'և', 'եթե',
  'и', 'или', 'если', 'чтобы', 'для', 'к', 'в', 'с', 'по', 'при', 'на', 'до',
  'после',
]);

function stripPunct(word) {
  return word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

function isDangling(title) {
  const words = title.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? '';
  return DANGLING_LAST_WORDS.has(stripPunct(last)) || /^[—–→]+$/u.test(last);
}

async function main() {
  const allPlaybooks = listAllGuideFlowPlaybookDefs();
  const missing = allPlaybooks.filter((p) =>
    p.steps?.some((s) => !s.shortTitleKey),
  );
  console.log(`e2e-bug.330 QA — ${missing.length} playbooks lack shortTitleKey\n`);

  let passed = 0;
  let total = 0;
  const failures = [];

  for (const locale of ['en', 'hy', 'ru']) {
    const messages = getFrontendGuideCorpusMessages(locale);
    for (const playbook of missing) {
      const resolved = resolveGuideFlowPlaybook(playbook, messages);
      const guide = buildGuideResponseFromFlowPlaybook(resolved);
      for (let stepIndex = 0; stepIndex < guide.steps.length; stepIndex += 1) {
        total += 1;
        const stepped = buildGuideResponseForMultiTurnStep(
          guide,
          { guideFlowId: playbook.topicId, guideStepIndex: stepIndex, completedSteps: [] },
          locale,
        );
        const summary = String(stepped.summary || '');
        const title = guide.steps[stepIndex]?.title ?? '';
        const dangling = isDangling(title);
        const emptyTitle = !title.trim();
        const notCapitalized =
          title.length > 0 && title[0] !== title[0].toLocaleUpperCase();
        const ok = !dangling && !emptyTitle && !notCapitalized;
        if (ok) {
          passed += 1;
        } else {
          failures.push({
            id: `${locale}:${playbook.topicId}:step${stepIndex + 1}`,
            title,
            summary: summary.slice(0, 140),
            dangling,
            emptyTitle,
            notCapitalized,
          });
        }
      }
    }
  }

  // Spot-print a sample so a human can eyeball quality, not just the pass/fail count.
  console.log('Sample (dashboard.core.schedule, en):');
  {
    const messages = getFrontendGuideCorpusMessages('en');
    const playbook = allPlaybooks.find((p) => p.topicId === 'dashboard.core.schedule');
    const resolved = resolveGuideFlowPlaybook(playbook, messages);
    const guide = buildGuideResponseFromFlowPlaybook(resolved);
    for (let i = 0; i < guide.steps.length; i += 1) {
      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        { guideFlowId: playbook.topicId, guideStepIndex: i, completedSteps: [] },
        'en',
      );
      console.log(`  ${stepped.summary}`);
    }
  }
  console.log('\nSample (provider-appointments, hy):');
  {
    const messages = getFrontendGuideCorpusMessages('hy');
    const playbook = allPlaybooks.find((p) => p.topicId === 'provider-appointments');
    const resolved = resolveGuideFlowPlaybook(playbook, messages);
    const guide = buildGuideResponseFromFlowPlaybook(resolved);
    for (let i = 0; i < guide.steps.length; i += 1) {
      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        { guideFlowId: playbook.topicId, guideStepIndex: i, completedSteps: [] },
        'hy',
      );
      console.log(`  ${stepped.summary}`);
    }
  }

  console.log(`\n${passed}/${total} step-titles clean (no dangling/empty/lowercase)`);
  if (failures.length) {
    console.log('\nFAILURES:');
    for (const f of failures) {
      console.log(`  ${f.id}: "${f.title}" (dangling=${f.dangling} empty=${f.emptyTitle} lowercase=${f.notCapitalized})`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
