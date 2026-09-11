import {
  decodePlanResponse,
  extractJsonBody,
} from './ai-command-plan.decode.js';
import {
  buildPlannerMessages,
  buildPlannerSystemPrompt,
} from './ai-command-plan.prompt.js';
import { validatePlan } from './ai-command-plan.validate.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';

const CONTEXT = { today: '2026-08-03', timeZone: 'Asia/Yerevan', locale: 'en' };

const GOOD = JSON.stringify({
  steps: [
    {
      id: 's1',
      command: 'appointment.reschedule',
      variables: { appointmentId: 'apt-1', newStart: '2026-08-04T15:00:00Z' },
      confidence: 0.94,
      dependsOn: [],
    },
  ],
  unresolved: [],
  topicChanged: false,
});

describe('AI-ROADMAP Phase 3 — planner prompt', () => {
  const prompt = buildPlannerSystemPrompt(
    COMMAND_SPECS,
    'dashboard',
    'owner',
    CONTEXT,
  );

  it('lists only the commands legal on this surface', () => {
    expect(prompt).toContain('appointment.reschedule');
    expect(prompt).toContain('catalog.create_category');
    // Customer/public-only commands must not even be offered here.
    expect(prompt).not.toContain('appointment.cancel_mine');
    expect(prompt).not.toContain('appointment.book_public');
  });

  it('is generated per surface, not hand-written per schema', () => {
    const publicPrompt = buildPlannerSystemPrompt(
      COMMAND_SPECS,
      'public',
      'owner',
      CONTEXT,
    );
    expect(publicPrompt).toContain('appointment.book_public');
    expect(publicPrompt).not.toContain('appointment.reschedule:');
  });

  it('names required and optional variables so the model knows what to fill', () => {
    // §98 — now with types. Naming the variable was never enough on its own:
    // `catalogDraft` alone told the model nothing about the shape to produce,
    // and it answered with a sentence 18 times.
    // Was `appointment.reschedule`'s `appointmentId`/`newStart`. Both were
    // fictional — no handler reads either — so this assertion was pinning the
    // rendering of a contract that did not exist (tech-debt A6 / e2e-bug.399).
    expect(prompt).toContain(
      'required: customerName (string), serviceName (string), date (string)',
    );
    expect(prompt).toContain(
      // e2e-bug.485 — `bookingFirstAvailable` deliberately no longer appears.
      // It is `source: 'orchestrator'`: a compound recipe writes it, so the
      // handler reads it and C2 requires it declared, but the model must not be
      // invited to set it from prose. Its absence here IS the fix.
      'optional: timeSlot (string), employeeName (string)',
    );
  });

  it('grounds relative dates instead of letting the model guess today', () => {
    expect(prompt).toContain('Today is 2026-08-03');
    expect(prompt).toContain('Asia/Yerevan');
  });

  it('instructs it to add unmappable requests to unresolved rather than substitute', () => {
    expect(prompt).toMatch(/do NOT substitute a similar one/i);
    expect(prompt).toContain('unresolved');
  });

  it('asks for every distinct request as its own step', () => {
    expect(prompt).toMatch(/Extract EVERY distinct request/i);
  });

  it('threads prior turns so follow-ups have context', () => {
    const messages = buildPlannerMessages(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      {
        ...CONTEXT,
        recentTurns: [{ role: 'user', text: "cancel Mary's booking" }],
      },
      'actually move it to 4pm',
    );
    expect(messages.map((m) => m.role)).toEqual(['system', 'user', 'user']);
    expect(messages.at(-1)?.content).toBe('actually move it to 4pm');
  });

  it('passes known entities so "it" can bind to something concrete', () => {
    const withEntities = buildPlannerSystemPrompt(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      {
        ...CONTEXT,
        knownEntities: { lastAppointmentId: 'apt-9' },
      },
    );
    expect(withEntities).toContain('lastAppointmentId=apt-9');
  });
});

