import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n';
import {
  specimenOpsBasePath,
  type ClinicSpecimenOpsView,
} from '@/lib/clinic-lab-specimens';

const VIEWS: ClinicSpecimenOpsView[] = ['collection', 'tracking'];

export function ClinicSpecimenOpsNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-2">
      {VIEWS.map((view) => {
        const href = specimenOpsBasePath(view);
        const active = pathname === href;
        return (
          <Link
            key={view}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-600/20 text-blue-300'
                : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'
            }`}
          >
            {t(`clinic.labSpecimens.tabs.${view}`)}
          </Link>
        );
      })}
    </div>
  );
}
