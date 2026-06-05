import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiProviderBookingService } from './ai-provider-booking.service.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';

describe('AiProviderBookingService', () => {
  let service: AiProviderBookingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiProviderBookingService,
        {
          provide: BookingService,
          useValue: {
            update: jest.fn(async (id, patch) => ({ id, ...patch })),
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            find: jest.fn(async () => [
              {
                id: 'book-1',
                businessId: 'biz-1',
                employeeId: 'emp-1',
                packagePurchaseId: 'pkg-1',
                startTime: new Date(),
                status: BookingStatus.CONFIRMED,
              },
            ]),
            findOne: jest.fn(async () => ({
              id: 'book-1',
              businessId: 'biz-1',
              employeeId: 'emp-1',
              metadata: { payAtVenue: true },
              customer: { name: 'Anna' },
            })),
          },
        },
      ],
    }).compile();

    service = module.get(AiProviderBookingService);
  });

  it('rescues and detects compound prompts', () => {
    expect(
      service.rescueProviderBookingIntent(
        'Show my package appointments today',
        'unknown',
      )?.action,
    ).toBe('list_package_appointments_today');
    expect(
      service.isProviderBookingCompound(
        'List my package visits and mark booking paid',
      ),
    ).toBe(true);
  });

  it('delegates list and mark paid handlers', async () => {
    expect(
      (
        await service.handleListPackageAppointmentsToday('biz-1', {
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleListMyPackageVisits('biz-1', 'my package visits', {
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleListMyMultiServiceGroups(
          'biz-1',
          'my multi-service groups',
          { sessionEmployeeId: 'emp-1' },
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleMarkPaid('biz-1', {
          bookingId: 'book-1',
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(true);
    expect(
      service.decomposeProviderBookingCompound(
        'List my package visits and mark booking paid',
      ),
    ).toHaveLength(2);
  });
});
