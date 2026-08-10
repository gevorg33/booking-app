/**
 * AI-ROADMAP Phase 4 — anaphora resolution.
 *
 * The corpus measurement drove the whole design and is pinned here as
 * behaviour: of 110 real anaphoric prompts, **82% carry their referent in the
 * same message**, 12% are expletives referring to nothing, and 6% have no
 * in-message referent — of which exactly one is genuine cross-turn anaphora.
 *
 * The prompts below are taken from `ai_command_trace` rather than invented, so
 * these assert against phrasings users actually sent.
 */
import {
  bindAnaphorToReference,
  findAnaphor,
  resolveAnaphora,
} from './ai-anaphora.util.js';
import type { PlanStep } from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (id: string, risk: CommandSpec['risk']): CommandSpec => ({
  id,
  aliases: [],
  domain: id.split('.')[0],
  surfaces: ['customer'],
  tiers: { customer: ['client'] },
  risk,
  description: id,
  variables: {},
  examples: [],
  confirm: 'never',
  handler: 'X',
  ...(risk === 'T0'
    ? {}
    : { compensation: { kind: 'none' as const, reason: 'test fixture' } }),
});

const SPECS: CommandSpec[] = [
  spec('appointment.cancel_mine', 'T1'),
  spec('appointment.create', 'T1'),
  spec('appointment.list', 'T0'),
];

const step = (
  id: string,
  command: string,
  variables: Record<string, unknown> = {},
): PlanStep => ({ id, command, variables, confidence: 1, dependsOn: [] });

describe('findAnaphor', () => {
  describe('real anaphora from the corpus', () => {
    it('finds "it" in the commonest compound shape', () => {
      // The single most frequent anaphoric prompt in the corpus, by a wide
      // margin — and `compound_intent` is measured at 0% accuracy (§42).
      const mention = findAnaphor(
        'cancel my Swedish massage booking and rebook it for next Friday instead',
      );
      expect(mention).toMatchObject({ text: 'it', kind: 'singular' });
    });

    it('finds a plural anaphor', () => {
      expect(findAnaphor('yes, cancel them all')).toMatchObject({
        kind: 'plural',
      });
    });

    it('treats "the same X" as an attribute, not an entity', () => {
      // "the same time" echoes an attribute of a referent; it does not point at
      // an entity, and binding it to one would be a category error.
      expect(findAnaphor('book the same time next week')).toMatchObject({
        kind: 'attribute',
        attribute: 'time',
      });
    });

    it('finds "that one"', () => {
      expect(findAnaphor('cancel that one')).toMatchObject({
        kind: 'singular',
      });
    });
  });

  describe('the 12% that refer to nothing', () => {
    // Binding these to an entity would invent a reference the user never made,
    // and then act on it. Each of these is a real corpus prompt.
    it.each([
      'is it possible to cancel my booking?',
      'It says my email is invalid at checkout, what should I fix?',
      'What does it mean to pick any available specialist?',
      'How much does it cost',
      'Add a new catalog category named Makeup E2E290 appreciate it',
      'keep it within my means',
    ])('returns null for %j', (prompt) => {
      expect(findAnaphor(prompt)).toBeNull();
    });
  });

  it('returns null when there is no anaphor at all', () => {
    expect(findAnaphor('book a massage tomorrow at 3pm')).toBeNull();
  });

  it('does not match "it" inside another word', () => {
    expect(findAnaphor('show my visits')).toBeNull();
  });
});

