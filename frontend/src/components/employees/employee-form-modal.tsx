'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { EmployeeAvatarField } from '@/components/employees/employee-avatar-field';
import { DashboardPhoneInput } from '@/components/dashboard-phone-input';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import {
  ASSIGNABLE_ROLES,
  roleLabel,
  type TeamMemberRole,
} from '@/components/employees/team-members-card';
import type { EmployeeAccessRoleConfig } from '@/lib/employee-access-role.util';
import {
  emptyEmployeeForm,
  employeeToForm,
  formToPayload,
  validateEmployeeServices,
  type EmployeeFormValues,
  type EmployeeRecord,
} from '@/lib/employee-types';

export type { EmployeeAccessRoleConfig };

interface EmployeeFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  businessId: string;
  employee?: EmployeeRecord | null;
  services: Array<{ id: string; name: string }>;
  accessRoleConfig?: EmployeeAccessRoleConfig | null;
  saving?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (
    payload: ReturnType<typeof formToPayload>,
    accessRole?: TeamMemberRole,
  ) => void;
}

export function EmployeeFormModal({
  open,
  mode,
  businessId,
  employee,
  services,
  accessRoleConfig,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const locale = business?.locale ?? user?.locale;
  const defaultPhoneCountry = locale === 'ru' ? '7' : locale === 'hy' ? '374' : '374';

  const [form, setForm] = useState<EmployeeFormValues>(emptyEmployeeForm());
  const [accessRole, setAccessRole] = useState<TeamMemberRole>('contributor');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setForm(employee ? employeeToForm(employee) : emptyEmployeeForm());
      setAccessRole(accessRoleConfig?.initialRole ?? 'contributor');
      setPhoneError(null);
      setServicesError(null);
    });
  }, [open, employee, accessRoleConfig]);

  if (!open) return null;

  const toggleService = (serviceId: string) => {
    setServicesError(null);
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {mode === 'create' ? t('employees.addEmployee') : t('employees.editEmployee')}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{t('employees.formSubtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPhoneError(null);
            setServicesError(null);
            if (validateEmployeeServices(form.serviceIds, services.length) === 'SERVICES_REQUIRED') {
              setServicesError(t('employees.servicesRequired'));
              return;
            }
            try {
              onSubmit(
                formToPayload(form),
                accessRoleConfig ? accessRole : undefined,
              );
            } catch (err) {
              if (err instanceof Error && err.message === 'INVALID_PHONE') {
                setPhoneError(t('employees.invalidPhone'));
                return;
              }
              throw err;
            }
          }}
          className="space-y-4"
        >
          <EmployeeAvatarField
            businessId={businessId}
            name={form.name}
            avatarUrl={form.avatarUrl}
            onChange={(avatarUrl) => setForm({ ...form, avatarUrl })}
            disabled={saving}
          />

          <div>
            <label className="label">{t('common.name')}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">{t('employees.role')}</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('employees.titlePlaceholder')}
            />
          </div>

          {mode === 'edit' && accessRoleConfig ? (
            <div>
              <label className="label">{t('employees.accessRole')}</label>
              <p className="text-[11px] text-gray-500 mb-2">{t('employees.accessRoleHint')}</p>
              {accessRoleConfig.editable ? (
                <select
                  className="input"
                  value={accessRole}
                  onChange={(e) => setAccessRole(e.target.value as TeamMemberRole)}
                  disabled={saving}
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role, t)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-300">{roleLabel(accessRoleConfig.initialRole, t)}</p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">{t('common.email')}</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <DashboardPhoneInput
              label={t('common.phone')}
              value={form.phone || undefined}
              onChange={(phone) => {
                setPhoneError(null);
                setForm({ ...form, phone: phone ?? '' });
              }}
              defaultCountryCode={defaultPhoneCountry}
            />
            {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
          </div>

          {services.length > 0 && (
            <div>
              <label className="label">{t('employees.servicesOffered')}</label>
              <p className="text-[11px] text-gray-500 mb-2">
                {t('employees.servicesOfferedHint')}
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const selected = form.serviceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        selected
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>
              {servicesError && <p className="text-sm text-red-400 mt-2">{servicesError}</p>}
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : mode === 'create' ? (
                t('employees.createEmployee')
              ) : (
                t('common.saveChanges')
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
