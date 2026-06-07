'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  type ClinicTestPanelRecord,
  type ClinicTestTypeRecord,
} from '@/lib/clinic-test-catalog';
import {
  isCatalogPickerSelected,
  toggleCatalogPickerSelection,
  type CatalogOrderPickerSelection,
} from '@/lib/patient-chart-catalog-order';
import { unwrapPatientChartList } from '@/lib/patient-chart';

export interface ClinicCatalogOrderPickerProps {
  businessId: string;
  selections: CatalogOrderPickerSelection[];
  onSelectionsChange: (selections: CatalogOrderPickerSelection[]) => void;
}

function unwrapList<T>(payload: unknown): T[] {
  return unwrapPatientChartList<T>(payload);
}

export function ClinicCatalogOrderPicker({
  businessId,
  selections,
  onSelectionsChange,
}: ClinicCatalogOrderPickerProps) {
  const { t } = useI18n();

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
  const catalogLoading = typesLoading || panelsLoading;

  if (catalogLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (activeTestTypes.length === 0 && activeTestPanels.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {t('clinic.labState.ordersTab.noCatalogItems')}
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {activeTestTypes.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('clinic.labState.ordersTab.catalogTestsLabel')}
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto rounded border border-gray-700/60 p-2">
            {activeTestTypes.map((testType) => {
              const checked = isCatalogPickerSelected(selections, 'test_type', testType.id);
              return (
                <li key={testType.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onSelectionsChange(
                          toggleCatalogPickerSelection(selections, {
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
            {t('clinic.labState.ordersTab.catalogPanelsLabel')}
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto rounded border border-gray-700/60 p-2">
            {activeTestPanels.map((panel) => {
              const checked = isCatalogPickerSelected(selections, 'test_panel', panel.id);
              return (
                <li key={panel.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onSelectionsChange(
                          toggleCatalogPickerSelection(selections, {
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
  );
}