describe('resolveAnaphora', () => {
  const message =
    'cancel my Swedish massage booking and rebook it for next Friday instead';

  it('binds "it" to the earlier step in the same message', () => {
    // 82% of the corpus. No session store involved.
    const steps = [
      step('s1', 'appointment.cancel_mine', { service: 'Swedish massage' }),
      step('s2', 'appointment.create', { date: 'next Friday' }),
    ];
    const result = resolveAnaphora(message, steps, 1, SPECS);
    expect(result.status).toBe('resolved');
    expect(result.referentStepId).toBe('s1');
  });

  it('does not look forward for a referent', () => {
    // A reference cannot point at something not yet established.
    const steps = [
      step('s1', 'appointment.create', { date: 'next Friday' }),
      step('s2', 'appointment.cancel_mine', { service: 'Swedish massage' }),
    ];
    expect(resolveAnaphora(message, steps, 0, SPECS).status).toBe(
      'no_referent',
    );
  });

  it('refuses when two earlier steps could be the referent', () => {
    // A wrongly bound anaphor is a mutation on a row the user never named, and
    // §47 established many of these writes cannot be undone.
    const steps = [
      step('s1', 'appointment.cancel_mine', { service: 'Swedish' }),
      step('s2', 'appointment.cancel_mine', { service: 'Deep tissue' }),
      step('s3', 'appointment.create', { date: 'Friday' }),
    ];
    const result = resolveAnaphora(message, steps, 2, SPECS);
    expect(result.status).toBe('ambiguous');
    expect(result.referentStepId).toBeNull();
    expect(result.candidates).toEqual(['s1', 's2']);
  });

  it('offers the candidates so the clarify can be answered', () => {
    const steps = [
      step('s1', 'appointment.cancel_mine', { service: 'Swedish' }),
      step('s2', 'appointment.cancel_mine', { service: 'Deep tissue' }),
      step('s3', 'appointment.create', {}),
    ];
    const result = resolveAnaphora(message, steps, 2, SPECS);
    expect(result.clarification).toContain('it');
    expect(result.candidates).toHaveLength(2);
  });

  it('does not bind an anaphor to a read', () => {
    // "show my bookings" then "cancel it" — a list does not establish which row
    // "it" is, and binding to it would cancel an arbitrary one.
    const steps = [
      step('s1', 'appointment.list', { range: 'week' }),
      step('s2', 'appointment.cancel_mine', {}),
    ];
    expect(resolveAnaphora(message, steps, 1, SPECS).status).toBe(
      'no_referent',
    );
  });

  it('does not bind to a step that established no entity', () => {
    const steps = [
      step('s1', 'appointment.cancel_mine', {}),
      step('s2', 'appointment.create', {}),
    ];
    expect(resolveAnaphora(message, steps, 1, SPECS).status).toBe(
      'no_referent',
    );
  });

  it('reports not_applicable when the message has no anaphor', () => {
    const steps = [
      step('s1', 'appointment.cancel_mine', { service: 'Swedish' }),
      step('s2', 'appointment.create', { date: 'Friday' }),
    ];
    const result = resolveAnaphora('book a massage friday', steps, 1, SPECS);
    expect(result.status).toBe('not_applicable');
    expect(result.mention).toBeNull();
  });

  it('reports not_applicable for an expletive rather than hunting a referent', () => {
    const steps = [
      step('s1', 'appointment.cancel_mine', { service: 'Swedish' }),
      step('s2', 'appointment.create', { date: 'Friday' }),
    ];
    expect(
      resolveAnaphora('is it possible to cancel my booking?', steps, 1, SPECS)
        .status,
    ).toBe('not_applicable');
  });

  it('ignores an unknown command as a referent', () => {
    // An unidentifiable command cannot be confirmed to establish an entity.
    const steps = [
      step('s1', 'mystery.command', { thing: 'x' }),
      step('s2', 'appointment.create', {}),
    ];
    expect(resolveAnaphora(message, steps, 1, SPECS).status).toBe(
      'no_referent',
    );
  });
});

describe('bindAnaphorToReference', () => {
  it('emits the $sN.field form the executor already understands', () => {
    // Not an inlined value: the referent's id does not exist until that step
    // runs, and §33's executor is what wires an output into a later input.
    const bound = bindAnaphorToReference(
      step('s2', 'appointment.create', { date: 'Friday' }),
      'appointmentId',
      's1',
    );
    expect(bound.variables.appointmentId).toBe('$s1.id');
  });

  it('adds the dependency so the executor orders the steps', () => {
    const bound = bindAnaphorToReference(
      step('s2', 'appointment.create'),
      'appointmentId',
      's1',
    );
    expect(bound.dependsOn).toEqual(['s1']);
  });

  it('does not duplicate an existing dependency', () => {
    const existing: PlanStep = {
      ...step('s2', 'appointment.create'),
      dependsOn: ['s1'],
    };
    expect(bindAnaphorToReference(existing, 'x', 's1').dependsOn).toEqual([
      's1',
    ]);
  });

  it('can reference a field other than id', () => {
    const bound = bindAnaphorToReference(
      step('s2', 'appointment.create'),
      'startsAt',
      's1',
      'startsAt',
    );
    expect(bound.variables.startsAt).toBe('$s1.startsAt');
  });

  it('leaves the original step untouched', () => {
    const original = step('s2', 'appointment.create', { date: 'Friday' });
    bindAnaphorToReference(original, 'appointmentId', 's1');
    expect(original.variables).toEqual({ date: 'Friday' });
    expect(original.dependsOn).toEqual([]);
  });
});
