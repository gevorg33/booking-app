'use client';

import { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Stethoscope } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  defaultExternalDoctorForm,
  externalDoctorFormToPayload,
  externalDoctorToForm,
  unwrapExternalDoctorRecord,
  unwrapExternalDoctorsList,
  type ExternalDoctorFormState,
  type ExternalDoctorRecord,
} from '@/lib/external-doctors';

export interface ExternalDoctorsTabProps {
  businessId: string;
}

export function ExternalDoctorsTab({ businessId }: ExternalDoctorsTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExternalDoctorFormState>(defaultExternalDoctorForm());
  const [formError, setFormError] = useState<string | null>(null);

  const trimmedSearch = search.trim();

  const { data, isLoading } = useQuery({
    queryKey: ['external-doctors', businessId, trimmedSearch],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/external-doctors`, {
        params: {
          q: trimmedSearch || undefined,
          page: 1,
          pageSize: 50,
          activeOnly: false,
        },
      });
      return unwrapExternalDoctorsList(res);
    },
    enabled: !!businessId,
  });

  const doctors = useMemo(() => data?.items ?? [], [data?.items]);

  const resetForm = () => {
    setForm(defaultExternalDoctorForm());
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const startEdit = (doctor: ExternalDoctorRecord) => {
    setEditingId(doctor.id);
    setForm(externalDoctorToForm(doctor));
    setShowForm(true);
    setFormError(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = externalDoctorFormToPayload(form);
      if (!payload.name || !payload.address.street || !payload.address.city) {
        throw new Error(t('externalDoctors.formRequired'));
      }
      if (editingId) {
        const { data: res } = await api.put(
          `/businesses/${businessId}/external-doctors/${editingId}`,
          payload,
        );
        return unwrapExternalDoctorRecord(res);
      }
      const { data: res } = await api.post(
        `/businesses/${businessId}/external-doctors`,
        payload,
      );
      return unwrapExternalDoctorRecord(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['external-doctors', businessId] });
      resetForm();
    },
    onError: (error: Error) => {
      setFormError(error.message || t('externalDoctors.saveFailed'));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{t('externalDoctors.title')}</h2>
        <p className="text-sm text-gray-400">{t('externalDoctors.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          className="input max-w-md"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('externalDoctors.searchPlaceholder')}
        />
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('externalDoctors.addDoctor')}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {editingId ? t('externalDoctors.editDoctor') : t('externalDoctors.addDoctor')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">{t('externalDoctors.fields.name')}</span>
              <input
                className="input mt-1"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.clinicName')}</span>
              <input
                className="input mt-1"
                value={form.clinicName}
                onChange={(event) => setForm({ ...form, clinicName: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.specialty')}</span>
              <input
                className="input mt-1"
                value={form.specialty}
                onChange={(event) => setForm({ ...form, specialty: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.fax')}</span>
              <input
                className="input mt-1"
                value={form.fax}
                onChange={(event) => setForm({ ...form, fax: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.phone')}</span>
              <input
                className="input mt-1"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.email')}</span>
              <input
                className="input mt-1"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="label">{t('externalDoctors.fields.street')}</span>
              <input
                className="input mt-1"
                value={form.address.street}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, street: event.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.unit')}</span>
              <input
                className="input mt-1"
                value={form.address.unit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, unit: event.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.city')}</span>
              <input
                className="input mt-1"
                value={form.address.city}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, city: event.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.province')}</span>
              <input
                className="input mt-1"
                value={form.address.province}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, province: event.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.postalCode')}</span>
              <input
                className="input mt-1"
                value={form.address.postalCode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, postalCode: event.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">{t('externalDoctors.fields.country')}</span>
              <input
                className="input mt-1"
                value={form.address.country}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: { ...form.address, country: event.target.value },
                  })
                }
              />
            </label>
            {editingId && (
              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                <span className="text-sm text-gray-300">{t('externalDoctors.fields.active')}</span>
              </label>
            )}
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : !doctors.length ? (
        <div className="card text-sm text-gray-400">{t('externalDoctors.empty')}</div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-300" />
                  <h3 className="font-medium text-white">{doctor.name}</h3>
                  {!doctor.isActive && (
                    <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                      {t('externalDoctors.inactiveBadge')}
                    </span>
                  )}
                </div>
                {doctor.clinicName && (
                  <p className="text-sm text-gray-300">{doctor.clinicName}</p>
                )}
                {doctor.specialty && (
                  <p className="text-sm text-gray-400">{doctor.specialty}</p>
                )}
                <p className="mt-1 text-sm text-gray-400">{doctor.address}</p>
                {(doctor.fax || doctor.phone || doctor.email) && (
                  <p className="mt-1 text-sm text-gray-500">
                    {[doctor.fax && `${t('externalDoctors.fields.fax')}: ${doctor.fax}`, doctor.phone, doctor.email]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1"
                onClick={() => startEdit(doctor)}
              >
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
