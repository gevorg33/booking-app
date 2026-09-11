/**
 * e2e-bug.390 — the gate that ties the checked-in embedding cache to the specs.
 *
 * `ai-command-embeddings.json` is generated from `commandMatchText` (description
 * plus examples) and committed. Nothing connected the two, so editing a spec
 * left the old vector in place and retrieval silently ranked against text that
 * no longer existed.
 *
 * §82 is what that costs: four specs gained the Armenian phrasings their users
 * actually write, the cache was not rebuilt, the measurement showed a
 * seven-point drop, and a correct change was reverted with the conclusion
 * written up as having "no mechanism I can defend". §86 re-ran it with the cache
 * rebuilt: truth-in-shortlist 64% -> 98%.
 *
 * If this test fails, the fix is one command:
 *
 *   npm run build:ai-embeddings
 */
import fs from 'node:fs';
import path from 'node:path';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  commandMatchTextHash,
  EMBEDDING_DIMENSIONS,
} from './ai-command-shortlist.util.js';

const CACHE = path.join(__dirname, 'ai-command-embeddings.json');

type Cache = {
  dimensions?: number;
  commandCount?: number;
  sourceHash?: string;
  vectors?: Record<string, number[]>;
};

describe('command embedding cache is not stale', () => {
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')) as Cache;

  it('was built from the current spec descriptions and examples', () => {
    // The whole point: a spec edit without a rebuild fails here by name rather
    // than as a quiet accuracy drift nobody attributes.
    expect(cache.sourceHash).toBe(commandMatchTextHash(COMMAND_SPECS));
  });

  it('covers every command', () => {
    expect(Object.keys(cache.vectors ?? {}).length).toBe(COMMAND_SPECS.length);
    expect(cache.commandCount).toBe(COMMAND_SPECS.length);
  });

  it('was built at the width the runtime queries with', () => {
    // A cache at another width produces meaningless cosines that still look like
    // numbers. `loadCommandIndex` already refuses it; this says so out loud.
    expect(cache.dimensions).toBe(EMBEDDING_DIMENSIONS);
  });

  it('changes its hash when any spec text changes', () => {
    // Guards the guard: a hash that ignored examples would pass everything.
    const base = commandMatchTextHash(COMMAND_SPECS);
    const mutated = commandMatchTextHash([
      ...COMMAND_SPECS.slice(1),
      { ...COMMAND_SPECS[0], examples: [...COMMAND_SPECS[0].examples, 'x'] },
    ]);
    expect(mutated).not.toBe(base);
  });

  it('does not depend on the order specs are declared in', () => {
    expect(commandMatchTextHash([...COMMAND_SPECS].reverse())).toBe(
      commandMatchTextHash(COMMAND_SPECS),
    );
  });
});
