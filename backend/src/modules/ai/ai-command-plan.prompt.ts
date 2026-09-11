/**
 * AI-ROADMAP Phase 3 — planner prompt assembly.
 *
 * The prompt is GENERATED from CommandSpecs, never hand-written. That is the
 * whole point of the registry: today the four surface schemas are maintained by
 * hand and drift from each other and from the registry. Here, adding a command
 * to a spec file changes the prompt on every surface it declares.
 *
 * Deterministic and pure, so the exact text the model receives is testable.
 */
import type { AccessTier } from './access-control.matrix.js';
import type { EntityStore } from './ai-entity-store.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { buildPlannerShortlist } from './ai-command-spec.derive.js';
import type { CommandSpec } from './ai-command-spec.types.js';

export type PlannerContext = {
  /** ISO date used to ground "tomorrow" / "Friday" without the model guessing. */
  today: string;
  timeZone?: string;
  locale?: string;
  /**
   * Entities already resolved earlier in the conversation, so follow-ups like
   * "move it to 4pm" have something concrete to bind to. Phase 6 fills this
   * from the session entity store.
   */
  knownEntities?: Record<string, string>;
  /**
   * e2e-bug.370 — the conversation's entity store, loaded by the e2e-bug.401
   * carrier and written by e2e-bug.373's recorder. The planner binds a
   * cross-turn anaphor ("book it") against it deterministically, after the
   * intra-plan resolver has had its turn.
   */
  entityStore?: EntityStore | null;
  /** e2e-bug.370 — user-turn number from the carrier; staleness is measured in turns. */
  turnIndex?: number;
  /** Verbatim recent turns, oldest first. */
  recentTurns?: { role: 'user' | 'assistant'; text: string }[];
};

/**
 * The exact JSON contract the model must return — mirrors `CommandPlan`.
 *
 * The step label is `stepId`, not `id`, because of e2e-bug.388. The field was
 * called `id` while the field beside it was documented as taking "one of the
 * command **ids** listed above" — so the model put the command id into `id` and
 * omitted `command` entirely. `decodePlanStep` then dropped every such step as
 * having no command, producing an empty plan with nothing in `unresolved`.
 *
 * That accounted for 57 of 150 replayed prompts. The plans were correct; the two
 * fields were named so that the wrong one attracted the value.
 */
export const PLAN_OUTPUT_CONTRACT = `Return ONLY a JSON object of this shape:
{
  "steps": [
    {
      "command": "<one of the command ids listed above, exactly>",
      "stepId": "s1",
      "variables": { "<variableName>": <value> },
      "confidence": 0.9,
      "dependsOn": ["<stepId of an earlier step>"]
    }
  ],
  "unresolved": ["<anything you could not map or pin down, in plain words>"],
  "topicChanged": false
}
"command" is the command id. "stepId" is just a label for this step ("s1", "s2") so later steps can refer to it.
"confidence" is a number between 0 and 1 — how sure you are this step is what the user asked for. Always include it.`;

const RULES = [
  'Extract EVERY distinct request in the message as its own step. One message can contain several commands.',
  'Use a command id exactly as listed. If a request does not match any listed command, do NOT substitute a similar one — add a plain-language note to "unresolved" instead.',
  "Only fill variables that are named in that command's list. Never invent variable names.",
  'If a value is missing from the message, leave the variable out. Do not guess names, dates, prices or ids.',
  'When one step needs a value produced by an earlier step, reference it as "$<stepId>.<field>" and list that step in "dependsOn".',
  'If a person, service or appointment is ambiguous (e.g. two customers named John), add it to "unresolved" rather than picking one.',
  'confidence is your own certainty that this step is what the user asked for.',
  'Set "topicChanged" to true when this message starts a new subject rather than continuing the previous one.',
];

/**
 * AI-ROADMAP §78 — group the shortlist by domain instead of filtering it.
 *
 * Seven attempts at retrieval-based narrowing all landed between 22% and 49%
 * recall, and §78 concluded the embedding is the ceiling. But the same model
 * picks correctly among the 16 coherent domains 58% of the time at top-2, and
 * with the *full* list the correct command is present by construction.
 *
 * So this reduces the navigation problem rather than the candidate count:
 * every command stays, grouped under a domain heading. Recall is 100% by
 * construction; the bet is that structure is what the model was missing.
 *
 * Behind a flag so the effect can be measured against the flat rendering with
 * one variable changed.
 */
