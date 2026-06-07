import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import { mapClinicTaskView } from '../clinic-tasks/clinic-task-map.util.js';
import { CLINIC_TASK_FIXTURES } from '../clinic-tasks/clinic-task.fixtures.js';
import type { ClinicTask } from '../clinic-tasks/entities/clinic-task.entity.js';
import {
  buildProviderClinicTaskNameLookups,
  mapProviderClinicTaskInboxItems,
  mapProviderClinicTaskItem,
  mergeClinicTaskInboxItems,
  sortClinicTasksForInbox,
} from './provider-mobile-clinic-tasks.util.js';

describe('provider-mobile-clinic-tasks.util', () => {
  const providerCtx = {
    userId: 'user-provider',
    membershipRole: MemberRole.STAFF,
    employeeId: 'emp-provider-1',
  };

  const taskViews = CLINIC_TASK_FIXTURES.map((fixture) =>
    mapClinicTaskView(fixture as ClinicTask),
  );

  it('merges inbox pages without duplicates and sorts by due date', () => {
    const merged = mergeClinicTaskInboxItems(
      [taskViews[0], taskViews[2]],
      [taskViews[1], taskViews[0]],
    );

    expect(merged.map((task) => task.id)).toEqual([
      'task-specimen-1',
      'task-callback-1',
      'task-result-1',
    ]);
  });

  it('sorts tasks with null due dates last', () => {
    const sorted = sortClinicTasksForInbox([
      {
        ...taskViews[2],
        dueAt: null,
      },
      taskViews[1],
    ]);

    expect(sorted[0]?.id).toBe('task-specimen-1');
    expect(sorted[1]?.id).toBe('task-callback-1');
  });

  it('maps provider inbox items with names and action flags', () => {
    const lookups = buildProviderClinicTaskNameLookups(
      [{ id: 'cust-1', name: 'Jane Doe' }],
      [{ id: 'emp-provider-1', name: 'Dr Smith' }],
    );

    const item = mapProviderClinicTaskItem(taskViews[0], providerCtx, lookups);

    expect(item.customerName).toBe('Jane Doe');
    expect(item.assigneeName).toBe('Dr Smith');
    expect(item.canComplete).toBe(true);
    expect(item.canClaim).toBe(false);
  });

  it('leaves customer and assignee names null when lookups miss', () => {
    const lookups = buildProviderClinicTaskNameLookups([], []);
    const item = mapProviderClinicTaskItem(taskViews[0], providerCtx, lookups);

    expect(item.customerName).toBeNull();
    expect(item.assigneeName).toBeNull();
  });

  it('leaves customer name null when the task has no customer link', () => {
    const lookups = buildProviderClinicTaskNameLookups(
      [{ id: 'cust-1', name: 'Jane Doe' }],
      [],
    );
    const item = mapProviderClinicTaskItem(
      { ...taskViews[0], customerId: null },
      providerCtx,
      lookups,
    );

    expect(item.customerName).toBeNull();
  });

  it('marks unassigned tasks as claimable for providers', () => {
    const lookups = buildProviderClinicTaskNameLookups(
      [{ id: 'cust-1', name: 'Jane Doe' }],
      [],
    );
    const items = mapProviderClinicTaskInboxItems(
      [taskViews[2]],
      providerCtx,
      lookups,
    );

    expect(items[0]?.canClaim).toBe(true);
    expect(items[0]?.canComplete).toBe(false);
  });
});
