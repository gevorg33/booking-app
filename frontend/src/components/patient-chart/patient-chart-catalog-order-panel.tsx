'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import type { CustomerDetail } from '@/components/customers/customer-detail-panel';
import {
  type ClinicTestPanelRecord,
  type ClinicTestTypeRecord,
} from '@/lib/clinic-test-catalog';
import {
  buildCatalogOrderItemsPayload,
  canSubmitCatalogOrder,
  filterConfirmedVisitsForCatalogOrder,
  isCatalogPickerSelected,
  toggleCatalogPickerSelection,
  type CatalogOrderPickerSelection,
} from '@/lib/patient-chart-catalog-order';
import {
  mapCustomerAppointmentsToVisits,
  unwrapPatientChartData,
  unwrapPatientChartList,
} from '@/lib/patient-chart';

export interface PatientChartCatalogOrderPanelProps {
  businessId: string;
  customerId: string;
}

function unwrapList<T>(payload: unknown): T[] {
  return unwrapPatientChartList<T>(payload);
}

export function PatientChartCatalogOrderPanel({
  businessId,
  customerId,
}: PatientChartCatalogOrderPanelProps) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [bookingId, setBookingId] = useState('');
  const [selections, setSelections] = useState<CatalogOrderPickerSelection[]>([]);

  const { data: customerDetail, isLoading: visitsLoading } = useQuery({
    queryKey: ['customer-detail', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/detail`,
      );
      return unwrapPatientChartData<CustomerDetail>(data);
    },
    enabled: !!businessId && !!customerId,
  });

  const confirmedVisits = useMemo(
    () =>
      filterConfirmedVisitsForCatalogOrder(
        mapCustomerAppointmentsToVisits(customerDetail?.appointments ?? []),
      ),
    [customerDetail?.appointments],
  );

  const { data: testTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['clinic-test-types', businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/catalog/test-types`,
      );
      return unwrapList<ClinicTestTypeRecord>(data);
    },
    enabled: !!businessId,
  });

  const { data: testPanels = [], isLoading: panelsLoading } = useQuery({
    queryKey: ['clinic-test-panels', businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/catalog/test-panels`,
      );
      return unwrapList<ClinicTestPanelRecord>(data);
    },
    enabled: !!businessId,
  });

  const activeTestTypes = testTypes.filter((item) => item.isActive);
  const activeTestPanels = testPanels.filter((item) => item.isActive);

  const createOrderMutation = useMutation({
    mutationFn: async (visitBookingId: string) => {
      await api.post(
        `/businesses/${businessId}/clinic-test-results/bookings/${visitBookingId}/orders`,
        { items: buildCatalogOrderItemsPayload(selections) },
      );
    },
    onSuccess: async () => {
      setSelections([]);
      await queryClient.invalidateQueries({
        queryKey: ['patient-chart-orders', businessId, customerId],
      });
    },
  });

  const catalogLoading = typesLoading || panelsLoading;
  const selectedBookingId = bookingId || confirmedVisits[0]?.id || '';
  const canSubmit = canSubmitCatalogOrder(selectedBookingId, selections);

  return (
    <section className="card mb-4 space-y-4">
      <h2 className="text-sm font-semibold">{t('clinic.patientChart.catalogOrder.title')}</h2>

      {visitsLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        </div>
      ) : confirmedVisits.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('clinic.patientChart.catalogOrder.noConfirmedVisits')}
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">
              {t('clinic.patientChart.catalogOrder.visitLabel')}
            </span>
            <select
              className="input max-w-xl"
              value={selectedBookingId}
              onChange={(event) => setBookingId(event.target.value)}
            >
              {confirmedVisits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.serviceName ?? t('customers.appointmentFallback')} ·{' '}
                  {formatDateDisplay(new Date(visit.startTime), locale)} ·{' '}
                  {formatTimeRangeDisplay(
                    new Date(visit.startTime),
                    new Date(visit.endTime),
                  )}
                </option>
              ))}
            </select>
          </label>

          {catalogLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
          ) : activeTestTypes.length === 0 && activeTestPanels.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('clinic.patientChart.catalogOrder.noCatalogItems')}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeTestTypes.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('clinic.patientChart.catalogOrder.testsLabel')}
                  </p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-800">
                    {activeTestTypes.map((testType) => {
                      const checked = isCatalogPickerSelected(
                        selections,
                        'test_type',
                        testType.id,
                      );
                      return (
                        <li key={testType.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelections((current) =>
                                  toggleCatalogPickerSelection(current, {
                                    kind: 'test_type',
                                    id: testType.id,
                                    label: testType.title,
                                  }),
                                )
                              }
                            />
                            <span>
                              <span className="font-medium">{testType.title}</span>
                              {testType.code ? (
                                <span className="ml-1 text-gray-500">({testType.code})</span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {activeTestPanels.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('clinic.patientChart.catalogOrder.panelsLabel')}
                  </p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-800">
                    {activeTestPanels.map((panel) => {
                      const checked = isCatalogPickerSelected(
                        selections,
                        'test_panel',
                        panel.id,
                      );
                      return (
                        <li key={panel.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelections((current) =>
                                  toggleCatalogPickerSelection(current, {
                                    kind: 'test_panel',
                                    id: panel.id,
                                    label: panel.title,
                                  }),
                                )
                              }
                            />
                            <span>
                              <span className="font-medium">{panel.title}</span>
                              {panel.code ? (
                                <span className="ml-1 text-gray-500">({panel.code})</span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!canSubmit || createOrderMutation.isPending}
              onClick={() => {
                if (!selectedBookingId) return;
                setBookingId(selectedBookingId);
                createOrderMutation.mutate(selectedBookingId);
              }}
            >
              {createOrderMutation.isPending
                ? t('common.saving')
                : t('clinic.patientChart.catalogOrder.placeOrder')}
            </button>
            {selections.length === 0 ? (
              <p className="text-xs text-gray-500">
                {t('clinic.patientChart.catalogOrder.selectItems')}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {t('clinic.patientChart.catalogOrder.selectedCount', {
                  count: selections.length,
                })}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
