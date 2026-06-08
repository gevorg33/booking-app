import { describe, expect, it, jest } from '@jest/globals';
import {
  executeHumanHandoffLogic,
  executeStaffOwnerHandoffLogic,
  isHumanHandoffExecutePrompt,
  shouldExecuteHumanHandoff,
  shouldExecuteHumanHandoffFromSession,
} from './ai-escalation-handoff.logic.js';
import { PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';

describe('ai-escalation-handoff.logic (acc-6.5)', () => {
  const agentTaskRepo = {
    create: jest.fn((row) => ({ ...row, id: 'task-1' })),
    save: jest.fn(async (row) => row),
  };
  const aiEvents = { emitAlert: jest.fn() };
  const integrations = {
    handleContactSupport: jest.fn(async () => ({
      success: true,
      action: 'contact_support',
      summary: 'Support ticket #42 submitted — we\'ll follow up by email.',
      details: { ticketId: 42 },
    })),
  };
  const settings = { enterprise: { hitlSlaMinutes: 20 } };

  it('detects explicit Get help execute session flag', () => {
    expect(shouldExecuteHumanHandoffFromSession({ _executeHumanHandoff: true })).toBe(
      true,
    );
    expect(
      shouldExecuteHumanHandoff('anything', { _executeHumanHandoff: true }),
    ).toBe(true);
  });

  it.each([
    'Get help',
    'I need help — escalate to staff',
    'I need help with my last request — please open a support ticket',
  ])('isHumanHandoffExecutePrompt(%s)', (prompt) => {
    expect(isHumanHandoffExecutePrompt(prompt)).toBe(true);
  });

  it('executeStaffOwnerHandoffLogic creates HITL task and owner alert', async () => {
    const result = await executeStaffOwnerHandoffLogic(
      { agentTaskRepo: agentTaskRepo as any, aiEvents: aiEvents as any, integrations: integrations as any, settings },
      {
        businessId: 'biz-1',
        surface: 'dashboard',
        userId: 'user-1',
        sessionContext: {
          _clarifyContext: { originalPrompt: 'cancel maybe tomorrow', clarifyRound: 2 },
        },
      },
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('request_human_help');
    expect(result.details?.taskId).toBeDefined();
    expect(result.details?.hitlSlaMinutes).toBe(20);
    expect(agentTaskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PlanStatus.PENDING_VALIDATION }),
    );
    expect(aiEvents.emitAlert).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ route: '/dashboard/ai-ops' }),
    );
  });

  it('executeHumanHandoffLogic routes customer to Zendesk contact_support', async () => {
    const result = await executeHumanHandoffLogic(
      { agentTaskRepo: agentTaskRepo as any, aiEvents: aiEvents as any, integrations: integrations as any, settings },
      {
        businessId: 'biz-1',
        surface: 'customer',
        customerId: 'cust-1',
        prompt: 'Get help',
        sessionContext: {
          _executeHumanHandoff: true,
          _clarifyContext: { originalPrompt: 'book massage' },
        },
      },
    );
    expect(integrations.handleContactSupport).toHaveBeenCalled();
    expect(result.details?.escalationRoute).toBe('support_ticket');
  });

  it('executeHumanHandoffLogic notifies owner for anonymous public visitor', async () => {
    const result = await executeHumanHandoffLogic(
      { agentTaskRepo: agentTaskRepo as any, aiEvents: aiEvents as any, integrations: integrations as any, settings },
      {
        businessId: 'biz-1',
        surface: 'customer',
        prompt: 'Get help',
        sessionContext: {
          _executeHumanHandoff: true,
          _handoffSurface: 'public',
          _clarifyContext: { originalPrompt: 'book something weird' },
        },
      },
    );
    expect(result.details?.openSupportWidget).toBe(true);
    expect(aiEvents.emitAlert).toHaveBeenCalled();
  });
});
