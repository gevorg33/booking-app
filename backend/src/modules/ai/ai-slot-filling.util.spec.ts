/**
 * AI-ROADMAP Phase 6 — multi-turn slot filling.
 *
 * The property under test is that a clarify answer **merges into the pending
 * plan** rather than restarting understanding — and, just as important, that a
 * reply which is *not* an answer is refused rather than written into the
 * pending command. Treating "actually cancel it instead" as a customer name
 * would be the same family as every silent-pick bug on this programme.
 */
import {
  applyClarifyAnswer,
  attachPendingClarification,
  looksLikeNewRequest,
  PENDING_CLARIFICATION_KEY,
  readPendingClarification,
  type PendingClarification,
} from './ai-slot-filling.util.js';
import type { ClarifyRequest } from './ai-clarify.util.js';
import type { CommandPlan } from './ai-command-plan.types.js';

const plan = (): CommandPlan => ({
  steps: [
    {
      id: 's1',
      command: 'appointment.create',
      variables: { serviceName: 'Massage', date: '2026-08-07' },
      confidence: 0.9,
      dependsOn: [],
    },
  ],
  unresolved: ['which customerName did you mean'],
  topicChanged: false,
});

const request = (overrides: Partial<ClarifyRequest> = {}): ClarifyRequest => ({
  reason: 'ambiguous_entity',
  question: 'Which customer did you mean — John Smith, John Baker?',
  command: 'appointment.create',
  variable: 'customerName',
  options: [
    { value: 'c1', label: 'John Smith' },
    { value: 'c2', label: 'John Baker' },
  ],
  allowsFreeText: true,
  ...overrides,
});

const pending = (
  overrides: Partial<PendingClarification> = {},
): PendingClarification => ({
  plan: plan(),
  stepId: 's1',
  request: request(),
  ...overrides,
});

describe('applyClarifyAnswer', () => {
  describe('merges rather than restarting', () => {
    it('fills the slot and keeps everything else the plan already knew', () => {
      // The point of the whole item: `serviceName` and `date` survive. A
      // restart would re-classify "John Smith" on its own and lose them.
      const result = applyClarifyAnswer(pending(), 'John Smith');
      expect(result.kind).toBe('option');
      expect(result.plan!.steps[0].variables).toEqual({
        serviceName: 'Massage',
        date: '2026-08-07',
        customerName: 'c1',
      });
    });

    it('writes the option value, not the label the user clicked', () => {
      // The label is for humans; the id is what the command needs.
      expect(applyClarifyAnswer(pending(), 'John Baker').value).toBe('c2');
    });

    it('matches an option by its value too', () => {
      expect(applyClarifyAnswer(pending(), 'c2').kind).toBe('option');
    });

    it('is case-insensitive about the option', () => {
      expect(applyClarifyAnswer(pending(), 'john smith').value).toBe('c1');
    });

    it('clears the unresolved note the question was about', () => {
      // Leaving it would make the merged plan fail validation for a reason
      // that no longer holds.
      const result = applyClarifyAnswer(pending(), 'John Smith');
      expect(result.plan!.unresolved).toEqual([]);
    });

    it('leaves other steps untouched', () => {
      const twoStep = plan();
      twoStep.steps.push({
        id: 's2',
        command: 'appointment.cancel_bulk',
        variables: { date: '2026-08-08' },
        confidence: 0.9,
        dependsOn: [],
      });
      const result = applyClarifyAnswer(
        pending({ plan: twoStep }),
        'John Smith',
      );
      expect(result.plan!.steps[1].variables).toEqual({ date: '2026-08-08' });
    });
  });

  describe('accepts free text when no option matches', () => {
    it('takes a typed name as the value', () => {
      const result = applyClarifyAnswer(pending(), 'Mary Poppins');
      expect(result.kind).toBe('free_text');
      expect(result.plan!.steps[0].variables.customerName).toBe('Mary Poppins');
    });

    it('refuses free text when the question does not allow it', () => {
      const result = applyClarifyAnswer(
        pending({ request: request({ allowsFreeText: false }) }),
        'Mary Poppins',
      );
      expect(result.kind).toBe('not_an_answer');
    });
  });

  describe('refuses replies that are not answers', () => {
    it.each([
      'actually cancel it instead',
      'never mind',
      'forget that, book me a haircut',
      'reschedule the 3pm instead',
    ])('treats %p as a new request', (answer) => {
      // Writing any of these into `customerName` would put the user's topic
      // change inside the pending command.
      const result = applyClarifyAnswer(pending(), answer);
      expect(result.kind).toBe('not_an_answer');
      expect(result.plan).toBeNull();
    });

    it('refuses an empty reply', () => {
      expect(applyClarifyAnswer(pending(), '   ').kind).toBe('not_an_answer');
    });

    it('refuses when the question has no slot to fill', () => {
      // "I don't have a command for patient.create" is a statement, not a
      // question — whatever the user says next is a new request.
      const result = applyClarifyAnswer(
        pending({
          request: request({
            reason: 'unsupported_command',
            variable: null,
            options: [],
          }),
        }),
        'ok then book Mary',
      );
      expect(result.kind).toBe('not_an_answer');
    });

    it('still accepts an explicit option pick that contains a cue word', () => {
      // A customer legitimately called "Cancel" is absurd, but a *service*
      // called "Cancellation cover" is not — an explicit pick is unambiguous
      // regardless of its wording, so the option check runs first.
      const result = applyClarifyAnswer(
        pending({
          request: request({
            options: [{ value: 'svc1', label: 'Cancellation cover' }],
          }),
        }),
        'Cancellation cover',
      );
      expect(result.kind).toBe('option');
      expect(result.value).toBe('svc1');
    });
  });
});

