'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { bookPath } from '@/lib/tenant-host';

export function EmbedWidgetSection({ slug, businessName }: { slug: string; businessName: string }) {
  const { t } = useI18n();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `${origin}/embed/${slug}`;
  const bookUrl = `${origin}${bookPath(slug, '/services')}`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="420" frameborder="0" title="${businessName} booking"></iframe>`;
  const scriptSnippet = `<div id="optischedule-booking"></div>
<script>
  (function(){
    var f=document.createElement('iframe');
    f.src='${embedUrl}';
    f.width='100%';f.height='420';f.frameBorder='0';
    f.title='${businessName.replace(/'/g, "\\'")} booking';
    document.getElementById('optischedule-booking').appendChild(f);
  })();
</script>`;

  return (
    <section className="card w-full space-y-4">
      <div>
        <h2 className="font-semibold text-lg">{t('embed.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('embed.subtitle')}</p>
      </div>
      <div>
        <label className="label">{t('embed.publicLink')}</label>
        <input className="input font-mono text-xs" readOnly value={bookUrl} onFocus={(e) => e.target.select()} />
      </div>
      <div>
        <label className="label">{t('embed.iframeSnippet')}</label>
        <textarea className="input min-h-[80px] font-mono text-xs resize-y" readOnly value={iframeSnippet} />
      </div>
      <div>
        <label className="label">{t('embed.scriptSnippet')}</label>
        <textarea className="input min-h-[120px] font-mono text-xs resize-y" readOnly value={scriptSnippet} />
      </div>
      <div>
        <p className="label mb-2">{t('embed.preview')}</p>
        <div className="rounded-xl overflow-hidden border border-gray-700">
          <iframe src={embedUrl} width="100%" height="320" title={`${businessName} booking preview`} className="bg-white" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('embed.fullFlow')}{' '}
          <Link href={bookPath(slug, '/services')} target="_blank" className="text-blue-400 hover:underline">
            {bookUrl}
          </Link>
        </p>
      </div>
    </section>
  );
}
