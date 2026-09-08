/**
 * §224 — `spec.handler` diffed against the dispatch maps.
 *
 * The `handler` field is what a reader (or a tracing script) starts from when
 * asking "which code serves this command?". Across the C2 campaign that
 * question was answered by hand 27 services over, and it went wrong often
 * enough to be worth a gate: `ProviderAiCommandService` lives outside
 * `modules/ai/`, `notify_patient_book_lab` is served by a handler whose name
 * shares nothing with the alias, and `list_my_package_visits` has *two*
 * implementations of the same name in different files.
 *
 * The 41 `*-dispatch.build.ts` files are ground truth: each is typed against
 * exactly one service and maps the aliases that service serves. Diffing the two
 * gives 134 checkable commands, of which 45 disagree — and the disagreements
 * are not noise, they are three distinct shapes:
 *
 *  1. **facade (42)** — `handler` names `AiCommandService`, the dashboard entry
 *     point, while the dispatch map names the service that implements it. This
 *     is the convention, not an error.
 *  2. **multi-surface (2)** — one spec, two surfaces, two real implementations;
 *     `handler` is a single string and can only name one of them.
 *  3. **wrong (1, fixed §224)** — `configure_openai_integration` named a
 *     service that neither serves it nor delegates to the one that does.
 *
 * This test pins 1 and 2 by name so a **new** divergence — which would be a
 * fresh instance of 3 — fails instead of being absorbed into the count.
 */
import * as fs from 'fs';
import * as path from 'path';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';

type Spec = (typeof COMMAND_SPECS)[number] & {
  handler?: string;
  aliases?: string[];
};

/** `handler` → dispatching service, for commands where the two legitimately differ. */
const KNOWN_DIVERGENCES: Readonly<Record<string, string>> = {
  // 1. the dashboard facade delegating to its implementing services
  'AiCommandService::AiBookingCoreService': 'dashboard facade',
  'AiCommandService::AiScheduleHandlersService': 'dashboard facade',
  'AiCommandService::AiMetaOpsService': 'dashboard facade',
  // 2. one spec, two surfaces, two implementations — `handler` names one
  'PublicBookingAssistantService::AiBookingCoreService': 'multi-surface',
  'AiProviderBookingService::AiSelfServiceBookingService': 'multi-surface',
};

function dispatchOwners(): Array<{ alias: string; service: string }> {
  const out: Array<{ alias: string; service: string }> = [];
  for (const file of fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith('-dispatch.build.ts'))) {
    const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const service = /import type \{\s*(Ai[A-Za-z0-9]*Service)\s*\}/.exec(src)?.[1];
    if (!service) continue;
    for (const m of src.matchAll(/map\.set\(\s*'([a-z_0-9]+)'/g)) {
      out.push({ alias: m[1], service });
    }
  }
  return out;
}

describe('spec.handler agrees with the dispatch maps (§224)', () => {
  const specByAlias = new Map<string, Spec>();
  for (const spec of COMMAND_SPECS as unknown as Spec[]) {
    for (const alias of spec.aliases ?? []) specByAlias.set(alias, spec);
  }

  it('every dispatched alias has a spec', () => {
    const orphans = dispatchOwners()
      .filter(({ alias }) => !specByAlias.has(alias))
      .map(({ alias }) => alias);
    expect(orphans).toEqual([]);
  });

  it('no handler disagrees with its dispatch map in a new way', () => {
    const unexplained = dispatchOwners()
      .map(({ alias, service }) => {
        const spec = specByAlias.get(alias);
        if (!spec?.handler || spec.handler === service) return null;
        const key = `${spec.handler}::${service}`;
        return KNOWN_DIVERGENCES[key] ? null : `${alias}: ${key}`;
      })
      .filter((x): x is string => x !== null);

    // A new pair here means the spec points at code that does not serve the
    // command — the shape `configure_openai_integration` had until §224, and
    // the one that sends a reader to the wrong file.
    expect(unexplained).toEqual([]);
  });

  it('still has a population to measure', () => {
    // 134 at §224. A refactor that empties the dispatch maps must not make this
    // file pass by checking nothing.
    expect(dispatchOwners().length).toBeGreaterThan(100);
  });
});
