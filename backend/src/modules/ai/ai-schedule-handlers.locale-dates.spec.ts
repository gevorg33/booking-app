import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';

describe('AiScheduleHandlersService locale dates', () => {
  const employee: Employee = {
    id: 'emp-1',
    name: 'Alex',
    businessId: 'biz-1',
    isActive: true,
  } as Employee;

  const business: Business = {
    id: 'biz-1',
    settings: { locale: 'hy' },
  } as Business;

  const periodRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue(business),
  };

  const sprint23 = {
    resolveHolidayDatesForBusiness: jest.fn().mockResolvedValue([]),
  };

  const service = new AiScheduleHandlersService(
    {} as any,
    periodRepo as any,
    businessRepo as any,
    {} as any,
    {} as any,
    sprint23 as any,
  );

  it('localizes weekday and date in schedule gap summaries', async () => {
    const result = await service.handleListScheduleGaps(
      'biz-1',
      'gaps this week',
      { employeeName: 'Alex', dateFrom: '2026-06-01', dateTo: '2026-06-01' },
      [employee],
    );

    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/հնգ|Ալեքս|Alex/i);
    expect(businessRepo.findOne).toHaveBeenCalledWith({ where: { id: 'biz-1' } });
  });
});
