'use client';

import { useState } from 'react';
import { Briefcase, Plus, Clock, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';

export default function ServicesPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', durationMinutes: 30, price: 0, bufferMinutes: 0, description: '' });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/businesses/${business!.id}/services`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setForm({ name: '', durationMinutes: 30, price: 0, bufferMinutes: 0, description: '' });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('servicesPage.title')}</h1>
          <p className="text-gray-400 text-sm">Define what you offer</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">New Service</h3>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" min={10} step={10} className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} required />
            </div>
            <div>
              <label className="label">Buffer (minutes)</label>
              <input type="number" min={0} step={5} className="input" value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: +e.target.value })} />
            </div>
            <div>
              <label className="label">Price</label>
              <input type="number" min={0} step={0.01} className="input" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : !services || services.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No services yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {services.map((svc: any) => (
              <div key={svc.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{svc.name}</p>
                  {svc.description && <p className="text-sm text-gray-500">{svc.description}</p>}
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.durationMinutes} min</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${svc.price}</span>
                    {svc.bufferMinutes > 0 && <span>{svc.bufferMinutes}m buffer</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
