import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import { I18nProvider } from '../i18n/I18nProvider';
import { useAuthStore } from '../services/auth-store';
import { ProviderClinicTasksList } from './ProviderClinicTasksList';

vi.mock('../lib/date-format', () => ({
  formatDateDisplay: (value: string) => value.slice(0, 10),
  formatTimeDisplay: (value: string) => value.slice(11, 16),
}));

const taskRows = [
  {
    id: 'task-1',
    taskType: 'ResultReview' as const,
    status: 'open' as const,
    title: 'Review CBC',
    notes: null,
    priority: 'high' as const,
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
    taskType: 'SpecimenCollection' as const,
    status: 'in_progress' as const,
    title: 'Collect sample',
    notes: null,
    priority: 'normal' as const,
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
];

describe('ProviderClinicTasksList i18n integration (i18n-clinic-v2-9)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(locale: 'hy' | 'ru') {
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com', locale },
      business: {
        id: 'biz-1',
        name: 'Clinic',
        locale,
        defaultLocale: locale,
        enabledLocales: ['en', 'hy', 'ru'],
      },
      token: 'token',
      isAuthenticated: true,
      employee: null,
      businesses: [],
    });

    act(() => {
      root.render(
        <I18nProvider>
          <ProviderClinicTasksList
            tasks={taskRows}
            loading={false}
            showAssigneeName={false}
            busyTaskId={null}
            onClaim={() => undefined}
            onComplete={() => undefined}
          />
        </I18nProvider>,
      );
    });
  }

  it('renders localized task type labels and actions in Armenian', () => {
    const hy = getMessages('hy');
    render('hy');

    expect(container.textContent).toContain(
      translate(hy, 'provider.clinicTasksTypeResultReview'),
    );
    expect(container.textContent).toContain(
      translate(hy, 'provider.clinicTasksTypeSpecimenCollection'),
    );
    expect(container.textContent).toContain(translate(hy, 'provider.clinicTasksPriorityHigh'));
    expect(container.textContent).toContain(translate(hy, 'provider.clinicTasksClaim'));
    expect(container.textContent).toContain(translate(hy, 'provider.clinicTasksComplete'));
  });

  it('renders localized task type labels in Russian', () => {
    const ru = getMessages('ru');
    render('ru');

    expect(container.textContent).toContain(
      translate(ru, 'provider.clinicTasksTypeResultReview'),
    );
    expect(container.textContent).toContain(
      translate(ru, 'provider.clinicTasksTypeSpecimenCollection'),
    );
    expect(container.textContent).toContain(translate(ru, 'provider.clinicTasksAutoManaged'));
    expect(container.textContent).toContain(translate(ru, 'provider.clinicTasksDue'));
  });
});
