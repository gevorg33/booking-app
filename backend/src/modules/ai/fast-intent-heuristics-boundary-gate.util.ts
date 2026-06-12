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

const IMPORT_FROM_RE = /from\s+['"](\.\/[^'"]+)['"]/g;

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
    for (const match of content.matchAll(IMPORT_FROM_RE)) {
      const mod = relativeImportModule(match[1] ?? '');
      if (!allowed.has(mod)) {
        violations.push(`${rel}: import not on allowlist: "./${mod}"`);
      }
    }
  }

  return violations;
}
