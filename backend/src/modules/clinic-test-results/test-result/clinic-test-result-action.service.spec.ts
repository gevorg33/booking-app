import { ClinicTestResultActionService } from './clinic-test-result-action.service.js';

describe('ClinicTestResultActionService', () => {
  const statusService = {
    transitionResultStatus: jest.fn(async (input) => ({
      id: input.resultId,
      status: input.toStatus,
    })),
  };

  const service = new ClinicTestResultActionService(statusService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('markAsReleased delegates to status service', async () => {
    await service.markAsReleased({
      businessId: 'biz-1',
      resultId: 'result-1',
      employeeId: 'emp-1',
      comment: 'Ready for patient',
    });

    expect(statusService.transitionResultStatus).toHaveBeenCalledWith({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Released',
      employeeId: 'emp-1',
      note: 'Ready for patient',
    });
  });

  it('markAsReviewed delegates to status service', async () => {
    await service.markAsReviewed({
      businessId: 'biz-1',
      resultId: 'result-1',
      comment: 'Signed off',
    });

    expect(statusService.transitionResultStatus).toHaveBeenCalledWith({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Reviewed',
      employeeId: undefined,
      note: 'Signed off',
    });
  });
});
