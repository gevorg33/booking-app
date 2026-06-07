'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ShieldAlert } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import type { CustomerDetail } from '@/components/customers/customer-detail-panel';
import {
  type PatientClinicalProfileView,
  unwrapPatientChartData,
} from '@/lib/patient-chart';
import { unwrapExternalDoctorsList } from '@/lib/external-doctors';
import { formatDateDisplay } from '@/lib/date-format';

export interface PatientChartProfileTabProps {
  businessId: string;
  customerId: string;
}

export function PatientChartProfileTab({
  businessId,
  customerId,
}: PatientChartProfileTabProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [allergies, setAllergies] = useState('');
  const [chronicProblems, setChronicProblems] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [referringExternalDoctorId, setReferringExternalDoctorId] = useState('');

  const { data: customerDetail, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-detail', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/detail`,
      );
      return unwrapPatientChartData<CustomerDetail>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['patient-clinical-profile', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/clinical-profile`,
      );
      return unwrapPatientChartData<PatientClinicalProfileView>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  const { data: referringDoctors } = useQuery({
    queryKey: ['external-doctors', businessId, 'profile-select'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/external-doctors`, {
        params: { page: 1, pageSize: 100, activeOnly: true },
      });
      return unwrapExternalDoctorsList(data);
    },
    enabled: !!businessId && !!customerId,
  });

  useEffect(() => {
    if (!profile) return;
    queueMicrotask(() => {
      setAllergies(profile.allergies ?? '');
      setChronicProblems(profile.chronicProblems ?? '');
      setEmergencyContactName(profile.emergencyContactName ?? '');
      setEmergencyContactPhone(profile.emergencyContactPhone ?? '');
      setEmergencyContactRelationship(profile.emergencyContactRelationship ?? '');
      setBloodType(profile.bloodType ?? '');
      setReferringExternalDoctorId(profile.referringExternalDoctorId ?? '');
    });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(
        `/businesses/${businessId}/customers/${customerId}/clinical-profile`,
        {
          allergies: allergies.trim() || null,
          chronicProblems: chronicProblems.trim() || null,
          emergencyContactName: emergencyContactName.trim() || null,
          emergencyContactPhone: emergencyContactPhone.trim() || null,
          emergencyContactRelationship: emergencyContactRelationship.trim() || null,
          bloodType: bloodType.trim() || null,
          referringExternalDoctorId: referringExternalDoctorId.trim() || null,
        },
      );
      return unwrapPatientChartData<PatientClinicalProfileView>(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-clinical-profile', businessId, customerId],
      });
    },
  });

  if (customerLoading || profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  const customer = customerDetail?.customer;

  return (
    <div className="space-y-6">
      {profile?.phiMasked ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('clinic.patientChart.phiMaskedNotice')}</p>
        </div>
      ) : null}

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('clinic.patientChart.demographicsTitle')}
        </h2>
        {customer ? (
          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-gray-500">{t('clinic.patientChart.fields.name')}</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('clinic.patientChart.fields.email')}</dt>
              <dd>{customer.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('clinic.patientChart.fields.phone')}</dt>
              <dd>{customer.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('clinic.patientChart.fields.segment')}</dt>
              <dd className="capitalize">{customer.segment.replace(/_/g, ' ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('clinic.patientChart.fields.customerSince')}</dt>
              <dd>{formatDateDisplay(new Date(customer.createdAt), locale)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">{t('clinic.patientChart.loadFailed')}</p>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('clinic.patientChart.clinicalProfileTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t('clinic.patientChart.fields.allergies')}</label>
            <textarea
              className="input min-h-[80px]"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('clinic.patientChart.fields.chronicProblems')}</label>
            <textarea
              className="input min-h-[80px]"
              value={chronicProblems}
              onChange={(e) => setChronicProblems(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
          <div>
            <label className="label">{t('clinic.patientChart.fields.bloodType')}</label>
            <input
              className="input"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
          <div>
            <label className="label">{t('clinic.patientChart.fields.referringDoctor')}</label>
            <select
              className="input"
              value={referringExternalDoctorId}
              onChange={(e) => setReferringExternalDoctorId(e.target.value)}
              disabled={profile?.phiMasked}
            >
              <option value="">{t('clinic.patientChart.referringDoctorNone')}</option>
              {(referringDoctors?.items ?? []).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.clinicName ? ` — ${doctor.clinicName}` : ''}
                </option>
              ))}
            </select>
            {profile?.referringExternalDoctor && (
              <p className="mt-1 text-xs text-gray-500">
                {profile.referringExternalDoctor.address}
                {profile.referringExternalDoctor.fax
                  ? ` · ${t('externalDoctors.fields.fax')}: ${profile.referringExternalDoctor.fax}`
                  : ''}
              </p>
            )}
          </div>
          <div />
          <div>
            <label className="label">{t('clinic.patientChart.fields.emergencyContactName')}</label>
            <input
              className="input"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
          <div>
            <label className="label">{t('clinic.patientChart.fields.emergencyContactPhone')}</label>
            <input
              className="input"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
          <div>
            <label className="label">
              {t('clinic.patientChart.fields.emergencyContactRelationship')}
            </label>
            <input
              className="input"
              value={emergencyContactRelationship}
              onChange={(e) => setEmergencyContactRelationship(e.target.value)}
              disabled={profile?.phiMasked}
            />
          </div>
        </div>
        {!profile?.phiMasked ? (
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 text-sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('common.save')}
          </button>
        ) : null}
      </section>
    </div>
  );
}
