import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  INTENT_RESCUE_PIPELINE_BOUNDARY_DOC,
  RESCUE_BOUNDARY_RELATIVE_FILES,
  RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS,
  RESCUE_PIPELINE_BOUNDARY_MARKER,
} from './ai-intent-rescue.boundary.js';
import { RESCUE_PIPELINE_PHASES } from './ai-intent-rescue-pipeline.util.js';
import { checkIntentRescueBoundary } from './ai-intent-rescue-boundary-gate.util.js';

const MODULE_DIR = __dirname;
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');

describe('ai-intent-rescue boundary gate (pipe-1.5.1)', () => {
  it('boundary doc exists and states semantic is pipeline-only', () => {
    const docPath = path.join(REPO_ROOT, INTENT_RESCUE_PIPELINE_BOUNDARY_DOC);
    const doc = readFileSync(docPath, 'utf8');
    expect(doc).toContain(RESCUE_PIPELINE_BOUNDARY_MARKER);
    expect(doc).toMatch(/semantic_match/i);
    expect(doc).toMatch(/domain/i);
    expect(doc).toContain('AiIntentRescueService');
    expect(doc).toContain('semanticParamHints');
    expect(doc).not.toMatch(/trySemanticIntentRescue.*inside rescue/i);
  });

  it('documents domain-first rescue phases', () => {
    expect(RESCUE_PIPELINE_PHASES).toEqual([
      'provider_surface',
      'classified_disambiguation',
      'unknown_domain',
    ]);
  });

  it.each(RESCUE_BOUNDARY_RELATIVE_FILES)(
    'production file %s passes pipe-1.5.1 semantic-exclusion guard',
    () => {
      const violations = checkIntentRescueBoundary(MODULE_DIR);
      expect(violations).toEqual([]);
    },
  );

  it('documents forbidden semantic symbols for rescue service', () => {
    expect(RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS).toContain(
      'AiSemanticIntentService',
    );
    expect(RESCUE_FORBIDDEN_IMPORT_SUBSTRINGS).toContain(
      'trySemanticIntentRescue',
    );
  });
});
