/**
 * AI-ROADMAP Phase 9 — a confirmed miss becomes an example and an eval case.
 *
 * > "Each confirmed miss → registry `example` + eval case (**never** a new
 * > regex)."
 *
 * §43 finds the candidates; this turns a triaged one into the two artefacts
 * that close the loop. The parenthesis is the important half: the historical
 * response to a miss was a new `is*Prompt` detector, which is how the tree
 * reached 790 of them. Working agreement 6 forbids that, and §22's freeze
 * ratchet enforces it — but only if the fix path produces *data* instead.
 *
 * Everything below returns data. There is no code-generation path here, so the
 * loop structurally cannot emit a detector.
 */
import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { MissCandidate } from './ai-miss-mining.util.js';

/**
 * A miss that a human has triaged.
 *
 * `expectedAction` is required and cannot be derived: §43 knows which command
 * *ran*, not which one should have. Guessing it would write the wrong answer
 * into the eval corpus, which is worse than having no case — a wrong golden is
 * a permanent lie that everything else is measured against.
 */
export interface ConfirmedMiss {
  candidate: MissCandidate;
  /** The command that should have run. */
  expectedAction: string;
  surface: CommandSurface;
  locale?: AiEvalLocale;
  /** Which prompt to keep: the original, or the rewording that worked. */
  use?: 'original' | 'evidence';
}

export interface MissFixtures {
  /** Line to add to the command spec's `examples`. */
  example: string;
  /** Case to add to the deterministic eval corpus. */
  evalCase: AiCommandEvalCase;
}

/** `Cancel my BOOKING now!` → `cancel-my-booking-now`, for a stable case id. */
export function slugifyPrompt(prompt: string, maxWords = 6): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join('-');
}

export function buildMissCaseId(miss: ConfirmedMiss): string {
  const prompt = resolvePrompt(miss);
  return `miss-${miss.expectedAction}-${slugifyPrompt(prompt)}`;
}

function resolvePrompt(miss: ConfirmedMiss): string {
  // Default to the ORIGINAL wording, not the rewording that worked. The
  // rewording already succeeds — adding it as a case would pass on day one and
  // prove nothing. The phrasing that failed is the one worth pinning.
  if (miss.use === 'evidence' && miss.candidate.evidencePrompt) {
    return miss.candidate.evidencePrompt;
  }
  return miss.candidate.prompt;
}

/**
 * Turn a triaged miss into the example + eval case.
 *
 * The eval case asserts only `action`. A miss says "this phrasing reached the
 * wrong command"; it says nothing about which parameters should have been
 * extracted, and inventing param expectations would create a golden nobody
 * verified.
 */
export function buildMissFixtures(miss: ConfirmedMiss): MissFixtures {
  const prompt = resolvePrompt(miss);
  return {
    example: prompt,
    evalCase: {
      id: buildMissCaseId(miss),
      prompt,
      surface: miss.surface,
      ...(miss.locale ? { locale: miss.locale } : {}),
      expect: { action: miss.expectedAction },
    },
  };
}

export interface MissFixtureBatch {
  fixtures: MissFixtures[];
  /** Examples grouped by the command whose spec should gain them. */
  examplesByCommand: Record<string, string[]>;
  skipped: { prompt: string; reason: string }[];
}

/**
 * Convert a batch, dropping anything that would pollute the corpus.
 *
 * Three rejections, each protecting the corpus rather than the caller:
 *
 * - a prompt already present, because a duplicate golden inflates an intent's
 *   apparent coverage without testing anything new (§42 gates on case count);
 * - a prompt too short to carry intent — "yes", "ok" — which as a standalone
 *   eval case asserts that two characters mean a command;
 * - a miss whose expected action equals the one that already ran, which is not
 *   a miss at all and would encode the failure as correct.
 */
export function buildMissFixtureBatch(
  misses: readonly ConfirmedMiss[],
  existingPrompts: ReadonlySet<string> = new Set(),
): MissFixtureBatch {
  const fixtures: MissFixtures[] = [];
  const examplesByCommand: Record<string, string[]> = {};
  const skipped: { prompt: string; reason: string }[] = [];
  const seen = new Set([...existingPrompts].map((p) => p.trim().toLowerCase()));

  for (const miss of misses) {
    const prompt = resolvePrompt(miss).trim();
    const key = prompt.toLowerCase();

    if (miss.expectedAction === miss.candidate.action) {
      skipped.push({
        prompt,
        reason: `expected action equals the action that already ran (${miss.expectedAction})`,
      });
      continue;
    }
    if (prompt.split(/\s+/).filter(Boolean).length < 2) {
      skipped.push({ prompt, reason: 'prompt too short to carry an intent' });
      continue;
    }
    if (seen.has(key)) {
      skipped.push({ prompt, reason: 'prompt already in the corpus' });
      continue;
    }

    seen.add(key);
    const built = buildMissFixtures({ ...miss, use: miss.use ?? 'original' });
    fixtures.push(built);
    (examplesByCommand[miss.expectedAction] ??= []).push(built.example);
  }

  return { fixtures, examplesByCommand, skipped };
}

/**
 * Guard for the working agreement: a fix for a miss must be data.
 *
 * Returns the offending fragments. Intended for a review step over whatever a
 * miss produced — if a proposed fix contains a regex literal or a detector
 * name, it is the old habit reasserting itself and §22's ratchet will reject it
 * anyway. Failing here says *why* rather than just "the count went up".
 */
export function findRegexShapedFixes(text: string): string[] {
  const offenders: string[] = [];
  if (/\bexport\s+function\s+is[A-Za-z0-9_]*Prompt\b/.test(text)) {
    offenders.push('declares a new is*Prompt detector');
  }
  if (/new RegExp\(|\/\^|\\b[a-z].*\/[gimsuy]*\s*[,);]/.test(text)) {
    offenders.push('contains a regular expression');
  }
  return offenders;
}
