import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderClinicTasksList } from './ProviderClinicTasksList';

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'provider.clinicTasksEmpty': 'No open clinic tasks.',
        'provider.clinicTasksTypeResultReview': 'Result review',
        'provider.clinicTasksPriorityHigh': 'High priority',
        'provider.clinicTasksAutoManaged': 'Auto',
        'provider.clinicTasksDue': 'Due',
        'provider.clinicTasksUnassigned': 'Unassigned',
        'provider.clinicTasksClaim': 'Take task',
        'provider.clinicTasksComplete': 'Complete',
        'common.provider': 'Provider',
      };
      return labels[key] ?? key;
    },
  }),
}));

vi.mock('../lib/date-format', () => ({
  formatDateDisplay: (value: string) => value.slice(0, 10),
  formatTimeDisplay: (value: string) => value.slice(11, 16),
}));

describe('ProviderClinicTasksList', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(
    props: Partial<React.ComponentProps<typeof ProviderClinicTasksList>> = {},
  ) {
    act(() => {
      root.render(
        <ProviderClinicTasksList
          tasks={[]}
          loading={false}
          showAssigneeName={false}
          busyTaskId={null}
          onClaim={() => undefined}
          onComplete={() => undefined}
          {...props}
        />,
      );
    });
  }

  it('renders empty state', () => {
    render();
    expect(container.textContent).toContain('No open clinic tasks.');
  });

  it('renders task rows with claim and complete actions', () => {
    const onClaim = vi.fn();
    const onComplete = vi.fn();
    render({
      onClaim,
      onComplete,
      tasks: [
        {
          id: 'task-1',
          taskType: 'ResultReview',
          status: 'open',
          title: 'Review CBC',
          notes: 'Flagged',
          priority: 'high',
          dueAt: '2026-06-22T12:00:00.000Z',
          customerId: 'cust-1',
          customerName: 'Jane Doe',
          bookingId: 'book-1',
          assigneeEmployeeId: null,
          assigneeName: null,
          isAutoManaged: true,
          canClaim: true,
          canComplete: false,
          createdAt: '2026-06-22T09:00:00.000Z',
        },
        {
          id: 'task-2',
          taskType: 'SpecimenCollection',
          status: 'in_progress',
          title: 'Collect sample',
          notes: null,
          priority: 'normal',
          dueAt: null,
          customerId: 'cust-2',
          customerName: 'Alex',
          bookingId: null,
          assigneeEmployeeId: 'emp-1',
          assigneeName: 'Dr Smith',
          isAutoManaged: false,
          canClaim: false,
          canComplete: true,
          createdAt: '2026-06-22T08:00:00.000Z',
        },
      ],
    });

    expect(container.textContent).toContain('Review CBC');
    expect(container.textContent).toContain('Jane Doe');
    expect(container.textContent).toContain('Take task');
    expect(container.textContent).toContain('Complete');

    const buttons = container.querySelectorAll('ion-button');
    act(() => {
      buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClaim).toHaveBeenCalledWith('task-1');
    expect(onComplete).toHaveBeenCalledWith('task-2');
  });

  it('shows assignee name in team view', () => {
    render({
      showAssigneeName: true,
      tasks: [
        {
          id: 'task-3',
          taskType: 'PatientCallback',
          status: 'open',
          title: 'Call patient',
          notes: null,
          priority: 'normal',
          dueAt: null,
          customerId: 'cust-3',
          customerName: 'Sam',
          bookingId: null,
          assigneeEmployeeId: 'emp-2',
          assigneeName: 'Dr Lee',
          isAutoManaged: false,
          canClaim: false,
          canComplete: true,
          createdAt: '2026-06-22T09:00:00.000Z',
        },
      ],
    });

    expect(container.textContent).toContain('Provider: Dr Lee');
  });

  it('renders loading state', () => {
    render({ loading: true });
    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });
});
