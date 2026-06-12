import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  RESCUE_BOUNDARY_RELATIVE_FILES,
  RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS,
  RESCUE_FORBIDDEN_SOURCE_SUBSTRINGS,
  RESCUE_PIPELINE_BOUNDARY_MARKER,
} from './ai-intent-rescue.boundary.js';

const DEFAULT_MODULE_DIR = path.join(__dirname);

/** Returns violation messages; empty array means gate passed (pipe-1.5.1). */
export function checkIntentRescueBoundary(
  moduleDir = DEFAULT_MODULE_DIR,
): string[] {
  const violations: string[] = [];

  for (const rel of RESCUE_BOUNDARY_RELATIVE_FILES) {
    const filePath = path.join(moduleDir, rel);
    const content = readFileSync(filePath, 'utf8');

    if (!content.includes(RESCUE_PIPELINE_BOUNDARY_MARKER)) {
      violations.push(
        `${rel}: missing boundary marker "${RESCUE_PIPELINE_BOUNDARY_MARKER}"`,
      );
    }

    for (const forbidden of RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS) {
      if (content.includes(forbidden)) {
        violations.push(`${rel}: forbidden import/reference "${forbidden}"`);
      }
    }

    for (const forbidden of RESCUE_FORBIDDEN_SOURCE_SUBSTRINGS) {
      if (content.includes(forbidden)) {
        violations.push(`${rel}: forbidden source reference "${forbidden}"`);
      }
    }
  }

  return violations;
}
