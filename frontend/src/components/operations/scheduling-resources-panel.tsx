'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, DoorOpen } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface SchedulingResource {
  id: string;
  name: string;
  resourceType: string;
  locationId: string | null;
}

interface SchedulingResourcesPanelProps {
  businessId: string;
}

export function SchedulingResourcesPanel({ businessId }: SchedulingResourcesPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', resourceType: 'room' });
  const [reqServiceId, setReqServiceId] = useState('');
  const [reqResourceIds, setReqResourceIds] = useState<string[]>([]);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['scheduling-resources', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/resources`);
      return unwrap<SchedulingResource[]>(data);
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<Array<{ id: string; name: string }>>(data);
    },
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['service-resource-requirements', businessId, reqServiceId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/resources/services/${reqServiceId}/requirements`,
      );
      return unwrap<Array<{ resourceId: string; resource?: { name: string } }>>(data);
    },
    enabled: !!reqServiceId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/resources`, form);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-resources', businessId] });
      setForm({ name: '', resourceType: 'room' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      await api.delete(`/businesses/${businessId}/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-resources', businessId] });
    },
  });

  const saveRequirementsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(
        `/businesses/${businessId}/resources/services/${reqServiceId}/requirements`,
        { resourceIds: reqResourceIds },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['service-resource-requirements', businessId, reqServiceId],
      });
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="card flex flex-wrap gap-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">{t('operations.resourceName')}</label>
          <input
            className="input min-w-[200px]"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Room A"
            required
          />
        </div>
        <div>
          <label className="label">{t('operations.resourceType')}</label>
          <select
            className="input"
            value={form.resourceType}
            onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
          >
            <option value="room">{t('operations.resourceTypeRoom')}</option>
            <option value="chair">{t('operations.resourceTypeChair')}</option>
            <option value="equipment">{t('operations.resourceTypeEquipment')}</option>
          </select>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('operations.addResource')}
        </button>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : resources.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">{t('operations.noResources')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('operations.resourceName')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('operations.resourceType')}</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-amber-400" />
                    {resource.name}
                  </td>
                  <td className="px-4 py-3 capitalize">{resource.resourceType}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deactivateMutation.mutate(resource.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label="Remove resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-200">{t('operations.serviceResourceRequirements')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('operations.service')}</label>
            <select
              className="input"
              value={reqServiceId}
              onChange={(e) => {
                setReqServiceId(e.target.value);
                setReqResourceIds([]);
              }}
            >
              <option value="">{t('operations.selectService')}</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>
          {reqServiceId && (
            <div>
              <label className="label">{t('operations.requiredResources')}</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-800 rounded-lg p-3">
                {resources.map((resource) => (
                  <label key={resource.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={reqResourceIds.includes(resource.id)}
                      onChange={(e) => {
                        setReqResourceIds((current) =>
                          e.target.checked
                            ? [...current, resource.id]
                            : current.filter((id) => id !== resource.id),
                        );
                      }}
                    />
                    {resource.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        {reqServiceId && requirements.length > 0 && reqResourceIds.length === 0 && (
          <p className="text-xs text-gray-500">
            {t('operations.currentRequirements')}:{' '}
            {requirements.map((r) => r.resource?.name ?? r.resourceId).join(', ')}
          </p>
        )}
        {reqServiceId && (
          <button
            type="button"
            disabled={saveRequirementsMutation.isPending}
            onClick={() => saveRequirementsMutation.mutate()}
            className="btn-primary text-sm"
          >
            {t('common.save')}
          </button>
        )}
      </div>
    </div>
  );
}
