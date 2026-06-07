import { ClinicTaskAutoScheduler } from './clinic-task-auto.scheduler.js';
import { ClinicTaskAutoService } from './clinic-task-auto.service.js';

describe('ClinicTaskAutoScheduler', () => {
  const clinicTaskAutoService = {
    syncAllClinicBusinessAutoTasks: jest.fn(),
  };

  const scheduler = new ClinicTaskAutoScheduler(clinicTaskAutoService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs when auto tasks are created', async () => {
    clinicTaskAutoService.syncAllClinicBusinessAutoTasks.mockResolvedValue(2);

    await scheduler.syncOverdueSpecimenTasks();

    expect(
      clinicTaskAutoService.syncAllClinicBusinessAutoTasks,
    ).toHaveBeenCalled();
  });

  it('swallows sync failures', async () => {
    clinicTaskAutoService.syncAllClinicBusinessAutoTasks.mockRejectedValue(
      new Error('db down'),
    );

    await expect(scheduler.syncOverdueSpecimenTasks()).resolves.toBeUndefined();
  });
});