describe('AI-ROADMAP Phase 3 — plan decoding', () => {
  describe('extractJsonBody', () => {
    it('unwraps a ```json fence', () => {
      expect(extractJsonBody('```json\n{"a":1}\n```')).toBe('{"a":1}');
    });

    it('ignores prose before and after the JSON', () => {
      expect(extractJsonBody('Sure! {"a":1} Hope that helps.')).toBe('{"a":1}');
    });

    it('returns null when there is no JSON at all', () => {
      expect(extractJsonBody('I cannot help with that.')).toBeNull();
    });
  });

  describe('happy path', () => {
    it('decodes a well-formed plan with no repairs', () => {
      const result = decodePlanResponse(GOOD);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.repairs).toEqual([]);
      expect(result.plan.steps).toHaveLength(1);
      expect(result.plan.steps[0].command).toBe('appointment.reschedule');
    });

    it('produces a plan that passes validation end to end', () => {
      const result = decodePlanResponse(GOOD);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(
        validatePlan(COMMAND_SPECS, result.plan, 'dashboard', 'owner')
          .executable,
      ).toBe(true);
    });
  });

  describe('never throws, always reports', () => {
    it.each([
      ['empty string', '', 'empty_response'],
      ['whitespace', '   \n ', 'empty_response'],
      ['prose only', 'I did not understand.', 'not_json'],
      ['broken json', '{"steps": [', 'not_json'],
      // A bare scalar has no `{`/`[` body at all, so it fails at extraction
      // rather than at the shape check.
      ['json scalar', '42', 'not_json'],
      ['object without steps', '{"foo":1}', 'no_steps'],
    ] as const)('%s → %s', (_label, raw, failure) => {
      const result = decodePlanResponse(raw);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure).toBe(failure);
    });

    it('handles null/undefined input', () => {
      expect(decodePlanResponse(null).ok).toBe(false);
      expect(decodePlanResponse(undefined).ok).toBe(false);
    });
  });

  describe('syntax repair', () => {
    it('strips a markdown fence and records the repair', () => {
      const result = decodePlanResponse('```json\n' + GOOD + '\n```');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.repairs).toContain('stripped non-JSON wrapper');
    });

    it('treats a bare array as the steps list', () => {
      const result = decodePlanResponse(
        '[{"id":"s1","command":"catalog.list_packages","variables":{},"confidence":0.9}]',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps).toHaveLength(1);
      expect(result.repairs).toContain(
        'response was a bare array, treated as steps',
      );
    });

    it('rescales a 0-100 confidence', () => {
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","command":"catalog.list_packages","confidence":85}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].confidence).toBeCloseTo(0.85);
    });

    it('defaults a missing dependsOn to an empty list', () => {
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","command":"catalog.list_packages","confidence":0.9}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].dependsOn).toEqual([]);
    });

    it('assigns an id when the model omits one', () => {
      const result = decodePlanResponse(
        '{"steps":[{"command":"catalog.list_packages","confidence":0.9}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].id).toBe('s1');
    });

    it('renames duplicate ids so the dependency graph stays well formed', () => {
      const result = decodePlanResponse(
        '{"steps":[' +
          '{"id":"s1","command":"catalog.list_packages","confidence":0.9},' +
          '{"id":"s1","command":"catalog.list_subscription_plans","confidence":0.9}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps.map((s) => s.id)).toEqual(['s1', 's1_2']);
    });
  });

  describe('refuses to invent meaning', () => {
    it('drops a step with no command rather than guessing one', () => {
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","variables":{"a":1},"confidence":0.9}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps).toHaveLength(0);
      expect(result.repairs).toContain('step 0: no command, dropped');
    });

    it('treats unreadable confidence as ZERO, not as high', () => {
      // A mutating step must never slip through the confidence gate because the
      // model returned something unparseable.
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","command":"appointment.mark_paid","variables":{"appointmentId":"a"},"confidence":"very sure"}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].confidence).toBe(0);
      expect(
        validatePlan(COMMAND_SPECS, result.plan, 'dashboard', 'owner')
          .executable,
      ).toBe(false);
    });

    it('does not fabricate variables when the model sends a non-object', () => {
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","command":"catalog.list_packages","variables":"none","confidence":0.9}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].variables).toEqual({});
    });

    it('keeps unresolved notes so the clarify path can use them', () => {
      const result = decodePlanResponse(
        '{"steps":[],"unresolved":["no command exists for creating a patient"]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.unresolved).toEqual([
        'no command exists for creating a patient',
      ]);
    });
  });

  describe('decode → validate pipeline', () => {
    it('a plausible-but-wrong command from the model is caught by validation, not decoding', () => {
      // Decoding is syntax only; deciding the command is not real is validation's job.
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","command":"patient.create","variables":{"name":"David"},"confidence":0.8}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const validated = validatePlan(
        COMMAND_SPECS,
        result.plan,
        'dashboard',
        'owner',
      );
      expect(validated.problems.map((p) => p.code)).toEqual([
        'unknown_command',
      ]);
      expect(validated.executable).toBe(false);
    });
  });

  describe('e2e-bug.388 - the command id filed under the label field', () => {
    // The contract used to name the step label `id` while describing the field
    // beside it as taking "one of the command ids listed above". gpt-4o-mini
    // resolved that collision by putting the command id in `id` and omitting
    // `command`. 57 of 150 replayed real prompts came back this exact shape.
    const SLIPPED = JSON.stringify({
      steps: [
        {
          id: 'booking.list_services',
          variables: {},
          confidence: 1.0,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    });

    it('recovers the command and keeps the step', () => {
      const result = decodePlanResponse(SLIPPED);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps).toHaveLength(1);
      expect(result.plan.steps[0].command).toBe('booking.list_services');
      // The label is regenerated, because the value that was in it was the command.
      expect(result.plan.steps[0].id).toBe('s1');
      expect(result.repairs.join(' ')).toContain('recovered');
    });

    it('the recovered plan validates and executes', () => {
      const result = decodePlanResponse(SLIPPED);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const validated = validatePlan(
        COMMAND_SPECS,
        result.plan,
        'customer',
        'client',
      );
      expect(validated.problems).toEqual([]);
      expect(validated.executable).toBe(true);
    });

    it('accepts stepId as the label without treating it as a command', () => {
      const result = decodePlanResponse(
        '{"steps":[{"command":"booking.list_services","stepId":"s7","variables":{},"confidence":1}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].id).toBe('s7');
      expect(result.plan.steps[0].command).toBe('booking.list_services');
    });

    it('does not mistake a plain step label for a command', () => {
      // No dot, so no recovery: `s1` is a label and the step really has no command.
      const result = decodePlanResponse(
        '{"steps":[{"id":"s1","variables":{},"confidence":1}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps).toHaveLength(0);
    });

    it('a recovered command that names nothing real still fails validation', () => {
      // The decoder does not own the command list, and must not appear to.
      const result = decodePlanResponse(
        '{"steps":[{"id":"patient.create","variables":{},"confidence":1}]}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps[0].command).toBe('patient.create');
      const validated = validatePlan(
        COMMAND_SPECS,
        result.plan,
        'dashboard',
        'owner',
      );
      expect(validated.problems.map((p) => p.code)).toEqual([
        'unknown_command',
      ]);
    });
  });

  describe('e2e-bug.387 - a plan emptied by dropped steps is not a refusal', () => {
    it('notes the dropped steps in unresolved', () => {
      const result = decodePlanResponse(
        '{"steps":[{"variables":{},"confidence":1}],"unresolved":[],"topicChanged":false}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.steps).toHaveLength(0);
      // Previously `unresolved` stayed empty, which downstream read as the
      // planner declining rather than the response being unreadable.
      expect(result.plan.unresolved).toHaveLength(1);
      expect(result.plan.unresolved[0]).toContain('could not be read');
    });

    it('leaves a genuine refusal untouched', () => {
      const result = decodePlanResponse(
        '{"steps":[],"unresolved":["no command matches this"],"topicChanged":false}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.unresolved).toEqual(['no command matches this']);
    });

    it('does not annotate an empty-but-honest plan with nothing dropped', () => {
      const result = decodePlanResponse(
        '{"steps":[],"unresolved":[],"topicChanged":false}',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.plan.unresolved).toEqual([]);
    });
  });
});
