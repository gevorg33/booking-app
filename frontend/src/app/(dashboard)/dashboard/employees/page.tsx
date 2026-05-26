'use client';

import { useState } from 'react';
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function EmployeesPage() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/businesses/${business!.id}/employees`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '' });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-400 text-sm">Manage your team members</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">New Employee</h3>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="md:col-span-3 flex gap-2">
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
        ) : !employees || employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No employees yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {employees.map((emp: any) => (
              <div key={emp.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center">
                    <span className="text-green-400 font-medium">{emp.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      {emp.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {emp.email}
                        </span>
                      )}
                      {emp.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {emp.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-green-600/10 text-green-400' : 'bg-gray-600/10 text-gray-400'}`}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