function renderGroupedShortlist(
  entries: ReturnType<typeof buildPlannerShortlist>,
  specs: readonly CommandSpec[],
  renderEntry: (e: ReturnType<typeof buildPlannerShortlist>[number]) => string,
): string {
  const domainOf = new Map(specs.map((s) => [s.id, s.domain]));
  const byDomain = new Map<string, string[]>();
  for (const e of entries) {
    const domain = domainOf.get(e.command) ?? 'other';
    const bucket = byDomain.get(domain) ?? [];
    bucket.push(renderEntry(e));
    byDomain.set(domain, bucket);
  }
  return [...byDomain.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(
      ([domain, lines]) =>
        `## ${domain} (${lines.length})\n${lines.join('\n')}`,
    )
    .join('\n\n');
}

function renderShortlist(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
): string {
  const entries = buildPlannerShortlist(specs, surface, tier);
  const renderEntry = (e: (typeof entries)[number]) => {
    // e2e-bug.397 — with types. A bare name tells the model nothing about the
    // shape it has to produce, and it answered `catalogDraft` with a sentence.
    const hint = new Map(e.variableHints.map((h) => [h.name, h]));
    const withType = (name: string) => {
      const h = hint.get(name);
      if (!h) return name;
      const en = h.enum ? ` one of ${h.enum.join('|')}` : '';
      // e2e-bug.399 — `h.resolver` is available here and deliberately NOT
      // rendered. Measured twice, against two different theories, and it has
      // never paid.
      //
      // §120 rendered it and reverted: `missing_variables` 4 -> 2 as intended,
      // recovery 30.6% -> 28.7%, because the newly-filled plans then hit
      // `needs_confirmation` and the routing seam declined them. That was
      // diagnosed as "blocked behind a different gate", and the gate was removed
      // by e2e-bug.404.
      //
      // §130 redid the measurement with the gate gone. It recovered exactly the
      // loss §120 identified (28.7% -> 30.1%) and still did not beat doing
      // nothing (30.6% and 32.4% on two baseline runs). The effect is real and
      // well above the noise floor — 13-14 of 121 prompts move verdict, against
      // 3 for baseline-vs-baseline — but it reshuffles failures rather than
      // fixing them: five prompts move from `not_executable` to
      // `not_single_step`, the added rule making the model split work into steps.
      //
      // So the deadlock in the ticket is real and this is not its fix.
      return `${name} (${h.type}${en})`;
    };
    const required = e.requiredVariables.length
      ? `    required: ${e.requiredVariables.map(withType).join(', ')}`
      : '    required: (none)';
    const optional = e.optionalVariables.length
      ? `\n    optional: ${e.optionalVariables.map(withType).join(', ')}`
      : '';
    const examples = e.examples.length
      ? `\n    e.g. ${e.examples.map((x) => `"${x}"`).join(' | ')}`
      : '';
    return `- ${e.command}: ${e.description}\n${required}${optional}${examples}`;
  };

  return process.env.AI_PLANNER_GROUPED_SHORTLIST === '1'
    ? renderGroupedShortlist(entries, specs, renderEntry)
    : entries.map(renderEntry).join('\n');
}

export function buildPlannerSystemPrompt(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
  context: PlannerContext,
): string {
  const shortlist = renderShortlist(specs, surface, tier);
  const contextLines = [
    `Today is ${context.today}.`,
    context.timeZone ? `Business time zone: ${context.timeZone}.` : null,
    context.locale ? `User locale: ${context.locale}.` : null,
    context.knownEntities && Object.keys(context.knownEntities).length
      ? `Already known from this conversation: ${Object.entries(
          context.knownEntities,
        )
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}.`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    `You turn a user's message into a plan of commands for a booking platform.`,
    `You are on the "${surface}" surface. Only the commands listed below exist here.`,
    '',
    contextLines,
    '',
    'AVAILABLE COMMANDS',
    shortlist,
    '',
    'RULES',
    ...RULES.map((r, i) => `${i + 1}. ${r}`),
    '',
    PLAN_OUTPUT_CONTRACT,
  ].join('\n');
}

export function buildPlannerMessages(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
  context: PlannerContext,
  message: string,
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] =
    [
      {
        role: 'system',
        content: buildPlannerSystemPrompt(specs, surface, tier, context),
      },
    ];
  for (const turn of context.recentTurns ?? []) {
    messages.push({ role: turn.role, content: turn.text });
  }
  messages.push({ role: 'user', content: message });
  return messages;
}
