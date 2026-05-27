'use client';

import { useAuthStore } from '@/lib/store';
import { Calendar, Users, Briefcase, Brain, TrendingUp, Clock, UserCircle, Loader2, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import type { DashboardOverview } from '@/lib/dashboard-types';

export default function DashboardPage() {
  const { user, business } = useAuthStore();
  const { t } = useI18n();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/dashboard/overview`);
      return (res.data || res) as DashboardOverview;
    },
    enabled: !!business?.id,
  });

  const quickActions = [
    { label: t('dashboard.newBooking'), href: '/dashboard/bookings', icon: Calendar, color: 'blue' },
    { label: t('dashboard.manageSchedule'), href: '/dashboard/schedule', icon: Clock, color: 'green' },
    { label: t('dashboard.aiOperations'), href: '/dashboard/ai-ops', icon: Brain, color: 'purple' },
    { label: t('dashboard.addEmployee'), href: '/dashboard/employees', icon: Users, color: 'orange' },
  ];

  const formatStat = (value: number | undefined, suffix = '') => {
    if (isLoading || value === undefined) return '—';
    return `${value}${suffix}`;
  };

  const stats = [
    {
      label: t('dashboard.todaysBookings'),
      value: formatStat(overview?.todaysBookings),
      icon: Calendar,
      colorClass: 'text-blue-400 bg-blue-600/10',
      href: '/dashboard/bookings',
    },
    {
      label: t('dashboard.revenueThisMonth'),
      value: isLoading || overview?.revenueThisMonth === undefined
        ? '—'
        : `$${overview.revenueThisMonth.toFixed(0)}`,
      icon: DollarSign,
      colorClass: 'text-emerald-400 bg-emerald-600/10',
      href: '/dashboard/bookings',
    },
    {
      label: t('dashboard.bookingsThisMonth'),
      value: formatStat(overview?.bookingsThisMonth),
      icon: Calendar,
      colorClass: 'text-indigo-400 bg-indigo-600/10',
      href: '/dashboard/appointments',
    },
    {
      label: t('dashboard.noShowRate'),
      value: formatStat(overview?.noShowRatePercent, overview ? '%' : ''),
      icon: AlertTriangle,
      colorClass: 'text-orange-400 bg-orange-600/10',
      href: '/dashboard/customers',
    },
    {
      label: t('dashboard.utilization'),
      value: formatStat(overview?.utilizationPercent, overview ? '%' : ''),
      icon: TrendingUp,
      colorClass: 'text-orange-400 bg-orange-600/10',
      href: '/dashboard/bookings',
    },
    {
      label: t('dashboard.totalCustomers'),
      value: formatStat(overview?.totalCustomers),
      icon: UserCircle,
      colorClass: 'text-cyan-400 bg-cyan-600/10',
      href: '/dashboard/customers',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {user?.firstName
            ? t('dashboard.welcome', { name: user.firstName })
            : t('dashboard.welcomeThere')}
        </h1>
        <p className="text-gray-400 mt-1">
          {t('dashboard.overview', {
            business: business?.name || t('dashboard.yourBusiness'),
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card flex items-center gap-4 hover:border-gray-600 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.colorClass}`}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin opacity-60" />
              ) : (
                <stat.icon className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 truncate">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="card hover:border-gray-600 transition-colors text-center"
          >
            <action.icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">{action.label}</p>
          </Link>
        ))}
      </div>

      <div className="card border-blue-500/20 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{t('dashboard.aiOperator')}</h3>
            <p className="text-gray-400 text-sm mb-3">{t('dashboard.aiOperatorBody')}</p>
            <Link href="/dashboard/ai-ops" className="btn-primary text-sm">
              {t('dashboard.openAiOps')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
