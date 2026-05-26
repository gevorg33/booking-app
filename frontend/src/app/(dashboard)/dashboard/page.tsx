'use client';

import { useAuthStore } from '@/lib/store';
import { Calendar, Users, Briefcase, Brain, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, business } = useAuthStore();

  const quickActions = [
    { label: 'New Booking', href: '/dashboard/bookings', icon: Calendar, color: 'blue' },
    { label: 'Manage Schedule', href: '/dashboard/schedule', icon: Clock, color: 'green' },
    { label: 'AI Operations', href: '/dashboard/ai-ops', icon: Brain, color: 'purple' },
    { label: 'Add Employee', href: '/dashboard/employees', icon: Users, color: 'orange' },
  ];

  const stats = [
    { label: "Today's Bookings", value: '—', icon: Calendar, colorClass: 'text-blue-400 bg-blue-600/10' },
    { label: 'Active Employees', value: '—', icon: Users, colorClass: 'text-green-400 bg-green-600/10' },
    { label: 'Services', value: '—', icon: Briefcase, colorClass: 'text-purple-400 bg-purple-600/10' },
    { label: 'Utilization', value: '—', icon: TrendingUp, colorClass: 'text-orange-400 bg-orange-600/10' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || 'there'}</h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s an overview of {business?.name || 'your business'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
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
            <h3 className="font-semibold mb-1">AI Operator</h3>
            <p className="text-gray-400 text-sm mb-3">
              Express your intent and let AI handle the operations. Try commands like &quot;optimize
              tomorrow&apos;s schedule&quot; or &quot;resolve conflicts for next week&quot;.
            </p>
            <Link href="/dashboard/ai-ops" className="btn-primary text-sm">
              Open AI Operations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
