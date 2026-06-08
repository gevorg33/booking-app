import { BookingStatus } from '../booking/entities/booking.entity.js';
import { CustomerRebookingCadenceService } from './customer-rebooking-cadence.service.js';

describe('CustomerRebookingCadenceService (adopt-6.5)', () => {
  const bookingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const customerRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const service = new CustomerRebookingCadenceService(
    bookingRepo as any,
    customerRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.save.mockImplementation(async (customer) => customer);
  });

  it('persists learned cadence per service after enough completed visits', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-3',
      businessId: 'biz-1',
      customerId: 'cust-1',
      serviceId: 'svc-haircut',
      status: BookingStatus.COMPLETED,
    });
    bookingRepo.find.mockResolvedValue([
      { endTime: new Date('2026-05-01') },
      { endTime: new Date('2026-04-03') },
      { endTime: new Date('2026-03-06') },
    ]);
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      metadata: { gdpr: { marketingOptIn: true } },
    });

    await service.persistLearnedCadenceForCompletedBooking('bk-3');

    expect(customerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          learnedRebookingCadenceByService: { 'svc-haircut': 28 },
        }),
      }),
    );
  });

  it('skips persistence when fewer than two completed visits exist', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      serviceId: 'svc-haircut',
      status: BookingStatus.COMPLETED,
    });
    bookingRepo.find.mockResolvedValue([{ endTime: new Date('2026-05-01') }]);

    await service.persistLearnedCadenceForCompletedBooking('bk-1');

    expect(customerRepo.save).not.toHaveBeenCalled();
  });
});
