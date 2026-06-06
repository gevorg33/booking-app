import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { EventsGateway } from '../../websocket/events.gateway.js';
import { AiEventsService } from './ai-events.service.js';

describe('AiEventsService', () => {
  const emitBusinessEvent = jest.fn();
  const gateway = { emitBusinessEvent };
  const service = new AiEventsService(gateway as any);

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiEventsService,
        { provide: EventsGateway, useValue: gateway },
      ],
    }).compile();
    expect(moduleRef.get(AiEventsService)).toBeInstanceOf(AiEventsService);
  });

  beforeEach(() => {
    emitBusinessEvent.mockClear();
  });

  it('emit forwards arbitrary AI event types', () => {
    service.emit('biz-1', 'ai.clarify', { custom: true });
    expect(emitBusinessEvent).toHaveBeenCalledWith('biz-1', 'ai.clarify', {
      custom: true,
    });
  });

  it('emitClarify forwards clarify payload', () => {
    service.emitClarify('biz-1', {
      action: 'create_booking',
      summary: 'Need date',
    });
    expect(emitBusinessEvent).toHaveBeenCalledWith('biz-1', 'ai.clarify', {
      action: 'create_booking',
      summary: 'Need date',
    });
  });

  it('emitTaskProgress and emitTaskCompleted use correct types', () => {
    service.emitTaskProgress('biz-1', {
      taskId: 't1',
      action: 'optimize_schedule',
      status: 'requires_approval',
    });
    service.emitTaskCompleted('biz-1', {
      taskId: 't1',
      action: 'optimize_schedule',
      success: true,
      summary: 'Done',
    });
    expect(emitBusinessEvent).toHaveBeenNthCalledWith(
      1,
      'biz-1',
      'ai.task.progress',
      expect.objectContaining({ taskId: 't1' }),
    );
    expect(emitBusinessEvent).toHaveBeenNthCalledWith(
      2,
      'biz-1',
      'ai.task.completed',
      expect.objectContaining({ success: true }),
    );
  });

  it('emitMisrouteTelemetry forwards failure telemetry payload (ai-cmd-h4.4)', () => {
    service.emitMisrouteTelemetry('biz-1', {
      surface: 'dashboard',
      prompt: 'who is free tomorrow evening for permanent lashes',
      classifierAction: 'create_booking',
      rescuedAction: 'check_providers_for_service',
      rescueReason: 'create_booking_to_check_providers',
      classifierConfidence: 0.66,
      compoundStepCount: 1,
      scenarioId: 'dashboard-create-to-check-providers',
      misrouted: true,
      timestamp: '2026-06-06T00:00:00.000Z',
    });
    expect(emitBusinessEvent).toHaveBeenCalledWith('biz-1', 'ai.misroute', {
      surface: 'dashboard',
      prompt: 'who is free tomorrow evening for permanent lashes',
      classifierAction: 'create_booking',
      rescuedAction: 'check_providers_for_service',
      rescueReason: 'create_booking_to_check_providers',
      classifierConfidence: 0.66,
      compoundStepCount: 1,
      scenarioId: 'dashboard-create-to-check-providers',
      misrouted: true,
      timestamp: '2026-06-06T00:00:00.000Z',
    });
  });

  it('emitAlert forwards in-app alert payload (ai-d19)', () => {
    service.emitAlert('biz-1', {
      alertType: 'conflict',
      title: 'Conflict detected',
      message: 'Review overlaps',
      prompt: 'Resolve conflicts',
      taskId: 't9',
      route: '/dashboard/calendar',
    });
    expect(emitBusinessEvent).toHaveBeenCalledWith('biz-1', 'ai.alert', {
      alertType: 'conflict',
      title: 'Conflict detected',
      message: 'Review overlaps',
      prompt: 'Resolve conflicts',
      taskId: 't9',
      route: '/dashboard/calendar',
    });
  });
});
