import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  FAST_HEURISTIC_ALLOWED_IMPORT_MODULES,
  FAST_HEURISTIC_BOUNDARY_MARKER,
  FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES,
  FAST_HEURISTIC_FORBIDDEN_IMPORT_SUBSTRINGS,
  FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS,
} from './fast-intent-heuristics.boundary.js';

const DEFAULT_MODULE_DIR = path.join(__dirname);

/**
 * acc-3.14 / §229 — matches the whole import statement so `import type` can be
 * told apart from a value import.
 *
 * The allowlist exists to stop these modules **delegating** to non-routing
 * code. A type-only import delegates to nothing: it is erased before runtime.
 * The old pattern matched the bare `from './x'`, so
 * `import type { AssistantMode } from './ai-assistant-mode.util.js'` — a field
 * annotation — was reported as a forbidden delegation, and three boundary tests
 * failed for a dependency that does not exist at runtime.
 */
const IMPORT_FROM_RE =
  /\b(?:import|export)\s+(type\s+)?[^;]*?from\s+['"](\.\/[^'"]+)['"]/g;

/**
 * The delegation imports a gated file actually makes — §229.
 *
 * Exported because `fast-intent-heuristics.boundary.spec.ts` re-implemented this
 * scan with its own copy of the regex, so teaching the checker to skip
 * `import type` left the spec still failing on the same type-only import. One
 * scanner, one definition of "delegation".
 */
export function listDelegationImports(content: string): string[] {
  const mods: string[] = [];
  for (const match of content.matchAll(IMPORT_FROM_RE)) {
    if (match[1]) continue; // type-only: erased before runtime
    mods.push(relativeImportModule(match[2] ?? ''));
  }
  return mods;
}

function relativeImportModule(specifier: string): string {
  return path.basename(specifier.replace(/\.js$/, ''));
}

/** Returns violation messages; empty array means gate passed (pipe-1.2.3). */
export function checkFastIntentHeuristicsBoundary(
  moduleDir = DEFAULT_MODULE_DIR,
): string[] {
  const violations: string[] = [];

  for (const rel of FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES) {
    const filePath = path.join(moduleDir, rel);
    const content = readFileSync(filePath, 'utf8');

    if (!content.includes(FAST_HEURISTIC_BOUNDARY_MARKER)) {
      violations.push(
        `${rel}: missing boundary marker "${FAST_HEURISTIC_BOUNDARY_MARKER}"`,
      );
    }

    for (const forbidden of FAST_HEURISTIC_FORBIDDEN_IMPORT_SUBSTRINGS) {
      if (content.includes(forbidden)) {
        violations.push(`${rel}: forbidden import/reference "${forbidden}"`);
      }
    }

    for (const symbol of FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS) {
      if (content.includes(symbol)) {
        violations.push(`${rel}: forbidden paraphrase symbol "${symbol}"`);
      }
    }

    const allowed = new Set<string>(FAST_HEURISTIC_ALLOWED_IMPORT_MODULES);
    for (const mod of listDelegationImports(content)) {
      if (!allowed.has(mod)) {
        violations.push(`${rel}: import not on allowlist: "./${mod}"`);
      }
    }
  }

  return violations;
}
