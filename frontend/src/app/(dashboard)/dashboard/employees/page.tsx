'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Pencil, Phone, Plus, Smartphone, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeFormModal } from '@/components/employees/employee-form-modal';
import TeamMembersCard from '@/components/employees/team-members-card';
import type { TeamMemberRole } from '@/components/employees/team-members-card';
import { roleLabel } from '@/components/employees/team-members-card';
import {
  employeeAvatarUrl,
  employeeTitle,
  formToPayload,
  type EmployeeRecord,
} from '@/lib/employee-types';
import { useI18n } from '@/i18n';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';

export default function EmployeesPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const isOwner = business?.membershipRole === 'owner';
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    employeeName: '',
    role: 'contributor' as TeamMemberRole,
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [accessSentId, setAccessSentId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return (data.data || data || []) as EmployeeRecord[];
    },
    enabled: !!business?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const closeModal = () => {
    setModalMode(null);
    setEditingEmployee(null);
    setFormError(null);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof formToPayload>) => {
      const { data } = await api.post(`/businesses/${business!.id}/employees`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ReturnType<typeof formToPayload>;
    }) => {
      const { data } = await api.put(`/businesses/${business!.id}/employees/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to update employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/businesses/${business!.id}/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteTarget(null);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/invitations`, {
        email: inviteForm.email.trim(),
        employeeName: inviteForm.employeeName.trim() || undefined,
        role: inviteForm.role,
      });
      return data;
    },
    onSuccess: () => {
      setInviteSuccess(true);
      setInviteForm({ email: '', employeeName: '', role: 'contributor' });
      setInviteError(null);
      void queryClient.invalidateQueries({ queryKey: ['team-members', business?.id] });
      setTimeout(() => {
        setInviteOpen(false);
        setInviteSuccess(false);
      }, 2000);
    },
    onError: (err: any) => {
      setInviteError(err?.response?.data?.message || 'Failed to send invitation');
    },
  });

  const sendAppAccessMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data } = await api.post(
        `/businesses/${business!.id}/employees/${employeeId}/send-app-access`,
      );
      return data;
    },
    onSuccess: (_data, employeeId) => {
      setAccessError(null);
      setAccessSentId(employeeId);
      setTimeout(() => setAccessSentId(null), 4000);
    },
    onError: (err: any, employeeId) => {
      setAccessSentId(null);
      setAccessError(
        `${employeeId}:${err?.response?.data?.message || 'Failed to send app access email'}`,
      );
    },
  });

  const openCreate = () => {
    setEditingEmployee(null);
    setFormError(null);
    setModalMode('create');
  };

  const openEdit = (employee: EmployeeRecord) => {
    setEditingEmployee(employee);
    setFormError(null);
    setModalMode('edit');
  };

  const handleSubmit = (payload: ReturnType<typeof formToPayload>) => {
    setFormError(null);
    if (modalMode === 'create') {
      createMutation.mutate(payload);
      return;
    }
    if (modalMode === 'edit' && editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, payload });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('employees.title')}</h1>
          <p className="text-gray-400 text-sm">Manage team profiles, titles, and photos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setInviteError(null);
              setInviteSuccess(false);
              setInviteOpen(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> {t('invite.sendInvite')}
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="card bg-blue-600/5 border-blue-500/20 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-300">
            Providers need app access before they can sign in on mobile. Add employees here, then use{' '}
            <span className="text-white">Send app access</span> to email them a password setup link.
          </p>
          <Link href="/provider/login" className="text-sm text-blue-400 hover:underline mt-1 inline-block">
            Open provider app →
          </Link>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No employees yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {employees.map((emp) => {
              const avatar = employeeAvatarUrl(emp);
              const title = employeeTitle(emp);
              const rowAccessError =
                accessError?.startsWith(`${emp.id}:`) ? accessError.slice(emp.id.length + 1) : null;
              return (
                <div key={emp.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-600/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-green-400 font-medium text-lg">
                          {emp.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{emp.name}</p>
                      {title && <p className="text-sm text-gray-300">{title}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-0.5">
                        {emp.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {emp.email}
                          </span>
                        )}
                        {emp.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {emp.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {emp.userId ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-400 whitespace-nowrap">
                        {t('employees.appAccessActive')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/10 text-amber-400 whitespace-nowrap">
                        {t('employees.appAccessMissing')}
                      </span>
                    )}
                    {!emp.userId && emp.email ? (
                      <button
                        type="button"
                        onClick={() => sendAppAccessMutation.mutate(emp.id)}
                        disabled={sendAppAccessMutation.isPending}
                        className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 whitespace-nowrap"
                        title={t('employees.sendAppAccess')}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {accessSentId === emp.id ? t('employees.appAccessSent') : t('employees.sendAppAccess')}
                      </button>
                    ) : !emp.userId && !emp.email ? (
                      <span className="text-xs text-gray-500 max-w-[140px] text-right sm:text-left">
                        {t('employees.appAccessNeedsEmail')}
                      </span>
                    ) : null}
                    {rowAccessError && (
                      <p className="text-xs text-red-400 max-w-[200px] text-right sm:text-left">{rowAccessError}</p>
                    )}
                    <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/10 text-green-400 whitespace-nowrap hidden sm:inline">
                      Active
                    </span>
                    <button
                      onClick={() => openEdit(emp)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(emp)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AiPagePanel suggestions={AI_PAGE_SUGGESTIONS['/dashboard/employees']} context={{ route: '/dashboard/employees' }} />

      <TeamMembersCard />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">Deactivate employee?</h3>
            <p className="text-sm text-gray-400 mb-4">
              {deleteTarget.name} will be hidden from scheduling and public booking. Existing
              bookings are kept.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                {deleteMutation.isPending ? 'Deactivating…' : 'Deactivate'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">{t('invite.sendInvite')}</h3>
            <p className="text-sm text-gray-400 mb-4">
              Invite someone to your dashboard. Choose their role — admins and managers can see all
              appointments in the mobile app.
            </p>
            {inviteSuccess ? (
              <p className="text-green-400 text-sm">{t('invite.inviteSent')}</p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  inviteMutation.mutate();
                }}
              >
                <div>
                  <label className="label">{t('common.email')}</label>
                  <input
                    type="email"
                    className="input"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('invite.employeeName')}</label>
                  <input
                    className="input"
                    value={inviteForm.employeeName}
                    onChange={(e) => setInviteForm({ ...inviteForm, employeeName: e.target.value })}
                    placeholder="Optional display name"
                  />
                </div>
                {isOwner ? (
                  <div>
                    <label className="label">{t('invite.accessRole')}</label>
                    <select
                      className="input"
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          role: e.target.value as TeamMemberRole,
                        })
                      }
                    >
                      {(['admin', 'manager', 'staff', 'contributor'] as TeamMemberRole[]).map(
                        (role) => (
                          <option key={role} value={role}>
                            {roleLabel(role, t)}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                ) : null}
                {inviteError && <p className="text-red-400 text-sm">{inviteError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={inviteMutation.isPending} className="btn-primary text-sm">
                    {inviteMutation.isPending ? t('common.saving') : t('invite.sendInvite')}
                  </button>
                  <button type="button" onClick={() => setInviteOpen(false)} className="btn-secondary text-sm">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {business?.id && modalMode && (
        <EmployeeFormModal
          open
          mode={modalMode}
          businessId={business.id}
          employee={editingEmployee}
          services={services}
          saving={saving}
          errorMessage={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
