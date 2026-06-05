'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Pencil, Phone, Plus, Smartphone, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeFormModal } from '@/components/employees/employee-form-modal';
import TeamMembersCard, {
  ASSIGNABLE_ROLES,
  roleLabel,
  type TeamMember,
  type TeamMemberRole,
} from '@/components/employees/team-members-card';
import {
  employeeAvatarUrl,
  employeeTitle,
  formToPayload,
  type EmployeeRecord,
} from '@/lib/employee-types';
import { useI18n } from '@/i18n';
import { getErrorMessage } from '@/lib/error-message';
import { PageHelpHeader } from '@/components/help/contextual-help';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AiSuggestionsStack } from '@/components/ai-suggestion-collapsible';
import { DashboardPageShell } from '@/components/dashboard/dashboard-page-shell';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { usePlanEntitlements } from '@/lib/use-plan-entitlements';
import { isPlanLimitError, planLimitMessage } from '@/lib/plan-entitlements';

export default function EmployeesPage() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
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
  const [appAccessRoles, setAppAccessRoles] = useState<Record<string, TeamMemberRole>>({});
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return (data.data || data || []) as EmployeeRecord[];
    },
    enabled: !!business?.id,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/team-members`);
      return (data.data || data || []) as TeamMember[];
    },
    enabled: !!business?.id,
  });

  const teamMemberByEmployeeId = useMemo(() => {
    const map = new Map<string, TeamMember>();
    for (const member of teamMembers) {
      if (member.employeeId) map.set(member.employeeId, member);
    }
    return map;
  }, [teamMembers]);

  const { data: entitlements } = usePlanEntitlements(business?.id);

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
      queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
      closeModal();
    },
    onError: (err: unknown) => {
      if (isPlanLimitError(err)) {
        setFormError(planLimitMessage(err));
        return;
      }
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('employees.errorsSaveFailed'),
      );
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
    onError: (err: unknown) => {
      setFormError(getErrorMessage(err, t('employees.errorsSaveFailed')));
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
    onError: (err: unknown) => {
      setInviteError(getErrorMessage(err, t('employees.errorsInviteFailed')));
    },
  });

  const sendAppAccessMutation = useMutation({
    mutationFn: async ({
      employeeId,
      role,
    }: {
      employeeId: string;
      role: TeamMemberRole;
    }) => {
      const { data } = await api.post(
        `/businesses/${business!.id}/employees/${employeeId}/send-app-access`,
        isOwner ? { role } : {},
      );
      return data;
    },
    onSuccess: (_data, { employeeId }) => {
      setAccessError(null);
      setAccessSentId(employeeId);
      setTimeout(() => setAccessSentId(null), 4000);
    },
    onError: (err: unknown, { employeeId }) => {
      setAccessSentId(null);
      setAccessError(`${employeeId}:${getErrorMessage(err, t('employees.errorsInviteFailed'))}`);
    },
  });

  const updateAccessRoleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      role,
    }: {
      employeeId: string;
      role: TeamMemberRole;
    }) => {
      const { data } = await api.patch(
        `/businesses/${business!.id}/employees/${employeeId}/access-role`,
        { role },
      );
      return (data.data || data) as TeamMember;
    },
    onSuccess: () => {
      setRoleUpdateError(null);
      void queryClient.invalidateQueries({ queryKey: ['team-members', business?.id] });
    },
    onError: (err: unknown) => {
      setRoleUpdateError(getErrorMessage(err, t('teamMembers.updateFailed')));
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
    <div className="flex flex-col gap-4">
      <DashboardPageShell
        ai={
          <AiSuggestionsStack>
            <AiPagePanel
              suggestions={AI_PAGE_SUGGESTIONS['/dashboard/employees']}
              context={{ route: '/dashboard/employees' }}
            />
          </AiSuggestionsStack>
        }
      >
        <PageHelpHeader
          topicId="employees"
          title={t('employees.title')}
          subtitle={t('teamMembers.subtitle')}
          actions={
            <>
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
                <Plus className="w-4 h-4" /> {t('employees.addEmployee')}
              </button>
            </>
          }
        />
      </DashboardPageShell>

      {entitlements?.atLimit.providerSeats && (
        <UpgradePrompt limit="provider_seats" className="mb-6" />
      )}

      <div className="card flex items-start gap-3 border-blue-500/20 bg-blue-600/5">
        <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-300">{t('employees.appAccessCardBody')}</p>
          <Link href="/provider/login" className="text-sm text-blue-400 hover:underline mt-1 inline-block">
            {t('employees.openProviderApp')}
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="text-center py-12 px-6 text-gray-500">{t('employees.loading')}</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">{t('employees.noEmployees')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800 px-6">
            {employees.map((emp) => {
              const avatar = employeeAvatarUrl(emp);
              const title = employeeTitle(emp);
              const linkedMember = teamMemberByEmployeeId.get(emp.id);
              const isSelf = linkedMember?.userId === user?.id;
              const canEditRole =
                isOwner &&
                emp.userId &&
                linkedMember &&
                linkedMember.role !== 'owner' &&
                !isSelf;
              const pendingAppAccessRole = appAccessRoles[emp.id] ?? 'contributor';
              const rowAccessError =
                accessError?.startsWith(`${emp.id}:`) ? accessError.slice(emp.id.length + 1) : null;
              const rowRoleError =
                roleUpdateError &&
                updateAccessRoleMutation.variables?.employeeId === emp.id
                  ? roleUpdateError
                  : null;
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
                    {canEditRole ? (
                      <select
                        className="input text-xs py-1.5 min-w-[140px]"
                        value={linkedMember.role}
                        disabled={updateAccessRoleMutation.isPending}
                        onChange={(e) =>
                          updateAccessRoleMutation.mutate({
                            employeeId: emp.id,
                            role: e.target.value as TeamMemberRole,
                          })
                        }
                        title={t('employees.accessRole')}
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role, t)}
                          </option>
                        ))}
                      </select>
                    ) : linkedMember ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/10 text-violet-300 whitespace-nowrap">
                        {roleLabel(linkedMember.role, t)}
                      </span>
                    ) : null}
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
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        {isOwner ? (
                          <select
                            className="input text-xs py-1.5 min-w-[140px]"
                            value={pendingAppAccessRole}
                            onChange={(e) =>
                              setAppAccessRoles((prev) => ({
                                ...prev,
                                [emp.id]: e.target.value as TeamMemberRole,
                              }))
                            }
                            title={t('employees.accessRole')}
                          >
                            {ASSIGNABLE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {roleLabel(role, t)}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            sendAppAccessMutation.mutate({
                              employeeId: emp.id,
                              role: pendingAppAccessRole,
                            })
                          }
                          disabled={sendAppAccessMutation.isPending}
                          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 whitespace-nowrap"
                          title={t('employees.sendAppAccess')}
                        >
                        <Smartphone className="w-3.5 h-3.5" />
                        {accessSentId === emp.id ? t('employees.appAccessSent') : t('employees.sendAppAccess')}
                      </button>
                      </div>
                    ) : !emp.userId && !emp.email ? (
                      <span className="text-xs text-gray-500 max-w-[140px] text-right sm:text-left">
                        {t('employees.appAccessNeedsEmail')}
                      </span>
                    ) : null}
                    {rowAccessError && (
                      <p className="text-xs text-red-400 max-w-[200px] text-right sm:text-left">{rowAccessError}</p>
                    )}
                    {rowRoleError && (
                      <p className="text-xs text-red-400 max-w-[200px] text-right sm:text-left">{rowRoleError}</p>
                    )}
                    <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/10 text-green-400 whitespace-nowrap hidden sm:inline">
                      {t('employees.active')}
                    </span>
                    <button
                      onClick={() => openEdit(emp)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(emp)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title={t('employees.deactivate')}
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
            <h3 className="font-semibold text-lg mb-2">{t('employees.deactivateModalTitle')}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {t('employees.deactivateModalBody').replace('{name}', deleteTarget.name)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                {deleteMutation.isPending ? t('common.deactivating') : t('employees.deactivate')}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm">
                {t('common.cancel')}
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
            <p className="text-sm text-gray-400 mb-4">{t('invite.sendInviteModalBody')}</p>
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
                    placeholder={t('employees.namePlaceholderOptional')}
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
