/**
 * AI-ROADMAP Phase 6 — topic-change detection invalidating stale bindings.
 *
 * The property that matters is the failure direction. A stale binding that
 * survives sends a mutating command at a row the user never named, and §47
 * established that many of those writes cannot be undone. A binding dropped too
 * eagerly costs one restated sentence. These tests pin that asymmetry.
 */
import {
  BINDING_TTL_MS,
  detectTopicChange,
  invalidateStaleBindings,
  type TopicChangeInput,
} from './ai-topic-change.util.js';
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import type { PendingClarification } from './ai-slot-filling.util.js';

const spec = (id: string, risk: CommandSpec['risk']): CommandSpec => ({
  id,
  aliases: [],
  domain: id.split('.')[0],
  surfaces: ['dashboard'],
  tiers: { dashboard: ['owner'] },
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
  spec('appointment.list', 'T0'),
];

const step = (id: string, command: string): PlanStep => ({
  id,
  command,
  variables: {},
  confidence: 1,
  dependsOn: [],
});

const planWith = (steps: PlanStep[], topicChanged = false): CommandPlan => ({
  steps,
  unresolved: [],
  topicChanged,
});

const pendingFor = (command: string): PendingClarification => ({
  plan: planWith([step('s1', command)]),
  stepId: 's1',
  request: {
    reason: 'ambiguous_entity',
    question: 'Which appointment?',
    command,
    variable: 'appointmentId',
    options: [
      { value: 'a1', label: 'Tuesday 3pm' },
      { value: 'a2', label: 'Friday 10am' },
    ],
    allowsFreeText: true,
  },
});

const NOW = new Date('2026-08-07T12:00:00Z');

const input = (over: Partial<TopicChangeInput> = {}): TopicChangeInput => ({
  pending: pendingFor('appointment.cancel_mine'),
  message: 'the tuesday one',
  newPlan: null,
  pendingCreatedAt: new Date(NOW.getTime() - 10_000),
  now: NOW,
  turnsElapsed: 1,
  ...over,
});

describe('detectTopicChange', () => {
  it('sees no change in a plain answer to the question', () => {
    const verdict = detectTopicChange(input());
    expect(verdict.changed).toBe(false);
    expect(verdict.signals).toEqual([]);
  });

  it('honours the planner flag that was previously decoded and dropped', () => {
    // `CommandPlan.topicChanged` is set by the prompt and read by the decoder;
    // until now nothing consumed it.
    const verdict = detectTopicChange(
      input({
        newPlan: planWith([step('s1', 'appointment.cancel_mine')], true),
      }),
    );
    expect(verdict.signals).toContain('model_reported');
    expect(verdict.changed).toBe(true);
  });

  it('sees a change when the new message names a different command', () => {
    const verdict = detectTopicChange(
      input({
        message: 'what is on my calendar friday',
        newPlan: planWith([step('s1', 'appointment.list')]),
      }),
    );
    expect(verdict.signals).toContain('command_mismatch');
  });

  it('does not flag a mismatch when the command is the same', () => {
    const verdict = detectTopicChange(
      input({ newPlan: planWith([step('s1', 'appointment.cancel_mine')]) }),
    );
    expect(verdict.signals).not.toContain('command_mismatch');
  });

  it('picks up an explicit change of mind', () => {
    expect(
      detectTopicChange(input({ message: 'actually never mind' })).signals,
    ).toContain('new_request_cue');
  });

  it('expires a binding older than the conversation window', () => {
    const verdict = detectTopicChange(
      input({
        pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
      }),
    );
    expect(verdict.signals).toContain('expired');
  });

  it('keeps a binding inside the window', () => {
    const verdict = detectTopicChange(
      input({
        pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS + 1000),
      }),
    );
    expect(verdict.signals).not.toContain('expired');
  });

  it('expires a binding that survived too many turns', () => {
    // A clarification is answered by the next message or it is not answered.
    expect(detectTopicChange(input({ turnsElapsed: 3 })).signals).toContain(
      'too_many_turns',
    );
  });

  it('reports every signal, not just the first', () => {
    const verdict = detectTopicChange(
      input({
        message: 'actually, cancel that',
        newPlan: planWith([step('s1', 'appointment.list')], true),
        turnsElapsed: 5,
      }),
    );
    expect(verdict.signals.sort()).toEqual([
      'command_mismatch',
      'model_reported',
      'new_request_cue',
      'too_many_turns',
    ]);
  });

  it('explains itself in words a user could read', () => {
    const verdict = detectTopicChange(input({ turnsElapsed: 3 }));
    expect(verdict.reason).toContain('more than one turn old');
  });
});

