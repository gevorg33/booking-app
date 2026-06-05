import { AiSchedulingService } from './ai-scheduling.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';

describe('AiSchedulingService (thin wrapper)', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan', businessId: 'biz-1', isActive: true },
    { id: 'e2', name: 'Maria Lopez', businessId: 'biz-1', isActive: true },
  ] as Employee[];

  const services = [
    { id: 's1', name: 'facemassage', businessId: 'biz-1', durationMinutes: 60 },
  ] as Service[];

  const templateRepo = {
    find: jest
      .fn()
      .mockResolvedValue([{ id: 't1', name: 'Weekday', businessId: 'biz-1' }]),
  };
  const periodRepo = {
    find: jest.fn().mockResolvedValue([
      {
        startTime: new Date('2026-06-06T09:00:00.000Z'),
        endTime: new Date('2026-06-06T17:00:00.000Z'),
        type: 'service_block',
        serviceIds: ['s1'],
      },
    ]),
  };
  const bookingRepo = {
    find: jest.fn().mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-06-06T10:00:00.000Z'),
        status: 'confirmed',
      },
    ]),
  };
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({ settings: {} }),
  };
  const orchestration = {
    executePlan: jest.fn().mockResolvedValue({
      success: true,
      action: 'swap_schedules',
      summary: 'ok',
      taskId: 'task-1',
    }),
  };
  const planBuilder = new OperationalPlanBuilderService();

  const service = new AiSchedulingService(
    templateRepo as any,
    periodRepo as any,
    bookingRepo as any,
    businessRepo as any,
    orchestration as any,
    planBuilder,
  );

  it('delegates prepare and handle methods to scheduling logic', async () => {
    const plan = await service.prepareSwapSchedulesPlan(
      'biz-1',
      'Swap Friday schedules between Gevorg and Maria',
      {
        employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
        date: '06/06/2026',
      },
      employees,
    );
    expect(plan?.intent).toBe('swap_schedules');

    const result = await service.handleSwapSchedules(
      'biz-1',
      'Swap Friday schedules between Gevorg and Maria',
      {
        employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
        date: '06/06/2026',
      },
      employees,
    );
    expect(result.success).toBe(true);

    expect(
      (
        await service.handleRebalanceCapacity(
          'biz-1',
          'move',
          {},
          employees,
          services,
        )
      ).success,
    ).toBe(false);
    expect(
      (await service.handleHolidayMode('biz-1', 'close', {}, employees))
        .success,
    ).toBe(false);
    expect(
      (
        await service.handleOnboardProviderSchedule(
          'biz-1',
          'onboard',
          {},
          employees,
          services,
        )
      ).success,
    ).toBe(false);
  });
});
