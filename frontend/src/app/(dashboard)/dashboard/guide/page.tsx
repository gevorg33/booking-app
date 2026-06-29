'use client';

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  MessageSquare,
  Package,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Warehouse,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { resolveGuideTopicIdFromAnchor } from '@/lib/dashboard-guide-corpus.util';
import { useGuideHashAssistantSeed } from '@/lib/use-guide-hash-assistant-seed';
import { GuideTopicAskAiButton } from '@/components/guide-topic-ask-ai-button';

function GuideSection({
  id,
  icon: Icon,
  title,
  accent = 'amber',
  children,
}: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  accent?: 'amber' | 'violet';
  children: ReactNode;
}) {
  const accentStyles = {
    amber: {
      iconBg: 'bg-amber-600/10',
      iconColor: 'text-amber-400',
    },
    violet: {
      iconBg: 'bg-violet-600/10',
      iconColor: 'text-violet-400',
    },
  };
  const styles = accentStyles[accent];
  const topicId = resolveGuideTopicIdFromAnchor(id);

  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <h2 className="text-xl font-semibold text-gray-100 flex-1 min-w-0">{title}</h2>
        {topicId ? <GuideTopicAskAiButton topicId={topicId} className="shrink-0" /> : null}
      </div>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-xs font-semibold text-blue-400">
            {i + 1}
          </span>
          <span className="text-sm pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Callout({ title, children, variant = 'info' }: { title: string; children: ReactNode; variant?: 'info' | 'tip' | 'warn' }) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-600/5',
    tip: 'border-emerald-500/30 bg-emerald-600/5',
    warn: 'border-amber-500/30 bg-amber-600/5',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[variant]}`}>
      <p className="text-sm font-semibold text-gray-100 mb-1">{title}</p>
      <div className="text-sm text-gray-400">{children}</div>
    </div>
  );
}

function ExampleCommands({
  intro,
  examples,
}: {
  intro: string;
  examples: Array<{ command: string; desc: string }>;
}) {
  return (
    <div>
      <p className="text-sm mb-3">{intro}</p>
      <div className="grid gap-3">
        {examples.map((ex) => (
          <div key={ex.command} className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
            <p className="text-sm font-mono text-violet-200">{ex.command}</p>
            <p className="text-sm text-gray-400 mt-1">{ex.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuidePage() {
  const { t } = useI18n();
  useGuideHashAssistantSeed();

  const coreToc = [
    { id: 'schedule', label: t('guide.core.scheduleTitle') },
    { id: 'calendar', label: t('guide.core.calendarTitle') },
    { id: 'employees', label: t('guide.core.employeesTitle') },
  ];

  const operationsToc = [
    { id: 'overview', label: t('guide.operations.overviewTitle') },
    { id: 'problems', label: t('guide.operations.problemsTitle') },
    { id: 'workflow', label: t('guide.operations.workflowTitle') },
    { id: 'locations', label: t('guide.operations.locationsTitle') },
    { id: 'inventory', label: t('guide.operations.inventoryTitle') },
    { id: 'expenses', label: t('guide.operations.expensesTitle') },
    { id: 'commissions', label: t('guide.operations.commissionsTitle') },
    { id: 'pl', label: t('guide.operations.plTitle') },
    { id: 'tips', label: t('guide.operations.tipsTitle') },
  ];

  const aiToc = [
    { id: 'ai-overview', label: t('guide.ai.overviewTitle') },
    { id: 'ai-getting-started', label: t('guide.ai.gettingStartedTitle') },
    { id: 'ai-command-bar', label: t('guide.ai.commandBarTitle') },
    { id: 'ai-dashboard', label: t('guide.ai.dashboardTitle') },
    { id: 'ai-approval', label: t('guide.ai.approvalTitle') },
    { id: 'ai-ops', label: t('guide.ai.aiOpsTitle') },
    { id: 'ai-mobile', label: t('guide.ai.mobileTitle') },
    { id: 'ai-examples', label: t('guide.ai.examplesTitle') },
    { id: 'ai-tips', label: t('guide.ai.tipsTitle') },
  ];

  const aiExamples = [
    { command: t('guide.ai.example1Command'), desc: t('guide.ai.example1Desc') },
    { command: t('guide.ai.example2Command'), desc: t('guide.ai.example2Desc') },
    { command: t('guide.ai.example3Command'), desc: t('guide.ai.example3Desc') },
    { command: t('guide.ai.example4Command'), desc: t('guide.ai.example4Desc') },
    { command: t('guide.ai.example5Command'), desc: t('guide.ai.example5Desc') },
    { command: t('guide.ai.example6Command'), desc: t('guide.ai.example6Desc') },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          {t('guide.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('guide.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <nav className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="card space-y-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-2 py-1">
              {t('guide.core.navLabel')}
            </p>
            {coreToc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="card space-y-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-2 py-1">
              {t('guide.operations.navLabel')}
            </p>
            {operationsToc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/dashboard/operations"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/10 transition-colors"
            >
              {t('guide.operations.openOperations')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card space-y-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-2 py-1">
              {t('guide.ai.navLabel')}
            </p>
            {aiToc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/dashboard/ai-ops"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-violet-400 hover:bg-violet-600/10 transition-colors"
            >
              {t('guide.ai.openAiOps')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <div className="space-y-10">
          <GuideSection id="schedule" icon={CalendarDays} title={t('guide.core.scheduleTitle')}>
            <p className="text-sm">{t('guide.core.scheduleBody')}</p>
            <StepList
              steps={[
                t('guide.core.scheduleStep1'),
                t('guide.core.scheduleStep2'),
                t('guide.core.scheduleStep3'),
                t('guide.core.scheduleStep4'),
              ]}
            />
            <Link
              href="/dashboard/schedule"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 mt-2"
            >
              Open Schedule
              <ArrowRight className="w-4 h-4" />
            </Link>
          </GuideSection>

          <GuideSection id="calendar" icon={CalendarDays} accent="violet" title={t('guide.core.calendarTitle')}>
            <p className="text-sm">{t('guide.core.calendarBody')}</p>
            <StepList
              steps={[
                t('guide.core.calendarStep1'),
                t('guide.core.calendarStep2'),
                t('guide.core.calendarStep3'),
                t('guide.core.calendarStep4'),
              ]}
            />
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 mt-2"
            >
              Open Calendar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </GuideSection>

          <GuideSection id="employees" icon={Users} title={t('guide.core.employeesTitle')}>
            <p className="text-sm">{t('guide.core.employeesBody')}</p>
            <StepList
              steps={[
                t('guide.core.employeesStep1'),
                t('guide.core.employeesStep2'),
                t('guide.core.employeesStep3'),
                t('guide.core.employeesStep4'),
              ]}
            />
            <Link
              href="/dashboard/employees"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 mt-2"
            >
              Open Employees
              <ArrowRight className="w-4 h-4" />
            </Link>
          </GuideSection>

          <div className="card bg-gradient-to-br from-amber-600/10 to-transparent border-amber-500/20">
            <div className="flex items-start gap-4">
              <Warehouse className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-100">{t('guide.operations.heroTitle')}</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{t('guide.operations.heroBody')}</p>
              </div>
            </div>
          </div>

          <GuideSection id="overview" icon={BookOpen} title={t('guide.operations.overviewTitle')}>
            <p className="text-sm">{t('guide.operations.overviewBody')}</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {[
                t('guide.operations.overviewPoint1'),
                t('guide.operations.overviewPoint2'),
                t('guide.operations.overviewPoint3'),
                t('guide.operations.overviewPoint4'),
              ].map((point) => (
                <div key={point} className="flex gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection id="problems" icon={CircleDollarSign} title={t('guide.operations.problemsTitle')}>
            <p className="text-sm">{t('guide.operations.problemsIntro')}</p>
            <div className="grid gap-3 mt-2">
              {[
                { problem: t('guide.operations.problem1'), solution: t('guide.operations.solution1') },
                { problem: t('guide.operations.problem2'), solution: t('guide.operations.solution2') },
                { problem: t('guide.operations.problem3'), solution: t('guide.operations.solution3') },
                { problem: t('guide.operations.problem4'), solution: t('guide.operations.solution4') },
              ].map((item) => (
                <div key={item.problem} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <p className="text-sm font-medium text-gray-200">{item.problem}</p>
                  <p className="text-sm text-gray-400 mt-1">{item.solution}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection id="workflow" icon={ArrowRight} title={t('guide.operations.workflowTitle')}>
            <Callout title={t('guide.operations.workflowTipTitle')} variant="tip">
              {t('guide.operations.workflowTipBody')}
            </Callout>
            <StepList
              steps={[
                t('guide.operations.workflowStep1'),
                t('guide.operations.workflowStep2'),
                t('guide.operations.workflowStep3'),
                t('guide.operations.workflowStep4'),
                t('guide.operations.workflowStep5'),
                t('guide.operations.workflowStep6'),
              ]}
            />
          </GuideSection>

          <GuideSection id="locations" icon={Building2} title={t('guide.operations.locationsTitle')}>
            <p className="text-sm">{t('guide.operations.locationsBody')}</p>
            <StepList
              steps={[
                t('guide.operations.locationsStep1'),
                t('guide.operations.locationsStep2'),
                t('guide.operations.locationsStep3'),
              ]}
            />
            <Callout title={t('guide.operations.locationsNoteTitle')} variant="info">
              {t('guide.operations.locationsNoteBody')}
            </Callout>
          </GuideSection>

          <GuideSection id="inventory" icon={Package} title={t('guide.operations.inventoryTitle')}>
            <p className="text-sm">{t('guide.operations.inventoryBody')}</p>
            <StepList
              steps={[
                t('guide.operations.inventoryStep1'),
                t('guide.operations.inventoryStep2'),
                t('guide.operations.inventoryStep3'),
                t('guide.operations.inventoryStep4'),
              ]}
            />
            <Callout title={t('guide.operations.inventoryAutoTitle')} variant="tip">
              {t('guide.operations.inventoryAutoBody')}
            </Callout>
          </GuideSection>

          <GuideSection id="expenses" icon={CircleDollarSign} title={t('guide.operations.expensesTitle')}>
            <p className="text-sm">{t('guide.operations.expensesBody')}</p>
            <StepList
              steps={[
                t('guide.operations.expensesStep1'),
                t('guide.operations.expensesStep2'),
                t('guide.operations.expensesStep3'),
              ]}
            />
            <p className="text-sm text-gray-500">{t('guide.operations.expensesExamples')}</p>
          </GuideSection>

          <GuideSection id="commissions" icon={Users} title={t('guide.operations.commissionsTitle')}>
            <p className="text-sm">{t('guide.operations.commissionsBody')}</p>
            <StepList
              steps={[
                t('guide.operations.commissionsStep1'),
                t('guide.operations.commissionsStep2'),
                t('guide.operations.commissionsStep3'),
              ]}
            />
            <Callout title={t('guide.operations.commissionsRuleTitle')} variant="info">
              {t('guide.operations.commissionsRuleBody')}
            </Callout>
          </GuideSection>

          <GuideSection id="pl" icon={Calculator} title={t('guide.operations.plTitle')}>
            <p className="text-sm">{t('guide.operations.plBody')}</p>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-800 bg-gray-900/60">
                {[
                  { label: t('guide.operations.plRevenue'), color: 'text-emerald-400' },
                  { label: t('guide.operations.plExpenses'), color: 'text-orange-400' },
                  { label: t('guide.operations.plCommissions'), color: 'text-violet-400' },
                  { label: t('guide.operations.plNet'), color: 'text-blue-400' },
                ].map((item) => (
                  <div key={item.label} className="p-4 text-center">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-lg font-bold mt-1 ${item.color}`}>$—</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 p-3 border-t border-gray-800">{t('guide.operations.plFormula')}</p>
            </div>
            <StepList steps={[t('guide.operations.plStep1'), t('guide.operations.plStep2')]} />
          </GuideSection>

          <GuideSection id="tips" icon={CheckCircle2} title={t('guide.operations.tipsTitle')}>
            <ul className="space-y-2 text-sm">
              {[
                t('guide.operations.tip1'),
                t('guide.operations.tip2'),
                t('guide.operations.tip3'),
                t('guide.operations.tip4'),
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <Callout title={t('guide.operations.limitationsTitle')} variant="warn">
              {t('guide.operations.limitationsBody')}
            </Callout>
          </GuideSection>

          <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-gray-100">{t('guide.operations.readyTitle')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('guide.operations.readyBody')}</p>
            </div>
            <Link href="/dashboard/operations" className="btn-primary inline-flex items-center gap-2 shrink-0">
              {t('guide.operations.openOperations')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="border-t border-gray-800 pt-10">
            <div className="card bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20">
              <div className="flex items-start gap-4">
                <Brain className="w-8 h-8 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">{t('guide.ai.heroTitle')}</h2>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{t('guide.ai.heroBody')}</p>
                </div>
              </div>
            </div>
          </div>

          <GuideSection id="ai-overview" icon={Sparkles} accent="violet" title={t('guide.ai.overviewTitle')}>
            <p className="text-sm">{t('guide.ai.overviewBody')}</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {[
                t('guide.ai.overviewPoint1'),
                t('guide.ai.overviewPoint2'),
                t('guide.ai.overviewPoint3'),
                t('guide.ai.overviewPoint4'),
              ].map((point) => (
                <div key={point} className="flex gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection id="ai-getting-started" icon={Brain} accent="violet" title={t('guide.ai.gettingStartedTitle')}>
            <p className="text-sm">{t('guide.ai.gettingStartedBody')}</p>
            <StepList
              steps={[
                t('guide.ai.gettingStartedStep1'),
                t('guide.ai.gettingStartedStep2'),
                t('guide.ai.gettingStartedStep3'),
              ]}
            />
            <Callout title={t('guide.ai.gettingStartedNoteTitle')} variant="info">
              {t('guide.ai.gettingStartedNoteBody')}
            </Callout>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              {t('guide.ai.openSettings')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </GuideSection>

          <GuideSection id="ai-command-bar" icon={MessageSquare} accent="violet" title={t('guide.ai.commandBarTitle')}>
            <p className="text-sm">{t('guide.ai.commandBarBody')}</p>
            <StepList
              steps={[
                t('guide.ai.commandBarStep1'),
                t('guide.ai.commandBarStep2'),
                t('guide.ai.commandBarStep3'),
                t('guide.ai.commandBarStep4'),
              ]}
            />
            <Callout title={t('guide.ai.commandBarTipTitle')} variant="tip">
              {t('guide.ai.commandBarTipBody')}
            </Callout>
          </GuideSection>

          <GuideSection id="ai-dashboard" icon={Sparkles} accent="violet" title={t('guide.ai.dashboardTitle')}>
            <p className="text-sm">{t('guide.ai.dashboardBody')}</p>
            <ul className="space-y-2 text-sm">
              {[
                t('guide.ai.dashboardFeature1'),
                t('guide.ai.dashboardFeature2'),
                t('guide.ai.dashboardFeature3'),
                t('guide.ai.dashboardFeature4'),
              ].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-violet-400">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </GuideSection>

          <GuideSection id="ai-approval" icon={Shield} accent="violet" title={t('guide.ai.approvalTitle')}>
            <p className="text-sm">{t('guide.ai.approvalBody')}</p>
            <StepList
              steps={[
                t('guide.ai.approvalStep1'),
                t('guide.ai.approvalStep2'),
                t('guide.ai.approvalStep3'),
                t('guide.ai.approvalStep4'),
              ]}
            />
            <Callout title={t('guide.ai.approvalWarnTitle')} variant="warn">
              {t('guide.ai.approvalWarnBody')}
            </Callout>
          </GuideSection>

          <GuideSection id="ai-ops" icon={Brain} accent="violet" title={t('guide.ai.aiOpsTitle')}>
            <p className="text-sm">{t('guide.ai.aiOpsBody')}</p>
            <StepList
              steps={[
                t('guide.ai.aiOpsStep1'),
                t('guide.ai.aiOpsStep2'),
                t('guide.ai.aiOpsStep3'),
                t('guide.ai.aiOpsStep4'),
              ]}
            />
          </GuideSection>

          <GuideSection id="ai-mobile" icon={Smartphone} accent="violet" title={t('guide.ai.mobileTitle')}>
            <p className="text-sm">{t('guide.ai.mobileBody')}</p>
            <ul className="space-y-2 text-sm">
              {[
                t('guide.ai.mobilePoint1'),
                t('guide.ai.mobilePoint2'),
                t('guide.ai.mobilePoint3'),
                t('guide.ai.mobilePoint4'),
              ].map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-violet-400">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </GuideSection>

          <GuideSection id="ai-examples" icon={MessageSquare} accent="violet" title={t('guide.ai.examplesTitle')}>
            <ExampleCommands intro={t('guide.ai.examplesIntro')} examples={aiExamples} />
          </GuideSection>

          <GuideSection id="ai-tips" icon={CheckCircle2} accent="violet" title={t('guide.ai.tipsTitle')}>
            <ul className="space-y-2 text-sm">
              {[
                t('guide.ai.tip1'),
                t('guide.ai.tip2'),
                t('guide.ai.tip3'),
                t('guide.ai.tip4'),
                t('guide.ai.tip5'),
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-violet-400">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <Callout title={t('guide.ai.limitationsTitle')} variant="warn">
              {t('guide.ai.limitationsBody')}
            </Callout>
          </GuideSection>

          <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-violet-500/20 bg-violet-950/10">
            <div>
              <p className="font-medium text-gray-100">{t('guide.ai.readyTitle')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('guide.ai.readyBody')}</p>
            </div>
            <Link href="/dashboard/ai-ops" className="btn-primary inline-flex items-center gap-2 shrink-0">
              {t('guide.ai.openAiOps')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
