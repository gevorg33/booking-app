/**
 * e2e-bug.476 part 2 — "who offers Deep tissue massage?" named the provider and
 * stopped there, so the owner's next move was to try booking them and only then
 * discover nobody is scheduled. The capability answer now says so, and names the
 * action that fixes it.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';

const emp = (id: string, name: string, serviceIds: string[] = []) =>
  ({ id, name, isActive: true, serviceIds }) as Employee;

const svc = (id: string, name: string) => ({ id, name }) as Service;

function build(periods: Array<Record<string, unknown>>) {
  const periodRepo = { find: jest.fn().mockResolvedValue(periods) };
  const service = new AiBookingCoreService(
    undefined as any, // bookingRepo
    undefined as any, // employeeRepo
    undefined as any, // serviceRepo
    undefined as any, // customerRepo
    undefined as any, // businessRepo
    periodRepo as any, // periodRepo
    undefined as any, // slotRepo
    undefined as any, // templateRepo
    undefined as any, // orchestration
    undefined as any, // planBuilder
    undefined as any, // scheduleHandlers
    undefined as any, // operations
    undefined as any, // schedulingEngine
    undefined as any, // slotResolver
    undefined as any, // customerService
  );
  return { service, periodRepo };
}

const GEVORG = emp('e1', 'Gevorg', ['s1']);
const DEEP_TISSUE = svc('s1', 'Deep tissue massage');

describe('capability answer flags a missing schedule (e2e-bug.476)', () => {
  it('names the provider and recommends creating a schedule', async () => {
    const { service } = build([]); // nobody has any period tomorrow
    const result = await service.handleLookupServiceAssignment(
      'biz-1',
      [GEVORG],
      [DEEP_TISSUE],
      {
        assignmentLookup: 'providers_for_service',
        serviceName: 'Deep tissue massage',
      },
      'who offers Deep tissue massage usually?',
    );

    expect(result.success).toBe(true);
    // the half that already worked
    expect(result.summary).toContain('Gevorg');
    // the half this ticket added
    expect(result.summary).toMatch(/No Deep tissue massage time is scheduled/i);
    expect(result.summary).toContain('create a schedule for Gevorg');
    expect(result.details?.unscheduledProviders).toEqual([
      { id: 'e1', name: 'Gevorg' },
    ]);
  });

  it('stays silent when the provider is scheduled for that service', async () => {
    const { service } = build([
      {
        employeeId: 'e1',
        type: TemplatePeriodType.SERVICE_BLOCK,
        serviceIds: ['s1'],
        startTime: new Date(),
        endTime: new Date(),
      },
    ]);
    const result = await service.handleLookupServiceAssignment(
      'biz-1',
      [GEVORG],
      [DEEP_TISSUE],
      {
        assignmentLookup: 'providers_for_service',
        serviceName: 'Deep tissue massage',
      },
      'who offers Deep tissue massage?',
    );

    expect(result.summary).toContain('Gevorg');
    expect(result.summary).not.toMatch(/create a schedule/i);
    expect(result.details?.unscheduledProviders).toEqual([]);
  });

  it('reads the roster in one query, not one per provider', async () => {
    const { service, periodRepo } = build([]);
    await service.handleLookupServiceAssignment(
      'biz-1',
      [GEVORG, emp('e2', 'Mary', ['s1']), emp('e3', 'Ani', ['s1'])],
      [DEEP_TISSUE],
      {
        assignmentLookup: 'providers_for_service',
        serviceName: 'Deep tissue massage',
      },
      'who offers Deep tissue massage?',
    );
    expect(periodRepo.find).toHaveBeenCalledTimes(1);
  });

  it('still answers when the schedule read fails', async () => {
    const periodRepo = {
      find: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const service = new AiBookingCoreService(
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      periodRepo as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
    );
    const result = await service.handleLookupServiceAssignment(
      'biz-1',
      [GEVORG],
      [DEEP_TISSUE],
      {
        assignmentLookup: 'providers_for_service',
        serviceName: 'Deep tissue massage',
      },
      'who offers Deep tissue massage?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Gevorg');
    expect(result.summary).not.toMatch(/create a schedule/i);
  });
});
