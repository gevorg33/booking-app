import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentTask } from './agent-task.entity.js';
import { AgentTaskUndoService } from './agent-task-undo.service.js';
import { BookingService } from '../../modules/booking/booking.service.js';
import { BlockScheduleService } from '../../modules/schedule/services/block-schedule.service.js';
import { ScheduleService } from '../../modules/schedule/schedule.service.js';
import { EmployeeService } from '../../modules/employee/employee.service.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { PlanStatus } from './interfaces/agent.interfaces.js';
import { StepStatus } from '../workflow/interfaces/workflow.interfaces.js';
import { EventType } from '../../events/event-types.js';

function buildTask(
  planSteps: Array<{
    action: string;
    id?: string;
    params?: Record<string, unknown>;
  }>,
  stepResults: Array<{
    stepId: string;
    status: string;
    result?: Record<string, unknown>;
  }>,
  overrides: Partial<AgentTask> = {},
): AgentTask {
  return {
    id: 'task-1',
    businessId: 'biz-1',
    intent: 'test intent',
    status: PlanStatus.COMPLETED,
    createdAt: new Date('2026-06-01T10:00:00Z'),
    plan: {
      steps: planSteps.map((s, i) => ({
        id: s.id ?? `step-${i}`,
        action: s.action,
        description: s.action,
        params: s.params ?? {},
        dependsOn: [],
      })),
    } as AgentTask['plan'],
    result: { steps: stepResults },
    ...overrides,
  } as AgentTask;
}

