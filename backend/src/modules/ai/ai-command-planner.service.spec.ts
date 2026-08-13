import { AiCommandPlannerService } from './ai-command-planner.service.js';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';

/** Minimal stand-in for an OpenAI chat completion. */
const completion = (content: string | null) =>
  ({ choices: [{ message: { content } }] }) as never;

function makePlanner(reply: string | null | undefined) {
  const chatCompletion = jest.fn(async () =>
    reply === undefined ? null : completion(reply),
  );
  const service = new AiCommandPlannerService({
    chatCompletion,
  } as unknown as OpenAiGatewayService);
  return { service, chatCompletion };
}

const BASE = {
  businessId: 'biz-1',
  surface: 'dashboard' as const,
  tier: 'owner' as const,
  context: { today: '2026-08-03', timeZone: 'Asia/Yerevan' },
  userId: 'user-1',
};

const rescheduleStep = {
  id: 's1',
  command: 'appointment.reschedule',
  variables: { bookingId: 'apt-1', date: '2026-08-04', timeSlot: '15:00' },
  confidence: 0.94,
  dependsOn: [],
};

describe('AiCommandPlannerService', () => {
  describe('the gateway call', () => {
    it('requests JSON and near-deterministic output', async () => {
      const { service, chatCompletion } = makePlanner(
        JSON.stringify({
          steps: [rescheduleStep],
          unresolved: [],
          topicChanged: false,
        }),
      );
      await service.plan({
        ...BASE,
        message: "move John's appointment to tomorrow 3pm",
      });

      const [context, params] = chatCompletion.mock.calls[0] as unknown as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
      expect(params.responseFormat).toBe('json_object');
      expect(params.temperature).toBeLessThanOrEqual(0.2);
      expect(context.operation).toBe('plan_commands');
      expect(context.businessId).toBe('biz-1');
    });

    it('maps command surfaces onto usage surfaces correctly', async () => {
      const { service, chatCompletion } = makePlanner('{"steps":[]}');
      await service.plan({ ...BASE, surface: 'provider', message: 'hi' });
      const [context] = chatCompletion.mock.calls[0] as unknown as [
        Record<string, unknown>,
      ];
      // 'provider' is 'provider_mobile' for usage accounting — a hand-rolled
      // map got this wrong; the shared converter is the single source.
      expect(context.surface).toBe('provider_mobile');
    });

    it('sends the surface-scoped shortlist in the system prompt', async () => {
      const { service, chatCompletion } = makePlanner('{"steps":[]}');
      await service.plan({ ...BASE, message: 'anything' });
      const [, params] = chatCompletion.mock.calls[0] as unknown as [
        unknown,
        { messages: { role: string; content: string }[] },
      ];
      const system = params.messages[0].content;
      expect(system).toContain('appointment.reschedule');
      expect(system).not.toContain('appointment.cancel_mine');
    });
  });

  describe('executable plans', () => {
    it('returns an ordered, executable plan', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [rescheduleStep],
          unresolved: [],
          topicChanged: false,
        }),
      );
      const outcome = await service.plan({
        ...BASE,
        message: "move John's appointment",
      });

      expect(outcome.status).toBe('executable');
      if (outcome.status !== 'executable') return;
      expect(outcome.validation.orderedStepIds).toEqual(['s1']);
      expect(outcome.validation.highestRisk).toBe('T1');
    });

    it('extracts several commands from one message', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            rescheduleStep,
            {
              id: 's2',
              command: 'appointment.cancel_bulk',
              variables: { customerName: 'Mary' },
              confidence: 0.91,
              dependsOn: [],
            },
            {
              id: 's3',
              command: 'catalog.create_category',
              variables: { categoryName: 'Wellness' },
              confidence: 0.9,
              dependsOn: [],
            },
          ],
          unresolved: [],
          topicChanged: false,
        }),
      );
      const outcome = await service.plan({
        ...BASE,
        message:
          "Move John's appointment, cancel Mary's, and add a category Wellness",
      });

      expect(outcome.status).toBe('executable');
      if (outcome.status !== 'executable') return;
      expect(outcome.plan.steps).toHaveLength(3);
      expect(outcome.validation.orderedStepIds).toEqual(['s1', 's2', 's3']);
      // cancel_bulk is T3, so the whole plan must be confirmed before writing.
      expect(outcome.validation.requiresConfirmation).toBe(true);
    });
  });

  describe('the headline example, end to end', () => {
    it('clarifies about the unsupported command and executes nothing', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            rescheduleStep,
            {
              id: 's2',
              command: 'appointment.cancel_bulk',
              variables: { customerName: 'Mary' },
              confidence: 0.91,
              dependsOn: [],
            },
            {
              id: 's3',
              command: 'patient.create',
              variables: { name: 'David' },
              confidence: 0.72,
              dependsOn: [],
            },
          ],
          unresolved: [],
          topicChanged: false,
        }),
      );

      const outcome = await service.plan({
        ...BASE,
        message:
          "Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment, and create a new patient named David for Friday.",
      });

      expect(outcome.status).toBe('clarify');
      if (outcome.status !== 'clarify') return;
      expect(outcome.question).toContain('patient.create');
      expect(outcome.validation.executable).toBe(false);
    });
  });

  describe('clarify paths', () => {
    it('asks for a missing variable by name', async () => {
      // `appointment.create`, not `appointment.reschedule`: reschedule has no
      // required variable any handler reads, so it cannot demonstrate this
      // (tech-debt A6 / e2e-bug.399).
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            {
              ...rescheduleStep,
              command: 'appointment.create',
              variables: {
                customerName: 'Sarah',
                serviceName: 'deep tissue massage',
              },
            },
          ],
          unresolved: [],
          topicChanged: false,
        }),
      );
      const outcome = await service.plan({
        ...BASE,
        message: 'book Sarah a deep tissue massage',
      });
      expect(outcome.status).toBe('clarify');
      if (outcome.status !== 'clarify') return;
      expect(outcome.question).toContain('date');
    });

    it('refuses a command that is not legal on this surface', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            {
              id: 's1',
              command: 'appointment.cancel_mine',
              variables: {},
              confidence: 0.95,
              dependsOn: [],
            },
          ],
          unresolved: [],
          topicChanged: false,
        }),
      );
      const outcome = await service.plan({
        ...BASE,
        message: 'cancel my appointment',
      });
      expect(outcome.status).toBe('clarify');
      if (outcome.status !== 'clarify') return;
      expect(outcome.validation.problems[0].code).toBe('surface_violation');
    });

    it('does not execute while an entity is ambiguous', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            {
              id: 's1',
              command: 'appointment.cancel_bulk',
              variables: { customerName: 'John' },
              confidence: 0.9,
              dependsOn: [],
            },
          ],
          unresolved: ['there are two customers called John'],
          topicChanged: false,
        }),
      );
      const outcome = await service.plan({
        ...BASE,
        message: "cancel John's appointment",
      });
      expect(outcome.status).toBe('clarify');
      if (outcome.status !== 'clarify') return;
      expect(outcome.question).toContain('two customers called John');
    });
  });

  describe('degrades safely', () => {
    it('reports unavailable when the gateway returns nothing', async () => {
      const { service } = makePlanner(undefined);
      const outcome = await service.plan({ ...BASE, message: 'hello' });
      expect(outcome).toEqual({ status: 'unavailable', reason: 'no_response' });
    });

    it('reports unavailable rather than throwing on unparseable output', async () => {
      const { service } = makePlanner('I am not going to answer that.');
      const outcome = await service.plan({ ...BASE, message: 'hello' });
      expect(outcome).toEqual({ status: 'unavailable', reason: 'not_json' });
    });

    it('still works when the model wraps JSON in a markdown fence', async () => {
      const { service } = makePlanner(
        '```json\n' +
          JSON.stringify({
            steps: [rescheduleStep],
            unresolved: [],
            topicChanged: false,
          }) +
          '\n```',
      );
      const outcome = await service.plan({
        ...BASE,
        message: "move John's appointment",
      });
      expect(outcome.status).toBe('executable');
      if (outcome.status !== 'executable') return;
      expect(outcome.repairs).toContain('stripped non-JSON wrapper');
    });
  });

  describe('the actor', () => {
    const noShowResponse = JSON.stringify({
      steps: [
        {
          id: 's1',
          command: 'appointment.update_bulk',
          variables: { status: 'no_show' },
          confidence: 0.95,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    });

    it('never offers the model a command the actor cannot run', async () => {
      const { service, chatCompletion } = makePlanner(noShowResponse);
      await service.plan({
        ...BASE,
        tier: 'staff',
        message: 'mark those as no-show',
      });

      const [, params] = chatCompletion.mock.calls[0] as unknown as [
        Record<string, unknown>,
        { messages: { role: string; content: string }[] },
      ];
      const systemPrompt = params.messages[0].content;
      expect(systemPrompt).not.toContain('appointment.update_bulk');
    });

    it('clarifies rather than executing when the model names it anyway', async () => {
      // Defence in depth: the shortlist filter is not the only thing stopping
      // this, because a model can echo a command it was never shown.
      const { service } = makePlanner(noShowResponse);
      const outcome = await service.plan({
        ...BASE,
        tier: 'staff',
        message: 'mark those as no-show',
      });
      expect(outcome.status).toBe('clarify');
      if (outcome.status !== 'clarify') return;
      expect(outcome.validation.problems.map((p) => p.code)).toContain(
        'permission_violation',
      );
      expect(outcome.question).toContain("You don't have access");
    });

    it('runs the identical request for an actor who may', async () => {
      const { service } = makePlanner(noShowResponse);
      const outcome = await service.plan({
        ...BASE,
        tier: 'manager',
        message: 'mark those as no-show',
      });
      expect(outcome.status).toBe('executable');
    });
  });

  describe('decoding', () => {
    it('never executes a mutating step whose confidence was unreadable', async () => {
      const { service } = makePlanner(
        JSON.stringify({
          steps: [
            {
              id: 's1',
              command: 'appointment.mark_paid',
              variables: { bookingId: 'a' },
              confidence: 'very sure',
            },
          ],
        }),
      );
      const outcome = await service.plan({ ...BASE, message: 'mark it paid' });
      expect(outcome.status).toBe('clarify');
    });
  });
});
