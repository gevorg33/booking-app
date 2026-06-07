'use client';

import { useMemo, useState } from 'react';
import { FlaskConical, Layers, Loader2, Pencil, Plus, Trash2, Upload, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  clinicTestPanelFormToPayload,
  clinicTestPanelToForm,
  clinicTestTypeFormToPayload,
  clinicTestTypeToForm,
  defaultClinicTestPanelForm,
  defaultClinicTestTypeForm,
  type ClinicTestPanelFormState,
  type ClinicTestPanelRecord,
  type ClinicTestTypeFormState,
  type ClinicTestTypeRecord,
} from '@/lib/clinic-test-catalog';

export interface ClinicCatalogImportSummary {
  testTypesCreated: number;
  testTypesSkipped: number;
  panelsCreated: number;
  panelsSkipped: number;
  unmatchedServiceNames: string[];
  csvErrors: string[];
}

interface LinkedServiceOption {
  id: string;
  name: string;
  serviceType?: string;
}

export interface ClinicTestCatalogTabProps {
  businessId: string;
  labServices: LinkedServiceOption[];
}

function unwrapList<T>(data: unknown): T[] {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (Array.isArray(payload)) return payload as T[];
  const nested = (payload as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

export function ClinicTestCatalogTab({
  businessId,
  labServices,
}: ClinicTestCatalogTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showPanelForm, setShowPanelForm] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState<ClinicTestTypeFormState>(
    defaultClinicTestTypeForm(),
  );
  const [panelForm, setPanelForm] = useState<ClinicTestPanelFormState>(
    defaultClinicTestPanelForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [importSummary, setImportSummary] = useState<ClinicCatalogImportSummary | null>(
    null,
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

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['clinic-test-types', businessId] });
    queryClient.invalidateQueries({ queryKey: ['clinic-test-panels', businessId] });
  };

  const createTypeMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof clinicTestTypeFormToPayload>) => {
      await api.post(
        `/businesses/${businessId}/clinic-test-results/catalog/test-types`,
        payload,
      );
    },
    onSuccess: () => {
      invalidateCatalog();
      setShowTypeForm(false);
      setTypeForm(defaultClinicTestTypeForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ReturnType<typeof clinicTestTypeFormToPayload>;
    }) => {
      await api.put(
        `/businesses/${businessId}/clinic-test-results/catalog/test-types/${id}`,
        payload,
      );
    },
    onSuccess: () => {
      invalidateCatalog();
      setEditingTypeId(null);
      setTypeForm(defaultClinicTestTypeForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const deactivateTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(
        `/businesses/${businessId}/clinic-test-results/catalog/test-types/${id}`,
      );
    },
    onSuccess: invalidateCatalog,
  });

  const seedPlaybookMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/catalog/seed-playbook`,
      );
      return ((data as { data?: ClinicCatalogImportSummary })?.data ??
        data) as ClinicCatalogImportSummary;
    },
    onSuccess: (summary) => {
      invalidateCatalog();
      setImportSummary(summary);
      setFormError(null);
      toast.success(t('clinicTestCatalog.seedSuccess'));
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/catalog/import-csv`,
        { csv: csvText },
      );
      return ((data as { data?: ClinicCatalogImportSummary })?.data ??
        data) as ClinicCatalogImportSummary;
    },
    onSuccess: (summary) => {
      invalidateCatalog();
      setImportSummary(summary);
      setCsvText('');
      setFormError(null);
      toast.success(t('clinicTestCatalog.importSuccess'));
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const createPanelMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof clinicTestPanelFormToPayload>) => {
      const { data } = await api.post(
        `/businesses/${businessId}/clinic-test-results/catalog/test-panels`,
        payload,
      );
      const created = (data.data ?? data) as ClinicTestPanelRecord;
      if (panelForm.testTypeIds.length > 0) {
        await api.put(
          `/businesses/${businessId}/clinic-test-results/catalog/test-panels/${created.id}/items`,
          {
            items: panelForm.testTypeIds.map((testTypeId, index) => ({
              testTypeId,
              sortOrder: index,
            })),
          },
        );
      }
    },
    onSuccess: () => {
      invalidateCatalog();
      setShowPanelForm(false);
      setPanelForm(defaultClinicTestPanelForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const updatePanelMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ReturnType<typeof clinicTestPanelFormToPayload>;
    }) => {
      await api.put(
        `/businesses/${businessId}/clinic-test-results/catalog/test-panels/${id}`,
        payload,
      );
      await api.put(
        `/businesses/${businessId}/clinic-test-results/catalog/test-panels/${id}/items`,
        {
          items: panelForm.testTypeIds.map((testTypeId, index) => ({
            testTypeId,
            sortOrder: index,
          })),
        },
      );
    },
    onSuccess: () => {
      invalidateCatalog();
      setEditingPanelId(null);
      setPanelForm(defaultClinicTestPanelForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('errors.saveFailed'),
      );
    },
  });

  const activeTypes = useMemo(
    () => testTypes.filter((type) => type.isActive),
    [testTypes],
  );

  const startEditType = (record: ClinicTestTypeRecord) => {
    setEditingTypeId(record.id);
    setShowTypeForm(false);
    setTypeForm(clinicTestTypeToForm(record));
    setFormError(null);
  };

  const startEditPanel = (record: ClinicTestPanelRecord) => {
    setEditingPanelId(record.id);
    setShowPanelForm(false);
    setPanelForm(clinicTestPanelToForm(record));
    setFormError(null);
  };

  const renderTypeForm = (mode: 'create' | 'edit', typeId?: string) => (
    <form
      className="card grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = clinicTestTypeFormToPayload(typeForm);
        if (mode === 'create') createTypeMutation.mutate(payload);
        else if (typeId) updateTypeMutation.mutate({ id: typeId, payload });
      }}
    >
      <div>
        <label className="label">{t('clinicTestCatalog.typeTitle')}</label>
        <input
          className="input"
          value={typeForm.title}
          onChange={(e) => setTypeForm({ ...typeForm, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('clinicTestCatalog.typeCode')}</label>
        <input
          className="input"
          value={typeForm.code}
          onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
          placeholder={t('clinicTestCatalog.optionalCodeHint')}
        />
      </div>
      <div>
        <label className="label">{t('clinicTestCatalog.linkedService')}</label>
        <select
          className="input"
          value={typeForm.serviceId}
          onChange={(e) => setTypeForm({ ...typeForm, serviceId: e.target.value })}
        >
          <option value="">{t('clinicTestCatalog.noLinkedService')}</option>
          {labServices.map((svc) => (
            <option key={svc.id} value={svc.id}>
              {svc.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t('common.price')}</label>
        <input
          className="input"
          inputMode="decimal"
          value={typeForm.price}
          onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={typeForm.requiresFasting}
            onChange={(e) =>
              setTypeForm({ ...typeForm, requiresFasting: e.target.checked })
            }
          />
          {t('clinicTestCatalog.requiresFasting')}
        </label>
      </div>
      <div className="md:col-span-2">
        <label className="label">{t('clinicTestCatalog.preparationNotes')}</label>
        <textarea
          className="input min-h-[80px]"
          value={typeForm.preparationNotes}
          onChange={(e) =>
            setTypeForm({ ...typeForm, preparationNotes: e.target.value })
          }
        />
      </div>
      {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
      <div className="md:col-span-2 flex gap-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
        >
          {mode === 'create' ? t('common.create') : t('common.saveChanges')}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowTypeForm(false);
            setEditingTypeId(null);
            setTypeForm(defaultClinicTestTypeForm());
            setFormError(null);
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );

  const renderPanelForm = (mode: 'create' | 'edit', panelId?: string) => (
    <form
      className="card grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = clinicTestPanelFormToPayload(panelForm);
        if (mode === 'create') createPanelMutation.mutate(payload);
        else if (panelId) updatePanelMutation.mutate({ id: panelId, payload });
      }}
    >
      <div>
        <label className="label">{t('clinicTestCatalog.panelTitle')}</label>
        <input
          className="input"
          value={panelForm.title}
          onChange={(e) => setPanelForm({ ...panelForm, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('clinicTestCatalog.panelCode')}</label>
        <input
          className="input"
          value={panelForm.code}
          onChange={(e) => setPanelForm({ ...panelForm, code: e.target.value })}
        />
      </div>
      <div>
        <label className="label">{t('common.price')}</label>
        <input
          className="input"
          inputMode="decimal"
          value={panelForm.price}
          onChange={(e) => setPanelForm({ ...panelForm, price: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">{t('clinicTestCatalog.panelItems')}</label>
        <div className="grid gap-2 md:grid-cols-2">
          {activeTypes.map((type) => {
            const checked = panelForm.testTypeIds.includes(type.id);
            return (
              <label
                key={type.id}
                className="flex items-center gap-2 rounded-lg border border-gray-700/70 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setPanelForm({
                      ...panelForm,
                      testTypeIds: e.target.checked
                        ? [...panelForm.testTypeIds, type.id]
                        : panelForm.testTypeIds.filter((id) => id !== type.id),
                    });
                  }}
                />
                <span>{type.title}</span>
              </label>
            );
          })}
        </div>
      </div>
      {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
      <div className="md:col-span-2 flex gap-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={createPanelMutation.isPending || updatePanelMutation.isPending}
        >
          {mode === 'create' ? t('common.create') : t('common.saveChanges')}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowPanelForm(false);
            setEditingPanelId(null);
            setPanelForm(defaultClinicTestPanelForm());
            setFormError(null);
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-10">
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('clinicTestCatalog.importTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('clinicTestCatalog.importSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={seedPlaybookMutation.isPending}
            onClick={() => seedPlaybookMutation.mutate()}
          >
            <Wand2 className="w-4 h-4" />
            {seedPlaybookMutation.isPending
              ? t('common.loading')
              : t('clinicTestCatalog.seedPlaybook')}
          </button>
        </div>
        <div>
          <label className="label">{t('clinicTestCatalog.csvLabel')}</label>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={t('clinicTestCatalog.csvPlaceholder')}
          />
          <p className="text-xs text-gray-500 mt-2">{t('clinicTestCatalog.csvHint')}</p>
        </div>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          disabled={importCsvMutation.isPending || !csvText.trim()}
          onClick={() => importCsvMutation.mutate()}
        >
          <Upload className="w-4 h-4" />
          {importCsvMutation.isPending
            ? t('common.loading')
            : t('clinicTestCatalog.importCsv')}
        </button>
        {importSummary && (
          <div className="rounded-lg border border-gray-700/70 bg-gray-900/40 p-3 text-sm text-gray-300 space-y-1">
            <p>{t('clinicTestCatalog.importSummaryTypes', {
              created: importSummary.testTypesCreated,
              skipped: importSummary.testTypesSkipped,
            })}</p>
            <p>{t('clinicTestCatalog.importSummaryPanels', {
              created: importSummary.panelsCreated,
              skipped: importSummary.panelsSkipped,
            })}</p>
            {importSummary.unmatchedServiceNames.length > 0 && (
              <p className="text-amber-400/90">
                {t('clinicTestCatalog.importUnmatchedServices', {
                  names: importSummary.unmatchedServiceNames.join(', '),
                })}
              </p>
            )}
            {importSummary.csvErrors.length > 0 && (
              <p className="text-red-400/90">
                {t('clinicTestCatalog.importCsvErrors', {
                  errors: importSummary.csvErrors.join('; '),
                })}
              </p>
            )}
          </div>
        )}
        {formError && <p className="text-sm text-red-500">{formError}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              {t('clinicTestCatalog.typesTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('clinicTestCatalog.typesSubtitle')}</p>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => {
              setShowTypeForm(true);
              setEditingTypeId(null);
              setTypeForm(defaultClinicTestTypeForm());
            }}
          >
            <Plus className="w-4 h-4" />
            {t('clinicTestCatalog.addType')}
          </button>
        </div>

        {showTypeForm && renderTypeForm('create')}
        {editingTypeId && renderTypeForm('edit', editingTypeId)}

        {typesLoading ? (
          <div className="card text-center py-10 text-gray-500 inline-flex items-center gap-2 justify-center w-full">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : activeTypes.length === 0 ? (
          <div className="card text-sm text-gray-500">{t('clinicTestCatalog.noTypes')}</div>
        ) : (
          <div className="grid gap-3">
            {activeTypes.map((type) => (
              <div key={type.id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">{type.title}</p>
                  <p className="text-sm text-gray-500">
                    {type.code}
                    {type.department ? ` · ${type.department}` : ''}
                    {type.requiresFasting ? ` · ${t('clinicTestCatalog.fastingBadge')}` : ''}
                  </p>
                  {type.preparationNotes && (
                    <p className="text-sm text-gray-400 mt-1">{type.preparationNotes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => startEditType(type)}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-red-400"
                    onClick={() => deactivateTypeMutation.mutate(type.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {t('clinicTestCatalog.panelsTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('clinicTestCatalog.panelsSubtitle')}</p>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => {
              setShowPanelForm(true);
              setEditingPanelId(null);
              setPanelForm(defaultClinicTestPanelForm());
            }}
          >
            <Plus className="w-4 h-4" />
            {t('clinicTestCatalog.addPanel')}
          </button>
        </div>

        {showPanelForm && renderPanelForm('create')}
        {editingPanelId && renderPanelForm('edit', editingPanelId)}

        {panelsLoading ? (
          <div className="card text-center py-10 text-gray-500 inline-flex items-center gap-2 justify-center w-full">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : testPanels.filter((panel) => panel.isActive).length === 0 ? (
          <div className="card text-sm text-gray-500">{t('clinicTestCatalog.noPanels')}</div>
        ) : (
          <div className="grid gap-3">
            {testPanels
              .filter((panel) => panel.isActive)
              .map((panel) => (
                <div key={panel.id} className="card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-medium">{panel.title}</p>
                      <p className="text-sm text-gray-500">{panel.code}</p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => startEditPanel(panel)}>
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  {panel.items.length > 0 && (
                    <ul className="mt-3 text-sm text-gray-400 list-disc pl-5">
                      {panel.items.map((item) => (
                        <li key={item.id}>{item.testType?.title ?? item.testTypeId}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
