'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Download, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';

interface StaffRow {
  employeeId: string;
  employeeName: string;
  bookings: number;
  completed: number;
  noShows: number;
  revenue: number;
  hoursBooked: number;
  utilizationPercent: number;
}

interface ServiceRow {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function unwrap<T>(res: unknown): T {
  const data = (res as { data?: T })?.data ?? res;
  return data as T;
}

export default function ReportsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [range, setRange] = useState(defaultDateRange);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const params = useMemo(() => ({ from: range.from, to: range.to }), [range]);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['analytics-staff', business?.id, params],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/analytics/staff`, { params });
      return unwrap<StaffRow[]>(data);
    },
    enabled: !!business?.id,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['analytics-services', business?.id, params],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/analytics/services`, { params });
      return unwrap<ServiceRow[]>(data);
    },
    enabled: !!business?.id,
  });

  const { data: heatmap = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ['analytics-heatmap', business?.id, params],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/analytics/heatmap`, { params });
      return unwrap<HeatmapCell[]>(data);
    },
    enabled: !!business?.id,
  });

  const maxHeat = useMemo(
    () => Math.max(1, ...heatmap.map((c) => c.count)),
    [heatmap],
  );

  const heatGrid = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of heatmap) map.set(`${cell.dayOfWeek}-${cell.hour}`, cell.count);
    return map;
  }, [heatmap]);

  const handleExport = async (type: 'csv' | 'pdf') => {
    if (!business?.id) return;
    setExporting(type);
    try {
      const endpoint = type === 'csv' ? 'export.csv' : 'export.pdf';
      const response = await api.get(`/businesses/${business.id}/analytics/${endpoint}`, {
        params,
        responseType: type === 'csv' ? 'blob' : 'text',
      });
      if (type === 'csv') {
        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report.csv';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const html = response.data as string;
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      }
    } finally {
      setExporting(null);
    }
  };

  const loading = staffLoading || servicesLoading || heatmapLoading;

  return (
    <div>
      <AiPagePanel
        suggestions={AI_PAGE_SUGGESTIONS['/dashboard/reports']}
        context={{
          route: '/dashboard/reports',
          dateFrom: range.from.replace(/-/g, '_'),
          dateTo: range.to.replace(/-/g, '_'),
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            {t('reports.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            {exporting === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('reports.exportCsv')}
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {t('reports.exportPdf')}
          </button>
        </div>
      </div>

      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">{t('reports.dateFrom')}</label>
          <input
            type="date"
            className="input max-w-[180px]"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">{t('reports.dateTo')}</label>
          <input
            type="date"
            className="input max-w-[180px]"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
      </div>

      {loading ? (
        <div className="card flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="card overflow-hidden p-0">
            <h2 className="font-semibold px-6 pt-6 pb-3">{t('reports.staffPerformance')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">{t('common.name')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Bookings</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Completed</th>
                    <th className="px-4 py-3 font-medium text-gray-400">No-shows</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Revenue</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Hours</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    staff.map((row) => (
                      <tr key={row.employeeId} className="border-b border-gray-800/80">
                        <td className="px-4 py-3 font-medium">{row.employeeName}</td>
                        <td className="px-4 py-3">{row.bookings}</td>
                        <td className="px-4 py-3">{row.completed}</td>
                        <td className="px-4 py-3 text-orange-400">{row.noShows}</td>
                        <td className="px-4 py-3">${row.revenue.toFixed(2)}</td>
                        <td className="px-4 py-3">{row.hoursBooked}h</td>
                        <td className="px-4 py-3">{row.utilizationPercent}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card overflow-hidden p-0">
            <h2 className="font-semibold px-6 pt-6 pb-3">{t('reports.servicePopularity')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">{t('bookings.service')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Bookings</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No data for this period
                      </td>
                    </tr>
                  ) : (
                    services.map((row) => (
                      <tr key={row.serviceId} className="border-b border-gray-800/80">
                        <td className="px-4 py-3 font-medium">{row.serviceName}</td>
                        <td className="px-4 py-3">{row.bookings}</td>
                        <td className="px-4 py-3">${row.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 className="font-semibold mb-4">{t('reports.peakHours')}</h2>
            <div className="overflow-x-auto">
              <div
                className="inline-grid gap-0.5 min-w-[640px]"
                style={{ gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' }}
              >
                <div />
                {DAY_LABELS.map((day) => (
                  <div key={day} className="text-xs text-center text-gray-500 pb-1">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={`row-${hour}`} className="contents">
                    <div className="text-[10px] text-gray-500 pr-2 text-right leading-5">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {DAY_LABELS.map((_, day) => {
                      const count = heatGrid.get(`${day}-${hour}`) ?? 0;
                      const intensity = count / maxHeat;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          title={`${DAY_LABELS[day]} ${hour}:00 — ${count} bookings`}
                          className="h-5 rounded-sm border border-gray-800/50"
                          style={{
                            backgroundColor:
                              count === 0
                                ? 'rgb(17 24 39 / 0.4)'
                                : `rgba(37, 99, 235, ${0.15 + intensity * 0.85})`,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