describe('the lexical detector this deliberately does not use', () => {
  it('does not treat a translated repeat as a topic change', () => {
    // Measured on 40 real consecutive pairs: "Who approves my time off?"
    // followed by the same question in Armenian scores 0.00 token similarity
    // while keeping the same action. The corpus is trilingual, so lexical
    // overlap measures language rather than subject.
    //
    // Asserted through the real API: two messages sharing no tokens are NOT
    // treated as a topic change on that basis alone.
    const verdict = detectTopicChange(
      input({
        message: 'Ով է հաստատում իմ արձակուրդը',
        newPlan: planWith([step('s1', 'appointment.cancel_mine')]),
      }),
    );
    expect(verdict.changed).toBe(false);
  });
});

describe('invalidateStaleBindings', () => {
  it('keeps the binding when nothing changed', () => {
    const decision = invalidateStaleBindings(input(), SPECS);
    expect(decision.invalidated).toBe(false);
    expect(decision.pending).not.toBeNull();
  });

  it('drops a mutating binding on any signal', () => {
    // The failure this exists to prevent: "cancel it" landing on the previous
    // topic's appointment.
    const decision = invalidateStaleBindings(
      input({
        message: 'what is on my calendar friday',
        newPlan: planWith([step('s1', 'appointment.list')]),
      }),
      SPECS,
    );
    expect(decision.invalidated).toBe(true);
    expect(decision.pending).toBeNull();
  });

  it('drops a mutating binding on a clock signal alone', () => {
    // For a write, an old binding is enough on its own. §47: many of these
    // writes cannot be undone, and a wrongly cancelled appointment has already
    // emailed the customer.
    const decision = invalidateStaleBindings(
      input({
        pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
      }),
      SPECS,
    );
    expect(decision.invalidated).toBe(true);
  });

  it('lets a read binding survive a clock signal alone', () => {
    // A stale read shows the wrong list and the user asks again. Applying the
    // write standard here would drop context for no safety gain.
    const decision = invalidateStaleBindings(
      {
        ...input({
          pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
        }),
        pending: pendingFor('appointment.list'),
      },
      SPECS,
    );
    expect(decision.invalidated).toBe(false);
  });

  it('still drops a read binding when the subject actually changed', () => {
    const decision = invalidateStaleBindings(
      {
        ...input({
          message: 'actually never mind',
          pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
        }),
        pending: pendingFor('appointment.list'),
      },
      SPECS,
    );
    expect(decision.invalidated).toBe(true);
  });

  it('treats an unidentifiable command as mutating', () => {
    // The optimistic reading is what lets a stale binding reach a write.
    const decision = invalidateStaleBindings(
      {
        ...input({
          pendingCreatedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
        }),
        pending: pendingFor('mystery.command'),
      },
      SPECS,
    );
    expect(decision.invalidated).toBe(true);
  });

  it('tells the user why the earlier question went away', () => {
    // Dropping a clarification silently leaves the user answering a question
    // that no longer exists.
    const decision = invalidateStaleBindings(
      input({
        message: 'what is on my calendar friday',
        newPlan: planWith([step('s1', 'appointment.list')]),
      }),
      SPECS,
    );
    expect(decision.notice).toContain('different command');
  });

  it('says nothing when it kept the binding', () => {
    expect(invalidateStaleBindings(input(), SPECS).notice).toBeNull();
  });
});
