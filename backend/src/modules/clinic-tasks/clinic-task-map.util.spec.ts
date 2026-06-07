import { mapClinicTaskView } from './clinic-task-map.util.js';
import { CLINIC_TASK_FIXTURES } from './clinic-task.fixtures.js';

describe('clinic-task-map.util', () => {
  it.each(CLINIC_TASK_FIXTURES.map((task) => ({ id: task.id, task })))(
    'maps fixture $id to API view',
    ({ task }) => {
      expect(mapClinicTaskView(task as never)).toEqual(
        expect.objectContaining({
          id: task.id,
          businessId: task.businessId,
          taskType: task.taskType,
          status: task.status,
          title: task.title,
        }),
      );
    },
  );
});
