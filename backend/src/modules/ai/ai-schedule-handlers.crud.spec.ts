import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';

describe('AiScheduleHandlersService template/block CRUD (ai-cmd-dashboard-6.5)', () => {
  const employee = {
    id: 'emp-1',
    name: 'Alex',
    businessId: 'biz-1',
    isActive: true,
  } as Employee;

  const templates = [
    { id: 'tpl-1', name: 'Weekday', isDeleted: false, isActive: true },
    { id: 'tpl-2', name: 'Weekend', isDeleted: false, isActive: true },
  ];

  function buildService(overrides: Record<string, any> = {}) {
    const templateRepo = {
      find: jest.fn().mockResolvedValue(templates),
      ...overrides.templateRepo,
    };
    const scheduleService = {
      updateTemplate: jest.fn(async (_b, id, dto) => ({ id, name: dto.name })),
      deleteTemplates: jest.fn(async (_b, dto) => ({
        deleted: dto.templateIds.length,
      })),
      duplicateTemplate: jest.fn(async (_b, id) => ({
        id: `${id}-copy`,
        name: 'Weekday (Copy)',
      })),
      getProviderCalendar: jest.fn().mockResolvedValue({ periods: [] }),
      ...overrides.scheduleService,
    };
    const blockScheduleService = {
      list: jest.fn().mockResolvedValue([]),
      remove: jest.fn(async () => ({ deleted: true })),
      ...overrides.blockScheduleService,
    };

    const service = new AiScheduleHandlersService(
      templateRepo as any,
      {} as any,
      { findOne: jest.fn().mockResolvedValue({ id: 'biz-1', settings: {} }) } as any,
      {} as any,
      {} as any,
      {} as any,
      scheduleService as any,
      blockScheduleService as any,
    );
    return { service, templateRepo, scheduleService, blockScheduleService };
  }

  describe('handleUpdateScheduleTemplate', () => {
    it('fails when template not found', async () => {
      const { service } = buildService();
      const result = await service.handleUpdateScheduleTemplate('biz-1', {
        templateName: 'Missing',
      });
      expect(result.success).toBe(false);
    });

    it('asks for clarification when newName is missing', async () => {
      const { service } = buildService();
      const result = await service.handleUpdateScheduleTemplate('biz-1', {
        templateName: 'Weekday',
      });
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('renames the template', async () => {
      const { service, scheduleService } = buildService();
      const result = await service.handleUpdateScheduleTemplate('biz-1', {
        templateName: 'Weekday',
        newName: 'Weekday Hours',
      });
      expect(result.success).toBe(true);
      expect(scheduleService.updateTemplate).toHaveBeenCalledWith(
        'biz-1',
        'tpl-1',
        { name: 'Weekday Hours' },
        undefined,
      );
    });
  });

  describe('handleDeleteScheduleTemplates', () => {
    it('asks for clarification when no template names given', async () => {
      const { service } = buildService();
      const result = await service.handleDeleteScheduleTemplates('biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('deletes matching templates', async () => {
      const { service, scheduleService } = buildService();
      const result = await service.handleDeleteScheduleTemplates('biz-1', {
        templateNames: ['Weekday', 'Weekend'],
      });
      expect(result.success).toBe(true);
      expect(scheduleService.deleteTemplates).toHaveBeenCalledWith(
        'biz-1',
        { templateIds: ['tpl-1', 'tpl-2'] },
        undefined,
      );
    });

    it('fails when no templates match', async () => {
      const { service } = buildService();
      const result = await service.handleDeleteScheduleTemplates('biz-1', {
        templateName: 'Nonexistent',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleDuplicateScheduleTemplate', () => {
    it('duplicates the resolved template', async () => {
      const { service, scheduleService } = buildService();
      const result = await service.handleDuplicateScheduleTemplate('biz-1', {
        templateName: 'Weekday',
      });
      expect(result.success).toBe(true);
      expect(scheduleService.duplicateTemplate).toHaveBeenCalledWith(
        'biz-1',
        'tpl-1',
        undefined,
      );
    });

    it('fails when template not found', async () => {
      const { service } = buildService();
      const result = await service.handleDuplicateScheduleTemplate('biz-1', {
        templateName: 'Missing',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleDeleteScheduleBlock', () => {
    it('asks for clarification when no employee resolved', async () => {
      const { service } = buildService();
      const result = await service.handleDeleteScheduleBlock(
        'biz-1',
        'delete block',
        {},
        [employee],
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('fails when employee has no blocks', async () => {
      const { service } = buildService();
      const result = await service.handleDeleteScheduleBlock(
        'biz-1',
        'delete Alex block',
        { employeeName: 'Alex' },
        [employee],
      );
      expect(result.success).toBe(false);
    });

    it('auto-resolves a single block', async () => {
      const { service, blockScheduleService } = buildService({
        blockScheduleService: {
          list: jest.fn().mockResolvedValue([{ id: 'block-1', startDay: '2026-06-01', endDay: null }]),
        },
      });
      const result = await service.handleDeleteScheduleBlock(
        'biz-1',
        'delete Alex block',
        { employeeName: 'Alex' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(blockScheduleService.remove).toHaveBeenCalledWith(
        'biz-1',
        'block-1',
        undefined,
      );
    });

    it('asks for a date when multiple blocks match', async () => {
      const { service } = buildService({
        blockScheduleService: {
          list: jest.fn().mockResolvedValue([
            { id: 'block-1', startDay: '2026-06-01', endDay: null },
            { id: 'block-2', startDay: '2026-06-08', endDay: null },
          ]),
        },
      });
      const result = await service.handleDeleteScheduleBlock(
        'biz-1',
        'delete Alex block',
        { employeeName: 'Alex' },
        [employee],
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('e2e-bug.136 — matches single-block rows by singleStartTime day', async () => {
      const { service, blockScheduleService } = buildService({
        blockScheduleService: {
          list: jest.fn().mockResolvedValue([
            {
              id: 'block-single',
              startDay: null,
              endDay: null,
              singleStartTime: '2026-07-18T00:00:00.000Z',
              singleEndTime: '2026-07-18T23:59:59.000Z',
            },
          ]),
        },
      });
      const result = await service.handleDeleteScheduleBlock(
        'biz-1',
        "Unblock Alex's schedule for 18/07/2026, remove the full-day block",
        { employeeName: 'Alex', date: '18/07/2026' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(blockScheduleService.remove).toHaveBeenCalledWith(
        'biz-1',
        'block-single',
        undefined,
      );
    });
  });

  describe('handleListScheduleBlocks', () => {
    it('reports no blocks for a specific employee', async () => {
      const { service } = buildService();
      const result = await service.handleListScheduleBlocks(
        'biz-1',
        { employeeName: 'Alex' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Alex has no schedule blocks.');
      expect((result.details as any).blocks).toEqual([]);
    });

    it('reports no blocks for the whole team when no employee is named', async () => {
      const { service } = buildService();
      const result = await service.handleListScheduleBlocks('biz-1', {}, [
        employee,
      ]);
      expect(result.success).toBe(true);
      expect(result.summary).toBe('No schedule blocks found.');
    });

    it('lists blocks for a resolved employee', async () => {
      const { service, blockScheduleService } = buildService({
        blockScheduleService: {
          list: jest.fn().mockResolvedValue([
            {
              id: 'block-1',
              employee: { id: 'emp-1', name: 'Alex' },
              placeholderLabel: 'Lunch',
              startDay: 'MON',
              endDay: 'MON',
              blockStartTime: '12:00',
              blockEndTime: '13:00',
            },
          ]),
        },
      });
      const result = await service.handleListScheduleBlocks(
        'biz-1',
        { employeeName: 'Alex' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(blockScheduleService.list).toHaveBeenCalledWith('biz-1', 'emp-1');
      expect(result.summary).toContain('1 schedule block(s):');
      expect(result.summary).toContain('Alex: Lunch (MON, 12:00-13:00)');
    });

    it('lists blocks across all employees when none is named', async () => {
      const { service, blockScheduleService } = buildService({
        blockScheduleService: {
          list: jest.fn().mockResolvedValue([
            {
              id: 'block-1',
              employee: { id: 'emp-1', name: 'Alex' },
              placeholderLabel: 'Lunch',
              startDay: 'MON',
              endDay: 'TUE',
              blockStartTime: '12:00',
              blockEndTime: '13:00',
            },
          ]),
        },
      });
      const result = await service.handleListScheduleBlocks('biz-1', {}, [
        employee,
      ]);
      expect(blockScheduleService.list).toHaveBeenCalledWith(
        'biz-1',
        undefined,
      );
      expect(result.summary).toContain('MON–TUE');
    });
  });

  describe('handleGetProviderCalendar', () => {
    it('asks for clarification when no employee resolved', async () => {
      const { service } = buildService();
      const result = await service.handleGetProviderCalendar(
        'biz-1',
        'show the calendar',
        {},
        [employee],
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('reports no scheduled periods for the resolved range', async () => {
      const { service } = buildService();
      const result = await service.handleGetProviderCalendar(
        'biz-1',
        "Show Alex's calendar",
        { employeeName: 'Alex', date: '2026-07-13' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Alex has no scheduled periods');
    });

    it('summarizes periods by type for a resolved employee and range', async () => {
      const { service, scheduleService } = buildService({
        scheduleService: {
          getProviderCalendar: jest.fn().mockResolvedValue({
            periods: [
              { id: 'p1', type: 'SERVICE' },
              { id: 'p2', type: 'SERVICE' },
              { id: 'p3', type: 'BLOCKED' },
            ],
          }),
        },
      });
      const result = await service.handleGetProviderCalendar(
        'biz-1',
        "Show Alex's calendar",
        { employeeName: 'Alex', date: '2026-07-13' },
        [employee],
      );
      expect(result.success).toBe(true);
      expect(scheduleService.getProviderCalendar).toHaveBeenCalledWith(
        'biz-1',
        'emp-1',
        '2026-07-13',
        '2026-07-13',
      );
      expect(result.summary).toContain('3 period(s)');
      expect(result.summary).toContain('2 SERVICE');
      expect(result.summary).toContain('1 BLOCKED');
    });
  });

  describe('isApplyAndFillPrompt', () => {
    it('detects apply-and-fill phrasing', () => {
      const { service } = buildService();
      expect(
        service.isApplyAndFillPrompt(
          'Apply the Weekday template and fill unused slots this week',
        ),
      ).toBe(true);
      expect(service.isApplyAndFillPrompt('Apply the Weekday template')).toBe(
        false,
      );
    });
  });

  describe('handleApplyAndFill', () => {
    it('stops after apply_schedule when it fails', async () => {
      const { service } = buildService();
      const result = await service.handleApplyAndFill(
        'biz-1',
        'apply and fill',
        {},
        [],
        [],
      );
      expect(result.success).toBe(false);
      expect(result.action).toBe('apply_and_fill');
      expect((result.details as any).failedStep).toBe('apply_schedule');
    });
  });
});
