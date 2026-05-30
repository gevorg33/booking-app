'use client';

import { Quote } from 'lucide-react';
import { useI18n } from '@/i18n';
import { TESTIMONIAL_IDS } from '@/lib/marketing-content';

interface TestimonialsSectionProps {
  id?: string;
}

export function TestimonialsSection({ id = 'testimonials' }: TestimonialsSectionProps) {
  const { t } = useI18n();

  return (
    <section id={id} className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-4">{t('marketing.testimonials.title')}</h2>
        <p className="text-gray-400">{t('marketing.testimonials.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIAL_IDS.map((idKey) => (
          <article key={idKey} className="card flex flex-col">
            <Quote className="w-8 h-8 text-blue-500/40 mb-4 shrink-0" />
            <blockquote className="text-gray-300 leading-relaxed flex-1 mb-6">
              &ldquo;{t(`marketing.testimonials.items.${idKey}.quote`)}&rdquo;
            </blockquote>
            <footer>
              <p className="font-semibold text-white">
                {t(`marketing.testimonials.items.${idKey}.author`)}
              </p>
              <p className="text-sm text-gray-500">
                {t(`marketing.testimonials.items.${idKey}.role`)},{' '}
                {t(`marketing.testimonials.items.${idKey}.business`)}
              </p>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