describe('looksLikeNewRequest', () => {
  it.each(['actually, do X', 'never mind', 'cancel that', 'book me in'])(
    'flags %p',
    (text) => expect(looksLikeNewRequest(text)).toBe(true),
  );

  it.each(['John Smith', 'the 3pm one', 'Mary', 'tomorrow'])(
    'does not flag %p',
    (text) => expect(looksLikeNewRequest(text)).toBe(false),
  );
});

describe('pending state round-trip', () => {
  it('attaches under a key the next turn can find', () => {
    const details = attachPendingClarification({ existing: 1 }, pending());
    expect(details.existing).toBe(1);
    expect(details[PENDING_CLARIFICATION_KEY]).toBeDefined();
  });

  it('reads back what it wrote', () => {
    const details = attachPendingClarification({}, pending());
    const read = readPendingClarification(details);
    expect(read?.stepId).toBe('s1');
    expect(read?.request.variable).toBe('customerName');
  });

  it('survives a JSON round-trip through the client', () => {
    // The state crosses the wire; anything not JSON-serialisable is lost.
    const details = attachPendingClarification({}, pending());
    const read = readPendingClarification(
      JSON.parse(JSON.stringify(details)) as Record<string, unknown>,
    );
    expect(read).not.toBeNull();
    expect(applyClarifyAnswer(read!, 'John Smith').kind).toBe('option');
  });

  describe('refuses malformed state rather than half-building a plan', () => {
    it.each([
      ['missing', undefined],
      ['not an object', 'nope'],
      ['no plan', { stepId: 's1', request: request() }],
      ['no stepId', { plan: plan(), request: request() }],
      ['no request', { plan: plan(), stepId: 's1' }],
      [
        'stepId not in the plan',
        { plan: plan(), stepId: 's99', request: request() },
      ],
    ])('%s', (_what, value) => {
      expect(
        readPendingClarification({ [PENDING_CLARIFICATION_KEY]: value }),
      ).toBeNull();
    });

    it('returns null for no context at all', () => {
      expect(readPendingClarification(undefined)).toBeNull();
      expect(readPendingClarification({})).toBeNull();
    });
  });
});
