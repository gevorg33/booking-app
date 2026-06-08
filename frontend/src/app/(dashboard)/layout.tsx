'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Zap,
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Brain,
  CreditCard,
  LogOut,
  ClipboardList,
  Store,
  UserCircle,
  Settings,
  BarChart3,
  Wallet,
  Warehouse,
  Star,
  Smartphone,
  BookOpen,
  Plug,
  FlaskConical,
  TestTube2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { isClinicVerticalBusinessType } from '@/lib/clinic-service';
import { AiCommandBar } from '@/components/ai-command-bar';
import { AiNotificationCenter } from '@/components/ai-notification-center';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BusinessSwitcher } from '@/components/business-switcher';
import { DashboardZendeskWidget } from '@/components/integrations/dashboard-zendesk-widget';
import { SupportTicketButton } from '@/components/integrations/support-ticket-button';
import { ResizableDashboardSidebar } from '@/components/dashboard/resizable-dashboard-sidebar';
import { BusinessDateFormatBootstrap } from '@/components/business-date-format-bootstrap';
import { useI18n } from '@/i18n';
import { useHipaaSessionTimeout } from '@/lib/use-hipaa-session-timeout';
import { HipaaSessionNotice } from '@/components/hipaa-session-notice';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { business, logout, token, user } = useAuthStore();
  const { t, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const isOnboardingRoute = pathname === '/dashboard/onboarding';
  useHipaaSessionTimeout();

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/onboarding/status`);
      return ((data as { data?: { completed: boolean } })?.data ?? data) as { completed: boolean };
    },
    enabled: !!business?.id && !!token && mounted,
  });

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}`);
      return ((data as { data?: Record<string, unknown> })?.data ?? data) as Record<
        string,
        unknown
      >;
    },
    enabled: !!business?.id && !!token && mounted,
  });

  const businessType =
    ((businessProfile?.settings as { businessType?: string } | undefined)?.businessType ??
      (businessProfile?.businessType as string | undefined)) ??
    undefined;
  const showLabQueueNav = isClinicVerticalBusinessType(businessType);

  const navItems = useMemo(
    () => {
      const items = [
      { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/bookings', label: t('nav.bookings'), icon: Calendar },
      { href: '/dashboard/schedule', label: t('nav.schedule'), icon: Clock },
      { href: '/dashboard/appointments', label: t('nav.appointments'), icon: ClipboardList },
      { href: '/dashboard/services', label: t('nav.services'), icon: Briefcase },
      ...(showLabQueueNav
        ? [
            { href: '/dashboard/lab-queue', label: t('nav.labQueue'), icon: FlaskConical },
            {
              href: '/dashboard/lab-specimens/collection',
              label: t('nav.labSpecimens'),
              icon: TestTube2,
            },
          ]
        : []),
      { href: '/dashboard/employees', label: t('nav.employees'), icon: Users },
      { href: '/dashboard/customers', label: t('nav.customers'), icon: UserCircle },
      { href: '/dashboard/reviews', label: t('nav.reviews'), icon: Star },
      { href: '/dashboard/monetization', label: t('nav.monetization'), icon: Wallet },
      { href: '/dashboard/reports', label: t('nav.reports'), icon: BarChart3 },
      { href: '/dashboard/operations', label: t('nav.operations'), icon: Warehouse },
      { href: '/dashboard/business', label: t('nav.businessProfile'), icon: Store },
      { href: '/dashboard/integrations', label: t('nav.crmIntegrations'), icon: Plug },
      { href: '/dashboard/billing', label: t('nav.billing'), icon: CreditCard },
      { href: '/dashboard/ai-ops', label: t('nav.aiOps'), icon: Brain },
      { href: '/dashboard/adoption', label: t('nav.adoption'), icon: Smartphone },
      { href: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
      { href: '/dashboard/guide', label: t('nav.guide'), icon: BookOpen },
    ];
      return items;
    },
    [t, showLabQueueNav],
  );

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (mounted && !token) router.push('/login');
  }, [mounted, token, router]);

  useEffect(() => {
    if (user?.locale) setLocale(user.locale);
  }, [user?.locale, setLocale]);

  useEffect(() => {
    if (!onboardingStatus || isOnboardingRoute) return;
    if (!onboardingStatus.completed) router.push('/dashboard/onboarding');
  }, [onboardingStatus, isOnboardingRoute, router]);

  if (!mounted || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isOnboardingRoute) {
    return (
      <div className="dashboard-app min-h-screen bg-gray-50 dark:bg-gray-950">
        <BusinessDateFormatBootstrap business={business} />
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-app min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <BusinessDateFormatBootstrap business={business} />
      <ResizableDashboardSidebar>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">OptiSchedule</span>
            </div>
            {business && <BusinessSwitcher />}
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 space-y-3 border-t border-gray-200 p-3 dark:border-gray-800">
            <SupportTicketButton />
            <LanguageSwitcher />
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </ResizableDashboardSidebar>

      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <HipaaSessionNotice />
        <div className="shrink-0 flex justify-end px-6 pt-4">
          <AiNotificationCenter />
        </div>
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 pb-6">{children}</div>
      </main>

      <AiCommandBar />
      <DashboardZendeskWidget />
    </div>
  );
}
