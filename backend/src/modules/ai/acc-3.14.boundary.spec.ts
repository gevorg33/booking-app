import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ACC_3_14_FORBIDDEN_LOCAL_PARAPHRASE_SYMBOLS,
  ACC_3_14_FORBIDDEN_METRIC_REGEX_PATTERNS,
  ACC_3_14_PIPE_MARKER,
  BOOKING_PARAM_HINTS_RELATIVE_FILE,
  METRIC_RESOLVERS_RELATIVE_FILE,
} from './acc-3.14.boundary.js';

const MODULE_DIR = __dirname;

describe('acc-3.14 boundary gate', () => {
  it('exports pipe marker', () => {
    expect(ACC_3_14_PIPE_MARKER).toBe('acc-3.14');
  });

  it('booking param hints delegates paraphrase detectors to semantic utils', () => {
    const content = readFileSync(
      path.join(MODULE_DIR, BOOKING_PARAM_HINTS_RELATIVE_FILE),
      'utf8',
    );
    expect(content).toContain('acc-3.14');
    expect(content).toContain('./any-provider-booking.semantic.util.js');
    expect(content).toContain('./recommend-specialists.semantic.util.js');
    for (const symbol of ACC_3_14_FORBIDDEN_LOCAL_PARAPHRASE_SYMBOLS) {
      expect(content).not.toMatch(new RegExp(`export function ${symbol}\\b`));
    }
  });

  it('metric resolvers delegates paraphrase meaning to semantic utils', () => {
    const content = readFileSync(
      path.join(MODULE_DIR, METRIC_RESOLVERS_RELATIVE_FILE),
      'utf8',
    );
    expect(content).toContain('acc-3.14');
    expect(content).toContain('./metric-resolvers.semantic.util.js');
    for (const symbol of ACC_3_14_FORBIDDEN_LOCAL_PARAPHRASE_SYMBOLS) {
      expect(content).not.toMatch(new RegExp(`export function ${symbol}\\b`));
    }
    for (const pattern of ACC_3_14_FORBIDDEN_METRIC_REGEX_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });
});
