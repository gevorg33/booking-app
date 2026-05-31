'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { PhoneInput } from '@/components/public-booking/phone-input';
import {
  bookPublicMultiService,
  confirmPublicBookingPayment,
  createPublicMultiServiceCheckout,
  formatPrice,
  quotePublicMultiService,
  type PublicBusinessProfile,
  type PublicCheckoutQuote,
  type PublicService,
} from '@/lib/public-api';
import { defaultCountryFromCallingCode, formatPhoneForApi, isValidPhone } from '@/lib/phone-format';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { sumMultiServicePrice } from '@/lib/multi-service-booking';

interface MultiServiceCheckoutClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
  paymentSessionId?: string;
}

export function MultiServiceCheckoutClient({
  slug,
  tenant,
  services,
  backHref,
  paymentSessionId,
}: MultiServiceCheckoutClientProps) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);

  const serviceIds = useMemo(() => {
    const raw = searchParams.get('services');
    if (!raw) return services.map((svc) => svc.id);
    return raw.split(',').filter(Boolean);
  }, [searchParams, services]);

  const selectedServices = useMemo(
    () => services.filter((svc) => serviceIds.includes(svc.id)),
    [serviceIds, services],
  );

  const blockStartTime = searchParams.get('startTime') ?? undefined;
  const employeeId = searchParams.get('employeeId') ?? undefined;
  const linesRaw = searchParams.get('lines');

  const lines = useMemo(() => {
    if (!linesRaw) return undefined;
    try {
      return JSON.parse(linesRaw) as Array<{ serviceId: string; employeeId: string; startTime: string }>;
    } catch {
      return undefined;
    }
  }, [linesRaw]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: undefined as string | undefined,
    notes: '',
    consent: false,
  });
  const [promoCode, setPromoCode] = useState('');
  const [quote, setQuote] = useState<PublicCheckoutQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalPrice = sumMultiServicePrice(selectedServices);
  const currency = selectedServices[0]?.currency ?? 'USD';

  useEffect(() => {
    if (authLoading || !customer) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || customer.name,
      email: prev.email || customer.email || '',
      phone: prev.phone || customer.phone || undefined,
    }));
  }, [authLoading, customer]);

  useEffect(() => {
    if (serviceIds.length < 2) return;
    void quotePublicMultiService(slug, { serviceIds, promoCode: promoCode || undefined })
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [promoCode, serviceIds, slug]);

  useEffect(() => {
    if (!paymentSessionId) return;
    void (async () => {
      setSubmitting(true);
      try {
        await confirmPublicBookingPayment(slug, paymentSessionId);
        setSuccess(true);
      } catch (err: unknown) {
        setError((err as Error)?.message || t('common.errorGeneric'));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [paymentSessionId, slug, t]);

  const amountDue = quote?.amountDue ?? totalPrice;
  const requiresPayment = tenant.onlinePaymentsEnabled && amountDue > 0;

  const payload = useMemo(
    () => ({
      serviceIds,
      blockStartTime,
      employeeId,
      lines,
      notes: form.notes || undefined,
      promoCode: promoCode || undefined,
      customer: {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone ? formatPhoneForApi(form.phone) : undefined,
        privacyConsentAccepted: form.consent,
      },
    }),
    [blockStartTime, employeeId, form, lines, promoCode, serviceIds],
  );

  const onSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email && !form.phone) {
      setError('Email or phone is required');
      return;
    }
    if (form.phone && !isValidPhone(form.phone)) {
      setError('Enter a valid phone number');
      return;
    }
    if (!form.consent) {
      setError('Please accept the privacy policy');
      return;
    }
    if (!blockStartTime && !lines?.length) {
      setError('Missing appointment schedule');
      return;
    }

    setSubmitting(true);
    try {
      if (requiresPayment) {
        const checkout = await createPublicMultiServiceCheckout(slug, payload);
        window.location.href = checkout.url;
        return;
      }
      await bookPublicMultiService(slug, payload);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <PublicHeader tenant={tenant} />
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServiceBookedTitle')}</h1>
          <p className="text-gray-600 mt-2">{t('public.multiServiceBookedHint')}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServiceCheckoutTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{selectedServices.map((svc) => svc.name).join(' + ')}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2 text-sm">
          {blockStartTime && (
            <p className="text-gray-600">
              {formatDateDisplay(blockStartTime, locale)} · {formatScheduleTime(blockStartTime)}
            </p>
          )}
          <div className="flex justify-between font-semibold">
            <span className="text-gray-500">{t('public.total')}</span>
            <span>{formatPrice(amountDue, currency)}</span>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} defaultCountry={defaultPhoneCountry} />
          </div>
          <div>
            <label className="label">{t('public.promoCode')}</label>
            <input className="input" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            <span>I agree to the privacy policy</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : requiresPayment ? (
              t('public.multiServicePayAndBook')
            ) : (
              t('public.multiServiceBook')
            )}
          </button>
        </form>
      </main>
    </>
  );
}
