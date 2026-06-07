import { resolveReleasedResultIdForNotify } from './clinic-result-ready-notify.util.js';

describe('clinic-result-ready-notify.util', () => {
  const resultRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves by explicit released resultId', async () => {
    resultRepo.findOne.mockResolvedValue({ id: 'result-1' });

    const id = await resolveReleasedResultIdForNotify(resultRepo, 'biz-1', {
      resultId: 'result-1',
    });

    expect(id).toBe('result-1');
  });

  it('resolves latest released result for a booking', async () => {
    resultRepo.find.mockResolvedValue([{ id: 'result-2' }]);

    const id = await resolveReleasedResultIdForNotify(resultRepo, 'biz-1', {
      bookingId: 'booking-1',
    });

    expect(id).toBe('result-2');
    expect(resultRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'biz-1',
          bookingId: 'booking-1',
          status: 'Released',
        },
      }),
    );
  });

  it('returns null when no identifiers are provided', async () => {
    await expect(
      resolveReleasedResultIdForNotify(resultRepo as any, 'biz-1', {}),
    ).resolves.toBeNull();
  });
});
