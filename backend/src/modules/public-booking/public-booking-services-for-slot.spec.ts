import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import 'reflect-metadata';
import { GetServicesForSlotQueryDto } from './dto/public-booking.dto.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';

describe('GET services/for-slot — e2e-bug.116', () => {
  const employeeId = '11111111-1111-4111-8111-111111111111';

  const bookingService = {
    getAllowedServiceIdsAtInstant: jest.fn(),
    validateServiceFitsWindow: jest.fn(),
  };

  const service = createPublicBookingServiceHarness({
    businessService: {
      findBySlug: jest.fn().mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        isActive: true,
        settings: {},
      }),
    },
    bookingService,
    employeeRepo: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({
        id: employeeId,
        businessId: 'biz-1',
        isActive: true,
        name: 'Alex',
      }),
    },
    serviceRepo: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing startTime with a clean 400 (no Postgres leak)', async () => {
    await expect(
      service.getServicesForSlot('salon', employeeId, ''),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.getServicesForSlot('salon', employeeId, ''),
    ).rejects.toThrow('startTime must be a valid ISO 8601 date string');
    expect(bookingService.getAllowedServiceIdsAtInstant).not.toHaveBeenCalled();
  });

  it('rejects malformed startTime with a clean 400 (no Postgres leak)', async () => {
    await expect(
      service.getServicesForSlot('salon', employeeId, 'not-a-date'),
    ).rejects.toThrow('startTime must be a valid ISO 8601 date string');
    expect(bookingService.getAllowedServiceIdsAtInstant).not.toHaveBeenCalled();
  });

  it('query DTO requires ISO startTime and UUID employeeId', async () => {
    const bad = plainToInstance(GetServicesForSlotQueryDto, {
      employeeId: 'not-a-uuid',
      startTime: 'not-a-date',
    });
    const errors = await validate(bad);
    expect(errors.some((e) => e.property === 'employeeId')).toBe(true);
    expect(errors.some((e) => e.property === 'startTime')).toBe(true);

    const good = plainToInstance(GetServicesForSlotQueryDto, {
      employeeId,
      startTime: '2026-07-21T09:00:00.000Z',
    });
    expect(await validate(good)).toHaveLength(0);
  });
});
