'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

export type TeamMemberRole = 'owner' | 'admin' | 'manager' | 'staff' | 'contributor';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: TeamMemberRole;
  employeeId: string | null;
  employeeName: string | null;
}

const ASSIGNABLE_ROLES: TeamMemberRole[] = ['admin', 'manager', 'staff', 'contributor'];

export function roleLabel(role: TeamMemberRole, t: (key: string) => string): string {
  const key = `teamMembers.roles.${role}`;
  const translated = t(key);
  return translated === key ? role : translated;
}

export default function TeamMembersCard() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwner = business?.membershipRole === 'owner';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/team-members`);
      return (data.data || data || []) as TeamMember[];
    },
    enabled: !!business?.id,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: TeamMemberRole }) => {
      const { data } = await api.patch(
        `/businesses/${business!.id}/team-members/${memberId}/role`,
        { role },
      );
      return (data.data || data) as TeamMember;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-members', business?.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="card mt-6">
        <p className="text-gray-500 text-sm text-center py-8">{t('common.loading')}</p>
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <div className="card mt-6">
      <div className="flex items-start gap-3 mb-4">
        <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-lg">{t('teamMembers.title')}</h2>
          <p className="text-sm text-gray-400">{t('teamMembers.subtitle')}</p>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {members.map((member) => {
          const isSelf = member.userId === user?.id;
          const canEdit = isOwner && member.role !== 'owner' && !isSelf;
          const updateError =
            updateRoleMutation.isError &&
            updateRoleMutation.variables?.memberId === member.id
              ? (updateRoleMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message || t('teamMembers.updateFailed')
              : null;

          return (
            <div key={member.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {member.name}
                  {isSelf && (
                    <span className="text-xs text-gray-500 ml-2">({t('teamMembers.you')})</span>
                  )}
                </p>
                <p className="text-sm text-gray-400">{member.email}</p>
                {member.employeeName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('teamMembers.linkedEmployee')}: {member.employeeName}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                {canEdit ? (
                  <select
                    className="input text-sm py-1.5 min-w-[160px]"
                    value={member.role}
                    disabled={updateRoleMutation.isPending}
                    onChange={(e) =>
                      updateRoleMutation.mutate({
                        memberId: member.id,
                        role: e.target.value as TeamMemberRole,
                      })
                    }
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role, t)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 whitespace-nowrap">
                    {roleLabel(member.role, t)}
                  </span>
                )}
                {updateError && <p className="text-xs text-red-400">{updateError}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {!isOwner && (
        <p className="text-xs text-gray-500 mt-4">{t('teamMembers.ownerOnlyHint')}</p>
      )}
    </div>
  );
}
