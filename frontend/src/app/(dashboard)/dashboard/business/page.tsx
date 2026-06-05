'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, MapPin, Save, Store } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { BusinessLogoField } from '@/components/business/business-logo-field';
import {
  businessToProfileForm,
  profileFormToPayload,
  type BusinessProfileForm,
} from '@/lib/business-profile';
import { unwrapBusinessApiPayload } from '@/lib/business-query';
import { bookPath } from '@/lib/tenant-host';
import { EmbedWidgetSection } from '@/components/embed-widget-section';
import { BusinessPublicProfileLocaleFields } from '@/components/business/business-public-profile-locale-fields';
import { useI18n, LOCALE_LABELS, type AppLocale } from '@/i18n';
import { useBusinessEnabledLocales } from '@/hooks/use-business-enabled-locales';
import { getErrorMessage } from '@/lib/error-message';

export default function BusinessProfilePage() {
  const { t } = useI18n();
  const { business, setAuth, user, token } = useAuthStore();
  const { enabledLocales } = useBusinessEnabledLocales();

  const SOCIAL_FIELDS: Array<{ key: keyof BusinessProfileForm['social']; label: string; placeholder: string }> = [
    { key: 'website', label: t('business.website'), placeholder: 'https://yourbusiness.com' },
    { key: 'instagram', label: t('business.instagram'), placeholder: 'https://instagram.com/yourpage' },
    { key: 'facebook', label: t('business.facebook'), placeholder: 'https://facebook.com/yourpage' },
    { key: 'x', label: t('business.x'), placeholder: 'https://x.com/yourpage' },
    { key: 'tiktok', label: t('business.tiktok'), placeholder: 'https://tiktok.com/@yourpage' },
    { key: 'linkedin', label: t('business.linkedin'), placeholder: 'https://linkedin.com/company/yourpage' },
    { key: 'youtube', label: t('business.youtube'), placeholder: 'https://youtube.com/@yourchannel' },
  ];
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BusinessProfileForm | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['business-profile', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}`);
      return unwrapBusinessApiPayload(res);
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (data) queueMicrotask(() => setForm(businessToProfileForm(data)));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!business?.id || !form) throw new Error('Missing business');
      const { data: res } = await api.put(
        `/businesses/${business.id}/profile`,
        profileFormToPayload(form),
      );
      return res.data || res;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      if (user && token) {
        setAuth(user, updated, token);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!business) return null;

  const publicUrl = business.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${bookPath(business.slug)}`
    : null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6 text-violet-400" />
            {t('business.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('business.subtitle')}</p>
        </div>
        {publicUrl && (
          <Link
            href={bookPath(business.slug, '/profile')}
            target="_blank"
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            {t('business.viewPublicPage')}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {isLoading || !form ? (
        <div className="card py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : (
        <form
          id="business-profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg">{t('business.branding')}</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_1fr] lg:items-start">
              <BusinessLogoField
                businessId={business.id}
                businessName={form.name}
                logoUrl={form.branding.logoUrl ?? ''}
                onChange={(logoUrl) => {
                  setForm({ ...form, branding: { ...form.branding, logoUrl } });
                  if (logoUrl.trim()) {
                    void api
                      .put(`/businesses/${business.id}/profile`, {
                        branding: { logoUrl: logoUrl.trim() },
                      })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['business-profile', business.id] });
                      })
                      .catch(() => {
                        /* user can still save manually */
                      });
                  }
                }}
                disabled={saveMutation.isPending}
              />
              <div>
                <label className="label">{t('business.internalName')}</label>
                <p className="text-xs text-gray-500 mb-1">{t('business.internalNameHint')}</p>
                <input
                  className="input w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">{t('business.primaryColor')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.branding.primaryColor ?? '#7c3aed'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, primaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 shrink-0 rounded cursor-pointer border border-gray-700 bg-transparent"
                  />
                  <input
                    className="input w-full min-w-0"
                    value={form.branding.primaryColor ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, primaryColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg">{t('business.publicContentTitle')}</h2>
            <p className="text-sm text-gray-500 -mt-2">{t('business.publicContentSectionHint')}</p>
            <BusinessPublicProfileLocaleFields
              value={form.publicProfileLocales}
              onChange={(publicProfileLocales) => setForm({ ...form, publicProfileLocales })}
              enabledLocales={enabledLocales}
              t={t}
            />
          </section>

          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg">{t('business.contact')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t('common.phone')}</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t('common.email')}</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg">{t('business.publicLanguage')}</h2>
            <p className="text-sm text-gray-500 -mt-2">{t('languages.publicDescription')}</p>
            <select
              className="input w-full sm:max-w-xs"
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value as AppLocale })}
            >
              {enabledLocales.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_LABELS[code]}
                </option>
              ))}
            </select>
          </section>

          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg">{t('business.socialLinks')}</h2>
            <p className="text-sm text-gray-500 -mt-2">{t('business.socialHint')}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    className="input"
                    value={form.social[key] ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        social: { ...form.social, [key]: e.target.value },
                      })
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="card w-full space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              {t('business.mapsTitle')}
            </h2>
            <p className="text-sm text-gray-500 -mt-2">{t('business.mapsEmbedInstructions')}</p>
            <textarea
              className="input min-h-[100px] font-mono text-xs resize-y"
              value={form.location.mapEmbedHtml ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: { ...form.location, mapEmbedHtml: e.target.value },
                })
              }
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
            />
            {form.location.mapEmbedHtml && (
              <div className="rounded-xl overflow-hidden border border-gray-700 bg-white">
                <div
                  className="w-full [&>iframe]:w-full [&>iframe]:min-h-[280px] [&>iframe]:border-0"
                  dangerouslySetInnerHTML={{ __html: form.location.mapEmbedHtml }}
                />
              </div>
            )}
          </section>
        </form>
      )}

      {business?.slug && (
        <div className="mt-6 w-full">
          <EmbedWidgetSection slug={business.slug} businessName={business.name} />
        </div>
      )}

      {form && (
        <div className="mt-6 space-y-3 border-t border-gray-800 pt-6">
          {saveMutation.isError && (
            <p className="text-sm text-red-400">
              {getErrorMessage(saveMutation.error, t('business.saveFailed'))}
            </p>
          )}
          <button
            type="submit"
            form="business-profile-form"
            disabled={saveMutation.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('business.saveProfile')}
              </>
            )}
          </button>
          {saved && <p className="text-sm text-green-400">{t('business.saveSuccess')}</p>}
        </div>
      )}
    </div>
  );
}
