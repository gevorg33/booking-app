import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { EmployeeFormModal } from './employee-form-modal';
import type { EmployeeRecord } from '@/lib/employee-types';

vi.mock('@/lib/store', () => ({
  useAuthStore: () => ({
    business: { defaultPhoneCountryCode: '374' },
    user: { locale: 'en' },
  }),
}));

vi.mock('@/components/employees/employee-avatar-field', () => ({
  EmployeeAvatarField: () => <div data-testid="avatar-field" />,
}));

vi.mock('@/components/dashboard-phone-input', () => ({
  DashboardPhoneInput: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (phone?: string) => void;
  }) => (
    <input
      data-testid="phone-input"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  ),
}));

describe('EmployeeFormModal integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let submittedPayload: unknown;
  let submittedAccessRole: string | undefined;

  const employee: EmployeeRecord = {
    id: 'emp-1',
    name: 'Mary Torgomyan',
    email: 'mary@test.com',
    phone: '+37495018414',
    userId: 'user-mary',
    serviceIds: ['svc-1'],
    metadata: { title: 'Provider' },
  };

  beforeEach(() => {
    submittedPayload = null;
    submittedAccessRole = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function mountModal(
    props: Partial<Parameters<typeof EmployeeFormModal>[0]> = {},
  ) {
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="en">
          <EmployeeFormModal
            open
            mode="edit"
            businessId="biz-1"
            employee={employee}
            services={[{ id: 'svc-1', name: 'Haircut' }]}
            onClose={() => undefined}
            onSubmit={(payload, accessRole) => {
              submittedPayload = payload;
              submittedAccessRole = accessRole;
            }}
            {...props}
          />
        </I18nProvider>,
      );
      await Promise.resolve();
    });
  }

  it('renders editable access role select in edit mode', async () => {
    await mountModal({
      accessRoleConfig: { initialRole: 'staff', editable: true },
    });

    const accessRoleSelect = container.querySelector(
      'select',
    ) as HTMLSelectElement;
    expect(accessRoleSelect).toBeTruthy();
    expect(accessRoleSelect.value).toBe('staff');

    act(() => {
      accessRoleSelect.value = 'manager';
      accessRoleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submittedAccessRole).toBe('manager');
    expect(submittedPayload).toMatchObject({
      name: 'Mary Torgomyan',
      email: 'mary@test.com',
    });
  });

  it('renders read-only access role when not editable', async () => {
    await mountModal({
      accessRoleConfig: { initialRole: 'owner', editable: false },
    });

    expect(container.querySelector('select')).toBeNull();
    expect(container.textContent).toContain('Business owner');
  });

  it('hides access role section in create mode', async () => {
    await mountModal({
      mode: 'create',
      employee: null,
      accessRoleConfig: { initialRole: 'contributor', editable: true },
    });

    expect(container.textContent).not.toContain('Controls dashboard and mobile app permissions');
    expect(container.querySelector('select')).toBeNull();
  });

  it('does not submit access role when config is absent', async () => {
    await mountModal({ accessRoleConfig: null });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submittedAccessRole).toBeUndefined();
  });

  it('blocks submit when services are required but none selected', async () => {
    await mountModal({
      employee: { ...employee, serviceIds: [] },
      accessRoleConfig: null,
    });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(submittedPayload).toBeNull();
    expect(container.textContent).toContain('Select at least one service');
  });
});