describe('AgentTaskUndoService', () => {
  const bookingService = {
    cancel: jest.fn(),
    restoreCancelled: jest.fn(),
    setHiddenFromCalendar: jest.fn(),
    update: jest.fn(),
  };
  const blockScheduleService = { remove: jest.fn() };
  const scheduleService = {
    revertCreatedSchedule: jest.fn(async () => ({
      periodsRemoved: 1,
      slotsRemoved: 2,
    })),
  };
  const employeeService = { update: jest.fn() };
  const eventStore = { publish: jest.fn(), getEvents: jest.fn(async () => []) };
  const taskRepo = {
    find: jest.fn<Promise<unknown>, unknown[]>(),
    save: jest.fn(async (t: AgentTask) => t),
  };

  let service: AgentTaskUndoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentTaskUndoService(
      taskRepo as any,
      bookingService as any,
      blockScheduleService as any,
      scheduleService as any,
      employeeService as any,
      eventStore as any,
    );
  });

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgentTaskUndoService,
        { provide: getRepositoryToken(AgentTask), useValue: taskRepo },
        { provide: BookingService, useValue: bookingService },
        { provide: BlockScheduleService, useValue: blockScheduleService },
        { provide: ScheduleService, useValue: scheduleService },
        { provide: EmployeeService, useValue: employeeService },
        { provide: EventStoreService, useValue: eventStore },
      ],
    }).compile();

    expect(moduleRef.get(AgentTaskUndoService)).toBeInstanceOf(
      AgentTaskUndoService,
    );
  });

  describe('buildUndoPreview', () => {
    it('returns not undoable when plan steps are missing', () => {
      const task = buildTask([], []);
      (task as any).plan = undefined;
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
      expect(preview.reason).toMatch(/no changes/);
    });

    it('returns not undoable when step results are missing', () => {
      const task = buildTask([{ action: 'create_booking' }], []);
      (task as any).result = {};
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
    });

    it('ignores plan steps without a completed step result', () => {
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.FAILED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
      expect(preview.reason).toMatch(/no changes/);
    });

    it('returns not undoable when no mutating steps completed', () => {
      const task = buildTask(
        [{ action: 'list_appointments' }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result: {} }],
      );
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
      expect(preview.reason).toMatch(/no changes/);
    });

    it('returns not undoable for unsupported actions', () => {
      const task = buildTask(
        [{ action: 'clear_schedule' }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result: {} }],
      );
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
      expect(preview.reason).toMatch(/clear_schedule/);
    });

    it('returns not undoable when mutating steps are not in UNDOABLE set', () => {
      const task = buildTask(
        [{ action: 'unknown_mutator' }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result: {} }],
      );
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(false);
      expect(preview.reason).toMatch(/no supported undo/);
    });

    it('marks create_direct_schedule undoable with snapshot ids', () => {
      const task = buildTask(
        [{ action: 'create_direct_schedule' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { periodIds: ['p1'], slotIds: ['s1'] },
          },
        ],
      );
      const preview = service.buildUndoPreview(task);
      expect(preview.undoable).toBe(true);
      expect(preview.reversibleSteps[0]?.action).toBe('create_direct_schedule');
    });
  });

  describe('getLatestUndoPreview / undoLatest', () => {
    it('returns null when no undo candidate', async () => {
      taskRepo.find.mockResolvedValue([]);
      await expect(service.getLatestUndoPreview('biz-1')).resolves.toBeNull();
    });

    it('picks first undoable task when earlier tasks are not undoable', async () => {
      const blocked = buildTask(
        [{ action: 'clear_schedule' }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result: {} }],
      );
      const ok = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
        { id: 'task-2' },
      );
      taskRepo.find.mockResolvedValue([blocked, ok]);
      const preview = await service.getLatestUndoPreview('biz-1');
      expect(preview?.taskId).toBe('task-2');
    });

    it('considers tasks with no result object for undo', async () => {
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      (task as any).result = undefined;
      taskRepo.find.mockResolvedValue([task]);
      const preview = await service.getLatestUndoPreview('biz-1');
      expect(preview).toBeNull();
    });

    it('skips tasks already undone', async () => {
      const undone = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
        { result: { steps: [], undone: true } },
      );
      taskRepo.find.mockResolvedValue([undone]);
      await expect(service.getLatestUndoPreview('biz-1')).resolves.toBeNull();
    });

    it('throws when undoLatest has no candidate', async () => {
      taskRepo.find.mockResolvedValue([]);
      await expect(
        service.undoLatest('biz-1', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns preview for latest undoable task', async () => {
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      taskRepo.find.mockResolvedValue([task]);
      const preview = await service.getLatestUndoPreview('biz-1');
      expect(preview?.undoable).toBe(true);
      expect(preview?.taskId).toBe('task-1');
    });

    it('undoTask throws when preview is not undoable', async () => {
      const task = buildTask(
        [{ action: 'clear_schedule' }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result: {} }],
      );
      await expect((service as any).undoTask(task, 'user-1')).rejects.toThrow(
        /not supported for: clear_schedule/,
      );
    });
  });

  describe('reverseStep via undoLatest', () => {
    const undoable = (
      action: string,
      result: Record<string, unknown>,
      params = {},
    ) =>
      buildTask(
        [{ action, params }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result }],
      );

    beforeEach(() => {
      taskRepo.find.mockImplementation(async () => {
        return [undoable('create_booking', { bookingId: 'b1' })];
      });
    });

    it('reverts create_booking', async () => {
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.cancel).toHaveBeenCalledWith(
        'b1',
        'Undone AI command',
        'user-1',
      );
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: EventType.AGENT_PLAN_UNDONE }),
      );
    });

    it('merges undo metadata when task.result was undefined before save', async () => {
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      (task as any).result = undefined;
      jest.spyOn(service, 'buildUndoPreview').mockReturnValue({
        taskId: task.id,
        intent: task.intent,
        createdAt: task.createdAt,
        undoable: true,
        reversibleSteps: [{ stepId: 'step-0', action: 'create_booking' }],
      });
      jest.spyOn(service as any, 'getCompletedMutatingSteps').mockReturnValue([
        {
          planStep: task.plan.steps[0],
          stepResult: {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        },
      ]);
      await (service as any).undoTask(task, 'user-1');
      expect(task.result).toMatchObject({ undone: true });
      jest.restoreAllMocks();
    });

    it('merges undo metadata when task.result was null before save', async () => {
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      (task as any).result = null;
      jest.spyOn(service, 'buildUndoPreview').mockReturnValue({
        taskId: task.id,
        intent: task.intent,
        createdAt: task.createdAt,
        undoable: true,
        reversibleSteps: [{ stepId: 'step-0', action: 'create_booking' }],
      });
      jest.spyOn(service as any, 'getCompletedMutatingSteps').mockReturnValue([
        {
          planStep: task.plan.steps[0],
          stepResult: {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        },
      ]);
      await (service as any).undoTask(task, 'user-1');
      expect(task.result).toMatchObject({ undone: true });
      jest.restoreAllMocks();
    });

    it('reverts execute_reassignment', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('execute_reassignment', { bookingId: 'b2' }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.cancel).toHaveBeenCalledWith(
        'b2',
        'Undone AI command',
        'user-1',
      );
    });

    it('reverts cancel_bookings from result ids', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('cancel_bookings', { cancelledIds: ['b3', 'b4'] }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.restoreCancelled).toHaveBeenCalledTimes(2);
    });

    it('reverts cancel_bookings from plan params when result empty', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('cancel_bookings', {}, { bookingIds: ['b5'] }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.restoreCancelled).toHaveBeenCalledWith(
        'b5',
        'user-1',
      );
    });

    it('reverts hide and unhide calendar visibility', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('hide_appointments_from_calendar', {}, { bookingIds: ['b6'] }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.setHiddenFromCalendar).toHaveBeenCalledWith(
        ['b6'],
        false,
        'user-1',
      );

      taskRepo.find.mockResolvedValue([
        undoable(
          'unhide_appointments_from_calendar',
          {},
          { bookingIds: ['b7'] },
        ),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.setHiddenFromCalendar).toHaveBeenCalledWith(
        ['b7'],
        true,
        'user-1',
      );
    });

    it('reverts reschedule_booking using result snapshot', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('reschedule_booking', {
          bookingId: 'b8',
          previousStartTime: '2026-06-01T09:00:00.000Z',
          previousEmployeeId: 'e1',
          previousServiceId: 's1',
        }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.update).toHaveBeenCalledWith(
        'b8',
        expect.objectContaining({ employeeId: 'e1', serviceId: 's1' }),
        'user-1',
      );
    });

    it('reverts reschedule_booking using event store when snapshot missing time', async () => {
      eventStore.getEvents.mockResolvedValue([
        {
          payload: {
            oldStartTime: '2026-06-01T10:00:00.000Z',
            employeeId: 'e2',
          },
        },
      ]);
      taskRepo.find.mockResolvedValue([
        undoable(
          'reschedule_booking',
          { bookingId: 'b9' },
          { bookingId: 'b9' },
        ),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(eventStore.getEvents).toHaveBeenCalled();
      expect(bookingService.update).toHaveBeenCalled();
    });

    it('reverts assign_employee_services using plan params for employeeId', async () => {
      taskRepo.find.mockResolvedValue([
        undoable(
          'assign_employee_services',
          { previousServiceIds: ['s1'] },
          { employeeId: 'e-plan' },
        ),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(employeeService.update).toHaveBeenCalledWith(
        'e-plan',
        { serviceIds: ['s1'] },
        'user-1',
      );
    });

    it('reverts assign_employee_services using result employeeId over plan', async () => {
      taskRepo.find.mockResolvedValue([
        undoable(
          'assign_employee_services',
          { employeeId: 'e-result', previousServiceIds: ['s1'] },
          { employeeId: 'e-plan' },
        ),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(employeeService.update).toHaveBeenCalledWith(
        'e-result',
        { serviceIds: ['s1'] },
        'user-1',
      );
    });

    it('reverts create_block_schedule and assign_employee_services', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('create_block_schedule', { blockScheduleId: 'blk-1' }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(blockScheduleService.remove).toHaveBeenCalledWith(
        'biz-1',
        'blk-1',
        'user-1',
      );

      taskRepo.find.mockResolvedValue([
        undoable('assign_employee_services', {
          employeeId: 'e3',
          previousServiceIds: ['s1', 's2'],
        }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(employeeService.update).toHaveBeenCalledWith(
        'e3',
        { serviceIds: ['s1', 's2'] },
        'user-1',
      );
    });

    it('reverts create_direct_schedule snapshot', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('create_direct_schedule', {
          periodIds: ['p1'],
          slotIds: ['s1'],
        }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(scheduleService.revertCreatedSchedule).toHaveBeenCalledWith(
        'biz-1',
        {
          periodIds: ['p1'],
          slotIds: ['s1'],
        },
      );
    });

    it('reverts create_direct_schedule with slotIds only', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('create_direct_schedule', { slotIds: ['s1'] }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(scheduleService.revertCreatedSchedule).toHaveBeenCalledWith(
        'biz-1',
        {
          periodIds: [],
          slotIds: ['s1'],
        },
      );
    });

    it('reverts create_direct_schedule with periodIds only', async () => {
      taskRepo.find.mockResolvedValue([
        undoable('create_direct_schedule', { periodIds: ['p1'] }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(scheduleService.revertCreatedSchedule).toHaveBeenCalledWith(
        'biz-1',
        {
          periodIds: ['p1'],
          slotIds: [],
        },
      );
    });

    it('reverts reschedule using plan step bookingId', async () => {
      eventStore.getEvents.mockResolvedValue([]);
      taskRepo.find.mockResolvedValue([
        buildTask(
          [{ action: 'reschedule_booking', params: { bookingId: 'b-plan' } }],
          [
            {
              stepId: 'step-0',
              status: StepStatus.COMPLETED,
              result: { previousStartTime: '2026-06-01T09:00:00.000Z' },
            },
          ],
        ),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.update).toHaveBeenCalledWith(
        'b-plan',
        expect.any(Object),
        'user-1',
      );
    });

    it('merges employeeId from reschedule event payload', async () => {
      eventStore.getEvents.mockResolvedValue([
        {
          payload: {
            oldStartTime: '2026-06-01T10:00:00.000Z',
            employeeId: 'e-from-event',
          },
        },
      ]);
      taskRepo.find.mockResolvedValue([
        undoable('reschedule_booking', {
          bookingId: 'b9',
          previousEmployeeId: undefined,
        }),
      ]);
      await service.undoLatest('biz-1', 'user-1');
      expect(bookingService.update).toHaveBeenCalledWith(
        'b9',
        expect.objectContaining({ employeeId: 'e-from-event' }),
        'user-1',
      );
    });
  });

  describe('reverseStep errors', () => {
    it('stops on partial failure after logging', async () => {
      bookingService.cancel.mockRejectedValue(new Error('cancel failed'));
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      taskRepo.find.mockResolvedValue([task]);

      await expect(service.undoLatest('biz-1', 'user-1')).rejects.toThrow(
        /partial reversal/,
      );
    });

    it('uses String(error) when rejection is not an Error', async () => {
      bookingService.cancel.mockRejectedValue('plain-fail');
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      taskRepo.find.mockResolvedValue([task]);
      await expect(service.undoLatest('biz-1', 'user-1')).rejects.toThrow(
        /plain-fail/,
      );
    });

    it('undoTask uses preview reason when provided', async () => {
      jest.spyOn(service, 'buildUndoPreview').mockReturnValue({
        taskId: 'task-1',
        intent: 'x',
        createdAt: new Date(),
        undoable: false,
        reason: 'Custom undo blocked',
        reversibleSteps: [],
      });
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      await expect((service as any).undoTask(task, 'user-1')).rejects.toThrow(
        /Custom undo blocked/,
      );
      jest.restoreAllMocks();
    });

    it('undoTask uses default message when preview has no reason', async () => {
      jest.spyOn(service, 'buildUndoPreview').mockReturnValue({
        taskId: 'task-1',
        intent: 'x',
        createdAt: new Date(),
        undoable: false,
        reversibleSteps: [],
      });
      const task = buildTask(
        [{ action: 'create_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      await expect((service as any).undoTask(task, 'user-1')).rejects.toThrow(
        /This command cannot be undone/,
      );
      jest.restoreAllMocks();
    });

    it.each([
      ['create_booking', {}, /Missing booking id/],
      ['cancel_bookings', {}, /Missing cancelled booking ids/],
      ['hide_appointments_from_calendar', {}, /Missing booking ids to unhide/],
      ['unhide_appointments_from_calendar', {}, /Missing booking ids to hide/],
      ['reschedule_booking', {}, /Missing booking id to reverse reschedule/],
      ['create_block_schedule', {}, /Missing block schedule id/],
      [
        'assign_employee_services',
        { employeeId: 'e1' },
        /Missing previous service assignment/,
      ],
      ['create_direct_schedule', {}, /Missing schedule period\/slot snapshot/],
    ] as const)('throws for %s', async (action, result, message) => {
      eventStore.getEvents.mockResolvedValue([]);
      const task = buildTask(
        [{ action }],
        [{ stepId: 'step-0', status: StepStatus.COMPLETED, result }],
      );
      taskRepo.find.mockResolvedValue([task]);
      await expect(service.undoLatest('biz-1', 'user-1')).rejects.toThrow(
        message,
      );
    });

    it('throws when reschedule undo cannot resolve previous time', async () => {
      eventStore.getEvents.mockResolvedValue([]);
      const task = buildTask(
        [{ action: 'reschedule_booking' }],
        [
          {
            stepId: 'step-0',
            status: StepStatus.COMPLETED,
            result: { bookingId: 'b1' },
          },
        ],
      );
      taskRepo.find.mockResolvedValue([task]);
      await expect(service.undoLatest('biz-1', 'user-1')).rejects.toThrow(
        /Cannot determine previous appointment time/,
      );
    });

    it('throws for unsupported action in reverseStep default branch', async () => {
      await expect(
        (service as any).reverseStep(
          'biz-1',
          'user-1',
          {
            action: 'custom_unknown',
            description: 'x',
            params: {},
            dependsOn: [],
          },
          {},
        ),
      ).rejects.toThrow(/Undo is not supported for action: custom_unknown/);
    });
  });
});
