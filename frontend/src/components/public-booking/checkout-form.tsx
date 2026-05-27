'use client';

import { useState } from 'react';
import { Calendar, Pencil, Loader2 } from 'lucide-react';
import { formatScheduleTime, formatDateDisplay } from '@/lib/date-format';
import { createPublicBooking, formatPrice, type PublicBusinessProfile, type PublicService } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';

interface CheckoutFormProps {
  tenant: PublicBusinessProfile;
  employee: { id: string; name: string; role?: string };
  service: PublicService;
  startTime: string;
}

export function CheckoutForm({ tenant, employee, service, startTime }: CheckoutFormProps) {
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const start = new Date(startTime);
  const totalMin = service.durationMinutes + service.bufferMinutes;
  const end = new Date(start.getTime() + totalMin * 60000);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Email or phone number is required');
      return;
    }
    if (!form.consent) {
      setError('Please accept the privacy policy to continue');
      return;
    }

    setSubmitting(true);
    try {
      await createPublicBooking(tenant.slug, {
        employeeId: employee.id,
        serviceId: service.id,
        startTime,
        notes: form.notes || undefined,
        customer: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Appointment booked</h2>
        <p className="text-gray-500 mt-2 text-sm">
          {formatDateDisplay(start)} · {formatScheduleTime(start)} – {formatScheduleTime(end)}
        </p>
        <a
          href={bookPath(tenant.slug)}
          className="inline-block mt-8 px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: primary }}
        >
          Book another appointment
        </a>
      </div>
    );
  }

  const servicesHref = `${bookPath(tenant.slug, '/services')}?employeeId=${encodeURIComponent(employee.id)}&startTime=${encodeURIComponent(startTime)}`;
  const professionalsHref = bookPath(tenant.slug, '/professionals');

  return (
    <form onSubmit={handleSubmit} className="pb-36">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking details</h1>

      <section className="border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold shrink-0"
              style={{ backgroundColor: primary }}
            >
              {employee.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{employee.name}</p>
              {employee.role && <p className="text-sm text-gray-500">{employee.role}</p>}
            </div>
          </div>
          <a href={professionalsHref} className="text-gray-400 hover:text-gray-600">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                {start.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: tenant.timezone || 'UTC',
                })}
              </p>
              <p className="text-sm text-gray-500">{formatScheduleTime(start)}</p>
            </div>
          </div>
          <a href={professionalsHref} className="text-gray-400 hover:text-gray-600">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="text-sm text-gray-500 mt-1">{formatPrice(service.price, service.currency)}</p>
          </div>
          <a href={servicesHref} className="text-gray-400 hover:text-gray-600 mt-1">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-semibold text-gray-900">{formatPrice(service.price, service.currency)}</span>
        </div>
      </section>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder="Enter name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder="Enter your phone number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 min-h-[80px]"
            placeholder="Comment"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-1 rounded border-gray-300"
          />
          <span>
            I agree to the processing of my personal data and confirm that I have read and accepted the Privacy Policy and User Agreement.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{formatPrice(service.price, service.currency)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Book appointment
          </button>
        </div>
      </div>
    </form>
  );
}
