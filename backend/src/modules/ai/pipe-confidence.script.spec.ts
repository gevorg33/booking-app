import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PIPE_CONFIDENCE_PIPE_MARKER,
  PIPE_CONFIDENCE_SCRIPT_NAME,
  PIPE_CONFIDENCE_SCRIPT_STEPS,
} from './pipe-confidence.fixtures.js';

const PACKAGE_JSON = readFileSync(
  join(__dirname, '..', '..', '..', 'package.json'),
  'utf8',
);
const PACKAGE = JSON.parse(PACKAGE_JSON) as {
  scripts: Record<string, string>;
};

describe('pipe-confidence CI script (pipe-1.11.3)', () => {
  it('exports pipe marker', () => {
    expect(PIPE_CONFIDENCE_PIPE_MARKER).toBe('pipe-1.11.3');
  });

  it('registers test:pipe-confidence in package.json', () => {
    const script = PACKAGE.scripts[PIPE_CONFIDENCE_SCRIPT_NAME];
    expect(script).toBeDefined();
    for (const step of PIPE_CONFIDENCE_SCRIPT_STEPS) {
      expect(script).toContain(`npm run ${step}`);
    }
  });

  it('chains confidence gate before implication corpus', () => {
    const script = PACKAGE.scripts[PIPE_CONFIDENCE_SCRIPT_NAME];
    const gateIndex = script.indexOf('test:pipe-confidence-gate');
    const corpusIndex = script.indexOf('test:pipe-implication-corpus');
    expect(gateIndex).toBeGreaterThan(-1);
    expect(corpusIndex).toBeGreaterThan(gateIndex);
  });

  it('includes self-verify clarify gate after implication corpus', () => {
    const script = PACKAGE.scripts[PIPE_CONFIDENCE_SCRIPT_NAME];
    const corpusIndex = script.indexOf('test:pipe-implication-corpus');
    const selfVerifyIndex = script.indexOf('test:pipe-self-verify');
    expect(selfVerifyIndex).toBeGreaterThan(corpusIndex);
  });
});
